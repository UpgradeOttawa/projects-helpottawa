import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ExifReader from 'exifreader';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only
);

// Ottawa neighborhoods data (from your CSV)
const NEIGHBORHOODS = [
  { name: "Beacon Hill South - Cardinal Heights", lat: 45.441533, lng: -75.600544 },
  { name: "Convent Glen - Orléans Woods", lat: 45.477863, lng: -75.538049 },
  { name: "Chapel Hill North", lat: 45.454842, lng: -75.536070 },
  { name: "Chapel Hill South", lat: 45.434169, lng: -75.505466 },
  { name: "Blackburn Hamlet", lat: 45.434868, lng: -75.563583 },
  { name: "Orléans Village - Chateauneuf", lat: 45.460819, lng: -75.515227 },
  { name: "Rothwell Heights - Beacon Hill North", lat: 45.456175, lng: -75.601610 },
  { name: "Fallingbrook - Gardenway South", lat: 45.459614, lng: -75.524197 },
  // Add more neighborhoods from your CSV...
];

// Public locations for GPS jittering (parks, libraries, community centers)
const PUBLIC_LOCATIONS = [
  { name: "Petrie Island Park", lat: 45.4724, lng: -75.4963 },
  { name: "Orleans Library", lat: 45.4694, lng: -75.5164 },
  { name: "Chapel Hill Community Centre", lat: 45.4522, lng: -75.5333 },
  { name: "Fallingbrook Community Centre", lat: 45.4625, lng: -75.5236 },
  { name: "Convent Glen Park", lat: 45.4786, lng: -75.5372 },
  // Add more public locations...
];

function extractGPSFromEXIF(buffer: ArrayBuffer) {
  try {
    const tags = ExifReader.load(buffer);
    
    if (!tags.GPSLatitude || !tags.GPSLongitude) {
      return null;
    }

    const lat = convertGPSCoord(tags.GPSLatitude.description, tags.GPSLatitudeRef?.description);
    const lng = convertGPSCoord(tags.GPSLongitude.description, tags.GPSLongitudeRef?.description);

    return { lat, lng };
  } catch (error) {
    console.error('EXIF extraction error:', error);
    return null;
  }
}

function convertGPSCoord(coord: string, ref: string | undefined): number {
  // Parse "45° 28' 12.34"" format
  const parts = coord.match(/(\d+)° (\d+)' ([\d.]+)"/);
  if (!parts) return 0;

  const degrees = parseFloat(parts[1]);
  const minutes = parseFloat(parts[2]);
  const seconds = parseFloat(parts[3]);

  let decimal = degrees + minutes / 60 + seconds / 3600;

  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }

  return decimal;
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

function jitterToPublicLocation(lat: number, lng: number) {
  // Find nearest public location for privacy
  let nearest = PUBLIC_LOCATIONS[0];
  let minDistance = Infinity;

  for (const location of PUBLIC_LOCATIONS) {
    const distance = Math.sqrt(
      Math.pow(lat - location.lat, 2) + 
      Math.pow(lng - location.lng, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = location;
    }
  }

  // Add small random offset around public location (±50m)
  const offsetLat = (Math.random() - 0.5) * 0.0009; // ~50m
  const offsetLng = (Math.random() - 0.5) * 0.0009;

  return {
    lat: nearest.lat + offsetLat,
    lng: nearest.lng + offsetLng,
    publicLocation: nearest.name,
    originalDistance: minDistance
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const roomType = formData.get('roomType') as string || 'general_renovation';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract GPS from EXIF
    const gps = extractGPSFromEXIF(arrayBuffer);

    if (!gps) {
      return NextResponse.json({ 
        error: 'No GPS data in photo. Please use photos with location enabled.' 
      }, { status: 400 });
    }

    // Find neighborhood
    const neighborhood = findNearestNeighborhood(gps.lat, gps.lng);

    // Jitter GPS to public location
    const jittered = jitterToPublicLocation(gps.lat, gps.lng);

    // Upload to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('renovation-photos')
      .upload(fileName, arrayBuffer, {
        contentType: file.type
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('renovation-photos')
      .getPublicUrl(fileName);

    // Get Ottawa city ID
    const { data: cityData } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', 'ottawa')
      .single();

    if (!cityData) {
      return NextResponse.json({ error: 'Ottawa city not found' }, { status: 500 });
    }

    // Create project
    const { data: project } = await supabase
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

    if (!project) {
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    // Insert photo
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .insert({
        project_id: project.id,
        filename: file.name,
        storage_path: publicUrl,
        gps_lat: jittered.lat,
        gps_lng: jittered.lng,
        room_type: roomType,
        shapes_detected: 0,
        quality_score: 0.5,
        complexity_score: 0.5
      })
      .select()
      .single();

    if (photoError) {
      return NextResponse.json({ error: photoError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      photo,
      metadata: {
        originalGPS: gps,
        neighborhood: neighborhood.name,
        jitteredGPS: { lat: jittered.lat, lng: jittered.lng },
        publicLocation: jittered.publicLocation
      }
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
