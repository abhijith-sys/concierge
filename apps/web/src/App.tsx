import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { BrandHead } from "./components/BrandHead";
import { Layout } from "./components/Layout";
import { PageState } from "./components/ui";
import { lazyWithReload } from "./lib/lazyWithReload";
import { Account } from "./pages/Account";
import { Home } from "./pages/Home";
import { Listings } from "./pages/Listings";

const BusinessDetail = lazyWithReload(
  () => import("./pages/BusinessDetail"),
  (module) => module.BusinessDetail,
);
const ServiceDetail = lazyWithReload(
  () => import("./pages/ServiceDetail"),
  (module) => module.ServiceDetail,
);
const Login = lazyWithReload(() => import("./pages/Auth"), (module) => module.Login);
const Register = lazyWithReload(() => import("./pages/Auth"), (module) => module.Register);
const VerifyEmail = lazyWithReload(
  () => import("./pages/VerifyEmail"),
  (module) => module.VerifyEmail,
);
const ForgotPassword = lazyWithReload(
  () => import("./pages/ForgotPassword"),
  (module) => module.ForgotPassword,
);
const ListBusiness = lazyWithReload(
  () => import("./pages/ListBusiness"),
  (module) => module.ListBusiness,
);
const EditBusiness = lazyWithReload(
  () => import("./pages/EditBusiness"),
  (module) => module.EditBusiness,
);
const AdminRedirect = lazyWithReload(
  () => import("./pages/AdminRedirect"),
  (module) => module.AdminRedirect,
);
const Verification = lazyWithReload(
  () => import("./pages/Verification"),
  (module) => module.Verification,
);
const Wishlist = lazyWithReload(
  () => import("./pages/Wishlist"),
  (module) => module.Wishlist,
);
const ProviderDashboard = lazyWithReload(
  () => import("./pages/ProviderDashboard"),
  (module) => module.ProviderDashboard,
);
const ProviderListings = lazyWithReload(
  () => import("./pages/ProviderListings"),
  (module) => module.ProviderListings,
);
const Content = lazyWithReload(() => import("./pages/Content"), (module) => module.Content);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="listings" element={<Listings />} />
          <Route path="listings/:categorySlug" element={<Listings />} />
          <Route path="business/:slug" element={<BusinessDetail />} />
          <Route path="business/:slug/items/:itemId" element={<ServiceDetail />} />
          <Route path="business/:slug/edit" element={<EditBusiness />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="account" element={<Account />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="list-business" element={<ListBusiness />} />
          <Route path="provider" element={<ProviderDashboard />} />
          <Route path="provider/listings" element={<ProviderListings />} />
          <Route path="provider/listings/create" element={<ProviderListings mode="create" />} />
          <Route path="provider/listings/:serviceId/edit" element={<ProviderListings mode="edit" />} />
          <Route path="admin" element={<AdminRedirect />} />
          <Route path="verification" element={<Verification />} />
          <Route path="about" element={<Content />} />
          <Route path="careers" element={<Content />} />
          <Route path="terms" element={<Content />} />
          <Route path="privacy" element={<Content />} />
          <Route path="contact" element={<Content />} />
          <Route
            path="*"
            element={
              <PageState
                title="Page not found"
                description="The page you requested does not exist."
              />
            }
          />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BrandHead />
      <AppRoutes />
    </BrowserRouter>
  );
}
