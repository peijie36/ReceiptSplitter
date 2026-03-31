# ReceiptSplitter

ReceiptSplitter is a local-first web app for one payer to split a bill across participants, apply tax and tip, and calculate who owes the payer.

## Stack

- React
- TypeScript
- Vite
- Zustand with persist
- TanStack Router
- Tailwind CSS
- shadcn/ui primitives
- Vitest

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm typecheck`
- `pnpm test`

## Notes

- Data persists in browser local storage.
- Money is stored and calculated in integer cents.
- The app is web-only and has no backend services.
