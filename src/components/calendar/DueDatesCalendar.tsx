import React from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import CustomDateCell from './CustomDateCell';
import { Case, getCases } from '../../data/mockCasesData';
import './calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface DueDatesCalendarProps {
  events?: Case[];
  height?: number;
}

const DueDatesCalendar: React.FC<DueDatesCalendarProps> = ({ events = getCases(), height = 500 }) => {
  const components = {
    dateCell: (props: any) => {
      const { date } = props;
      const dateStr = format(date, 'yyyy-MM-dd');
      const dateEvents = events.filter(
        event => format(new Date(event.dueDate), 'yyyy-MM-dd') === dateStr
      );
      
      return <CustomDateCell value={date} events={dateEvents} />;
    },
  };

  const eventStyleGetter = () => ({
    style: {
      display: 'none', // Hide default event rendering
    },
  });

  return (
    <div className="calendar-wrapper" style={{ height }}>
      <Calendar
        localizer={localizer}
        events={[]}
        startAccessor="start"
        endAccessor="end"
        components={components}
        views={['month'] as View[]}
        defaultView="month"
        defaultDate={new Date()}
        toolbar={true}
        eventPropGetter={eventStyleGetter}
        onNavigate={(newDate) => {
          // Handle month navigation if needed
        }}
        className="calendar-container"
      />
    </div>
  );
};

export default DueDatesCalendar;