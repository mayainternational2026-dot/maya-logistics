import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListUsers,
  useCreateUser,
  useUpdateUserPermissions,
  useAdminResetUserPassword,
  useDeleteUser,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, KeyRound, Settings, Trash2, Users as UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type RoleFilter = "all" | "admin" | "staff" | "customer";

function PermissionsDialog({
  user,
  onClose,
}: {
  user: {
    id: number;
    name: string;
    permissions: {
      canManageShipments: boolean;
      canManageCustomers: boolean;
      canGenerateInvoice: boolean;
    };
  };
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const update = useUpdateUserPermissions();
  const [perms, setPerms] = useState(user.permissions);

  const handleSave = () => {
    update.mutate(
      { id: user.id, data: perms },
      {
        onSuccess: () => {
          toast({ title: "Permissions updated" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          onClose();
        },
        onError: (err: any) => {
          toast({
            title: "Update failed",
            description: err?.data?.error,
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit permissions</DialogTitle>
        <DialogDescription>{user.name}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={perms.canManageShipments}
            onCheckedChange={(v) =>
              setPerms((p) => ({ ...p, canManageShipments: !!v }))
            }
          />
          <span className="text-sm">Manage shipments (create, update, delete)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={perms.canManageCustomers}
            onCheckedChange={(v) =>
              setPerms((p) => ({ ...p, canManageCustomers: !!v }))
            }
          />
          <span className="text-sm">Manage customer accounts</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={perms.canGenerateInvoice}
            onCheckedChange={(v) =>
              setPerms((p) => ({ ...p, canGenerateInvoice: !!v }))
            }
          />
          <span className="text-sm">Generate invoices</span>
        </label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={update.isPending}
          className="bg-primary hover:bg-primary/90"
        >
          {update.isPending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: { id: number; name: string };
  onClose: () => void;
}) {
  const reset = useAdminResetUserPassword();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reset.mutate(
      { id: user.id, data: { newPassword } },
      {
        onSuccess: () => {
          toast({
            title: "Password reset",
            description: `New password set for ${user.name}.`,
          });
          onClose();
        },
        onError: (err: any) => {
          toast({
            title: "Reset failed",
            description: err?.data?.error,
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Reset password</DialogTitle>
        <DialogDescription>
          Choose a new temporary password for {user.name}.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <Input
          type="password"
          required
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min. 6 chars)"
          className="h-11"
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={reset.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {reset.isPending ? "Resetting..." : "Reset password"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const create = useCreateUser();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "staff" as "staff" | "customer",
    canManageShipments: true,
    canManageCustomers: false,
    canGenerateInvoice: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        data: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
          permissions: {
            canManageShipments: form.canManageShipments,
            canManageCustomers: form.canManageCustomers,
            canGenerateInvoice: form.canGenerateInvoice,
          },
        },
      },
      {
        onSuccess: () => {
          toast({ title: "User created" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          onClose();
        },
        onError: (err: any) => {
          toast({
            title: "Could not create user",
            description: err?.data?.error,
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Add a new user</DialogTitle>
        <DialogDescription>
          Create a staff member or customer account.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          <Input
            required
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="Full name"
            className="h-11"
          />
          <Select
            value={form.role}
            onValueChange={(v) =>
              setForm((s) => ({ ...s, role: v as "staff" | "customer" }))
            }
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
          <Input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            placeholder="Email"
            className="h-11"
          />
          <Input
            required
            value={form.phone}
            onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            placeholder="Phone"
            className="h-11"
          />
          <Input
            required
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            placeholder="Initial password"
            className="h-11 col-span-2"
          />
        </div>

        {form.role === "staff" && (
          <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Staff permissions
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={form.canManageShipments}
                onCheckedChange={(v) =>
                  setForm((s) => ({ ...s, canManageShipments: !!v }))
                }
              />
              <span className="text-sm">Manage shipments</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={form.canManageCustomers}
                onCheckedChange={(v) =>
                  setForm((s) => ({ ...s, canManageCustomers: !!v }))
                }
              />
              <span className="text-sm">Manage customers</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={form.canGenerateInvoice}
                onCheckedChange={(v) =>
                  setForm((s) => ({ ...s, canGenerateInvoice: !!v }))
                }
              />
              <span className="text-sm">Generate invoices</span>
            </label>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={create.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {create.isPending ? "Creating..." : "Create user"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export default function Users() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const params: { role?: "admin" | "staff" | "customer" } = {};
  if (roleFilter !== "all") params.role = roleFilter;

  const { data, isLoading } = useListUsers(params, {
    query: { queryKey: getListUsersQueryKey(params) },
  });
  const remove = useDeleteUser();

  const [createOpen, setCreateOpen] = useState(false);
  const [permsFor, setPermsFor] = useState<any | null>(null);
  const [resetFor, setResetFor] = useState<any | null>(null);

  const handleDelete = (id: number) => {
    remove.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "User deleted" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        },
        onError: (err: any) => {
          toast({
            title: "Delete failed",
            description: err?.data?.error,
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Users</h1>
          <p className="mt-1 text-gray-600">
            Manage your team and customer accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="w-44 h-11 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" /> Add user
              </Button>
            </DialogTrigger>
            <CreateUserDialog onClose={() => setCreateOpen(false)} />
          </Dialog>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <UsersIcon className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((u) => (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-secondary">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{u.email}</td>
                    <td className="px-6 py-4 text-gray-700">{u.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          u.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : u.role === "staff"
                              ? "bg-secondary/10 text-secondary"
                              : "bg-gray-100 text-gray-700",
                        )}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {u.role !== "admin" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1"
                            onClick={() => setPermsFor(u)}
                          >
                            <Settings className="h-3.5 w-3.5" /> Permissions
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1"
                          onClick={() => setResetFor(u)}
                        >
                          <KeyRound className="h-3.5 w-3.5" /> Reset
                        </Button>
                        {u.role !== "admin" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-1 text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete user?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove {u.name}. Their
                                  shipments will keep their tracking history but
                                  lose the customer reference.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(u.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {permsFor && (
        <Dialog open={!!permsFor} onOpenChange={(o) => !o && setPermsFor(null)}>
          <PermissionsDialog user={permsFor} onClose={() => setPermsFor(null)} />
        </Dialog>
      )}
      {resetFor && (
        <Dialog open={!!resetFor} onOpenChange={(o) => !o && setResetFor(null)}>
          <ResetPasswordDialog user={resetFor} onClose={() => setResetFor(null)} />
        </Dialog>
      )}

      <WhatsAppButton />
    </div>
  );
}
