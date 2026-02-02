import { getTerms, getStudents, getActiveTerm } from "@/lib/api.server"
import { AdminDashboard } from "@/components/admin/dashboard/admin-dashboard"

export default async function AdminDashboardPage() {
  // Fetch data on the server
  const terms = await getTerms()
  const activeTerm = getActiveTerm(terms)

  // Fetch students for the active term
  const students = activeTerm ? await getStudents(activeTerm.id) : []

  return (
    <AdminDashboard
      initialTerms={terms}
      initialStudents={students}
      initialSelectedTerm={activeTerm?.name || ""}
    />
  )
}
