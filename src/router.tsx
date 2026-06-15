import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";

const rootRoute = createRootRoute({
  component: AppShell,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazyRouteComponent(() => import("@/routes/HomePage"), "HomePage"),
});

const splitEditorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "split/new",
  component: lazyRouteComponent(() => import("@/routes/SplitEditorPage"), "SplitEditorPage"),
});

const savedSplitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "split/$splitId",
  component: lazyRouteComponent(() => import("@/routes/SavedSplitRoute"), "SavedSplitRoute"),
});

const routeTree = rootRoute.addChildren([homeRoute, splitEditorRoute, savedSplitRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultStructuralSharing: true,
  defaultPendingComponent: () => <div className="p-6 text-sm text-muted-foreground">Loading...</div>,
  defaultNotFoundComponent: () => (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Page not found</h2>
      <p className="mt-2 text-sm text-muted-foreground">The route you requested does not exist.</p>
    </div>
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
