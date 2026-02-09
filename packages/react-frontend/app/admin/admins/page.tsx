"use client"

import { useEffect, useState } from "react"
import { api, type AdminUser } from "@/lib/api"
import { AdminUsersPage } from "@/components/admin/admin-users/admin-users-page"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { StudentsSkeleton } from "@/components/admin/loading-skeletons"

export default function AdminUsersManagementPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchAdminUsers = async () => {
    try {
      setIsLoading(true)
      setError("")
      const users = await api.adminUsers.getAll()
      setAdminUsers(users)
    } catch (fetchError) {
      console.error("Error fetching admin users:", fetchError)
      setError("Failed to load admin users. Please refresh the page.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminUsers()
  }, [])

  const handleCreate = async (data: { email: string; name?: string; isActive?: boolean }) => {
    try {
      const created = await api.adminUsers.create(data)
      setAdminUsers((previous) => [created, ...previous])
    } catch (createError) {
      console.error("Error creating admin user:", createError)
      throw createError
    }
  }

  const handleUpdate = async (
    id: string,
    data: { email: string; name?: string; isActive?: boolean },
  ) => {
    try {
      const updated = await api.adminUsers.update(id, data)
      setAdminUsers((previous) => previous.map((admin) => (admin.id === id ? updated : admin)))
    } catch (updateError) {
      console.error("Error updating admin user:", updateError)
      throw updateError
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.adminUsers.delete(id)
      setAdminUsers((previous) => previous.filter((admin) => admin.id !== id))
    } catch (deleteError) {
      console.error("Error deleting admin user:", deleteError)
      throw deleteError
    }
  }

  if (isLoading) {
    return <StudentsSkeleton />
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">{error}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <AdminUsersPage
      adminUsers={adminUsers}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  )
}
