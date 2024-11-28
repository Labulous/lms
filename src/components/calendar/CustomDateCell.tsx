import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Case } from '../../data/mockCasesData';
import { ChevronRight } from 'lucide-react';

interface CustomDateCellProps {
  value: Date;
  events: Case[];
}

const CustomDateCell: React.FC<CustomDateCellProps> = ({ value, events }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedEventIndex, setSelectedEventIndex] = useState(-1);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const formattedDate = format(value, 'yyyy-MM-dd');
    navigate(`/cases?dueDate=${formattedDate}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const formattedDate = format(value, 'yyyy-MM-dd');
      navigate(`/cases?dueDate=${formattedDate}`);
    } else if (e.key === 'ArrowDown' && showTooltip) {
      e.preventDefault();
      setSelectedEventIndex(prev => 
        prev < events.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp' && showTooltip) {
      e.preventDefault();
      setSelectedEventIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Escape') {
      setShowTooltip(false);
      setSelectedEventIndex(-1);
    }
  };

  const handleEventClick = (e: React.MouseEvent, caseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/cases/${caseId}`);
  };

  return (
    <div 
      ref={cellRef}
      className="custom-date-cell" 
      onClick={handleDateClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${format(value, 'MMMM d, yyyy')}${events.length > 0 ? `, ${events.length} cases due` : ''}`}
      aria-haspopup={events.length > 0}
      aria-expanded={showTooltip}
    >
      <span className="date-number">{format(value, 'd')}</span>
      {events.length > 0 && (
        <div 
          className="badge-container"
          onMouseEnter={() => {
            setShowTooltip(true);
            setSelectedEventIndex(-1);
          }}
          onMouseLeave={() => {
            setShowTooltip(false);
            setSelectedEventIndex(-1);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="count-badge"
            role="button"
            tabIndex={0}
            aria-label={`${events.length} cases due`}
          >
            {events.length}
          </div>
          {showTooltip && (
            <div 
              ref={tooltipRef}
              className="tooltip" 
              role="dialog"
              aria-label={`Cases due on ${format(value, 'MMMM d, yyyy')}`}
            >
              <div className="tooltip-content">
                Due on {format(value, 'MMM d, yyyy')}:
              </div>
              <div className="tooltip-list">
                {events.map((event, index) => (
                  <div 
                    key={event.id} 
                    className={`tooltip-item ${selectedEventIndex === index ? 'bg-accent' : ''}`}
                    onClick={(e) => handleEventClick(e, event.id)}
                    onMouseEnter={() => setSelectedEventIndex(index)}
                    role="button"
                    tabIndex={0}
                    aria-selected={selectedEventIndex === index}
                  >
                    <div className="tooltip-item-title flex items-center justify-between">
                      <span>{event.clientName}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
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