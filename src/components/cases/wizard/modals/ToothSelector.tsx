import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { BillingType } from '../../../../data/mockProductData';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw, HelpCircle } from 'lucide-react';
import { DefaultProductType } from '@/types/supabase';

interface ToothSelectorProps {
  billingType: string;
  selectedTeeth: number[];
  onSelectionChange: (teeth: number[]) => void;
  addedTeethMap: Map<number, boolean>;
  disabled: boolean;
  selectedProduct: {
    type: string[] | [];
  };
  onAddToShadeTable: () => void;
}

const teethData = [
  { number: 12, path: "M104.04,15.85c-4.53,0.15-10.17,2.75-12.78,6.3c-3.03,4.13-1.28,9.04,2.42,10.69 c3.89,1.73,16.62,13.27,20.44,5.58c2.02-4.07-1.88-15.5,3.34-18.55c0.68-1.43,1.55-2.84,3.23-3.5 C106.54,15.97,105.33,15.81,104.04,15.85z", x: 102, y: 30 },
  { number: 13, path: "M90.09,30.89c-3.04-2.15-6.49-3.39-9.6-2.95c-3.11,0.43-5.61,2.76-7.01,5.4c-1.91,3.59-2.09,8.06-0.07,11.6 c1.93,3.39,5.62,5.62,9.47,6.9c2.48,0.82,5.14,1.3,7.74,0.94c2.6-0.36,5.13-1.64,6.51-3.73C101.28,42.73,95.46,34.7,90.09,30.89z", x: 84, y: 43 },
  { number: 14, path: "M73.97,45.93c-3.04-2.15-6.49-3.39-9.6-2.95c-3.11,0.43-5.61,2.76-7.01,5.4c-1.91,3.59-2.09,8.06-0.07,11.6 c1.93,3.39,5.62,5.62,9.47,6.9c2.48,0.82,5.14,1.3,7.74,0.94c2.6-0.36,5.13-1.64,6.51-3.73C85.17,57.77,79.35,49.73,73.97,45.93z", x: 68, y: 58 },
  { number: 15, path: "M63.54,65.56c-2.52-1.09-5.26-1.98-8-1.63c-10.43,1.33-11.03,18.06-2.55,22.02 c4.37,2.04,11.87,3.86,16.13,0.47c5.6-4.45,3.43-14.58,1.69-18.45L63.54,65.56z", x: 59, y: 79 },
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

// Color mapping for different dental work types
export const TYPE_COLORS = {
  [DefaultProductType.Crown]: 'rgb(59 130 246)',    // blue-500
  [DefaultProductType.Bridge]: 'rgb(168 85 247)',   // purple-500
  [DefaultProductType.Removable]: 'rgb(77 124 15)', // lime-700
  [DefaultProductType.Implant]: 'rgb(6 182 212)',   // cyan-500
  [DefaultProductType.Coping]: 'rgb(136 19 55)',    // rose-900
  [DefaultProductType.Appliance]: 'rgb(120 113 108)' // stone-500
} as const;

// Color mapping for fill classes
const TYPE_FILL_CLASSES = {
  [DefaultProductType.Crown]: 'fill-blue-500',
  [DefaultProductType.Bridge]: 'fill-purple-500',
  [DefaultProductType.Removable]: 'fill-lime-700',
  [DefaultProductType.Implant]: 'fill-cyan-500',
  [DefaultProductType.Coping]: 'fill-rose-900',
  [DefaultProductType.Appliance]: 'fill-stone-500'
} as const;

const ToothSelector: React.FC<ToothSelectorProps> = ({
  billingType,
  selectedTeeth,
  onSelectionChange,
  addedTeethMap,
  disabled,
  selectedProduct,
  onAddToShadeTable
}) => {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [rangeStartTooth, setRangeStartTooth] = useState<number | null>(null);
  const [rangeSelections, setRangeSelections] = useState<Set<number>>(new Set());
  const [individualSelections, setIndividualSelections] = useState<Set<number>>(new Set());
  const [showTooltip, setShowTooltip] = useState(false);
  const [ponticMode, setPonticMode] = useState(false);
  const [ponticTeeth, setPonticTeeth] = useState<Set<number>>(new Set());
  const [abutmentMode, setAbutmentMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset all selection states
  const resetSelectionStates = () => {
    setPonticMode(false);
    setPonticTeeth(new Set());
    setRangeStartTooth(null);
    setIndividualSelections(new Set());
    setRangeSelections(new Set());
  };

  // Effect to reset pontic mode when selected teeth change
  useEffect(() => {
    if (selectedTeeth.length < 2) {
      setPonticMode(false);
      setPonticTeeth(new Set());
    }
  }, [selectedTeeth]);

  // Effect to reset pontic mode when product type changes
  useEffect(() => {
    if (!selectedProduct?.type?.some(t => t.toLowerCase() === 'bridge')) {
      setPonticMode(false);
      setPonticTeeth(new Set());
    }
  }, [selectedProduct?.type]);

  // Helper function to get visual position index of a tooth
  const getVisualIndex = (toothNumber: number) => {
    // Upper right quadrant (18-11)
    if (toothNumber >= 11 && toothNumber <= 18) {
      return 18 - toothNumber; // 18->0, 17->1, ..., 11->7
    }
    // Upper left quadrant (21-28)
    if (toothNumber >= 21 && toothNumber <= 28) {
      return toothNumber - 21; // 21->0, 22->1, ..., 28->7
    }
    // Lower right quadrant (48-41)
    if (toothNumber >= 41 && toothNumber <= 48) {
      return 48 - toothNumber; // 48->0, 47->1, ..., 41->7
    }
    // Lower left quadrant (31-38)
    if (toothNumber >= 31 && toothNumber <= 38) {
      return toothNumber - 31; // 31->0, 32->1, ..., 38->7
    }
    return -1;
  };

  // Helper function to get teeth in visual order for upper arch (always left to right)
  const getUpperArchTeeth = (fromTooth: number, toTooth: number): number[] => {
    const result: number[] = [];
    
    // Determine the leftmost and rightmost teeth
    let leftTooth: number, rightTooth: number;
    
    // For teeth in right quadrant (11-18)
    if (fromTooth >= 11 && fromTooth <= 18) {
      leftTooth = fromTooth;
    } else {
      leftTooth = toTooth;
    }
    
    // For teeth in left quadrant (21-28)
    if (fromTooth >= 21 && fromTooth <= 28) {
      rightTooth = fromTooth;
    } else {
      rightTooth = toTooth;
    }
    
    // If both teeth are in right quadrant (11-18)
    if (leftTooth >= 11 && leftTooth <= 18 && rightTooth >= 11 && rightTooth <= 18) {
      const min = Math.min(leftTooth, rightTooth);
      const max = Math.max(leftTooth, rightTooth);
      for (let t = min; t <= max; t++) result.push(t);
      return result;
    }
    
    // If both teeth are in left quadrant (21-28)
    if (leftTooth >= 21 && leftTooth <= 28 && rightTooth >= 21 && rightTooth <= 28) {
      const min = Math.min(leftTooth, rightTooth);
      const max = Math.max(leftTooth, rightTooth);
      for (let t = min; t <= max; t++) result.push(t);
      return result;
    }
    
    // If selection crosses quadrants, always go left to right visually
    if ((leftTooth >= 11 && leftTooth <= 18) && (rightTooth >= 21 && rightTooth <= 28)) {
      // Start from the leftmost tooth
      for (let t = leftTooth; t >= 11; t--) result.push(t);
      // Then add teeth from left quadrant
      for (let t = 21; t <= rightTooth; t++) result.push(t);
      return result;
    }
    
    return result;
  };

  // Helper function to get teeth in visual order for lower arch (always right to left)
  const getLowerArchTeeth = (fromTooth: number, toTooth: number): number[] => {
    const result: number[] = [];
    
    // Determine the rightmost and leftmost teeth
    let rightTooth: number, leftTooth: number;
    
    // For teeth in left quadrant (31-38)
    if (fromTooth >= 31 && fromTooth <= 38) {
      rightTooth = fromTooth;
    } else {
      rightTooth = toTooth;
    }
    
    // For teeth in right quadrant (41-48)
    if (fromTooth >= 41 && fromTooth <= 48) {
      leftTooth = fromTooth;
    } else {
      leftTooth = toTooth;
    }
    
    // If both teeth are in left quadrant (31-38)
    if (rightTooth >= 31 && rightTooth <= 38 && leftTooth >= 31 && leftTooth <= 38) {
      const min = Math.min(rightTooth, leftTooth);
      const max = Math.max(rightTooth, leftTooth);
      for (let t = min; t <= max; t++) result.push(t);
      return result;
    }
    
    // If both teeth are in right quadrant (41-48)
    if (rightTooth >= 41 && rightTooth <= 48 && leftTooth >= 41 && leftTooth <= 48) {
      const min = Math.min(rightTooth, leftTooth);
      const max = Math.max(rightTooth, leftTooth);
      for (let t = min; t <= max; t++) result.push(t);
      return result;
    }
    
    // If selection crosses quadrants, always go right to left visually
    if ((rightTooth >= 31 && rightTooth <= 38) && (leftTooth >= 41 && leftTooth <= 48)) {
      // Start from the rightmost tooth
      for (let t = rightTooth; t >= 31; t--) result.push(t);
      // Then add teeth from right quadrant
      for (let t = 41; t <= leftTooth; t++) result.push(t);
      return result;
    }
    
    return result;
  };

  // Helper function to get tooth numbers between two visual positions
  const getTeethInVisualRange = (start: number, end: number) => {
    console.log('getTeethInVisualRange called with:', { start, end });

    // Check if teeth are in the same arch
    const isUpperArch = (tooth: number) => tooth >= 11 && tooth <= 28;
    const isLowerArch = (tooth: number) => tooth >= 31 && tooth <= 48;

    // Prevent selection across upper/lower arch boundary
    if ((isUpperArch(start) && isLowerArch(end)) || 
        (isLowerArch(start) && isUpperArch(end))) {
      console.log('Selection crosses upper/lower arch boundary');
      return [];
    }

    // Get teeth based on arch
    if (isUpperArch(start) && isUpperArch(end)) {
      const result = getUpperArchTeeth(start, end);
      console.log('Upper arch selection:', result);
      return result;
    }

    if (isLowerArch(start) && isLowerArch(end)) {
      const result = getLowerArchTeeth(start, end);
      console.log('Lower arch selection:', result);
      return result;
    }

    console.log('Invalid selection');
    return [];
  };

  // Helper function to get abutment teeth based on visual order
  const getAbutmentTeeth = (): number[] => {
    if (selectedTeeth.length < 2) return [];
    
    const isUpperArch = selectedTeeth[0] >= 11 && selectedTeeth[0] <= 28;
    const isLowerArch = selectedTeeth[0] >= 31 && selectedTeeth[0] <= 48;
    
    if (!isUpperArch && !isLowerArch) return [];
    
    // Get teeth in visual order
    const visualOrderTeeth = isUpperArch ? 
      getUpperArchTeeth(selectedTeeth[0], selectedTeeth[selectedTeeth.length - 1]) :
      getLowerArchTeeth(selectedTeeth[0], selectedTeeth[selectedTeeth.length - 1]);
    
    // Return first and last teeth in the visual order if they are in the selected teeth
    const selectedSet = new Set(selectedTeeth);
    const abutments = [];
    
    if (selectedSet.has(visualOrderTeeth[0])) {
      abutments.push(visualOrderTeeth[0]);
    }
    if (selectedSet.has(visualOrderTeeth[visualOrderTeeth.length - 1])) {
      abutments.push(visualOrderTeeth[visualOrderTeeth.length - 1]);
    }
    
    return abutments;
  };

  // Add this helper function to check if teeth are in same arch
  const areTeethInSameArch = (teeth: number[]): boolean => {
    const isUpperArch = (tooth: number) => tooth >= 11 && tooth <= 28;
    const isLowerArch = (tooth: number) => tooth >= 31 && tooth <= 48;
    
    return teeth.every(isUpperArch) || teeth.every(isLowerArch);
  };

  // Add this helper function to check if teeth are in same quadrant
  const areTeethInSameQuadrant = (teeth: number[]): boolean => {
    const getQuadrant = (tooth: number) => {
      if (tooth >= 11 && tooth <= 18) return 1;
      if (tooth >= 21 && tooth <= 28) return 2;
      if (tooth >= 31 && tooth <= 38) return 3;
      if (tooth >= 41 && tooth <= 48) return 4;
      return 0;
    };
    
    const firstQuadrant = getQuadrant(teeth[0]);
    return teeth.every(tooth => getQuadrant(tooth) === firstQuadrant);
  };

  // Updated isTeethRangeContinuous to handle cross-quadrant selections
  const isTeethRangeContinuous = useCallback((teeth: number[]): boolean => {
    if (teeth.length < 2) {
      return false;
    }
    
    // Only check same arch requirement for Bridge products
    if (selectedProduct?.type?.includes('Bridge')) {
      const isUpperArch = teeth.every(t => t >= 11 && t <= 28);
      const isLowerArch = teeth.every(t => t >= 31 && t <= 48);
      
      if (!isUpperArch && !isLowerArch) {
        return false;
      }
    }

    // Get teeth in visual order
    const visualOrderTeeth = areTeethInSameArch(teeth) ? 
      (teeth[0] >= 11 && teeth[0] <= 28) ? 
        getUpperArchTeeth(teeth[0], teeth[teeth.length - 1]) :
        getLowerArchTeeth(teeth[0], teeth[teeth.length - 1]) :
        [];

    // Check if selected teeth match the visual order
    const selectedSet = new Set(teeth);
    return visualOrderTeeth.every(tooth => selectedSet.has(tooth)) &&
           teeth.length === visualOrderTeeth.length;
  }, [selectedProduct?.type]);

  // Effect to handle pontic mode
  useEffect(() => {
    if (selectedTeeth.length < 2 || !isTeethRangeContinuous(selectedTeeth)) {
      setPonticMode(false);
      setPonticTeeth(new Set());
    }
  }, [selectedTeeth, isTeethRangeContinuous]);

  // Effect to reset pontic mode when product type changes
  useEffect(() => {
    if (!selectedProduct?.type?.some(t => t.toLowerCase() === 'bridge')) {
      setPonticMode(false);
      setPonticTeeth(new Set());
    }
  }, [selectedProduct?.type]);

  // Helper function to get tooth color
  const getToothColor = (toothNumber: number): string => {
    const type = selectedProduct?.type?.[0];

    // If tooth is in ponticTeeth, use Bridge color
    if (ponticTeeth.has(toothNumber)) {
      return TYPE_FILL_CLASSES[DefaultProductType.Bridge];
    }

    // If tooth is already added to a product
    if (addedTeethMap && addedTeethMap[toothNumber]) {
      const addedType = addedTeethMap[toothNumber].type?.[0];
      if (addedType && addedType in TYPE_FILL_CLASSES) {
        return TYPE_FILL_CLASSES[addedType as DefaultProductType];
      }
      return 'fill-gray-300';
    }

    // If in bridge mode
    if (type === DefaultProductType.Bridge) {
      if (ponticMode) {
        return 'fill-gray-300'; // gray-300 for pontic selection mode
      }
      const abutmentTeeth = getAbutmentTeeth();
      if (abutmentTeeth.includes(toothNumber)) {
        return TYPE_FILL_CLASSES[DefaultProductType.Bridge]; // Abutment teeth
      }
    }

    // If tooth is selected
    if (selectedTeeth.includes(toothNumber)) {
      if (type && type in TYPE_FILL_CLASSES) {
        return TYPE_FILL_CLASSES[type as DefaultProductType];
      }
      return 'fill-gray-300'; // gray-300 fallback
    }

    // Default unselected color
    return 'fill-gray-200';
  };

  const handlePonticSelect = (toothNumber: number) => {
    if (!isPonticSelectable(toothNumber)) return;
    
    const newPonticTeeth = new Set(ponticTeeth);
    if (newPonticTeeth.has(toothNumber)) {
      newPonticTeeth.delete(toothNumber);
    } else {
      newPonticTeeth.add(toothNumber);
    }
    setPonticTeeth(newPonticTeeth);
  };

  const handleToothClick = (toothNumber: number, event: React.MouseEvent) => {
    if (disabled) return;

    if (ponticMode) {
      handlePonticSelect(toothNumber);
      onSelectionChange(selectedTeeth, Array.from(ponticTeeth));
      return;
    }

    // Single tooth selection with Cmd (Mac) or Ctrl (Windows/Linux) key
    if ((event.metaKey || event.ctrlKey) && billingType === 'perTooth') {
      const newIndividualSelections = new Set(individualSelections);
      
      if (newIndividualSelections.has(toothNumber)) {
        newIndividualSelections.delete(toothNumber);
      } else {
        newIndividualSelections.add(toothNumber);
      }
      
      setIndividualSelections(newIndividualSelections);
      setPonticMode(false); // Only reset pontic mode
      setPonticTeeth(new Set()); // Only reset pontic teeth
      onSelectionChange(Array.from(newIndividualSelections));
      return;
    }

    // Shift click for range selection
    if (event.shiftKey && billingType === 'perTooth') {
      if (selectedTeeth.length === 0) {
        setRangeStartTooth(toothNumber);
        setRangeSelections(new Set([toothNumber]));
        resetSelectionStates();
        onSelectionChange([toothNumber]);
        return;
      }

      const lastSelectedTooth = selectedTeeth[selectedTeeth.length - 1];
      const teethInRange = getTeethInVisualRange(lastSelectedTooth, toothNumber);
      
      if (teethInRange.length > 0) {
        const newRangeSelections = new Set(teethInRange);
        setRangeSelections(newRangeSelections);
        resetSelectionStates();
        onSelectionChange(teethInRange);
      }
      return;
    }

    // Regular click (no modifier keys)
    if (!event.shiftKey && !event.metaKey && !event.ctrlKey) {
      resetSelectionStates();
      setIndividualSelections(new Set([toothNumber]));
      onSelectionChange([toothNumber]);
    }
  };

  const getArchSelectionText = () => {
    if (billingType !== 'perArch') return '';
    
    const hasUpper = selectedTeeth.some(t => t >= 11 && t <= 28);
    const hasLower = selectedTeeth.some(t => t >= 31 && t <= 48);

    if (hasUpper && hasLower) return 'Both Arches';
    if (hasUpper) return 'Upper Arch';
    if (hasLower) return 'Lower Arch';
    return '';
  };

  const handleReset = () => {
    onSelectionChange([]);
    resetSelectionStates();
  };

  const handleAddToShadeTable = () => {
    if (onAddToShadeTable) {
      resetSelectionStates(); // Reset all states when adding to shade table
      onAddToShadeTable();
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only handle clicks directly on the SVG or container
    const target = e.target as Element;
    if (target === containerRef.current || 
        target.tagName.toLowerCase() === 'svg' || 
        target === e.currentTarget) {
      onSelectionChange([]);
      setPonticTeeth(new Set());
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSelectionChange([]);
        setPonticTeeth(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectionChange]);

  return (
    <div 
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative w-full max-w-3xl mx-auto"
    >
      {billingType === 'perTooth' && (
        <div className="absolute top-0 right-0 text-xs text-gray-500">
          <div 
            className="relative inline-block"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className="cursor-help underline decoration-dotted text-purple-500 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              Range Selection
            </span>
            {showTooltip && (
              <div className="absolute right-0 mt-1 p-2 bg-white border rounded-md shadow-lg z-50 w-48">
                <p className="text-xs mb-1">Hold Shift and click two teeth to select a range.</p>
                <p className="text-xs">Works within upper or lower arch.</p>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">Crown and Bridge</span>
          <span className="text-xs text-gray-500 mt-0.5">{billingType === 'perTooth' ? 'Per Tooth' : 
           billingType === 'perArch' ? 'Click any tooth to select/deselect an arch' : 
           'Generic'}</span>
        </div>
        {selectedTeeth.length > 0 && (
          <Button 
            variant="ghost" 
            size="xs" 
            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 mt-4"
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
          <foreignObject x="65" y="60" width="136" height="180">
            <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ transform: 'scale(0.75)' }}>
              <div className="text-gray-400 text-xs text-center">
                Selected Teeth
              </div>
              <div className="text-gray-600 text-xs font-semibold text-center break-words max-w-[272px]">
                {billingType === 'perArch' ? getArchSelectionText() : selectedTeeth.length === 0 ? 'None' : selectedTeeth.join(', ')}
              </div>

              {/* Display Abutment teeth */}
              {(() => {
                const isBridge = selectedProduct?.type?.some(t => t.toLowerCase() === 'bridge');
                const hasEnoughTeeth = selectedTeeth.length >= 2;
                const isRange = isTeethRangeContinuous(selectedTeeth);
                
                return isBridge && hasEnoughTeeth && isRange && (
                  <div className="text-xs font-semibold mt-1">
                    <span className="text-purple-500">Abutment: </span>
                    <span className="text-gray-600">{getAbutmentTeeth().join(', ')}</span>
                  </div>
                );
              })()}

              {/* Display Pontic teeth */}
              {selectedProduct?.type?.some(t => t.toLowerCase() === 'bridge') && ponticTeeth.size > 0 && (
                <div className="text-xs font-semibold mt-1">
                  <span className="text-emerald-500">Pontic: </span>
                  <span className="text-gray-600">{Array.from(ponticTeeth).sort((a, b) => a - b).join(', ')}</span>
                </div>
              )}

              {/* Pontic Button */}
              {(() => {
                const isBridge = selectedProduct?.type?.some(t => t.toLowerCase() === 'bridge');
                const hasEnoughTeeth = selectedTeeth.length >= 2;
                const notInPonticMode = !ponticMode;
                const isRange = isTeethRangeContinuous(selectedTeeth);

                return isBridge && hasEnoughTeeth && notInPonticMode && isRange && (
                  <Button
                    variant="outline"
                    size="xs"
                    className="mt-1 px-2 py-1 bg-emerald-500 text-white text-xs hover:bg-emerald-600 hover:text-white"
                    onClick={() => setPonticMode(true)}
                  >
                    Select Pontic
                  </Button>
                );
              })()}
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
                  onClick={(event) => handleToothClick(tooth.number, event)}
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
                {/* Corner Marker */}
                {addedTeethMap.has(tooth.number) && (
                  <circle
                    cx={tooth.number >= 11 && tooth.number <= 18 ? tooth.x - 8 : tooth.x + 8}
                    cy={tooth.y - 8}
                    r="2"
                    className={cn(
                      "pointer-events-none",
                      addedTeethMap.get(tooth.number) ? "fill-purple-500" : "fill-blue-500"
                    )}
                  />
                )}
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
                    onClick={(event) => handleToothClick(lowerToothNumber, event)}
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
                  {/* Corner Marker - Now positioned at bottom and in front */}
                  {addedTeethMap.has(lowerToothNumber) && (
                    <g transform="scale(1,-1)">
                      <circle
                        cx={lowerToothNumber >= 41 && lowerToothNumber <= 48 ? tooth.x - 8 : tooth.x + 8}
                        cy={-tooth.y + 8}
                        r="2"
                        className={cn(
                          "pointer-events-none",
                          addedTeethMap.get(lowerToothNumber) ? "fill-purple-500" : "fill-blue-500"
                        )}
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <Button 
        variant="ghost" 
        size="xs" 
        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 mt-4"
        onClick={handleAddToShadeTable}
      >
        Add to Shade Table
      </Button>

    </div>
  );
};

export default ToothSelector;