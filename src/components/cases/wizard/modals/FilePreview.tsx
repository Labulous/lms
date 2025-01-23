import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface FilePreviewProps {
  onClose: () => void;
  files: string[];
}

const FilePreview = ({ onClose, files }: FilePreviewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? files.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === files.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={() => {
        handleClose();
      }}
    >
      <DialogContent className="w-full max-w-6xl">
        <DialogHeader>
          <DialogTitle>File Preview</DialogTitle>
        </DialogHeader>

        <div className="relative w-full flex justify-center items-center mt-5">
          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            className="absolute left-5 z-50 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Image Display */}
          <div
            className="relative overflow-hidden flex justify-center items-center w-full max-w-5xl h-[70vh] bg-gray-100 rounded-lg"
          >
            <div
              className="absolute flex transition-transform duration-500"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 flex-grow-0 w-full h-92 flex justify-center items-center mt-5"
                  style={{ width: "100%" }}
                >
                  <img
                    src={file}
                    alt={`File Preview ${index + 1}`}
                    className="rounded-lg object-contain max-h-full max-w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="absolute right-5 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
          >
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center mt-5">
          {files.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 mx-1 rounded-full ${
                index === currentIndex ? "bg-blue-500" : "bg-gray-300"
              }`}
            ></button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreview;
