import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { useAuth } from "./context/auth";
import { useBrand } from "./lib/theme";
import { AssetsPage } from "./pages/AssetsPage";
import { AuditPage } from "./pages/AuditPage";
import { BusinessesPage } from "./pages/BusinessesPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CategoryDetailPage } from "./pages/CategoryDetailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FormBuilderPage } from "./pages/FormBuilderPage";
import { ListingsPage } from "./pages/ListingsPage";
import { LoginPage } from "./pages/LoginPage";
import { RolesPage } from "./pages/RolesPage";
import { StayEnquiriesPage } from "./pages/StayEnquiriesPage";
import { RentalEnquiriesPage } from "./pages/RentalEnquiriesPage";
import { TravelEnquiriesPage } from "./pages/TravelEnquiriesPage";
import { EventEnquiriesPage } from "./pages/EventEnquiriesPage";
import { LogisticsEnquiriesPage } from "./pages/LogisticsEnquiriesPage";
import { EducationEnquiriesPage } from "./pages/EducationEnquiriesPage";
import { HealthEnquiriesPage } from "./pages/HealthEnquiriesPage";
import { ProfessionalEnquiriesPage } from "./pages/ProfessionalEnquiriesPage";
import { HomeTradeEnquiriesPage } from "./pages/HomeTradeEnquiriesPage";
import { AutomotiveEnquiriesPage } from "./pages/AutomotiveEnquiriesPage";
import { ElectronicsEnquiriesPage } from "./pages/ElectronicsEnquiriesPage";
import { UsersPage } from "./pages/UsersPage";
import { VerificationPage } from "./pages/VerificationPage";

function RequireStaff() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="muted">Loading session…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export default function App() {
  useBrand();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireStaff />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="businesses" element={<BusinessesPage />} />
          <Route path="listings" element={<ListingsPage />} />
          <Route path="stay-enquiries" element={<StayEnquiriesPage />} />
          <Route path="rental-enquiries" element={<RentalEnquiriesPage />} />
          <Route path="travel-enquiries" element={<TravelEnquiriesPage />} />
          <Route path="event-enquiries" element={<EventEnquiriesPage />} />
          <Route path="logistics-enquiries" element={<LogisticsEnquiriesPage />} />
          <Route path="education-enquiries" element={<EducationEnquiriesPage />} />
          <Route path="health-enquiries" element={<HealthEnquiriesPage />} />
          <Route path="professional-enquiries" element={<ProfessionalEnquiriesPage />} />
          <Route path="home-trade-enquiries" element={<HomeTradeEnquiriesPage />} />
          <Route path="automotive-enquiries" element={<AutomotiveEnquiriesPage />} />
          <Route path="electronics-enquiries" element={<ElectronicsEnquiriesPage />} />
          <Route path="verification" element={<VerificationPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/:id" element={<CategoryDetailPage />} />
          <Route path="categories/:id/forms" element={<FormBuilderPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="audit" element={<AuditPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
