import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ExifReader from 'exifreader';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Ottawa neighborhoods with coordinates
const NEIGHBORHOODS = [
  { name: "Fallingbrook", lat: 45.47752571586377, lng: -75.48460802698182 },
  { name: "Chapel Hill North", lat: 45.454842401889394, lng: -75.53607001110123 },
  { name: "Chapel Hill South", lat: 45.43416897289973, lng: -75.50546579748969 },
  { name: "Convent Glen - Orléans Woods", lat: 45.477863087522415, lng: -75.53804919723913 },
  { name: "Queenswood - Chatelaine", lat: 45.49353312598147, lng: -75.50191371363908 },
  { name: "Orléans Village - Chateauneuf", lat: 45.46081908983043, lng: -75.51522700808438 },
  { name: "Centrum", lat: 45.3089, lng: -75.8967 },
  { name: "Barrhaven", lat: 45.2732, lng: -75.7338 },
  { name: "Kanata", lat: 45.3260, lng: -75.9002 },
  { name: "Centretown", lat: 45.41672663442016, lng: -75.69760785498559 },
  { name: "Glebe", lat: 45.40118461665449, lng: -75.69275129527401 },
  { name: "Westboro", lat: 45.392880394585596, lng: -75.74996147842012 },
];

function extractGPSFromGoogleTakeoutJSON(jsonText: string): { lat: number; lng: number } | null {
  try {
    const data = JSON.parse(jsonText);
    
    if (!data.geoData) {
      return null;
    }
    
    const lat = Number(data.geoData.latitude);
    const lng = Number(data.geoData.longitude);
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      console.log('Invalid GPS (NaN or infinite):', { lat, lng });
      return null;
    }
    
    if (lat === 0 && lng === 0) {
      console.log('GPS is 0,0 (location services disabled)');
      return null;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.log('GPS out of valid range:', { lat, lng });
      return null;
    }
    
    return { lat, lng };
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}

function extractGPSFromEXIF(buffer: ArrayBuffer): { lat: number; lng: number } | null {
  try {
    const tags = ExifReader.load(buffer);
    
    if (!tags.GPSLatitude || !tags.GPSLongitude) {
      return null;
    }

    const latValue = tags.GPSLatitude.value || tags.GPSLatitude.description;
    const lngValue = tags.GPSLongitude.value || tags.GPSLongitude.description;
    const latRef = tags.GPSLatitudeRef?.value || tags.GPSLatitudeRef?.description;
    const lngRef = tags.GPSLongitudeRef?.value || tags.GPSLongitudeRef?.description;

    let lat = 0;
    let lng = 0;

    // Handle array format [degrees, minutes, seconds]
    if (Array.isArray(latValue) && latValue.length === 3) {
      const d = Number(latValue[0]);
      const m = Number(latValue[1]);
      const s = Number(latValue[2]);
      if (!isNaN(d) && !isNaN(m) && !isNaN(s)) {
        lat = d + m / 60 + s / 3600;
        if (latRef === 'S') lat = -lat;
      }
    } else if (typeof latValue === 'number') {
      lat = latValue;
      if (latRef === 'S') lat = -lat;
    }

    if (Array.isArray(lngValue) && lngValue.length === 3) {
      const d = Number(lngValue[0]);
      const m = Number(lngValue[1]);
      const s = Number(lngValue[2]);
      if (!isNaN(d) && !isNaN(m) && !isNaN(s)) {
        lng = d + m / 60 + s / 3600;
        if (lngRef === 'W') lng = -lng;
      }
    } else if (typeof lngValue === 'number') {
      lng = lngValue;
      if (lngRef === 'W') lng = -lng;
    }

    if (lat === 0 && lng === 0) {
      return null;
    }

    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  } catch (error) {
    console.error('EXIF extraction error:', error);
    return null;
  }
}

function findNearestNeighborhood(lat: number, lng: number) {
  let nearest = NEIGHBORHOODS[0];
  let minDistance = Infinity;

  for (const neighborhood of NEIGHBORHOODS) {
    const distance = Math.sqrt(
      Math.pow(lat - neighborhood.lat, 2) + 
      Math.pow(lng - neighborhood.lng, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = neighborhood;
    }
  }

  return nearest;
}

function jitterGPS(lat: number, lng: number) {
  // Add small random offset (±90 meters) for privacy
  const jitterAmount = 0.0008;
  const offsetLat = (Math.random() - 0.5) * jitterAmount;
  const offsetLng = (Math.random() - 0.5) * jitterAmount;
  
  return {
    lat: lat + offsetLat,
    lng: lng + offsetLng
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jsonFile = formData.get('jsonFile') as File | null;
    const roomType = formData.get('roomType') as string || 'general_renovation';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Processing upload:', file.name);

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Generate SHA256 hash
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Try to extract GPS
    let gps: { lat: number; lng: number } | null = null;
    let source = '';

    // Try JSON first (Google Takeout)
    if (jsonFile) {
      console.log('  Trying JSON file:', jsonFile.name);
      const jsonText = await jsonFile.text();
      gps = extractGPSFromGoogleTakeoutJSON(jsonText);
      if (gps) {
        source = 'google_takeout_json';
        console.log('  GPS from JSON:', gps);
      }
    }

    // Try EXIF if JSON failed
    if (!gps) {
      console.log('  Trying EXIF...');
      gps = extractGPSFromEXIF(arrayBuffer);
      if (gps) {
        source = 'exif';
        console.log('  GPS from EXIF:', gps);
      }
    }

    if (!gps) {
      console.log('  No GPS found');
      return NextResponse.json({ 
        error: 'No GPS data in photo. Please use photos with location enabled.' 
      }, { status: 400 });
    }

    // Find neighborhood
    const neighborhood = findNearestNeighborhood(gps.lat, gps.lng);
    console.log('  Neighborhood:', neighborhood.name);

    // Jitter for privacy
    const jittered = jitterGPS(gps.lat, gps.lng);
    console.log('  Jittered GPS:', jittered);

    // Upload to Supabase storage
    const fileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('renovation-photos')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('  Storage upload error:', uploadError);
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('renovation-photos')
      .getPublicUrl(fileName);

    console.log('  Uploaded to storage:', fileName);

    // Get Ottawa city ID
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', 'ottawa')
      .single();

    if (cityError || !cityData) {
      console.error('  City lookup error:', cityError);
      return NextResponse.json({ error: 'Ottawa city not found in database' }, { status: 500 });
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        city_id: cityData.id,
        gps_lat: jittered.lat,
        gps_lng: jittered.lng,
        room_type: roomType,
        total_photos: 1,
        status: 'published'
      })
      .select()
      .single();

    if (projectError) {
      console.error('  Project insert error:', projectError);
      return NextResponse.json({ 
        error: `Failed to create project: ${projectError.message}`,
        details: projectError 
      }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ error: 'Failed to create project (no data returned)' }, { status: 500 });
    }

    console.log('  Created project:', project.id);

    // Create photo
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .insert({
        project_id: project.id,
        filename: file.name,
        storage_path: publicUrl,
        gps_lat: jittered.lat,
        gps_lng: jittered.lng,
        room_type: roomType,
        sha256: sha256,
        shapes_detected: 0,
        quality_score: 0.5,
        complexity_score: 0.5,
        resonance_points: 0
      })
      .select()
      .single();

    if (photoError) {
      console.error('  Photo insert error:', photoError);
      return NextResponse.json({ 
        error: `Failed to create photo: ${photoError.message}`,
        details: photoError 
      }, { status: 500 });
    }

    console.log('  SUCCESS! Photo ID:', photo.id);

    return NextResponse.json({
      success: true,
      photo,
      metadata: {
        originalGPS: gps,
        gpsSource: source,
        neighborhood: neighborhood.name,
        jitteredGPS: jittered
      }
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: `Server error: ${error.message}`,
      stack: error.stack 
    }, { status: 500 });
  }
}
