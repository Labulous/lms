import React, { useRef, Dispatch, SetStateAction, useState } from "react";
import { Upload, Camera, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase"; // Assuming you have initialized Supabase in this file
import toast from "react-hot-toast";
import FilePreview from "../modals/FilePreview";

// Define the types for file status and progress
export interface FileWithStatus {
  file?: File;
  status?: "pending" | "uploading" | "completed" | "failed";
  progress?: number;
  path?: string;
  url?: string;
}

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
  selectedFiles?: FileWithStatus[];
  setSelectedFiles?: Dispatch<SetStateAction<FileWithStatus[]>>;
  errors?: Partial<FormData>;
  storage: string;
}

const FilesStep: React.FC<FilesStepProps> = ({
  formData,
  onChange,
  selectedFiles,
  setSelectedFiles,
  errors,
  storage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files?.length) return;

    const newFiles: FileWithStatus[] = Array.from(event.target.files).map(
      (file) => ({
        file,
        status: "pending", // initial status
      })
    );

    setSelectedFiles?.((prev) => [...prev, ...newFiles]); // Add new files to the selected list
    setIsUploading(true);

    try {
      for (const fileUpload of newFiles) {
        // Update status to uploading for the file
        setSelectedFiles?.((prev) =>
          prev.map((f) =>
            f.file === fileUpload.file ? { ...f, status: "uploading" } : f
          )
        );

        // Create a unique file path for storage
        const filePath = `${storage}/${new Date().getTime()}-${
          fileUpload.file?.name
        }`;

        // Start uploading the file to Supabase storage
        const { data, error } = await supabase.storage
          .from(`${storage}`) // '${storage}' is the name of your storage bucket
          .upload(filePath, fileUpload?.file as File, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from("cases")
          .getPublicUrl(filePath);

        if (!publicUrlData) {
          throw new Error("Failed to retrieve public URL");
        }

        // Update status to completed and store the public URL for the current file
        setSelectedFiles?.((prev) =>
          prev.map((f) =>
            f.file === fileUpload.file
              ? {
                  ...f,
                  status: "completed",
                  path: data?.path,
                  url: publicUrlData.publicUrl, // Store the URL
                }
              : f
          )
        );
      }

      toast.success("Files uploaded successfully");
    } catch (error: any) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles &&
      setSelectedFiles((prev) => {
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
      const newFiles: FileWithStatus[] = Array.from(
        event.dataTransfer.files
      ).map((file) => ({
        file,
        status: "pending", // Initialize the status as "pending"
      }));

      // Add new files to the selected files state
      setSelectedFiles?.((prev) => [...prev, ...newFiles]);
    }
  };

  const handleEnclosedItemChange = (key: string, value: string) => {
    const numValue = parseInt(value) || 0;
    onChange({
      ...formData,
      enclosedItems: {
        ...(formData.enclosedItems || {}),
        [key]: numValue,
      },
    });
  };

  const handleOtherItemsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    onChange({
      ...formData,
      otherItems: e.target.value,
    });
  };

  const enclosedItemsList = [
    { key: "impression", label: "Impression" },
    { key: "biteRegistration", label: "Bite registration" },
    { key: "photos", label: "Photos" },
    { key: "jig", label: "Jig" },
    { key: "opposingModel", label: "Opposing Model" },
    { key: "articulator", label: "Articulator" },
    { key: "returnArticulator", label: "Return Articulator" },
    { key: "cadcamFiles", label: "CAD/CAM Files" },
    { key: "consultRequested", label: "Consult Requested" },
  ] as const;

  const enclosedItems = formData.enclosedItems || {};
  console.log(selectedFiles, "Seleced files");
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

      {selectedFiles && selectedFiles.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="relative group bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors"
              >
                {(file.status === "completed" || file?.url !== undefined) && (
                  <div 
                    className="relative aspect-[4/3] w-full overflow-hidden rounded-md cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Opening preview for files:', selectedFiles);
                      const urls = selectedFiles
                        .filter(f => f.url && f.status === "completed")
                        .map(f => f.url as string);
                      console.log('Preview URLs:', urls);
                      setPreviewFiles(urls);
                      setShowPreview(true);
                    }}
                  >
                    <img
                      src={file.url}
                      alt={file.file?.name || 'Uploaded file'}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                )}
                {file.file?.name && (
                  <p className="mt-2 text-xs text-gray-500 truncate px-1">
                    {file.file.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showPreview && (
        <FilePreview
          files={previewFiles}
          onClose={() => setShowPreview(false)}
        />
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
                  onChange={(e) =>
                    handleEnclosedItemChange(key, e.target.value)
                  }
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
            <label
              htmlFor="otherItems"
              className="block text-sm font-medium text-gray-700"
            >
              Other Enclosed Items:
            </label>
            <Textarea
              id="otherItems"
              name="otherItems"
              rows={4}
              value={formData.otherItems || ""}
              onChange={handleOtherItemsChange}
              className="mt-1 bg-white"
              placeholder="Enter any additional items..."
            />

            {errors?.otherItems && (
              <p className="mt-2 text-sm text-red-500">{errors?.otherItems}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilesStep;
