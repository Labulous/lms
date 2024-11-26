import React from 'react';

interface ToothProps {
  number: number;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

interface ToothSelectorProps {
  billingType: string;
  onSelectionChange: (selectedTeeth: number[]) => void;
  selectedTeeth: number[];
  disabled?: boolean;
}

const Tooth: React.FC<ToothProps> = ({ number, selected, onClick, disabled }) => (
  <button
    className={`
      w-10 h-10 flex items-center justify-center
      ${selected ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}
      border border-gray-300 rounded-md text-sm font-medium
      transition-colors duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    `}
    onClick={onClick}
    disabled={disabled}
  >
    {number}
  </button>
);

const ToothSelector: React.FC<ToothSelectorProps> = ({
  billingType,
  onSelectionChange,
  selectedTeeth,
  disabled = false,
}) => {
  // Define upper and lower teeth ranges (11-26 and 31-46)
  const upperTeeth = Array.from({ length: 16 }, (_, i) => i + 11);
  const lowerTeeth = Array.from({ length: 16 }, (_, i) => i + 31);

  const isUpperArchSelected = upperTeeth.every(tooth => selectedTeeth.includes(tooth));
  const isLowerArchSelected = lowerTeeth.every(tooth => selectedTeeth.includes(tooth));

  const handleToothClick = (toothNumber: number) => {
    let newSelection: number[];

    if (billingType === 'perTooth') {
      // Individual tooth selection
      newSelection = selectedTeeth.includes(toothNumber)
        ? selectedTeeth.filter(t => t !== toothNumber)
        : [...selectedTeeth, toothNumber];
    } else if (billingType === 'perArch') {
      // Select entire arch
      const isUpper = toothNumber >= 11 && toothNumber <= 26;
      const isLower = toothNumber >= 31 && toothNumber <= 46;
      
      if (isUpper) {
        newSelection = isUpperArchSelected
          ? selectedTeeth.filter(t => t < 11 || t > 26) // Deselect upper arch
          : [...selectedTeeth.filter(t => t < 11 || t > 26), ...upperTeeth]; // Select upper arch
      } else if (isLower) {
        newSelection = isLowerArchSelected
          ? selectedTeeth.filter(t => t < 31 || t > 46) // Deselect lower arch
          : [...selectedTeeth.filter(t => t < 31 || t > 46), ...lowerTeeth]; // Select lower arch
      } else {
        newSelection = selectedTeeth;
      }
    } else if (billingType === 'teeth') {
      // Multiple teeth selection
      newSelection = selectedTeeth.includes(toothNumber)
        ? selectedTeeth.filter(t => t !== toothNumber)
        : [...selectedTeeth, toothNumber];
    } else {
      return;
    }

    onSelectionChange(newSelection);
  };

  if (billingType === 'generic') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Upper teeth */}
      <div className="grid grid-cols-8 gap-2">
        {upperTeeth.map(number => (
          <Tooth
            key={number}
            number={number}
            selected={selectedTeeth.includes(number)}
            onClick={() => handleToothClick(number)}
            disabled={disabled || (billingType === 'perArch' && !upperTeeth.includes(number))}
          />
        ))}
      </div>

      {/* Lower teeth */}
      <div className="grid grid-cols-8 gap-2">
        {lowerTeeth.map(number => (
          <Tooth
            key={number}
            number={number}
            selected={selectedTeeth.includes(number)}
            onClick={() => handleToothClick(number)}
            disabled={disabled || (billingType === 'perArch' && !lowerTeeth.includes(number))}
          />
        ))}
      </div>
    </div>
  );
};

export default ToothSelector;