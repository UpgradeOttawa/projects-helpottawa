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
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setResults([]);
      setMessage('');
      
      const imageCount = selectedFiles.filter(f => f.type.startsWith('image/')).length;
      const jsonCount = selectedFiles.filter(f => f.name.endsWith('.json')).length;
      
      console.log(`Selected ${imageCount} images and ${jsonCount} JSON files`);
    }
  }

  async function handleUpload() {
    if (files.length === 0) {
      setMessage('❌ Please select files');
      return;
    }

    const photoFiles = files.filter(f => f.type.startsWith('image/'));
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));
    
    if (photoFiles.length === 0) {
      setMessage('❌ No image files selected');
      return;
    }

    console.log(`Uploading ${photoFiles.length} photos with ${jsonFiles.length} JSON files`);

    setUploading(true);
    setMessage(`🔄 Uploading ${photoFiles.length} photo(s)...`);
    setResults([]);

    const uploadResults: any[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const photoFile of photoFiles) {
      try {
        // Find matching JSON file
        const jsonFile = jsonFiles.find(j => 
          j.name === `${photoFile.name}.json` || 
          j.name === photoFile.name.replace(/\.(jpg|jpeg|png)$/i, '.json')
        );

        const formData = new FormData();
        formData.append('file', photoFile);
        if (jsonFile) {
          formData.append('jsonFile', jsonFile);
          console.log(`Uploading ${photoFile.name} with JSON file ${jsonFile.name}`);
        } else {
          console.log(`Uploading ${photoFile.name} without JSON file`);
        }
        formData.append('roomType', roomType);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          successCount++;
          uploadResults.push({
            filename: photoFile.name,
            success: true,
            neighborhood: data.metadata?.neighborhood,
            gpsSource: data.metadata?.gpsSource,
          });
        } else {
          failCount++;
          uploadResults.push({
            filename: photoFile.name,
            success: false,
            error: data.error,
          });
        }

        // Update progress
        setMessage(`🔄 Uploaded ${successCount + failCount}/${photoFiles.length}...`);
        
      } catch (error: any) {
        failCount++;
        uploadResults.push({
          filename: photoFile.name,
          success: false,
          error: error.message,
        });
      }
    }

    setResults(uploadResults);

    if (failCount === 0) {
      setMessage(`✅ Successfully uploaded ${successCount} photo(s)!`);
    } else {
      setMessage(`⚠️ Uploaded ${successCount}, failed ${failCount}`);
    }

    setUploading(false);
    
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setFiles([]);
  }

  const imageCount = files.filter(f => f.type.startsWith('image/')).length;
  const jsonCount = files.filter(f => f.name.endsWith('.json')).length;

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
            <p className="font-semibold text-blue-900 mb-2">📍 Google Takeout Photos</p>
            <p className="text-sm text-blue-800 mb-2">
              Select BOTH .jpg AND .json files together (use Ctrl+A to select all)
            </p>
            <p className="text-sm text-blue-800">
              GPS data is extracted from the .json files
            </p>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Select Photos + JSON Files *
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.json"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-3 file:px-6
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 cursor-pointer"
            />
            {files.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Selected files:</p>
                <p className="text-sm text-green-600">✓ {imageCount} image(s)</p>
                <p className="text-sm text-blue-600">✓ {jsonCount} JSON file(s)</p>
                {jsonCount === 0 && imageCount > 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ No JSON files selected - photos may not have GPS!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Room Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Room Type *
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
            {uploading ? '⏳ Uploading...' : `📤 Upload ${imageCount} Photo(s)`}
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
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-300'
                        : 'bg-red-50 border-red-300'
                    }`}
                  >
                    <p className="font-medium text-sm">{result.filename}</p>
                    {result.success ? (
                      <div className="text-xs text-green-700 mt-1">
                        {result.gpsSource && (
                          <span>✓ GPS: {result.gpsSource}</span>
                        )}
                        {result.neighborhood && (
                          <span className="ml-3">📍 {result.neighborhood}</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-red-700 mt-1">
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
            href="/map"
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition text-center"
          >
            View Map →
          </a>
        </div>
      </div>
    </div>
  );
}
