import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CaseStep {
  date: string;
  condition?: string;
  treatment?: string;
  dentist?: string;
  technician?: string;
  status: 'done' | 'pending' | 'in_progress';
  notes?: string;
}

interface CaseProgressProps {
  steps?: CaseStep[];
}

const CaseProgress: React.FC<CaseProgressProps> = ({ steps = [] }) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500">
        No progress steps available
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="space-y-8">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const date = new Date(step.date);
          const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
          const day = date.getDate();

          return (
            <div key={index} className="relative">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-7 top-14 w-0.5 h-full -ml-px",
                    step.status === 'done' ? "bg-green-200" : "bg-gray-200"
                  )}
                />
              )}

              <div className="flex items-start space-x-4">
                {/* Date column */}
                <div className="min-w-[50px] text-center">
                  <div className="text-sm font-medium text-gray-500">{month}</div>
                  <div className="text-2xl font-semibold">{day}</div>
                </div>

                {/* Status icon */}
                <div className="relative flex items-center justify-center">
                  {step.status === 'done' && (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  )}
                  {step.status === 'pending' && (
                    <Clock className="w-6 h-6 text-orange-500" />
                  )}
                  {step.status === 'in_progress' && (
                    <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="bg-white rounded-lg border p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {step.condition && (
                        <div>
                          <div className="text-sm text-gray-500">CONDITION</div>
                          <div className="font-medium">{step.condition}</div>
                        </div>
                      )}
                      {step.treatment && (
                        <div>
                          <div className="text-sm text-gray-500">TREATMENT</div>
                          <div className="font-medium">{step.treatment}</div>
                        </div>
                      )}
                    </div>
                    {(step.dentist || step.technician) && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-500">
                          {step.dentist ? 'DENTIST' : 'TECHNICIAN'}
                        </div>
                        <div className="font-medium">
                          {step.dentist || step.technician}
                        </div>
                      </div>
                    )}
                    {step.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        {step.notes}
                      </div>
                    )}
                    <div className="mt-2 flex items-center">
                      {step.status === 'done' && (
                        <span className="text-sm font-medium text-green-500">Done</span>
                      )}
                      {step.status === 'pending' && (
                        <span className="text-sm font-medium text-orange-500">Pending</span>
                      )}
                      {step.status === 'in_progress' && (
                        <span className="text-sm font-medium text-blue-500">In Progress</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CaseProgress;