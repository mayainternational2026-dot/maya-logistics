import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListUsers,
  useCreateUser,
  useUpdateUserPermissions,
  useAdminResetUserPassword,
  useDeleteUser,
  useCreateShipment,
  getListUsersQueryKey,
  getListShipmentsQueryKey,
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
import {
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Plus,
  Settings,
  Trash2,
  Users as UsersIcon,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RoleFilter = "all" | "admin" | "staff" | "customer";

const PASSWORD_RULES = [
  { label: "At least 8 characters",        test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter (A–Z)",    test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number (0–9)",              test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$…)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

function passwordScore(p: string) { return PASSWORD_RULES.filter((r) => r.test(p)).length; }
function passwordMeta(score: number) {
  if (score === 0) return { label: "",          bar: "bg-gray-200" };
  if (score === 1) return { label: "Very Weak", bar: "bg-red-500" };
  if (score === 2) return { label: "Weak",      bar: "bg-orange-500" };
  if (score === 3) return { label: "Good",      bar: "bg-yellow-500" };
  return              { label: "Strong",     bar: "bg-green-500" };
}

function PasswordRulesHint({ password }: { password: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1">
      {PASSWORD_RULES.map((r) => {
        const ok = password.length > 0 ? r.test(password) : false;
        return (
          <li
            key={r.label}
            className={cn(
              "flex items-center gap-1 text-xs",
              password.length > 0 ? (ok ? "text-green-600" : "text-red-500") : "text-gray-400",
            )}
          >
            {password.length > 0
              ? ok
                ? <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                : <XCircle className="h-3 w-3 flex-shrink-0" />
              : <span className="h-3 w-3 flex-shrink-0 text-center font-bold">·</span>}
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

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
            onCheckedChange={(v) => setPerms((p) => ({ ...p, canManageShipments: !!v }))}
          />
          <span className="text-sm">Manage shipments (create, update, delete)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={perms.canManageCustomers}
            onCheckedChange={(v) => setPerms((p) => ({ ...p, canManageCustomers: !!v }))}
          />
          <span className="text-sm">Manage customer accounts</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={perms.canGenerateInvoice}
            onCheckedChange={(v) => setPerms((p) => ({ ...p, canGenerateInvoice: !!v }))}
          />
          <span className="text-sm">Generate invoices</span>
        </label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={update.isPending} className="bg-primary hover:bg-primary/90">
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
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const score = passwordScore(newPassword);
  const { label: strLabel, bar: strBar } = passwordMeta(score);
  const passwordOk = score === 4;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordOk) {
      setError("Password does not meet all requirements");
      return;
    }
    reset.mutate(
      { id: user.id, data: { newPassword } },
      {
        onSuccess: () => {
          toast({ title: "Password reset", description: `New password set for ${user.name}.` });
          onClose();
        },
        onError: (err: any) => {
          toast({ title: "Reset failed", description: err?.data?.error, variant: "destructive" });
        },
      },
    );
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Reset password</DialogTitle>
        <DialogDescription>Choose a new strong password for {user.name}.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(undefined); }}
              placeholder="••••••••"
              className={cn("h-11 pr-12", error && "border-red-400 focus-visible:ring-red-400")}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= score ? strBar : "bg-gray-200")} />
              ))}
              {strLabel && (
                <span className={cn("text-xs font-medium ml-2 w-20 text-right", score === 4 ? "text-green-600" : score >= 3 ? "text-yellow-600" : "text-red-500")}>
                  {strLabel}
                </span>
              )}
            </div>
          )}
          <PasswordRulesHint password={newPassword} />
          {error && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 flex-shrink-0" />{error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={reset.isPending} className="bg-primary hover:bg-primary/90">
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
  const [showPass, setShowPass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    password: "",
    role: "staff" as "staff" | "customer",
    canManageShipments: false,
    canManageCustomers: false,
    canGenerateInvoice: false,
  });

  const score = passwordScore(form.password);
  const { label: strLabel, bar: strBar } = passwordMeta(score);
  const passwordOk = score === 4;

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s) => ({ ...s, [field]: e.target.value }));
    setFieldErrors((p) => ({ ...p, [field]: "" }));
  };

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address";
    }
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!passwordOk) errs.password = "Password does not meet all requirements";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    create.mutate(
      {
        data: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          whatsappNumber: form.whatsappNumber || undefined,
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
          toast({ title: "Could not create user", description: err?.data?.error, variant: "destructive" });
        },
      },
    );
  };

  const FErr = ({ field }: { field: string }) =>
    fieldErrors[field] ? (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <XCircle className="h-3 w-3 flex-shrink-0" />{fieldErrors[field]}
      </p>
    ) : null;

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Add a new user</DialogTitle>
        <DialogDescription>Create a staff member or customer account.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-2" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1">
            <Input
              value={form.name}
              onChange={set("name")}
              placeholder="Full name *"
              className={cn("h-11", fieldErrors.name && "border-red-400")}
            />
            <FErr field="name" />
          </div>
          <Select
            value={form.role}
            onValueChange={(v) => setForm((s) => ({ ...s, role: v as "staff" | "customer" }))}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>

          <div className="col-span-1">
            <Input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="Email *"
              className={cn("h-11", fieldErrors.email && "border-red-400")}
            />
            <FErr field="email" />
          </div>

          <div className="col-span-1">
            <Input
              value={form.phone}
              onChange={set("phone")}
              placeholder="Phone *"
              className={cn("h-11", fieldErrors.phone && "border-red-400")}
            />
            <FErr field="phone" />
          </div>

          <div className="col-span-2">
            <Input
              value={form.whatsappNumber}
              onChange={set("whatsappNumber")}
              placeholder="WhatsApp number (optional)"
              className="h-11"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Initial password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => { setForm((s) => ({ ...s, password: e.target.value })); setFieldErrors((p) => ({ ...p, password: "" })); }}
              placeholder="••••••••"
              className={cn("h-11 pr-12", fieldErrors.password && "border-red-400")}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.password.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= score ? strBar : "bg-gray-200")} />
              ))}
              {strLabel && (
                <span className={cn("text-xs font-medium ml-2 w-20 text-right", score === 4 ? "text-green-600" : score >= 3 ? "text-yellow-600" : "text-red-500")}>
                  {strLabel}
                </span>
              )}
            </div>
          )}
          <PasswordRulesHint password={form.password} />
          <FErr field="password" />
        </div>

        {form.role === "staff" && (
          <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Staff permissions
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={form.canManageShipments}
                onCheckedChange={(v) => setForm((s) => ({ ...s, canManageShipments: !!v }))}
              />
              <span className="text-sm">Manage shipments</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={form.canManageCustomers}
                onCheckedChange={(v) => setForm((s) => ({ ...s, canManageCustomers: !!v }))}
              />
              <span className="text-sm">Manage customers</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={form.canGenerateInvoice}
                onCheckedChange={(v) => setForm((s) => ({ ...s, canGenerateInvoice: !!v }))}
              />
              <span className="text-sm">Generate invoices</span>
            </label>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending} className="bg-primary hover:bg-primary/90">
            {create.isPending ? "Creating..." : "Create user"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function QuickBookingDialog({
  customer,
  onClose,
}: {
  customer: { id: number; name: string; phone: string; email: string };
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const create = useCreateShipment();

  const [form, setForm] = useState({
    productName: "",
    destination: "",
    quantity: "",
    weight: "",
    totalCost: "",
    amountPaid: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((s) => ({ ...s, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: "" }));
    };

  const totalCostNum = parseFloat(form.totalCost) || 0;
  const amountPaidNum = parseFloat(form.amountPaid) || 0;
  const dueAmount = Math.max(0, totalCostNum - amountPaidNum);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.productName.trim()) errs.productName = "Product name is required";
    if (!form.destination.trim()) errs.destination = "Destination is required";
    if (!form.weight || isNaN(Number(form.weight)) || Number(form.weight) <= 0)
      errs.weight = "Enter a valid weight (kg)";
    if (!form.totalCost || isNaN(Number(form.totalCost)) || Number(form.totalCost) < 0)
      errs.totalCost = "Enter a valid total cost";
    if (form.amountPaid && (isNaN(Number(form.amountPaid)) || Number(form.amountPaid) < 0))
      errs.amountPaid = "Enter a valid amount";
    if (amountPaidNum > totalCostNum)
      errs.amountPaid = "Amount paid cannot exceed total cost";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    create.mutate(
      {
        data: {
          customerId: customer.id,
          senderName: customer.name,
          senderPhone: customer.phone,
          receiverName: "Maya Import Export Logistic",
          origin: "Kathmandu, Nepal",
          destination: form.destination.trim(),
          productName: form.productName.trim(),
          quantity: form.quantity ? Number(form.quantity) : undefined,
          weight: Number(form.weight),
          cost: totalCostNum,
          paidAmount: amountPaidNum > 0 ? amountPaidNum : undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Booking created", description: `Shipment created for ${customer.name}.` });
          queryClient.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
          onClose();
        },
        onError: (err: any) => {
          toast({ title: "Could not create booking", description: err?.data?.error, variant: "destructive" });
        },
      },
    );
  };

  const FErr = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <XCircle className="h-3 w-3 flex-shrink-0" />{errors[field]}
      </p>
    ) : null;

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>New Booking</DialogTitle>
        <DialogDescription>Create a shipment for this customer.</DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Customer Name</p>
          <p className="font-semibold text-secondary truncate">{customer.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Phone</p>
          <p className="font-semibold text-secondary">{customer.phone}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Email</p>
          <p className="font-semibold text-secondary truncate">{customer.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.productName}
              onChange={set("productName")}
              placeholder="e.g. Electronics, Garments"
              className={cn("h-11", errors.productName && "border-red-400")}
            />
            <FErr field="productName" />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.destination}
              onChange={set("destination")}
              placeholder="e.g. New York, USA"
              className={cn("h-11", errors.destination && "border-red-400")}
            />
            <FErr field="destination" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <Input
              type="number"
              min="1"
              value={form.quantity}
              onChange={set("quantity")}
              placeholder="Units"
              className="h-11"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.weight}
              onChange={set("weight")}
              placeholder="0.00"
              className={cn("h-11", errors.weight && "border-red-400")}
            />
            <FErr field="weight" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payment</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Cost (NPR) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.totalCost}
                onChange={set("totalCost")}
                placeholder="0.00"
                className={cn("h-11", errors.totalCost && "border-red-400")}
              />
              <FErr field="totalCost" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (NPR)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amountPaid}
                onChange={set("amountPaid")}
                placeholder="0.00"
                className={cn("h-11", errors.amountPaid && "border-red-400")}
              />
              <FErr field="amountPaid" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-2.5 border border-gray-100">
            <span className="text-sm font-medium text-gray-600">Due Amount (NPR)</span>
            <span className={cn(
              "text-base font-bold",
              dueAmount > 0 ? "text-red-600" : "text-green-600",
            )}>
              {dueAmount.toLocaleString("en-NP", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending} className="bg-primary hover:bg-primary/90">
            {create.isPending ? "Creating…" : "Create Booking"}
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
  const [bookingFor, setBookingFor] = useState<any | null>(null);

  const handleDelete = (id: number) => {
    remove.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "User deleted" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Delete failed", description: err?.data?.error, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Users</h1>
          <p className="mt-1 text-gray-600">Manage your team and customer accounts.</p>
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
                    <td className="px-6 py-4 font-semibold text-secondary">{u.name}</td>
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
                        {u.role === "customer" && (
                          <Button size="sm" variant="ghost" className="h-8 gap-1 text-primary" onClick={() => setBookingFor(u)}>
                            <FileText className="h-3.5 w-3.5" /> New Booking
                          </Button>
                        )}
                        {u.role !== "admin" && (
                          <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => setPermsFor(u)}>
                            <Settings className="h-3.5 w-3.5" /> Permissions
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => setResetFor(u)}>
                          <KeyRound className="h-3.5 w-3.5" /> Reset
                        </Button>
                        {u.role !== "admin" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 gap-1 text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete user?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove {u.name}. Their shipments will keep
                                  their tracking history but lose the customer reference.
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
      {bookingFor && (
        <Dialog open={!!bookingFor} onOpenChange={(o) => !o && setBookingFor(null)}>
          <QuickBookingDialog customer={bookingFor} onClose={() => setBookingFor(null)} />
        </Dialog>
      )}

      <WhatsAppButton />
    </div>
  );
}
