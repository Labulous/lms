import React from 'react';
import { Textarea } from "@/components/ui/textarea";

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
    <div className="bg-slate-50 space-y-6">
      <div>
        <label htmlFor="labNotes" className="block text-sm font-medium text-gray-700">
          Lab Notes
        </label>
        <div className="mt-1">
          <Textarea
            id="labNotes"
            name="labNotes"
            rows={4}
            value={notes.labNotes || ''}
            onChange={handleInputChange}
            placeholder="Enter any lab-specific notes here..."
            className="bg-white"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Add any general notes about the case that are relevant for lab staff.
        </p>
      </div>

      <div>
        <label htmlFor="technicianNotes" className="block text-sm font-medium text-gray-700">
          Technician Notes
        </label>
        <div className="mt-1">
          <Textarea
            id="technicianNotes"
            name="technicianNotes"
            rows={4}
            value={notes.technicianNotes || ''}
            onChange={handleInputChange}
            placeholder="Enter any notes specific to the technician..."
            className="bg-white"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Add any specific instructions or notes for the technician.
        </p>
      </div>
    </div>
  );
};

export default NotesStep;