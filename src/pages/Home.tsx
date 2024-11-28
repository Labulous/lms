import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, PauseCircle, Package, Maximize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DueDatesCalendar from '../components/calendar/DueDatesCalendar';
import CalendarModal from '../components/calendar/CalendarModal';
import { getCases, Case } from '../data/mockCasesData';
import { Button } from '../components/ui/button';

const Home: React.FC = () => {
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [greeting, setGreeting] = useState('');
  const { user } = useAuth();
  const userName = user ? user.name : "User";

  useEffect(() => {
    setCases(getCases());
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(`Good morning, ${userName}!`);
    else if (hour < 18) setGreeting(`Good afternoon, ${userName}!`);
    else setGreeting(`Good evening, ${userName}!`);
  }, []);

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

  const formatCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-5 py-4">
      <h1 className="text-xl font-semibold text-gray-800 mb-1">{greeting}</h1>
      <p className="text-sm text-gray-500 mb-6">{formatCurrentDate()}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {keyMetrics.map((metric, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center p-3 ${metric.color} rounded-lg`}>
                <metric.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <h3 className="text-sm font-medium text-gray-500 mt-0.5">{metric.label}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-3/5">
          <div className="bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Due Dates Calendar</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCalendarModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Maximize2 className="h-4 w-4" />
                Expand
              </Button>
            </div>
            <div className="h-[500px]">
              <DueDatesCalendar events={cases} />
            </div>
          </div>
        </div>

        <div className="lg:w-2/5">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Cases In Progress</h2>
            <div className="space-y-4">
              {casesInProgress.map((caseItem, index) => (
                <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{caseItem.client}</h3>
                      <p className="text-sm text-gray-600">{caseItem.patient}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{caseItem.dueDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{caseItem.stage}</span>
                    <div className="w-1/2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-700 h-2.5 rounded-full"
                          style={{ width: `${caseItem.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isCalendarModalOpen && (
        <CalendarModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          events={cases}
        />
      )}
    </div>
  );
};

export default Home;