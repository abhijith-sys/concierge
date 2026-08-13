import { Navigate } from "react-router-dom";

const adminUrl = (import.meta.env.VITE_ADMIN_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8081";

/** Public SPA no longer hosts Super Admin — redirect to the isolated admin app. */
export function AdminRedirect() {
  if (typeof window !== "undefined") {
    window.location.replace(adminUrl);
  }
  return <Navigate to="/" replace />;
}
