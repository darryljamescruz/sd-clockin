import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

type AdminLoadingStateProps = {
  label?: string
  className?: string
}

export function AdminLoadingState({ label = "Loading...", className }: AdminLoadingStateProps) {
  return (
    <div className={cn("flex items-center gap-3 text-muted-foreground py-8", className)}>
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="font-medium">{label}</span>
    </div>
  )
}
