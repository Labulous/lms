import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useMemo } from "react"

// Mock data generator
const generateMockData = (days: number) => {
  const data = []
  const today = new Date()
  const totalHours = days === 7 ? 35 : days === 30 ? 150 : 300
  const avgDailyHours = totalHours / days

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Generate random hours between 75% and 125% of average
    const hours = Math.round((avgDailyHours * (0.75 + Math.random() * 0.5)) * 10) / 10

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: hours
    })
  }
  return data
}

// Mock technician data generator
const generateTechnicianData = (days: number) => {
  const baseData = [
    { name: "Alice Chen", image: "/avatars/alice.jpg", cases: Math.round(days * 1.2) },
    { name: "Bob Smith", image: "/avatars/bob.jpg", cases: Math.round(days * 0.9) },
    { name: "Carol Davis", image: "/avatars/carol.jpg", cases: Math.round(days * 1.1) },
    { name: "David Wilson", image: "/avatars/david.jpg", cases: Math.round(days * 0.8) }
  ]

  return baseData.map(tech => ({
    ...tech,
    hours: Math.round(tech.cases * 1.5 * 10) / 10 // Average 1.5 hours per case
  }))
}

const timeFilters = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 60 days", days: 60 }
]

const PerformanceMetricsCard = () => {
  const [selectedFilter, setSelectedFilter] = useState(timeFilters[0])
  
  const data = useMemo(() => generateMockData(selectedFilter.days), [selectedFilter.days])
  const technicianData = useMemo(() => generateTechnicianData(selectedFilter.days), [selectedFilter.days])
  
  const totalHours = data.reduce((sum, day) => sum + day.hours, 0)

  return (
    <Card className="bg-white h-full p-6">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Performance Metrics</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <CalendarDays className="mr-2 h-4 w-4" />
                {selectedFilter.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {timeFilters.map((filter) => (
                <DropdownMenuItem
                  key={filter.days}
                  onClick={() => setSelectedFilter(filter)}
                >
                  {filter.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Total Hours */}
        <div>
          <p className="text-sm font-medium text-gray-500">Total Hours</p>
          <p className="text-4xl font-bold">{Math.round(totalHours)}</p>
        </div>

        {/* Chart */}
        <div className="h-[200px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}h`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value}h`, 'Hours']}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '8px'
                }}
              />
              <Bar 
                dataKey="hours" 
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Technician Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">Technician Breakdown</h4>
          <div className="space-y-4">
            {technicianData.map((tech) => (
              <div key={tech.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={tech.image} />
                    <AvatarFallback>{tech.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{tech.name}</p>
                    <p className="text-xs text-gray-500">{tech.cases} cases</p>
                  </div>
                </div>
                <p className="text-sm font-medium">{tech.hours}h</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PerformanceMetricsCard
