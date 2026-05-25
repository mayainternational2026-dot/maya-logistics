import { Switch, Route, Router as WouterRouter } from "wouter";
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import { HelmetProvider } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";

// Lazy-loaded pages — each becomes its own JS chunk for faster initial load
const Home            = lazy(() => import("@/pages/Home"));
const Track           = lazy(() => import("@/pages/Track"));
const Login           = lazy(() => import("@/pages/auth/Login"));
const Register        = lazy(() => import("@/pages/auth/Register"));
const ForgotPassword  = lazy(() => import("@/pages/auth/ForgotPassword"));
const Dashboard       = lazy(() => import("@/pages/Dashboard"));
const Shipments       = lazy(() => import("@/pages/shipments/Shipments"));
const NewShipment     = lazy(() => import("@/pages/shipments/NewShipment"));
const ShipmentDetails = lazy(() => import("@/pages/shipments/ShipmentDetails"));
const Invoice         = lazy(() => import("@/pages/shipments/Invoice"));
const InquiryPage     = lazy(() => import("@/pages/Inquiry"));
const Users           = lazy(() => import("@/pages/admin/Users"));
const Inquiries       = lazy(() => import("@/pages/admin/Inquiries"));
const StaffActivity   = lazy(() => import("@/pages/admin/StaffActivity"));
const CreateInvoice   = lazy(() => import("@/pages/admin/CreateInvoice"));
const Profile         = lazy(() => import("@/pages/Profile"));
const Attendance      = lazy(() => import("@/pages/attendance/Attendance"));
const AttendanceAdmin = lazy(() => import("@/pages/admin/AttendanceAdmin"));
const Leave           = lazy(() => import("@/pages/leave/Leave"));
const LeaveAdmin      = lazy(() => import("@/pages/admin/LeaveAdmin"));
const WorkLog         = lazy(() => import("@/pages/worklog/WorkLog"));
const WorkLogAdmin    = lazy(() => import("@/pages/admin/WorkLogAdmin"));
const ShippingRates   = lazy(() => import("@/pages/admin/ShippingRates"));
const Expenses        = lazy(() => import("@/pages/Expenses"));
const AdminExpenses   = lazy(() => import("@/pages/admin/AdminExpenses"));
const NotFound        = lazy(() => import("@/pages/not-found"));
const Calculator      = lazy(() => import("@/pages/Calculator"));
const Testimonials    = lazy(() => import("@/pages/Testimonials"));
const AirFreight      = lazy(() => import("@/pages/services/AirFreight"));
const SeaFreight      = lazy(() => import("@/pages/services/SeaFreight"));
const RoadFreight     = lazy(() => import("@/pages/services/RoadFreight"));
const CustomsClearance = lazy(() => import("@/pages/services/CustomsClearance"));
const Blog            = lazy(() => import("@/pages/Blog"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // 30 s — don't refetch data that is fresh
      gcTime: 5 * 60_000,         // 5 min — keep unused data in cache
      retry: 1,
      refetchOnWindowFocus: false, // don't hammer the API every tab switch
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function ProtectedShell() {
  return (
    <AppShell>
      <Switch>
        <Route path="/dashboard">
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        </Route>
        <Route path="/shipments/new">
          <ProtectedRoute><NewShipment /></ProtectedRoute>
        </Route>
        <Route path="/shipments/:id/invoice">
          <ProtectedRoute><Invoice /></ProtectedRoute>
        </Route>
        <Route path="/shipments/:id">
          <ProtectedRoute><ShipmentDetails /></ProtectedRoute>
        </Route>
        <Route path="/shipments">
          <ProtectedRoute><Shipments /></ProtectedRoute>
        </Route>
        <Route path="/admin/users">
          <ProtectedRoute allowedRoles={["admin"]}><Users /></ProtectedRoute>
        </Route>
        <Route path="/admin/staff-activity">
          <ProtectedRoute allowedRoles={["admin"]}><StaffActivity /></ProtectedRoute>
        </Route>
        <Route path="/admin/inquiries">
          <ProtectedRoute allowedRoles={["admin", "staff"]}><Inquiries /></ProtectedRoute>
        </Route>
        <Route path="/admin/create-invoice">
          <ProtectedRoute allowedRoles={["admin", "staff"]}><CreateInvoice /></ProtectedRoute>
        </Route>
        <Route path="/attendance">
          <ProtectedRoute allowedRoles={["admin", "staff"]}><Attendance /></ProtectedRoute>
        </Route>
        <Route path="/admin/attendance">
          <ProtectedRoute allowedRoles={["admin"]}><AttendanceAdmin /></ProtectedRoute>
        </Route>
        <Route path="/leave">
          <ProtectedRoute allowedRoles={["admin", "staff"]}><Leave /></ProtectedRoute>
        </Route>
        <Route path="/admin/leave">
          <ProtectedRoute allowedRoles={["admin"]}><LeaveAdmin /></ProtectedRoute>
        </Route>
        <Route path="/work-log">
          <ProtectedRoute allowedRoles={["admin", "staff"]}><WorkLog /></ProtectedRoute>
        </Route>
        <Route path="/admin/work-logs">
          <ProtectedRoute allowedRoles={["admin"]}><WorkLogAdmin /></ProtectedRoute>
        </Route>
        <Route path="/admin/shipping-rates">
          <ProtectedRoute allowedRoles={["admin"]}><ShippingRates /></ProtectedRoute>
        </Route>
        <Route path="/expenses">
          <ProtectedRoute allowedRoles={["admin", "staff"]}><Expenses /></ProtectedRoute>
        </Route>
        <Route path="/admin/expenses">
          <ProtectedRoute allowedRoles={["admin"]}><AdminExpenses /></ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute><Profile /></ProtectedRoute>
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </AppShell>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/track/:trackingId" component={Track} />
        <Route path="/track" component={Track} />
        <Route path="/inquiry" component={InquiryPage} />
        <Route path="/calculator" component={Calculator} />
        <Route path="/testimonials" component={Testimonials} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/services/air-freight" component={AirFreight} />
        <Route path="/services/sea-freight" component={SeaFreight} />
        <Route path="/services/road-freight" component={RoadFreight} />
        <Route path="/services/customs-clearance" component={CustomsClearance} />
        <Route path="/blog" component={Blog} />
        <Route component={ProtectedShell} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
