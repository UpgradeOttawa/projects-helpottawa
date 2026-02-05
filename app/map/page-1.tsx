'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MapPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    async function loadPhotos() {
      try {
        console.log('Fetching photos...');
        
        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .not('gps_lat', 'is', null)
          .not('gps_lng', 'is', null);

        if (error) {
          console.error('Error fetching photos:', error);
        } else {
          console.log(`Fetched ${data?.length || 0} photos`);
          setPhotos(data || []);
        }
      } catch (error) {
        console.error('Error loading photos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPhotos();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || loading) return;

    // Load Leaflet
    import('leaflet').then((L) => {
      if (mapInstance.current) return;

      // Create map
      const map = L.map(mapRef.current).setView([45.4215, -75.6972], 11);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add markers for photos
      photos.forEach((photo) => {
        if (photo.gps_lat && photo.gps_lng) {
          L.marker([photo.gps_lat, photo.gps_lng])
            .addTo(map)
            .bindPopup(`
              <div class="text-sm">
                <img src="${photo.storage_path}" class="w-48 h-32 object-cover mb-2 rounded" />
                <p class="font-semibold">${photo.filename}</p>
                <p class="text-gray-600">${photo.room_type}</p>
              </div>
            `);
        }
      });

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [photos, loading]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading photos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4">
        <h2 className="font-bold text-lg mb-2">Ottawa Renovation Map</h2>
        <p className="text-sm text-gray-600">
          {photos.length > 0 ? (
            <span className="text-green-600 font-semibold">
              ✓ {photos.length} photos with GPS
            </span>
          ) : (
            <span className="text-yellow-600">
              No photos with GPS yet
            </span>
          )}
        </p>
        <div className="mt-2 space-y-1">
          <a
            href="/admin/upload"
            className="block text-sm text-blue-600 hover:text-blue-700"
          >
            → Upload Photos
          </a>
          <a
            href="/"
            className="block text-sm text-blue-600 hover:text-blue-700"
          >
            → Back to Hub
          </a>
        </div>
      </div>

      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
