'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Script from 'next/script';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MapPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  // Load photos from database
  useEffect(() => {
    async function loadPhotos() {
      try {
        console.log('Fetching photos from Supabase...');
        
        const { data, error: fetchError } = await supabase
          .from('photos')
          .select('*')
          .not('gps_lat', 'is', null)
          .not('gps_lng', 'is', null);

        if (fetchError) {
          console.error('Error fetching photos:', fetchError);
          setError(`Database error: ${fetchError.message}`);
          return;
        }

        console.log(`Fetched ${data?.length || 0} photos`);
        setPhotos(data || []);
      } catch (err: any) {
        console.error('Error loading photos:', err);
        setError(`Failed to load photos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadPhotos();
  }, []);

  // Initialize map when Leaflet is ready and photos are loaded
  useEffect(() => {
    if (!leafletReady || !mapRef.current || loading || mapInstance.current) {
      return;
    }

    const L = (window as any).L;
    if (!L) {
      console.error('Leaflet not available');
      setError('Map library failed to load');
      return;
    }

    console.log('Initializing map with', photos.length, 'photos');

    try {
      // Create map centered on Ottawa
      const map = L.map(mapRef.current).setView([45.4215, -75.6972], 11);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      console.log('Map created successfully');

      // Add markers for each photo
      let markerCount = 0;
      photos.forEach((photo) => {
        if (photo.gps_lat && photo.gps_lng) {
          try {
            const marker = L.marker([photo.gps_lat, photo.gps_lng])
              .addTo(map)
              .bindPopup(`
                <div style="width: 200px;">
                  <img 
                    src="${photo.storage_path}" 
                    style="width: 100%; height: 120px; object-fit: cover; margin-bottom: 8px; border-radius: 4px;" 
                    onerror="this.style.display='none'"
                  />
                  <p style="font-weight: 600; margin: 0; font-size: 14px;">${photo.filename}</p>
                  <p style="color: #666; margin: 4px 0 0 0; font-size: 12px;">${photo.room_type}</p>
                </div>
              `);
            markerCount++;
          } catch (err) {
            console.error('Error creating marker for photo:', photo.id, err);
          }
        }
      });

      console.log(`Added ${markerCount} markers to map`);

      mapInstance.current = map;

      // Force map to recalculate size
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

    } catch (err: any) {
      console.error('Error initializing map:', err);
      setError(`Map initialization failed: ${err.message}`);
    }

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [photos, loading, leafletReady]);

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium text-lg">Loading photos...</p>
          <p className="text-gray-500 text-sm mt-2">Connecting to database</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Map</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-2">
            <a
              href="/admin/upload"
              className="block bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700"
            >
              Go to Upload Page
            </a>
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Leaflet CSS */}
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      
      {/* Leaflet JS */}
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin=""
        onLoad={() => {
          console.log('Leaflet library loaded successfully');
          setLeafletReady(true);
        }}
        onError={() => {
          console.error('Failed to load Leaflet library');
          setError('Failed to load map library from CDN');
        }}
      />

      <div className="relative h-screen">
        {/* Info panel */}
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-xl p-5 max-w-sm">
          <h2 className="font-bold text-xl mb-3">Ottawa Renovation Map</h2>
          
          <div className="mb-4">
            {photos.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl">✓</span>
                <div>
                  <p className="text-green-600 font-bold text-lg">{photos.length} photos</p>
                  <p className="text-gray-600 text-sm">with GPS data</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-yellow-600 font-semibold">No photos yet</p>
                <p className="text-gray-600 text-sm mt-1">Upload photos to see them on the map</p>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t pt-3">
            <a
              href="/admin/upload"
              className="block text-center bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              📤 Upload Photos
            </a>
            <a
              href="/"
              className="block text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              ← Back to Hub
            </a>
          </div>
        </div>

        {/* Map container */}
        <div 
          ref={mapRef} 
          className="h-full w-full" 
          style={{ minHeight: '100vh' }}
        />
      </div>
    </>
  );
}
