import { Navigate } from "react-router-dom";
import { getAuthRole, isAuthenticated } from "@/lib/auth";

export default function RequireUser({ children }: { children: JSX.Element }) {
  const authenticated = isAuthenticated();
  const role = getAuthRole();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "employee") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
