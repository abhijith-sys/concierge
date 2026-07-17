import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { PageState } from "./components/ui";

const Home = lazy(() => import("./pages/Home").then((module) => ({ default: module.Home })));
const Listings = lazy(() => import("./pages/Listings").then((module) => ({ default: module.Listings })));
const BusinessDetail = lazy(() => import("./pages/BusinessDetail").then((module) => ({ default: module.BusinessDetail })));
const Login = lazy(() => import("./pages/Auth").then((module) => ({ default: module.Login })));
const Register = lazy(() => import("./pages/Auth").then((module) => ({ default: module.Register })));
const Account = lazy(() => import("./pages/Account").then((module) => ({ default: module.Account })));
const ListBusiness = lazy(() => import("./pages/ListBusiness").then((module) => ({ default: module.ListBusiness })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo({ top: 0, behavior: "instant" }), [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageState title="Opening Concierge" loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="listings" element={<Listings />} />
            <Route path="listings/:categorySlug" element={<Listings />} />
            <Route path="business/:slug" element={<BusinessDetail />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="account" element={<Account />} />
            <Route path="list-business" element={<ListBusiness />} />
            <Route path="*" element={<PageState title="Page not found" description="The page you requested does not exist." />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
