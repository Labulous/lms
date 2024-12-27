import React, { useState } from "react";
import { Printer, ChevronDown } from "lucide-react";

interface PrintButtonWithDropdownProps {
  caseId: string;
  onPrintOptionSelect: (option: string) => void;
  disabled?: boolean;
}

const PrintButtonWithDropdown: React.FC<PrintButtonWithDropdownProps> = ({
  onPrintOptionSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const printOptions = [
    { value: "invoice", label: "Invoice" },
    { value: "lab-slip", label: "Lab Slip" },
    { value: "address-label", label: "Address Label" },
    { value: "qr-code-label", label: "QR Code Label" },
    { value: "patient-label", label: "Patient Label" },
  ];

  const handleOptionSelect = (option: string) => {
    onPrintOptionSelect(option);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className={`inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium ${
            disabled
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-50"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <Printer className="mr-2 h-5 w-5" />
          Print
          <ChevronDown className="ml-2 h-5 w-5" />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {printOptions.map((option) => (
              <button
                key={option.value}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
                onClick={() => handleOptionSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintButtonWithDropdown;
