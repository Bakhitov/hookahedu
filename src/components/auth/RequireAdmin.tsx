import { Navigate } from "react-router-dom";
import { getAuthRole, isAuthenticated } from "@/lib/auth";

export default function RequireAdmin({ children }: { children: JSX.Element }) {
  const authenticated = isAuthenticated();
  const role = getAuthRole();

  if (!authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
