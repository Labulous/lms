import React, { useState } from 'react';
import { Camera } from 'lucide-react';

interface PhotoUploadProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUpload, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <label className="flex items-center justify-center px-4 py-2 bg-white text-blue-500 rounded-md shadow-md border border-blue-500 cursor-pointer hover:bg-blue-50">
        <Camera className="w-5 h-5 mr-2" />
        <span>Choose File</span>
        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={isLoading} />
      </label>
      {selectedFile && (
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">{selectedFile.name}</span>
          <button
            onClick={handleUpload}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;