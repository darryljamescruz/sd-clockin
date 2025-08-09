'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  X,
} from 'lucide-react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { availableLocations } from '@/data/initialData';

interface ClockEntry {
  timestamp: string;
  type: 'in' | 'out';
  isManual?: boolean;
}

type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
type WeeklySchedule = Record<Weekday, string[]>;

interface Staff {
  id: number;
  name: string;
  iso: string;
  role: string;
  currentStatus: string;
  weeklySchedule: WeeklySchedule;
  clockEntries: ClockEntry[];
  assignedLocation?: string;
}

// ClockEntry defined above

interface StudentManagerProps {
  staffData: Staff[];
  onAddStudent: (
    student: Omit<Staff, 'id' | 'clockEntries' | 'currentStatus'>
  ) => void;
  onEditStudent: (
    id: number,
    student: Omit<Staff, 'id' | 'clockEntries' | 'currentStatus'>
  ) => void;
  onDeleteStudent: (id: number) => void;
  onClose?: () => void;
  mode?: 'modal' | 'page';
}

export function StudentManager({
  staffData,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onClose,
  mode = 'modal',
}: StudentManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    student: Staff | null;
  }>({
    isOpen: false,
    student: null,
  });
  const [formData, setFormData] = useState<{
    name: string;
    iso: string;
    role: string;
    assignedLocation: string;
    weeklySchedule: WeeklySchedule;
  }>({
    name: '',
    iso: '',
    role: 'Assistant',
    assignedLocation: '',
    weeklySchedule: {
      monday: [] as string[],
      tuesday: [] as string[],
      wednesday: [] as string[],
      thursday: [] as string[],
      friday: [] as string[]
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Assistant' | 'Student Lead'>('all');
  const [sortKey, setSortKey] = useState<'name' | 'iso' | 'role'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.iso.trim()) {
      newErrors.iso = 'ISO is required';
    } else {
      // Check for duplicate ISO (excluding current editing item)
      const existingIso = staffData.find(
        (staff) =>
          staff.iso.toUpperCase() === formData.iso.toUpperCase() &&
          staff.id !== editingId
      );
      if (existingIso) {
        newErrors.iso = 'ISO already exists';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addScheduleBlock = (day: Weekday, timeBlock: string) => {
    if (timeBlock.trim()) {
      setFormData((prev) => ({
        ...prev,
        weeklySchedule: {
          ...prev.weeklySchedule,
          [day]: [...prev.weeklySchedule[day], timeBlock.trim()],
        },
      }));
    }
  };

  const removeScheduleBlock = (day: Weekday, index: number) => {
    setFormData((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: prev.weeklySchedule[day].filter((_, i: number) => i !== index),
      },
    }));
  };

  const parseScheduleInput = (input: string) => {
    // Parse formats like "8-11, 12-5" or "9:00 AM - 5:00 PM"
    return input
      .split(',')
      .map((block) => block.trim())
      .filter((block) => block.length > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const studentData = {
      name: formData.name.trim(),
      iso: formData.iso.toUpperCase().trim(),
      role: formData.role,
      assignedLocation: formData.assignedLocation === 'unassigned' ? undefined : formData.assignedLocation || undefined,
      weeklySchedule: formData.weeklySchedule,
    };

    if (editingId) {
      onEditStudent(editingId, studentData);
      setEditingId(null);
    } else {
      onAddStudent(studentData);
      setIsAdding(false);
    }

    setFormData({
      name: '',
      iso: '',
      role: 'Assistant',
      assignedLocation: '',
      weeklySchedule: {
        monday: [] as string[],
        tuesday: [] as string[],
        wednesday: [] as string[],
        thursday: [] as string[],
        friday: [] as string[],
      },
    });
    setErrors({});
  };

  const handleEdit = (staff: Staff) => {
    setFormData({
      name: staff.name,
      iso: staff.iso,
      role: staff.role,
      assignedLocation: staff.assignedLocation ?? '',
      weeklySchedule: staff.weeklySchedule || {
        monday: [] as string[],
        tuesday: [] as string[],
        wednesday: [] as string[],
        thursday: [] as string[],
        friday: [] as string[],
      },
    });
    setEditingId(staff.id);
    setIsAdding(true);
    setErrors({});
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      iso: '',
      role: 'Assistant',
      assignedLocation: '',
      weeklySchedule: {
        monday: [] as string[],
        tuesday: [] as string[],
        wednesday: [] as string[],
        thursday: [] as string[],
        friday: [] as string[],
      },
    });
    setErrors({});
  };

  const handleDeleteClick = (staff: Staff) => {
    setDeleteModal({ isOpen: true, student: staff });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.student) {
      onDeleteStudent(deleteModal.student.id);
      setDeleteModal({ isOpen: false, student: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, student: null });
  };

  const getRoleBadge = (role: string) => {
    if (role === 'Student Lead') {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Shield className="w-3 h-3 mr-1" />
          Student Lead
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">
          <UserCheck className="w-3 h-3 mr-1" />
          Assistant
        </Badge>
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: {
        color: 'bg-green-100 text-green-800',
        label: 'Present',
        icon: '●',
      },
      expected: {
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Expected',
        icon: '○',
      },
      absent: { color: 'bg-red-100 text-red-800', label: 'Absent', icon: '×' },
    };

    const config = statusConfig[(status as keyof typeof statusConfig)] || statusConfig['expected'];
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  const filteredStaff = useMemo(() => {
    if (mode !== 'page') return staffData;
    const q = searchQuery.trim().toLowerCase();
    let list = staffData.filter((s) => {
      const matchesQuery =
        q.length === 0 || s.name.toLowerCase().includes(q) || s.iso.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || s.role === roleFilter;
      return matchesQuery && matchesRole;
    });
    list = list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
      if (sortKey === 'iso') return a.iso.localeCompare(b.iso) * dir;
      if (sortKey === 'role') return a.role.localeCompare(b.role) * dir;
      return 0;
    });
    return list;
  }, [mode, staffData, searchQuery, roleFilter, sortKey, sortDir]);

  return (
    <>
      <div className={mode === 'modal' ? 'fixed inset-0 bg-black/50 flex items-center justify-center z-50' : ''}>
        <Card className={mode === 'modal' ? 'w-full max-w-6xl max-h[90vh] overflow-auto' : 'w-full'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Manage Students & Staff
              </div>
              {mode === 'modal' && onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters row for page mode */}
            {mode === 'page' && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or ISO"
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Assistant">Assistant</SelectItem>
                      <SelectItem value="Student Lead">Student Lead</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setRoleFilter('all'); }}>Clear</Button>
                </div>
              </div>
            )}

            <Dialog open={isAdding} onOpenChange={(open) => !open && handleCancel()}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Edit Student/Staff' : 'Add New Student/Staff'}
                  </DialogTitle>
                </DialogHeader>
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., John Smith"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="iso">ISO</Label>
                      <Input
                        id="iso"
                        value={formData.iso}
                        onChange={(e) => setFormData({ ...formData, iso: e.target.value.toUpperCase() })}
                        placeholder="e.g., ISO007"
                        className={errors.iso ? 'border-red-500' : ''}
                      />
                      {errors.iso && <p className="text-sm text-red-600 mt-1">{errors.iso}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Assistant">Assistant</SelectItem>
                          <SelectItem value="Student Lead">Student Lead</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="assignedLocation">Assigned Location</Label>
                      <Select value={formData.assignedLocation} onValueChange={(value) => setFormData({ ...formData, assignedLocation: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {availableLocations.map((loc) => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-base font-semibold">Weekly Schedule</Label>
                    <p className="text-sm text-slate-600 mb-4">Enter time blocks for each day. Examples: "8-11, 12-5" or "9:00 AM - 5:00 PM"</p>
                    <div className="space-y-4 max-h-64 overflow-y-auto border rounded-lg p-4">
                      {(Object.entries(formData.weeklySchedule) as [Weekday, string[]][]).map(([day, blocks]) => (
                        <div key={day} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="capitalize font-medium">{day}</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="e.g., 8-11, 12-5"
                                className="w-48 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const input = (e.target as HTMLInputElement).value;
                                    const timeBlocks = input.split(',').map((b) => b.trim()).filter((b) => b.length > 0);
                                    timeBlocks.forEach((block) => addScheduleBlock(day, block));
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement)!;
                                  const timeBlocks = input.value.split(',').map((b) => b.trim()).filter((b) => b.length > 0);
                                  timeBlocks.forEach((block) => addScheduleBlock(day, block));
                                  input.value = '';
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 min-h-[2rem]">
                            {blocks.length > 0 ? (
                              (blocks as string[]).map((block, index) => (
                                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer" onClick={() => removeScheduleBlock(day, index)}>
                                  {block} ×
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-slate-400 italic">No schedule set</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                      <strong>Tips:</strong> • Enter multiple time blocks separated by commas (e.g., "8-11, 12-5") • Use 24-hour format (8-17) or 12-hour format (8 AM - 5 PM) • Click on time blocks to remove them • Press Enter or click Add to save time blocks
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-slate-900 hover:bg-slate-800">{editingId ? 'Update' : 'Add'} Student/Staff</Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button onClick={() => setIsAdding(true)} className="bg-slate-900 hover:bg-slate-800" disabled={isAdding} size="lg">
              <Plus className="w-5 h-5 mr-2" /> Add New Student/Staff
            </Button>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Current Students & Staff ({(mode === 'page' ? filteredStaff : staffData).length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>ISO</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned Location</TableHead>
                      <TableHead>Current Week Schedule</TableHead>
                      {/* Status intentionally hidden for management page */}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(mode === 'page' ? filteredStaff : staffData).map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.name}</TableCell>
                        <TableCell className="font-mono text-sm">{staff.iso}</TableCell>
                        <TableCell>{getRoleBadge(staff.role)}</TableCell>
                        <TableCell>{staff.assignedLocation ?? '—'}</TableCell>
                        <TableCell>
                          <div className="space-y-1 max-w-xs">
                            {Object.entries(staff.weeklySchedule || {}).map(([day, blocks]) =>
                              (blocks as string[]).length > 0 && (
                                <div key={day} className="text-xs">
                                  <span className="font-medium capitalize">{day.slice(0, 3)}:</span>
                                  <span className="ml-1">{(blocks as string[]).join(', ')}</span>
                                </div>
                              )
                            )}
                            {Object.values(staff.weeklySchedule || {}).every((blocks) => (blocks as string[]).length === 0) && (
                              <span className="text-slate-400 italic text-xs">No schedule set</span>
                            )}
                          </div>
                        </TableCell>
                        {/* Status intentionally hidden for management page */}
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(staff)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteClick(staff)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(mode === 'page' ? filteredStaff : staffData).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">No results</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && handleDeleteCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteModal.student?.name}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
