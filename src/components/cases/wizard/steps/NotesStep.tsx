import React from 'react';

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
    <div className="bg-slate-50 rounded-lg shadow-sm space-y-6">
      <div>
        <label htmlFor="labNotes" className="block text-sm font-medium text-gray-700">
          Lab Notes
        </label>
        <div className="mt-1">
          <textarea
            id="labNotes"
            name="labNotes"
            rows={4}
            value={notes.labNotes || ''}
            onChange={handleInputChange}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Enter any lab-specific notes here..."
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Add any general notes about the case that are relevant for lab staff.
        </p>
      </div>

      <div>
        <label htmlFor="technicianNotes" className="block text-sm font-medium text-gray-700">
          Technician Notes
        </label>
        <div className="mt-1">
          <textarea
            id="technicianNotes"
            name="technicianNotes"
            rows={4}
            value={notes.technicianNotes || ''}
            onChange={handleInputChange}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Enter any technician-specific notes here..."
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Add any technical notes or special instructions for the assigned technicians.
        </p>
      </div>
    </div>
  );
};

export default NotesStep;