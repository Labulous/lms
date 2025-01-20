import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Clock, CheckCircle, CalendarDays, Package } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"

const metrics = [
  {
    label: "Cases Due",
    value: 12,
    icon: <Clock className="h-5 w-5 text-white" />,
    bgColor: "bg-purple-500"
  },
  {
    label: "Cases Completed",
    value: 8,
    icon: <CheckCircle className="h-5 w-5 text-white" />,
    bgColor: "bg-emerald-500"
  },
  {
    label: "Cases Received",
    value: 15,
    icon: <Package className="h-5 w-5 text-white" />,
    bgColor: "bg-blue-500"
  },
  {
    label: "Cases Shipped",
    value: 6,
    icon: <CalendarDays className="h-5 w-5 text-white" />,
    bgColor: "bg-orange-500"
  }
]

const DailyCountsCard = () => {
  const completedCases = metrics[1].value
  const totalDueCases = metrics[0].value
  const completionPercentage = Math.round((completedCases / totalDueCases) * 100)
  
  // Create segments for the progress bar
  const segments = Array.from({ length: totalDueCases }, (_, i) => {
    const isCompleted = i < completedCases
    return {
      id: i + 1,
      status: isCompleted ? 'completed' : 'pending'
    }
  })

  return (
    <Card className="bg-white h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Today's Daily Counts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="space-y-3 mt-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight">
                {completedCases}/{totalDueCases}
              </span>
              <span className="text-sm font-medium text-gray-500">
                Cases Completed
              </span>
            </div>
          </div>

          {/* Progress Tracker */}
          <TooltipProvider>
            <div className="space-y-2">
              <div className="flex gap-1">
                {segments.map((segment) => (
                  <Tooltip key={segment.id}>
                    <TooltipTrigger asChild>
                      <div 
                        className={`
                          h-2 flex-1 rounded-full transition-all duration-200
                          ${segment.status === 'completed' 
                            ? 'bg-emerald-500 hover:bg-emerald-600' 
                            : 'bg-gray-200 hover:bg-gray-300'}
                        `}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Case {segment.id}: {segment.status === 'completed' ? 'Completed' : 'Pending'}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-600">Progress</span>
                <span className="font-medium text-gray-600">{completionPercentage}%</span>
              </div>
            </div>
          </TooltipProvider>
        </div>

        {/* Auto margin spacer */}
        <div className="flex-grow" />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid grid-cols-1 gap-4">
            {/* First Row: Cases Due and Cases Completed */}
            {metrics.slice(0, 2).map((metric) => (
              <div 
                key={metric.label}
                className="flex flex-col items-center text-center space-y-2"
              >
                <div className={`p-2 rounded-full ${metric.bgColor}`}>
                  {metric.icon}
                </div>
                <span className="text-2xl font-semibold">{metric.value}</span>
                <span className="text-sm text-gray-500">{metric.label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {/* Second Row: Cases Received and Cases Shipped */}
            {metrics.slice(2, 4).map((metric) => (
              <div 
                key={metric.label}
                className="flex flex-col items-center text-center space-y-2"
              >
                <div className={`p-2 rounded-full ${metric.bgColor}`}>
                  {metric.icon}
                </div>
                <span className="text-2xl font-semibold">{metric.value}</span>
                <span className="text-sm text-gray-500">{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DailyCountsCard
