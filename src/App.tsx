import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import AuthPage from "./pages/Auth";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Chamas from "./pages/Chamas";
import Contributions from "./pages/Contributions";
import Loans from "./pages/Loans";
import WalletPage from "./pages/Wallet";
import Investments from "./pages/Investments";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/chamas" element={<Chamas />} />
                      <Route path="/contributions" element={<Contributions />} />
                      <Route path="/loans" element={<Loans />} />
                      <Route
                        path="/wallet"
                        element={
                          <ProtectedRoute requiredRole="treasurer">
                            <WalletPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/investments"
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <Investments />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/reports"
                        element={
                          <ProtectedRoute requiredRole="treasurer">
                            <Reports />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
