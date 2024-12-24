import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary hover:bg-primary/80 border-transparent text-primary-foreground",
        secondary:
          "bg-secondary hover:bg-secondary/80 border-transparent text-secondary-foreground",
        destructive:
          "bg-destructive hover:bg-destructive/80 border-transparent text-destructive-foreground",
        success:
          "bg-green-500 hover:bg-green-500/80 border-transparent text-white",
        warning:
          "bg-yellow-500 hover:bg-yellow-500/80 border-transparent text-white",
        outline: "text-foreground",
        // Filter count badge
        filter:
          "bg-gray-800 hover:bg-gray-700 border-transparent text-gray-100",
        // Product type badges
        Crown:
          "bg-blue-500 hover:bg-blue-500/80 border-transparent text-white",
        Bridge:
          "bg-purple-500 hover:bg-purple-500/80 border-transparent text-white",
        Removable:
          "bg-pink-500 hover:bg-pink-500/80 border-transparent text-white",
        Implant:
          "bg-cyan-500 hover:bg-cyan-500/80 border-transparent text-white",
        Coping:
          "bg-teal-500 hover:bg-teal-500/80 border-transparent text-white",
        Appliance:
          "bg-emerald-500 hover:bg-emerald-500/80 border-transparent text-white"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
