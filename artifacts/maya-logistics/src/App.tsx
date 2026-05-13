import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import { HelmetProvider } from "react-helmet-async";

// Pages
import Home from "@/pages/Home";
import Track from "@/pages/Track";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import Shipments from "@/pages/shipments/Shipments";
import NewShipment from "@/pages/shipments/NewShipment";
import ShipmentDetails from "@/pages/shipments/ShipmentDetails";
import Invoice from "@/pages/shipments/Invoice";
import InquiryPage from "@/pages/Inquiry";
import Users from "@/pages/admin/Users";
import Inquiries from "@/pages/admin/Inquiries";
import StaffActivity from "@/pages/admin/StaffActivity";
import CreateInvoice from "@/pages/admin/CreateInvoice";
import Profile from "@/pages/Profile";
import Attendance from "@/pages/attendance/Attendance";
import AttendanceAdmin from "@/pages/admin/AttendanceAdmin";
import Leave from "@/pages/leave/Leave";
import LeaveAdmin from "@/pages/admin/LeaveAdmin";
import WorkLog from "@/pages/worklog/WorkLog";
import WorkLogAdmin from "@/pages/admin/WorkLogAdmin";
import NotFound from "@/pages/not-found";
import Calculator from "@/pages/Calculator";
import Testimonials from "@/pages/Testimonials";

// SEO Service Pages
import AirFreight from "@/pages/services/AirFreight";
import SeaFreight from "@/pages/services/SeaFreight";
import RoadFreight from "@/pages/services/RoadFreight";
import CustomsClearance from "@/pages/services/CustomsClearance";
import Blog from "@/pages/Blog";

import { AppShell } from "@/components/layout/AppShell";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/track" component={Track} />
      <Route path="/track/:trackingId" component={Track} />
      <Route path="/inquiry" component={InquiryPage} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/testimonials" component={Testimonials} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />

      {/* SEO Service Pages */}
      <Route path="/services/air-freight" component={AirFreight} />
      <Route path="/services/sea-freight" component={SeaFreight} />
      <Route path="/services/road-freight" component={RoadFreight} />
      <Route path="/services/customs-clearance" component={CustomsClearance} />
      <Route path="/blog" component={Blog} />

      {/* Protected Routes wrapped in AppShell */}
      <Route>
        <AppShell>
          <Switch>
            <Route path="/dashboard">
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            </Route>
            <Route path="/shipments">
              <ProtectedRoute><Shipments /></ProtectedRoute>
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
            <Route path="/profile">
              <ProtectedRoute><Profile /></ProtectedRoute>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </AppShell>
      </Route>
    </Switch>
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
