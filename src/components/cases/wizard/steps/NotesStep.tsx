import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface FormData {
  notes?: {
    labNotes?: string;
    technicianNotes?: string;
  };
}

interface NotesStepProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: any) => void;
  errors?: any;
}

const NotesStep: React.FC<NotesStepProps> = ({
  formData,
  onChange,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Create a new notes object with the updated value
    const updatedNotes = {
      ...formData.notes,
      [name]: value,
    };

    // Only call onChange if the value has actually changed
    if (formData.notes?.[name as keyof typeof formData.notes] !== value) {
      onChange("notes", updatedNotes);
    }
  };

  return (
    <div className="bg-slate-50 h-full flex flex-col">
      <div className="flex-1 space-y-2">
        <Label htmlFor="labNotes">Instruction Notes</Label>
        <Textarea
          id="labNotes"
          name="labNotes"
          value={formData.notes?.labNotes || ""}
          onChange={handleInputChange}
          placeholder="Enter any instruction notes here..."
          className="bg-white h-[200px] resize-none"
        />
        <p className="text-xs text-gray-500">
          Add any instruction notes about the case that are relevant for admin staff
          or clients.
        </p>
      </div>

      <Separator className="my-6" />

      <div className="flex-1 space-y-2">
        <Label htmlFor="technicianNotes">Technician Notes</Label>
        <Textarea
          id="technicianNotes"
          name="technicianNotes"
          value={formData.notes?.technicianNotes || ""}
          onChange={handleInputChange}
          placeholder="Enter any specific instructions or notes for the technician..."
          className="bg-white h-[200px] resize-none"
        />
        <p className="text-xs text-gray-500">
          Add any specific instructions or notes for the technician.
        </p>
      </div>
    </div>
  );
};

export default NotesStep;
