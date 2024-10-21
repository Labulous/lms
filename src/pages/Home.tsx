import React from 'react';
import { AlertTriangle, Clock, PauseCircle, Package, AlertCircle } from 'lucide-react';
import { getCurrentUser } from '../services/authService';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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

const Home: React.FC = () => {
  console.log('Rendering Home component, currentUser:', getCurrentUser());

  const currentUser = getCurrentUser();
  const userName = currentUser ? currentUser.name : "User";
  const greeting = `Good ${getTimeOfDay()}, ${userName}!`;

  const keyMetrics = [
    { icon: AlertTriangle, label: 'Cases Past Due', value: 1, color: 'bg-red-500' },
    { icon: Package, label: 'Cases Due Today', value: 5, color: 'bg-blue-500' },
    { icon: Clock, label: 'Cases Due Tomorrow', value: 8, color: 'bg-green-400' },
    { icon: PauseCircle, label: 'Cases On Hold', value: 3, color: 'bg-yellow-500' },
  ];

  const casesInProgress = [
    { client: 'Coal Harbour Dental', patient: 'Matthias Cook', dueDate: 'Today', stage: 'Custom Shading', progress: 60 },
    { client: 'Smile Dental', patient: 'Emma Thompson', dueDate: 'Tomorrow', stage: 'Waxing', progress: 40 },
    { client: 'Bright Teeth Clinic', patient: 'John Doe', dueDate: 'In 2 days', stage: 'Modeling', progress: 20 },
  ];

  const calendarEvents = [
    {
      title: 'Case Due',
      start: new Date(2023, 4, 15),
      end: new Date(2023, 4, 15),
      allDay: true,
    },
    {
      title: 'Case Due',
      start: new Date(2023, 4, 18),
      end: new Date(2023, 4, 18),
      allDay: true,
    },
    {
      title: 'Case Due',
      start: new Date(2023, 4, 22),
      end: new Date(2023, 4, 22),
      allDay: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-semibold text-gray-800 mb-8">{greeting}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {keyMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className={`inline-flex items-center justify-center p-3 ${metric.color} rounded-full mb-4`}>
              <metric.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">{metric.label}</h3>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-3/5">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cases In Progress</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 font-semibold text-gray-600">Client</th>
                    <th className="pb-3 font-semibold text-gray-600">Patient</th>
                    <th className="pb-3 font-semibold text-gray-600">Due Date</th>
                    <th className="pb-3 font-semibold text-gray-600">Stage</th>
                    <th className="pb-3 font-semibold text-gray-600">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {casesInProgress.map((caseItem, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="py-3">{caseItem.client}</td>
                      <td className="py-3">{caseItem.patient}</td>
                      <td className="py-3">{caseItem.dueDate}</td>
                      <td className="py-3">{caseItem.stage}</td>
                      <td className="py-3">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${caseItem.progress}%` }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="lg:w-2/5">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upcoming Due Dates</h2>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 400 }}
              views={['month']}
              components={{
                dateCellWrapper: (props) => {
                  const hasEvent = calendarEvents.some(
                    (event) => event.start.toDateString() === props.value.toDateString()
                  );
                  return (
                    <div className="relative h-full">
                      {props.children}
                      {hasEvent && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  );
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export default Home;