import { Link, Outlet } from "@tanstack/react-router";
import { ReceiptText } from "lucide-react";

export function AppShell() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/80 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-md text-left transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-calm">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">ReceiptSplitter</p>
              <p className="text-sm text-muted-foreground">A local-first bill split workspace for the payer.</p>
            </div>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
