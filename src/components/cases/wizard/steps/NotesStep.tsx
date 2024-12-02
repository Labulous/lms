import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Notes {
  labNotes?: string;
  technicianNotes?: string;
}

interface NotesStepProps {
  notes?: Notes;
  onChange: (notes: Notes) => void;
}

const NotesStep: React.FC<NotesStepProps> = ({ notes = {}, onChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({
      ...notes,
      [name]: value,
    });
  };

  return (
    <div className="bg-slate-50 h-full flex flex-col">
      <div className="flex-1 space-y-2">
        <Label htmlFor="labNotes">Lab Notes</Label>
        <Textarea
          id="labNotes"
          name="labNotes"
          value={notes.labNotes || ''}
          onChange={handleInputChange}
          placeholder="Enter any lab-specific notes here..."
          className="bg-white h-[200px] resize-none"
        />
        <p className="text-xs text-gray-500">
          Add any general notes about the case that are relevant for lab staff.
        </p>
      </div>

      <Separator className="my-6" />

      <div className="flex-1 space-y-2">
        <Label htmlFor="technicianNotes">Technician Notes</Label>
        <Textarea
          id="technicianNotes"
          name="technicianNotes"
          value={notes.technicianNotes || ''}
          onChange={handleInputChange}
          placeholder="Enter any notes specific to the technician..."
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