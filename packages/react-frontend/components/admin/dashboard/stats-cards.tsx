// "use client"

// import { Card, CardContent } from "@/components/ui/card"
// import { Users, AlertCircle, Shield } from "lucide-react"

// interface StatsCardsProps {
//   totalStaff: number
//   presentStaff: number
//   studentLeadsPresent: number
//   lateToday: number
// }

// export function StatsCards({ totalStaff, presentStaff, studentLeadsPresent, lateToday }: StatsCardsProps) {
//   return (
//     <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 w-full max-w-full min-w-0">
//       <Card className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full overflow-hidden">
//         <CardContent className="p-4 sm:p-6">
//           <div className="flex items-center justify-between gap-2">
//             <div className="min-w-0 flex-1">
//               <div className="text-xl sm:text-2xl font-bold text-foreground">{totalStaff}</div>
//               <div className="text-xs sm:text-sm text-muted-foreground truncate">Total Staff</div>
//             </div>
//             <Users className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground flex-shrink-0" />
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full overflow-hidden">
//         <CardContent className="p-4 sm:p-6">
//           <div className="flex items-center justify-between gap-2">
//             <div className="min-w-0 flex-1">
//               <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{presentStaff}</div>
//               <div className="text-xs sm:text-sm text-muted-foreground truncate">Actively Present</div>
//             </div>
//             <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
//               <span className="text-green-600 dark:text-green-400 font-bold text-sm sm:text-base">●</span>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full overflow-hidden">
//         <CardContent className="p-4 sm:p-6">
//           <div className="flex items-center justify-between gap-2">
//             <div className="min-w-0 flex-1">
//               <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{studentLeadsPresent}</div>
//               <div className="text-xs sm:text-sm text-muted-foreground truncate">Student Leads Present</div>
//             </div>
//             <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="bg-card/70 backdrop-blur-sm shadow-lg w-full max-w-full overflow-hidden">
//         <CardContent className="p-4 sm:p-6">
//           <div className="flex items-center justify-between gap-2">
//             <div className="min-w-0 flex-1">
//               <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{lateToday}</div>
//               <div className="text-xs sm:text-sm text-muted-foreground truncate">Late Today</div>
//             </div>
//             <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
