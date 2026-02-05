'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function AdminPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    try {
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
      await supabase.from('photos').delete().eq('id', id);
      setPhotos(photos.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete photo');
    }
  }

  async function updatePhoto(id: string, updates: any) {
    try {
      await supabase.from('photos').update(updates).eq('id', id);
      setPhotos(photos.map(p => p.id === id ? { ...p, ...updates } : p));
      setEditingPhoto(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update photo');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">⚙️ Photo Management</h1>
          <a
            href="/admin/upload"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            📤 Upload Photos
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Total Photos</p>
            <p className="text-3xl font-bold text-blue-600">{photos.length}</p>
          </div>
          <div className="bg-white border-2 border-green-500 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">With GPS</p>
            <p className="text-3xl font-bold text-green-600">
              {photos.filter(p => p.gps_lat).length}
            </p>
          </div>
          <div className="bg-white border-2 border-yellow-500 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Without GPS</p>
            <p className="text-3xl font-bold text-yellow-600">
              {photos.filter(p => !p.gps_lat).length}
            </p>
          </div>
          <div className="bg-white border-2 border-purple-500 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Published</p>
            <p className="text-3xl font-bold text-purple-600">
              {photos.filter(p => p.status === 'published').length}
            </p>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Recent Photos</h2>
          
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No photos yet</p>
              <a
                href="/admin/upload"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Upload Your First Photos
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition">
                  {/* Photo Preview */}
                  {photo.storage_path && (
                    <img
                      src={photo.storage_path}
                      alt={photo.filename}
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                  )}

                  {/* Photo Info */}
                  <p className="font-medium truncate text-sm">{photo.filename}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Type: <span className="font-medium">{photo.room_type || 'None'}</span>
                  </p>
                  {photo.gps_lat && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Has GPS
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setEditingPhoto(photo)}
                      className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm font-medium hover:bg-blue-200 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm font-medium hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-6">
          <a
            href="/map"
            className="inline-block bg-white border-2 border-blue-500 text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-50 transition font-medium"
          >
            🗺️ View Map
          </a>
        </div>
      </div>

      {/* Edit Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                  placeholder="e.g., bathroom, kitchen"
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
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingPhoto(null)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition font-medium"
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
