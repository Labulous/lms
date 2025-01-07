import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { HexColorPicker } from "react-colorful";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const PRESET_COLORS = [
  "#FF0000", // Red
  "#FF4500", // Orange Red
  "#FFA500", // Orange
  "#FFD700", // Gold
  "#FFFF00", // Yellow
  "#9ACD32", // Yellow Green
  "#008000", // Green
  "#00CED1", // Dark Turquoise
  "#1E90FF", // Dodger Blue
  "#0000FF", // Blue
  "#4B0082", // Indigo
  "#800080", // Purple
  "#FF1493", // Deep Pink
  "#FF69B4", // Hot Pink
  "#FFC0CB", // Pink
  "#8B4513", // Saddle Brown
  "#A0522D", // Sienna
  "#D2691E", // Chocolate
  "#CD853F", // Peru
  "#DEB887", // Burlywood
];

interface ColorPickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  className?: string;
  value?: string;
  onChange?: (color: string) => void;
  disabled?: boolean;
  selectedColor: string;
}

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  (
    {
      className,
      selectedColor,
      value = "#FF0000",
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const [color, setColor] = useState("#FFA500");
    const [customCorlor, setCustomColor] = useState(false);

    useEffect(() => {
      onChange?.(color);
    }, [color]);

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-8 h-8 p-0",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{ backgroundColor: value }}
              disabled={disabled}
            >
              <span className="sr-only">Pick a color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="flex justify-center items-center">
              <button
                onClick={() => setCustomColor(!customCorlor)}
                className={`py-2 w-full bg-${selectedColor} px-5 rounded-md text-white mb-2 text-sm font-semibold`}
                style={{ backgroundColor: selectedColor }}
              >
                {customCorlor
                  ? "Select Pre Defined Colors"
                  : "Select Custom Color"}
              </button>
            </div>

            {customCorlor ? (
              <HexColorPicker
                color={color}
                onChange={setColor}
                className="w-64 max-w-full"
                style={{ width: "100% !important" }}
              />
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((color) => (
                  <Button
                    key={color}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-8 h-8 p-0",
                      value === color && "ring-2 ring-primary ring-offset-2"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => onChange?.(color)}
                  >
                    <span className="sr-only">{color}</span>
                  </Button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

export { ColorPicker, type ColorPickerProps };
