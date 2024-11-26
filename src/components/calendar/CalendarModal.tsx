import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import DueDatesCalendar from './DueDatesCalendar';
import { Case } from '../../data/mockCasesData';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Case[];
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, events }) => {
  useEffect(() => {
    console.log('CalendarModal mounted, isOpen:', isOpen);
    return () => {
      console.log('CalendarModal unmounted');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="relative inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Due Dates Calendar</h2>
            <div className="h-[800px]">
              <DueDatesCalendar events={events} height={800} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;