import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Registration from "./pages/Registration";
import AdminLogin from "./pages/AdminLogin";
import Login from "./pages/Login";
import Account from "./pages/Account";
import Offer from "./pages/Offer";
import Policy from "./pages/Policy";
import Faq from "./pages/Faq";
import Contacts from "./pages/Contacts";
import RequireAdmin from "./components/auth/RequireAdmin";
import RequireUser from "./components/auth/RequireUser";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register/:token" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/account"
            element={
              <RequireUser>
                <Account />
              </RequireUser>
            }
          />
          <Route path="/offer" element={<Offer />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/contacts" element={<Contacts />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
