import { lazy, type ReactNode, Suspense } from "react";
import { createBrowserRouter, Outlet, ScrollRestoration } from "react-router-dom";
import { userRoutes } from "./user-routes";
import { AppProvider } from "components/AppProvider";
import { Navigation } from "components/Navigation";
import { Footer } from "components/Footer";
import { DocumentTitle } from "components/DocumentTitle";

export const SuspenseWrapper = ({ children }: { children: ReactNode }) => {
  return <Suspense>{children}</Suspense>;
};

const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const SomethingWentWrongPage = lazy(
  () => import("./pages/SomethingWentWrongPage"),
);

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
          <SuspenseWrapper>
            <Outlet />
          </SuspenseWrapper>
          <Footer />
        </AppProvider>
      ),
      children: userRoutes
    },
    {
      path: "*",
      element: (
        <SuspenseWrapper>
          <NotFoundPage />
        </SuspenseWrapper>
      ),
      errorElement: (
        <SuspenseWrapper>
          <SomethingWentWrongPage />
        </SuspenseWrapper>
      ),
    },
  ]
);
