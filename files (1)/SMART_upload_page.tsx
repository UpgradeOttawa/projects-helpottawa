'use client';

import { useState } from 'react';

const ROOM_TYPES = [
  'bathroom', 'kitchen', 'bedroom', 'living_room', 'basement',
  'tile_work', 'drywall', 'framing', 'electrical', 'plumbing',
  'flooring', 'painting', 'cabinets', 'countertops', 'general_renovation'
];

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [roomType, setRoomType] = useState('general_renovation');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setResults([]);
      setMessage('');
    }
  }

  async function handleUpload() {
    if (files.length === 0) {
      setMessage('❌ Please select files');
      return;
    }

    setUploading(true);
    setMessage('🔄 Processing photos with GPS detection...');
    setResults([]);

    const uploadResults: any[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('roomType', roomType);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          uploadResults.push({
            filename: file.name,
            success: true,
            neighborhood: data.metadata.neighborhood,
            publicLocation: data.metadata.publicLocation,
          });
        } else {
          uploadResults.push({
            filename: file.name,
            success: false,
            error: data.error,
          });
        }
      } catch (error: any) {
        uploadResults.push({
          filename: file.name,
          success: false,
          error: error.message,
        });
      }
    }

    setResults(uploadResults);
    
    const successCount = uploadResults.filter(r => r.success).length;
    const failCount = uploadResults.length - successCount;

    if (failCount === 0) {
      setMessage(`✅ Successfully uploaded ${successCount} photo(s)!`);
    } else {
      setMessage(`⚠️ Uploaded ${successCount}, failed ${failCount}`);
    }

    setUploading(false);
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setFiles([]);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Hub
          </a>
        </div>

        <h1 className="text-4xl font-bold mb-8">📤 Upload Renovation Photos</h1>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
            <p className="font-semibold text-blue-900 mb-2">📍 GPS Auto-Detection</p>
            <p className="text-sm text-blue-800">
              Photos MUST have GPS/location data. The system will:
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
              <li>✓ Extract GPS from photo metadata</li>
              <li>✓ Auto-detect neighborhood (Beacon Hill, Convent Glen, etc.)</li>
              <li>✓ Jitter location to nearest public place (park/library) for privacy</li>
            </ul>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Select Photos with GPS *
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-3 file:px-6
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 cursor-pointer"
            />
            {files.length > 0 && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                ✓ {files.length} file(s) selected
              </p>
            )}
          </div>

          {/* Room Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Room Type
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
            >
              {ROOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-lg"
          >
            {uploading ? '⏳ Processing...' : `📤 Upload ${files.length} Photo(s)`}
          </button>

          {/* Message */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 
              message.includes('❌') ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <p className="font-medium">{message}</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-lg mb-3">Upload Results:</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      result.success
                        ? 'bg-green-50 border-green-500'
                        : 'bg-red-50 border-red-500'
                    }`}
                  >
                    <p className="font-medium text-sm">{result.filename}</p>
                    {result.success ? (
                      <div className="text-sm text-green-700 mt-1">
                        <p>✓ Neighborhood: <span className="font-semibold">{result.neighborhood}</span></p>
                        <p>✓ Public location: {result.publicLocation}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-red-700 mt-1">
                        ✗ {result.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex gap-4">
          <a
            href="/admin"
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition text-center"
          >
            ← Manage Photos
          </a>
          <a
            href="/map"
            className="flex-1 bg-white border-2 border-blue-500 text-blue-700 py-3 px-6 rounded-lg font-medium hover:bg-blue-50 transition text-center"
          >
            View Map →
          </a>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded-lg">
          <h3 className="font-bold text-yellow-900 mb-2">⚠️ Photos without GPS?</h3>
          <p className="text-sm text-yellow-800 mb-3">
            If your photos don't have GPS data (taken without location services), they will be rejected.
          </p>
          <p className="text-sm text-yellow-800">
            <strong>Solutions:</strong>
          </p>
          <ul className="text-sm text-yellow-800 mt-2 space-y-1 ml-4">
            <li>• Enable location services on your camera/phone</li>
            <li>• Use Google Photos Takeout (preserves GPS)</li>
            <li>• Manually add GPS data using photo editing software</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
