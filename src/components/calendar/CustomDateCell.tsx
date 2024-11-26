import React, { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Case } from '../../data/mockCasesData';

interface CustomDateCellProps {
  value: Date;
  events: Case[];
}

const CustomDateCell: React.FC<CustomDateCellProps> = ({ value, events }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();

  const handleDateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const formattedDate = format(value, 'yyyy-MM-dd');
    navigate(`/cases?dueDate=${formattedDate}`);
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div 
      className="custom-date-cell" 
      onClick={handleDateClick}
      role="gridcell"
      aria-label={format(value, 'MMMM d, yyyy')}
    >
      <span className="date-number">{format(value, 'd')}</span>
      {events.length > 0 && (
        <div 
          className="badge-container"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={handleBadgeClick}
        >
          <div className="count-badge">
            {events.length}
          </div>
          {showTooltip && (
            <div 
              className="tooltip" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tooltip-content">
                Due on {format(value, 'MMM d, yyyy')}:
              </div>
              <div className="tooltip-list">
                {events.map((event) => (
                  <div key={event.id} className="tooltip-item">
                    <div className="tooltip-item-title">{event.clientName}</div>
                    <div className="tooltip-item-subtitle">
                      {event.caseType} - {event.patientName}
                    </div>
                    {event.notes && (
                      <div className="tooltip-item-notes">{event.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomDateCell;