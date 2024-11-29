import { cn } from "@/lib/utils"

interface StepperProps {
  steps: string[]
  currentStep: number
  className?: string
  colSpans?: number[] 
}

export function Stepper({ steps, currentStep, className, colSpans = [] }: StepperProps) {
  return (
    <div className={cn("grid grid-cols-12 gap-9", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const colSpan = colSpans[index] || 1

        return (
          <div 
            key={step} 
            className={cn(
              "flex items-center",
              `col-span-${colSpan}`
            )}
          >
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                isCompleted && "bg-blue-600 text-white",
                isCurrent && "bg-blue-600 text-white",
                !isCompleted && !isCurrent && "bg-gray-200 text-gray-500"
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                "ml-2 text-xs font-medium tracking-[0.08em]",
                (isCompleted || isCurrent) && "text-blue-600",
                !isCompleted && !isCurrent && "text-gray-500"
              )}
            >
              {step}
            </span>
          </div>
        )
      })}
    </div>
  )
}
