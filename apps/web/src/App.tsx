import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
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
const Login = lazyWithReload(() => import("./pages/Auth"), (module) => module.Login);
const Register = lazyWithReload(() => import("./pages/Auth"), (module) => module.Register);
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
          <Route path="business/:slug/edit" element={<EditBusiness />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="account" element={<Account />} />
          <Route path="list-business" element={<ListBusiness />} />
          <Route path="admin" element={<AdminRedirect />} />
          <Route path="verification" element={<Verification />} />
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
      <AppRoutes />
    </BrowserRouter>
  );
}
