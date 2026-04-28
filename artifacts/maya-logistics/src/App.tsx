import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";

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
import Users from "@/pages/admin/Users";
import StaffActivity from "@/pages/admin/StaffActivity";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

import { AppShell } from "@/components/layout/AppShell";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/track" component={Track} />
      <Route path="/track/:trackingId" component={Track} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      
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
  );
}

export default App;
