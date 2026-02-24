import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

type SkeletonProps = {
  showHeader?: boolean
}

type TableSkeletonProps = {
  rows?: number
  columns?: number
}

type LinesSkeletonProps = {
  lines?: number
}

const TermSelectorSkeleton = () => (
  <div className="flex items-center gap-3 w-full sm:w-auto">
    <Skeleton className="h-10 w-10 rounded-md" />
    <Skeleton className="h-10 w-full sm:w-56" />
  </div>
)

const LinesSkeleton = ({ lines = 3 }: LinesSkeletonProps) => (
  <div className="space-y-3">
    {[...Array(lines)].map((_, i) => (
      <Skeleton key={i} className="h-4 w-full" />
    ))}
  </div>
)

const TableSkeleton = ({ rows = 5, columns = 3 }: TableSkeletonProps) => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-40" />
    <div className="border rounded-md">
      {[...Array(rows)].map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="grid grid-cols-3 gap-4 p-3 border-b last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {[...Array(columns)].map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  </div>
)

export const AnalyticsSkeleton = ({ showHeader = true }: SkeletonProps = {}) => (
  <div className="space-y-6">
    {showHeader && (
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Term Analytics</h2>
          <p className="text-muted-foreground">Performance by term</p>
        </div>
        <TermSelectorSkeleton />
      </div>
    )}
    <Card className="bg-card/70">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <LinesSkeleton lines={4} />
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  </div>
)

export const RecordsSkeleton = ({ showHeader = true }: SkeletonProps = {}) => (
  <div className="space-y-6">
    {showHeader && (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Student Records</h2>
          <p className="text-muted-foreground">View detailed records by term</p>
        </div>
        <TermSelectorSkeleton />
      </div>
    )}
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="bg-card/70 lg:col-span-1">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-5 w-28" />
          <LinesSkeleton lines={6} />
        </CardContent>
      </Card>
      <Card className="bg-card/70 lg:col-span-2">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <LinesSkeleton lines={8} />
        </CardContent>
      </Card>
    </div>
  </div>
)

export const SchedulesSkeleton = ({ showHeader = true }: SkeletonProps = {}) => (
  <div className="space-y-6">
    {showHeader && (
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Schedules</h2>
          <p className="text-muted-foreground">Set student availability for each term</p>
        </div>
      </div>
    )}
    <TableSkeleton rows={6} columns={3} />
  </div>
)

export const StudentsSkeleton = ({ showHeader = true }: SkeletonProps = {}) => (
  <div className="space-y-6">
    {showHeader && (
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Student Assistants</h2>
          <p className="text-muted-foreground">Add, edit, and manage student info</p>
        </div>
      </div>
    )}
    <TableSkeleton rows={6} columns={4} />
  </div>
)

export const TermsSkeleton = ({ showHeader = true }: SkeletonProps = {}) => (
  <div className="space-y-6">
    {showHeader && (
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Terms</h2>
          <p className="text-muted-foreground">Create and manage academic terms</p>
        </div>
      </div>
    )}
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="bg-card/70">
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

export const AdminAccessSkeleton = ({ showHeader = true }: SkeletonProps = {}) => (
  <div className="space-y-6">
    {showHeader && (
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Access</h2>
          <p className="text-muted-foreground">Manage who can sign in to the admin dashboard.</p>
        </div>
      </div>
    )}
    <TableSkeleton rows={6} columns={4} />
  </div>
)
