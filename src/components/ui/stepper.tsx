import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  id: number
  name: string
  isCompleted: boolean
  isCurrent: boolean
  colSpan: number
}

interface StepperProps {
  steps: Step[]
  className?: string
}

export function Stepper({ steps, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn("mb-8", className)}>
      <ol role="list" className="grid grid-cols-12 gap-9 relative">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={cn(
              'relative',
              `col-span-${step.colSpan}`,
              'flex justify-start'
            )}
          >
            {stepIdx !== 0 && (
              <div
                className={cn(
                  "absolute h-0.5 top-4 -left-9",
                  step.isCompleted ? "bg-blue-600" : "bg-gray-200"
                )}
                style={{
                  width: 'calc(100% + 2.25rem)',
                  zIndex: 0
                }}
              />
            )}
            <div className="relative z-10">
              {step.isCompleted ? (
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-900"
                >
                  <Check className="h-5 w-5 text-white" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </div>
              ) : step.isCurrent ? (
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-white"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </div>
              ) : (
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-transparent" aria-hidden="true" />
                  <span className="sr-only">{step.name}</span>
                </div>
              )}
              <span className="absolute left-0 top-10 whitespace-nowrap text-sm font-semibold">
                {step.name}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}
