import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { BillingType } from '../../../../data/mockProductData';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw } from 'lucide-react';

interface ToothSelectorProps {
  billingType: BillingType;
  onSelectionChange: (selectedTeeth: number[]) => void;
  selectedTeeth: number[];
  disabled?: boolean;
  onAdd?: (teeth: number[]) => void;
}

const teethData = [
  { number: 12, path: "M104.04,15.85c-4.53,0.15-10.17,2.75-12.78,6.3c-3.03,4.13-1.28,9.04,2.42,10.69 c3.89,1.73,16.62,13.27,20.44,5.58c2.02-4.07-1.88-15.5-3.34-18.55c-0.68-1.43-1.55-2.84-3.23-3.5 C106.54,15.97,105.33,15.81,104.04,15.85z", x: 102, y: 30 },
  { number: 13, path: "M90.09,30.89c-3.04-2.15-6.49-3.39-9.6-2.95c-3.11,0.43-5.61,2.76-7.01,5.4c-1.91,3.59-2.09,8.06-0.07,11.6 c1.93,3.39,5.62,5.62,9.47,6.9c2.48,0.82,5.14,1.3,7.74,0.94c2.6-0.36,5.13-1.64,6.51-3.73C101.28,42.73,95.46,34.7,90.09,30.89z", x: 84, y: 43 },
  { number: 14, path: "M73.97,45.93c-3.04-2.15-6.49-3.39-9.6-2.95c-3.11,0.43-5.61,2.76-7.01,5.4c-1.91,3.59-2.09,8.06-0.07,11.6 c1.93,3.39,5.62,5.62,9.47,6.9c2.48,0.82,5.14,1.3,7.74,0.94c2.6-0.36,5.13-1.64,6.51-3.73C85.17,57.77,79.35,49.73,73.97,45.93z", x: 68, y: 58 },
  { number: 15, path: "M63.54,65.56c-2.52-1.09-5.26-1.98-8-1.63c-10.43,1.33-11.03,18.06-2.55,22.02 c4.37,2.04,11.87,3.86,16.13,0.47c5.6-4.45,3.43-14.58-1.69-18.45L63.54,65.56z", x: 59, y: 79 },
  { number: 16, path: "M60.3,109.83c0.07-0.05,0.14-0.11,0.2-0.17c4.02-3.51,6.25-9.72,4.7-14.93c-1.32-4.43-5.57-6.45-9.76-7.35 c-5.31-1.14-10.59-0.06-13.35,5.07c-1.42,2.64-2.8,5.79-2.53,8.91c0.33,3.72,3.5,6.05,6.77,7.15c3.07,1.03,6.47,1.57,9.63,2.25 C57.54,111.1,59.03,110.83,60.3,109.83z", x: 52, y: 102 },
  { number: 17, path: "M54.82,111.6c-3.48-0.73-6.76-2.3-10.28-2.86c-2.27-0.36-4.77-0.11-6.53,1.38 c-1.19,1.01-1.91,2.47-2.57,3.89c-0.83,1.79-1.64,3.61-1.99,5.56s-0.2,4.05,0.79,5.75c0.84,1.45,2.23,2.5,3.67,3.33 c2.72,1.56,5.8,2.45,8.92,2.6c4.43,0.21,9.19-1.32,11.78-4.97c3.42-4.82,1.99-13.58-4.51-14.76", x: 46, y: 123 },
  { number: 18, path: "M47.67,155.5c0.17-0.02,0.33-0.04,0.5-0.06c6.8-0.82,10.92-6.54,9.73-13.69c-0.3-1.78-1.1-3.42-1.9-5.03 c-0.58-1.18-1.22-2.43-2.34-3.11c-0.9-0.55-1.99-0.65-3.03-0.74c-3.45-0.3-6.89-0.61-10.34-0.91c-1.25-0.11-2.54-0.22-3.75,0.11 c-3.91,1.04-6.25,6.27-7.09,9.91c-2.3,9.98,7.01,14.14,15.3,13.79C45.71,155.73,46.69,155.62,47.67,155.5z", x: 43, y: 145 },
  { number: 11, path: "M129.07,11.36c-4.16-1.81-10.36-1.88-14.2,0.22c-4.47,2.44-4.93,7.64-2.27,10.72 c2.8,3.24,9.53,19.16,16.19,13.83c3.53-2.82,4.76-14.85,4.71-18.24c-0.02-1.58-0.22-3.24-1.47-4.56 C131.28,12.53,130.26,11.87,129.07,11.36z", x: 123, y: 25 },
  { number: 21, path: "M138.98,11.36c4.16-1.81,10.36-1.88,14.2,0.22c4.47,2.44,4.93,7.64,2.27,10.72 c-2.8,3.24-9.53,19.16-16.19,13.83c-3.53-2.82-4.76-14.85-4.71-18.24c0.02-1.58,0.22-3.24,1.47-4.56 C136.78,12.53,137.8,11.87,138.98,11.36z", x: 145, y: 25 },
  { number: 23, path: "M177.96,30.89c3.04-2.15,6.49-3.39,9.6-2.95c3.11,0.43,5.61,2.76,7.01,5.4c1.91,3.59,2.09,8.06,0.07,11.6 c-1.93,3.39-5.62,5.62-9.47,6.9c-2.48,0.82-5.14,1.3-7.74,0.94c-2.6-0.36-5.13-1.64-6.51-3.73 C166.77,42.73,172.59,34.7,177.96,30.89z", x: 184, y: 43 },
  { number: 24, path: "M194.08,45.93c3.04-2.15 6.49-3.39 9.6-2.95c3.11 0.43 5.61 2.76 7.01 5.4c1.91 3.59 2.09 8.06 0.07 11.6 c-1.93 3.39-5.62 5.62-9.47 6.9c-2.48 0.82-5.14 1.3-7.74 0.94c-2.6-0.36-5.13-1.64-6.51-3.73 C182.88 57.77 188.7 49.73 194.08 45.93z", x: 200, y: 58 },
  { number: 25, path: "M204.51,65.56c2.52-1.09,5.26-1.98,8-1.63c10.43,1.33,11.03,18.06,2.55,22.02 c-4.37,2.04-11.87,3.86-16.13,0.47c-5.6-4.45-3.43-14.58,1.69-18.45L204.51,65.56z", x: 209, y: 80 },
  { number: 26, path: "M207.76,109.83c-0.07-0.05-0.14-0.11-0.2-0.17c-4.02-3.51-6.25-9.72-4.7-14.93 c1.32-4.43,5.57-6.45,9.76-7.35c5.31-1.14,10.59-0.06,13.35,5.07c1.42,2.64,2.8,5.79,2.53,8.91c-0.33,3.72-3.5,6.05-6.77,7.15 c-3.07,1.03-6.47,1.57-9.63,2.25C210.51,111.1,209.02,110.83,207.76,109.83z", x: 216, y: 101 },
  { number: 27, path: "M213.24,111.6c3.48-0.73,6.76-2.3,10.28-2.86c2.27-0.36,4.77-0.11,6.53,1.38c1.19,1.01,1.91,2.47,2.57,3.89 c0.83,1.79,1.64,3.61,1.99,5.56c0.35,1.94,0.2,4.05-0.79,5.75c-0.84,1.45-2.23,2.5-3.67,3.33c-2.72,1.56-5.8,2.45-8.92,2.6 c-4.43,0.21-9.19-1.32-11.78-4.97c-3.42-4.82-1.99-13.58,4.51-14.76", x: 222, y: 123 },
  { number: 28, path: "M220.38,155.5c-0.17-0.02-0.33-0.04-0.5-0.06c-6.8-0.82-10.92-6.54-9.73-13.69c0.3-1.78,1.1-3.42,1.9-5.03 c0.58-1.18,1.22-2.43,2.34-3.11c0.9-0.55,1.99-0.65,3.03-0.74c3.45-0.3,6.89-0.61,10.34-0.91c1.25-0.11,2.54-0.22,3.75,0.11 c3.91,1.04,6.25,6.27,7.09,9.91c2.3,9.98-7.01,14.14-15.3,13.79C222.34,155.73,221.36,155.62,220.38,155.5z", x: 225, y: 145 },
  { number: 22, path: "M164.01,15.85c4.53,0.15,10.17,2.75,12.78,6.3c3.03,4.13,1.28,9.04-2.42,10.69 c-3.89,1.73-16.62,13.27-20.44,5.58c-2.02-4.07,1.88-15.5,3.34-18.55c0.68-1.43,1.55-2.84,3.23-3.5 C161.52,15.97,162.72,15.81,164.01,15.85z", x: 165, y: 30 },
] as const;

const ToothSelector: React.FC<ToothSelectorProps> = ({
  billingType,
  onSelectionChange,
  selectedTeeth,
  disabled = false,
  onAdd
}) => {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);

  const handleToothClick = (toothNumber: number) => {
    if (disabled || billingType === 'generic') return;

    let newSelectedTeeth: number[];
    if (billingType === 'perArch') {
      // For perArch, select all teeth in the same arch
      const isUpperArch = toothNumber >= 11 && toothNumber <= 28;
      const archTeeth = isUpperArch ? [11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28] 
                                  : [31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48];
      
      // Check if we're deselecting
      const isArchSelected = archTeeth.every(t => selectedTeeth.includes(t));
      if (isArchSelected) {
        newSelectedTeeth = selectedTeeth.filter(t => !archTeeth.includes(t));
      } else {
        // Remove any teeth from the other arch
        const otherArchTeeth = !isUpperArch 
          ? [11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28]
          : [31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48];
        newSelectedTeeth = selectedTeeth.filter(t => !otherArchTeeth.includes(t));
        // Add all teeth from this arch
        newSelectedTeeth = [...newSelectedTeeth, ...archTeeth];
      }
    } else {
      // For perTooth, toggle individual tooth
      newSelectedTeeth = selectedTeeth.includes(toothNumber)
        ? selectedTeeth.filter(t => t !== toothNumber)
        : [...selectedTeeth, toothNumber];
    }
    onSelectionChange(newSelectedTeeth);
  };

  const handleReset = () => {
    onSelectionChange([]);
  };

  const isToothSelectable = (toothNumber: number) => {
    if (disabled || billingType === 'generic') return false;
    return true;
  };

  const getToothColor = (toothNumber: number) => {
    if (disabled) return 'text-gray-300 fill-gray-300';
    if (selectedTeeth.includes(toothNumber)) return 'text-blue-500 fill-blue-500';
    
    if (billingType === 'perArch') {
      // Highlight all teeth in the arch on hover
      const isUpperArch = toothNumber >= 11 && toothNumber <= 28;
      const isHoveredArchUpper = hoveredTooth !== null && hoveredTooth >= 11 && hoveredTooth <= 28;
      
      if (hoveredTooth !== null && 
          ((isUpperArch && isHoveredArchUpper) || (!isUpperArch && !isHoveredArchUpper))) {
        return 'text-blue-300 fill-blue-300';
      }
    } else if (hoveredTooth === toothNumber) {
      return 'text-blue-300 fill-blue-300';
    }
    
    return 'text-gray-600 fill-gray-300 hover:text-blue-300 hover:fill-blue-300';
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">Crown and Bridge</span>
          <span className="text-xs text-gray-500 mt-0.5">{billingType === 'perTooth' ? 'Per Tooth' : billingType === 'perArch' ? 'Per Arch' : 'Generic'}</span>
        </div>
        {selectedTeeth.length > 0 && (
          <Button 
            variant="ghost" 
            size="xs" 
            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
            onClick={handleReset}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>
      <div className={cn(
        "relative",
        disabled && "opacity-50 pointer-events-none"
      )}>
        <svg
          viewBox="20 0 228 340"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Selected Teeth Text */}
          <foreignObject x="65" y="100" width="136" height="120">
            <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ transform: 'scale(0.75)' }}>
              <div className="text-gray-400 text-xs text-center">
                Selected Teeth
              </div>
              <div className="text-gray-600 text-xs font-semibold text-center break-words max-w-[272px]">
                {selectedTeeth.length === 0 ? 'None' : selectedTeeth.join(', ')}
              </div>
              <Button 
                variant="default" 
                size="xs" 
                className="mt-1 px-3 py-1"
                disabled={selectedTeeth.length === 0}
                onClick={() => onAdd?.(selectedTeeth)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
          </foreignObject>

          {/* Upper Teeth Group */}
          <g>
            {teethData.map(tooth => (
              <g key={`upper-${tooth.number}`}>
                <path
                  d={tooth.path}
                  className={cn(
                    "transition-colors cursor-pointer",
                    getToothColor(tooth.number)
                  )}
                  onClick={() => handleToothClick(tooth.number)}
                  onMouseEnter={() => setHoveredTooth(tooth.number)}
                  onMouseLeave={() => setHoveredTooth(null)}
                />
                <text
                  x={tooth.x}
                  y={tooth.y}
                  className={cn(
                    "text-[8px] pointer-events-none select-none",
                    selectedTeeth.includes(tooth.number) ? "fill-white" : "fill-current"
                  )}
                  textAnchor="middle"
                >
                  {tooth.number}
                </text>
              </g>
            ))}
          </g>
          
          {/* Lower Teeth Group - Mirrored */}
          <g transform="translate(0,320) scale(1,-1)">
            {teethData.map(tooth => {
              const lowerToothNumber = (() => {
                if (tooth.number >= 11 && tooth.number <= 18) {
                  return tooth.number + 30; // 11-18 -> 41-48
                } else if (tooth.number >= 21 && tooth.number <= 28) {
                  return tooth.number + 10; // 21-28 -> 31-38
                }
                return tooth.number;
              })();
              
              return (
                <g key={`lower-${lowerToothNumber}`}>
                  <path
                    d={tooth.path}
                    className={cn(
                      "transition-colors cursor-pointer",
                      getToothColor(lowerToothNumber)
                    )}
                    onClick={() => handleToothClick(lowerToothNumber)}
                    onMouseEnter={() => setHoveredTooth(lowerToothNumber)}
                    onMouseLeave={() => setHoveredTooth(null)}
                  />
                  <text
                    x={tooth.x}
                    y={-tooth.y - -5}
                    className={cn(
                      "text-[8px] pointer-events-none select-none",
                      selectedTeeth.includes(lowerToothNumber) ? "fill-white" : "fill-current"
                    )}
                    textAnchor="middle"
                    transform="scale(1,-1)"
                  >
                    {lowerToothNumber}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default ToothSelector;