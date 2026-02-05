'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setPhotos(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm('Delete this photo?')) return;

    try {
      const supabase = createClient();
      await supabase.from('photos').delete().eq('id', id);
      setPhotos(photos.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete photo');
    }
  }

  async function updatePhoto(id: string, updates: any) {
    try {
      const supabase = createClient();
      await supabase.from('photos').update(updates).eq('id', id);
      setPhotos(photos.map(p => p.id === id ? { ...p, ...updates } : p));
      setEditingPhoto(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update photo');
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Photo Management</h1>
        <Link
          href="/admin/upload"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Upload Photos
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Photos</p>
          <p className="text-2xl font-bold">{photos.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">With GPS</p>
          <p className="text-2xl font-bold">
            {photos.filter(p => p.gps_lat).length}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Without GPS</p>
          <p className="text-2xl font-bold">
            {photos.filter(p => !p.gps_lat).length}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Published</p>
          <p className="text-2xl font-bold">
            {photos.filter(p => p.status === 'published').length}
          </p>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="border rounded-lg p-4 bg-white">
            {/* Photo Preview */}
            {photo.storage_path && (
              <img
                src={photo.storage_path}
                alt={photo.filename}
                className="w-full h-48 object-cover rounded mb-3"
              />
            )}

            {/* Photo Info */}
            <p className="font-medium truncate">{photo.filename}</p>
            <p className="text-sm text-gray-600 mt-1">
              Type: {photo.room_type || 'None'}
            </p>
            {photo.gps_lat && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {photo.gps_lat.toFixed(4)}, {photo.gps_lng.toFixed(4)}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setEditingPhoto(photo)}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition"
              >
                Edit
              </button>
              <button
                onClick={() => deletePhoto(photo.id)}
                className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Photo</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Room Type
                </label>
                <input
                  type="text"
                  value={editingPhoto.room_type || ''}
                  onChange={(e) => setEditingPhoto({
                    ...editingPhoto,
                    room_type: e.target.value
                  })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Status
                </label>
                <select
                  value={editingPhoto.status || 'draft'}
                  onChange={(e) => setEditingPhoto({
                    ...editingPhoto,
                    status: e.target.value
                  })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => updatePhoto(editingPhoto.id, {
                  room_type: editingPhoto.room_type,
                  status: editingPhoto.status
                })}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => setEditingPhoto(null)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
