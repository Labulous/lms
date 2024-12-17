import React, { useState, useRef } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface EnclosedItems {
  impression: number;
  biteRegistration: number;
  photos: number;
  jig: number;
  opposingModel: number;
  articulator: number;
  returnArticulator: number;
  cadcamFiles: number;
  consultRequested: number;
}

interface FormData {
  enclosedItems: EnclosedItems;
  otherItems?: string;
}

interface FilesStepProps {
  formData: FormData;
  onChange: (data: FormData) => void;
  errors?: any;
}

const FilesStep: React.FC<FilesStepProps> = ({ 
  formData,
  onChange
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer.files) {
      const newFiles = Array.from(event.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleEnclosedItemChange = (key: string, value: string) => {
    const numValue = parseInt(value) || 0;
    onChange({
      ...formData,
      enclosedItems: {
        ...(formData.enclosedItems || {}),
        [key]: numValue
      }
    });
  };

  const handleIncrement = (key: keyof EnclosedItems) => {
    onChange({
      ...formData,
      enclosedItems: {
        ...formData.enclosedItems,
        [key]: (formData.enclosedItems[key] || 0) + 1
      }
    });
  };

  const handleDecrement = (key: keyof EnclosedItems) => {
    const currentValue = formData.enclosedItems[key] || 0;
    if (currentValue > 0) {
      onChange({
        ...formData,
        enclosedItems: {
          ...formData.enclosedItems,
          [key]: currentValue - 1
        }
      });
    }
  };

  const handleOtherItemsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...formData,
      otherItems: e.target.value
    });
  };

  const enclosedItemsList = [
    { key: 'impression', label: 'Impression' },
    { key: 'biteRegistration', label: 'Bite registration' },
    { key: 'photos', label: 'Photos' },
    { key: 'jig', label: 'Jig' },
    { key: 'opposingModel', label: 'Opposing Model' },
    { key: 'articulator', label: 'Articulator' },
    { key: 'returnArticulator', label: 'Return Articulator' },
    { key: 'cadcamFiles', label: 'CAD/CAM Files' },
    { key: 'consultRequested', label: 'Consult Requested' },
  ] as const;

  const enclosedItems = formData.enclosedItems || {};

  return (
    <div>
      {/* Files Upload Section */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />
        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Files
            </button>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Camera className="h-5 w-5 mr-2" />
              Take Photo
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Drag and drop files here, or click the buttons above to select files
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <ul className="divide-y divide-gray-200">
            {selectedFiles.map((file, index) => (
              <li key={index} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">{file.name}</span>
                  <span className="ml-2 text-sm text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Separator className="my-6" />

      {/* Enclosed With Case Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Enclosed with Case</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2">
            {enclosedItemsList.map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2">
                <Input
                  type="number"
                  id={key}
                  name={key}
                  min="0"
                  value={enclosedItems[key] || 0}
                  onChange={(e) => handleEnclosedItemChange(key, e.target.value)}
                  className="w-16 bg-white text-center h-7 px-2"
                />
                <label htmlFor={key} className="text-sm text-gray-700">
                  {label}
                </label>
              </div>
            ))}
          </div>
          
          {/* Other Items Field */}
          <div>
            <label htmlFor="otherItems" className="block text-sm font-medium text-gray-700">
              Other items:
            </label>
            <Textarea
              id="otherItems"
              name="otherItems"
              rows={4}
              value={formData.otherItems || ''}
              onChange={handleOtherItemsChange}
              className="mt-1 bg-white"
              placeholder="Enter any additional items..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilesStep;