import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { HexColorPicker } from "react-colorful";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { WorkingTag } from "@/types/supabase";
import { getLabIdByUserId } from "@/services/authService";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "./input";
import { FormData as CaseFormData } from "../cases/wizard/CaseWizard";
interface ColorPickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  className?: string;
  value?: string;
  onColorChange?: (color: string) => void;
  disabled?: boolean;
  selectedColor: string;
  onFormChange: (field: keyof CaseFormData, value: string) => void;
}

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  (
    {
      className,
      selectedColor,
      value = "#FF0000",
      disabled,
      onColorChange,
      onFormChange,
      ...props
    },
    ref
  ) => {
    const [customColor, setCustomColor] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState<WorkingTag[]>([]);
    const [color, setColor] = useState("#000000");
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
      name: "",
      color: "#000000",
    });

    const { user } = useAuth();

    const fetchTags = async () => {
      try {
        setLoading(true);
        const labData = await getLabIdByUserId(user?.id as string);
        if (!labData?.labId) {
          toast.error("Lab not found");
          return;
        }

        const { data, error } = await supabase
          .from("working_tags")
          .select("*")
          .eq("lab_id", labData.labId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTags(data || []);
        setLoading(false);
        onColorChange?.(data[0]?.color);
        onFormChange("workingPanName" as keyof CaseFormData, data[0]?.name);
      } catch (error) {
        console.error("Error fetching tags:", error);
        toast.error("Failed to load tags");
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchTags();
    }, [user?.id]);

    console.log(user, "user  her");

    const handleSubmit = async (e: React.FormEvent) => {
      if (!formData.name) {
        toast.error("Tag Name is Required!!");
        return;
      }
      setLoading(true);
      e.preventDefault();
      try {
        const labData = await getLabIdByUserId(user?.id as string);
        if (!labData?.labId) {
          toast.error("Lab not found");
          return;
        }

        const { error } = await supabase.from("working_tags").insert([
          {
            name: formData.name,
            color: color,
            lab_id: labData.labId,
            created_by: user?.id,
          },
        ]);

        if (error) throw error;
        toast.success("Tag created successfully");
        onColorChange?.(formData.color);
        onFormChange("workingPanName" as keyof CaseFormData, formData.name);
        setFormData({ name: "", color: "#000000" });
        fetchTags();
        setLoading(false);
        setOpen(false);
      } catch (error) {
        console.error("Error saving tag:", error);
        toast.error("Failed to save tag");
        setLoading(false);
      }
    };
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <Popover open={open}>
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
              onClick={() => setOpen(!open)}
            >
              <span className="sr-only">Pick a color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            {(user?.role === "admin" || user?.role === "super_admin") && (
              <div className="flex justify-center items-center">
                <button
                  onClick={() => setCustomColor(!customColor)} // Fixed typo here
                  className={`py-2 w-full bg-${
                    selectedColor ?? "black"
                  } px-5 rounded-md text-white mb-2 text-sm font-semibold`}
                  style={{ backgroundColor: selectedColor }}
                >
                  {customColor ? "Select Existing Tag" : "Add New Tag"}
                </button>
              </div>
            )}

            {!(user?.role === "admin" || user?.role === "super_admin") && (
              <h2>hello</h2>
            )}

            {customColor ? (
              <div className="flex flex-col gap-4">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter tag name"
                  required
                />
                <HexColorPicker
                  color={color}
                  onChange={setColor}
                  className="w-64 max-w-full"
                  style={{ width: "100% !important" }}
                />

                <Button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: color }}
                  onClick={(e) => handleSubmit(e)}
                >
                  {loading ? "Creating tag" : "Create Tag"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {tags.map((color) => (
                  <Button
                    key={color.id}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-8 h-8 p-0",
                      value === color.color &&
                        "ring-2 ring-primary ring-offset-2"
                    )}
                    style={{ backgroundColor: color.color }}
                    onClick={() => {
                      onFormChange(
                        "workingPanName" as keyof CaseFormData,
                        color.name
                      );

                      onColorChange?.(color.color);
                    }}
                    title={color.name}
                  >
                    <span className="sr-only">{color.color}</span>
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
