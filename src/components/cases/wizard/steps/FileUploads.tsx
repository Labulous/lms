import React, { useRef, Dispatch, SetStateAction, useState } from "react";
import { Upload, Camera, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase"; // Assuming you have initialized Supabase in this file
import toast from "react-hot-toast";

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
  selectedFiles?: FileWithStatus[];
  setSelectedFiles?: Dispatch<SetStateAction<FileWithStatus[]>>;
  storage: string;
}

const FileUploads: React.FC<FilesStepProps> = ({
  selectedFiles,
  setSelectedFiles,
  storage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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
          fileUpload?.file?.name
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
          .from(storage)
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
          <ul className="divide-y divide-gray-200 grid grid-cols-4 gap-2">
            {selectedFiles.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2"
              >
                {/* Check if the file is completed or has a URL */}
                {(file.status === "completed" || file?.url !== undefined) && (
                  <div className="flex w-full">
                    {file?.url && (
                      <img
                        src={file.url}
                        height={100}
                        width={100}
                        alt="file"
                        className="h-20 w-32 mb-1"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Separator className="my-6" />
    </div>
  );
};

export default FileUploads;
