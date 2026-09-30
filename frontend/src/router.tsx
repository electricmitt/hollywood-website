import { lazy, type ReactNode, Suspense } from "react";
import { createBrowserRouter, Outlet, ScrollRestoration } from "react-router-dom";
import { userRoutes } from "./user-routes";
import { AppProvider } from "components/AppProvider";
import { Navigation } from "components/Navigation";
import { Footer } from "components/Footer";
import { DocumentTitle } from "components/DocumentTitle";
import { Toaster } from "@/components/ui/sonner";
// Loaded up front: it must still render when downloading a page has failed.
import SomethingWentWrongPage from "./pages/SomethingWentWrongPage";

export const SuspenseWrapper = ({ children }: { children: ReactNode }) => {
  return <Suspense>{children}</Suspense>;
};

const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

export const router = createBrowserRouter(
  [
    {
      // Site-wide layout: every page gets the nav bar, footer, tab title,
      // and scroll-to-top when moving between pages.
      element: (
        <AppProvider>
          <DocumentTitle />
          <ScrollRestoration />
          <Navigation />
          {/* Holds the page's space while it downloads so the footer doesn't jump up. */}
          <Suspense fallback={<div className="min-h-screen" />}>
            <Outlet />
          </Suspense>
          <Footer />
          {/* Renders every toast() message; without it they were silently dropped. */}
          <Toaster position="top-center" richColors closeButton />
        </AppProvider>
      ),
      errorElement: <SomethingWentWrongPage />,
      children: userRoutes
    },
    {
      path: "*",
      element: (
        <SuspenseWrapper>
          <NotFoundPage />
        </SuspenseWrapper>
      ),
      errorElement: <SomethingWentWrongPage />,
    },
  ]
);
