import { Link, Outlet } from "@tanstack/react-router";
import { ReceiptText } from "lucide-react";

export function AppShell() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/80 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-3 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-md text-left transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-calm sm:h-11 sm:w-11 sm:rounded-2xl">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight sm:text-lg">ReceiptSplitter</p>
              <p className="hidden text-sm text-muted-foreground sm:block">
                A local-first bill split workspace for the payer.
              </p>
            </div>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
