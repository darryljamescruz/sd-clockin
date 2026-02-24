"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Search, UserCog, MoreHorizontal, Ban, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import type { AdminUser } from "@/lib/api"

interface AdminUsersPageProps {
  adminUsers: AdminUser[]
  onCreate: (data: { email: string; name?: string; isActive?: boolean }) => Promise<void>
  onUpdate: (id: string, data: { email: string; name?: string; isActive?: boolean }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function AdminUserFormDialog({
  isOpen,
  onClose,
  onSubmit,
  editingUser,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { email: string; name?: string }) => Promise<void>
  editingUser?: AdminUser | null
}) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return
    setEmail(editingUser?.email || "")
    setName(editingUser?.name || "")
    setError("")
  }, [editingUser, isOpen])

  const handleSave = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = name.trim()

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("A valid email is required.")
      return
    }

    setIsSaving(true)
    setError("")
    try {
      await onSubmit({
        email: normalizedEmail,
        name: normalizedName || undefined,
      })
      onClose()
    } catch (submitError) {
      setError((submitError as Error).message || "Failed to save admin user.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            {editingUser ? "Edit Admin User" : "Add Admin User"}
          </DialogTitle>
          <DialogDescription>
            {editingUser
              ? "Update this admin account."
              : "Use the exact email address they sign in with (e.g. their Cal Poly email). They can access the dashboard after signing in with Microsoft."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="its-servicedesk@calpoly.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-name">Display Name (optional)</Label>
            <Input
              id="admin-name"
              placeholder="Service Desk Admin"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : editingUser ? "Save Changes" : "Create Admin"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminUsersPage({ adminUsers, onCreate, onUpdate, onDelete }: AdminUsersPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState("")

  const getDisplayName = (user: AdminUser) => {
    const trimmedName = user.name?.trim()
    if (trimmedName) return trimmedName
    return user.email.split("@")[0]
  }

  const getInitials = (value: string) => {
    const segments = value.trim().split(/\s+/).filter(Boolean)
    if (segments.length === 0) return "A"
    if (segments.length === 1) return segments[0].slice(0, 2).toUpperCase()
    return `${segments[0][0]}${segments[1][0]}`.toUpperCase()
  }

  const filteredUsers = adminUsers
    .filter((user) => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true

      return user.email.toLowerCase().includes(query) || getDisplayName(user).toLowerCase().includes(query)
    })
    .sort((a, b) => {
      const byName = getDisplayName(a).localeCompare(getDisplayName(b))
      if (byName !== 0) return byName
      return a.email.localeCompare(b.email)
    })

  const activeCount = adminUsers.filter((user) => user.isActive).length

  const handleCreate = async (data: { email: string; name?: string }) => {
    await onCreate({ ...data, isActive: true })
    toast.success("Admin added. They can now sign in with Microsoft.")
  }

  const handleUpdate = async (data: { email: string; name?: string }) => {
    if (!editingUser) return
    await onUpdate(editingUser.id, { ...data, isActive: editingUser.isActive })
  }

  const handleDelete = async () => {
    if (!deletingUser) return

    setIsDeleting(true)
    setActionError("")
    try {
      await onDelete(deletingUser.id)
      setDeletingUser(null)
    } catch (deleteError) {
      setActionError((deleteError as Error).message || "Failed to delete admin user.")
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleStatus = async (user: AdminUser) => {
    setActionError("")
    try {
      await onUpdate(user.id, {
        email: user.email,
        name: user.name,
        isActive: !user.isActive,
      })
    } catch (updateError) {
      setActionError((updateError as Error).message || "Failed to update admin status.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Access</h2>
          <p className="text-muted-foreground">Manage who can sign in to the admin dashboard.</p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null)
            setIsFormOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{adminUsers.length}</div>
            <p className="text-muted-foreground text-sm">Total Admin Users</p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCount}</div>
            <p className="text-muted-foreground text-sm">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-muted-foreground">{adminUsers.length - activeCount}</div>
            <p className="text-muted-foreground text-sm">Inactive</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <CardTitle>Admin Users</CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by email or name..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {actionError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </div>
          )}
          {filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No admin users found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[64px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs font-semibold">
                            {getInitials(getDisplayName(user))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{getDisplayName(user)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="ml-auto" aria-label={`Actions for ${user.email}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingUser(user)
                              setIsFormOpen(true)
                            }}
                          >
                            <Edit className="mr-2 w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(user)}>
                            {user.isActive ? (
                              <>
                                <Ban className="mr-2 w-4 h-4" />
                                Disable
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 w-4 h-4" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingUser(user)}
                          >
                            <Trash2 className="mr-2 w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminUserFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingUser(null)
        }}
        editingUser={editingUser}
        onSubmit={editingUser ? handleUpdate : handleCreate}
      />

      <AlertDialog open={!!deletingUser} onOpenChange={(open: boolean) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin User</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{deletingUser?.email}</strong> from admin access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
