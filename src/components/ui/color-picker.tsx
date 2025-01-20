import React, { SetStateAction, useEffect, useState } from "react";
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
import { Label } from "./label";

interface ColorPickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  className?: string;
  value?: string;
  onColorChange?: (color: string) => void;
  disabled?: boolean;
  selectedColor: string;
  onFormChange?: (field: keyof CaseFormData, value: string) => void;
  tags: WorkingTag[];
  setTags: React.Dispatch<SetStateAction<WorkingTag[]>>;
  pans: WorkingTag[];
  setPans: React.Dispatch<SetStateAction<WorkingTag[]>>;
  onClose?: () => void;
  initiallyOpen?: boolean;
  mode?: "select" | "create";
  trigger?: React.ReactNode;
  type?: string;
}

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  (
    {
      className,
      value,
      onColorChange,
      disabled,
      selectedColor,
      onFormChange,
      tags,
      setTags,
      pans,
      setPans,
      onClose,
      initiallyOpen = false,
      mode = "select",
      trigger,
      type,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = useState(initiallyOpen);
    const [customColor, setCustomColor] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      name: "",
      color: "#000000",
      id: "",
    });

    const { user } = useAuth();

    useEffect(() => {
      if (initiallyOpen) {
        setCustomColor(true);
        setOpen(true);
      }
    }, [initiallyOpen]);

    const handleOpenChange = (newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen && onClose) {
        onClose();
      }
    };

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
        const { data: pans, error: errorPan } = await supabase
          .from("working_pans")
          .select("*")
          .eq("lab_id", labData.labId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (errorPan) throw error;
        setTags(data || []);
        setPans(pans || []);
        setLoading(false);
        onColorChange?.(data[0]?.color);
        onFormChange?.("workingPanName" as keyof CaseFormData, pans[0]?.id);
        onFormChange?.("workingTagName" as keyof CaseFormData, data[0]?.id);
      } catch (error) {
        console.error("Error fetching tags:", error);
        toast.error("Failed to load tags");
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchTags();
    }, [user?.id]);

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
            color: formData.color,
            lab_id: labData.labId,
            created_by: user?.id,
          },
        ]);

        if (error) throw error;
        toast.success("Tag created successfully");
        onColorChange?.(formData.color);
        fetchTags();
        onFormChange?.("workingTagName" as keyof CaseFormData, formData.id);
        setFormData({ name: "", color: "#000000", id: "" });
        setLoading(false);
        setOpen(false);
        onClose?.();
      } catch (error) {
        console.error("Error saving tag:", error);
        toast.error("Failed to save tag");
        setLoading(false);
      }
    };
    const handlePanSubmit = async (e: React.FormEvent) => {
      if (!formData.name) {
        toast.error("Pan Name is Required!!");
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

        const { error } = await supabase.from("working_pans").insert([
          {
            name: formData.name,
            color: formData.color,
            lab_id: labData.labId,
            created_by: user?.id,
          },
        ]);

        if (error) throw error;
        toast.success("Pan created successfully");
        onColorChange?.(formData.color);
        fetchTags();
        onFormChange?.("workingPanName" as keyof CaseFormData, formData.id);
        setFormData({ name: "", color: "#000000", id: "" });
        setLoading(false);
        setOpen(false);
        onClose?.();
      } catch (error) {
        console.error("Error saving Pan:", error);
        toast.error("Failed to save Pan");
        setLoading(false);
      }
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <Popover open={open} onOpenChange={handleOpenChange}>
          {mode === "select" ? (
            <PopoverTrigger asChild>
              <div
                className={cn(
                  "h-5 w-5 rounded-md border border-input",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                style={{ backgroundColor: selectedColor }}
              />
            </PopoverTrigger>
          ) : trigger ? (
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          ) : null}
          <PopoverContent className="w-[220px] p-3">
            <div className="space-y-2">
              <div className="space-y-2">
                <Label>{type === "pan" ? "Pan" : "Tag"} Name</Label>
                <Input
                  id="name"
                  placeholder="Enter tag name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <HexColorPicker
                  color={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                  style={{ width: "100% !important" }}
                />
                <Button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: formData.color }}
                  onClick={(e) =>
                    type === "pan" ? handlePanSubmit(e) : handleSubmit(e)
                  }
                  className="w-full text-white"
                >
                  {loading
                    ? "Creating tag"
                    : type === "pan"
                    ? "Create Pan"
                    : "Create Tag"}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

export { ColorPicker, type ColorPickerProps };
