# AGENTS.md

## Project Overview

This project is a **web-only receipt split app** for the **payer flow only**.

The app helps one person who paid a bill:
- add participants by name
- add bill items and amounts
- assign items to one or more participants
- add optional tax and tip
- calculate how much each participant owes the payer

This is a **local-first, non-commercial utility app**.

## Core Product Constraints

Do **not** add:
- authentication
- backend APIs
- databases
- syncing
- payment integrations
- notifications
- cloud OCR or receipt-image uploads
- chat / social features
- multi-user collaboration
- monetization features

Keep the app small, fast, and easy to maintain.

Browser-only English receipt scanning is allowed as assisted data entry. Receipt images,
raw OCR text, and unconfirmed scan results must remain in memory and must not be persisted.

## Tech Stack

Use:
- **React**
- **TypeScript**
- **Vite**
- **Zustand** for state management
- **Zustand persist** for local storage persistence
- **TanStack Router** for routing
- **Vitest** for unit tests
- **Tailwind CSS + ShadcnUI**

Avoid unnecessary dependencies.

## Main Goals

Prioritize:
1. correctness of split calculations
2. simple data flow
3. clean UX
4. small, maintainable components
5. reliable local persistence

## App Structure

Prefer a structure close to:

```text
src/
  components/
  features/
  routes/
  store/
  types/
  utils/
  styles/
  main.tsx
  router.tsx
```

Keep cohesive optional capabilities under `features/`. Browser-only receipt scanning owns
its UI, parsing, image preparation, OCR adapter, orchestration, types, and tests under
`src/features/receipt-scanning/`. Shared split calculations and draft persistence remain
outside the feature module.

Routes:

```text
/               -> home
/split/new      -> create/edit current split
/split/$splitId -> saved split summary/detail
```

## Routing Rules

Use TanStack Router idiomatically.

- Keep route definitions clear and minimal.
- Prefer route-based pages, not one giant component.
- Do not overcomplicate navigation.
- Use route params only where they add value.
- Do not push lots of calculation state into the URL unless it clearly improves UX.
- App state should primarily live in Zustand, not search params.

Recommended route responsibilities:
- `/` shows recent saved splits and entry point.
- `/split/new` handles creation/editing.
- `/split/$splitId` shows a saved split summary.

## State Management Rules

Use Zustand as the main app state container.

Use separate concerns where reasonable:
- split editor state
- saved splits state
- UI-only local state inside components when it does not need global sharing

Use persist middleware for local storage.

State guidelines:
- keep the store shape simple
- keep calculation logic out of components
- avoid putting derived values permanently in state when they can be computed
- prefer pure utility functions for financial math
- persist only meaningful app data, not transient UI details unless necessary

## Data Model Expectations

Use stable IDs for all entities.

Suggested baseline types:

```ts
export type Participant = {
  id: string;
  name: string;
};

export type Item = {
  id: string;
  name: string;
  amountCents: number;
  participantIds: string[];
};

export type AllocationMode = "proportional" | "equal";

export type Split = {
  id: string;
  title: string;
  payerId: string;
  participants: Participant[];
  items: Item[];
  taxCents: number;
  tipCents: number;
  allocationMode: AllocationMode;
  createdAt: string;
  updatedAt: string;
};
```

This may be refined, but keep it lightweight.

## Financial Calculation Rules

All money logic must be deterministic and testable.

Required rules:
- store money as integer cents
- never use floating-point currency math for final calculations
- every item must be assigned to at least one participant
- an item assigned to multiple participants is split equally among those assigned participants
- tax and tip must support proportional allocation based on item subtotal
- tax and tip must support equal allocation across all participants
- the payer may have items assigned to them
- the payer should appear in subtotal, tax, and tip calculations
- the payer should not appear in the final "owes payer" list
- final totals must reconcile exactly to the full bill total

## Rounding Rules

Use a consistent rounding strategy.

Preferred approach:
- calculate exact shares in cents
- distribute leftover cent remainders deterministically
- use the largest remainder strategy when splitting values that do not divide evenly

Never allow the app to lose or create money due to rounding drift.

## Required Utility Boundaries

Put money logic in pure utility functions.

Expected utilities include functions similar to:
- `calculateParticipantSubtotals`
- `allocateAdditionalCharges`
- `calculateFinalTotals`
- `buildOwedSummary`
- `formatCurrency`

Expected mutation helpers may include:
- `addParticipant`
- `removeParticipant`
- `addItem`
- `updateItem`
- `deleteItem`

## UI And UX Rules

The UI should feel like a fast calculator with memory.

UX priorities:
- fast participant entry
- fast item entry
- fast assignment
- live-updating totals
- clean review summary
- low friction

UI guidelines:
- keep screens uncluttered
- use clear sectioning
- participants
- items
- tax/tip
- summary
- validate inputs inline
- provide good empty states
- make edit/delete actions obvious
- keep labels plain and human-readable
- mobile-friendly layout, but optimized for web

Do not overdesign the UI.

## Validation Rules

Prevent:
- empty participant names
- duplicate participant names if that would confuse the summary
- empty item names
- zero or negative item amounts
- negative tax or tip
- items with no assigned participants
- missing payer selection

Show validation errors clearly.

## Persistence Rules

Persist data locally only.

Use Zustand persist and local storage for:
- current draft split
- saved split history

Do not add backend persistence.

Persist enough to survive refresh and browser restart.

## Testing Rules

Use Vitest for calculation-heavy logic.

Test the pure math thoroughly.

Minimum required test coverage:
- one item assigned to one participant
- one item assigned to multiple participants
- multiple items across multiple participants
- payer assigned to some items
- payer assigned to no items
- proportional tax allocation
- equal tax allocation
- proportional tip allocation
- equal tip allocation
- rounding edge cases
- final reconciliation to full bill total
- summary output excluding payer from owed list

Component tests are optional. Calculation tests are required.

## Code Quality Rules

- Use TypeScript strictly.
- Prefer small functions with clear names.
- Prefer composition over giant components.
- Avoid duplicating calculation logic in multiple places.
- Keep components focused on rendering and user interaction.
- Keep business logic in utilities/store.
- Keep comments useful and sparse.
- Do not leave dead code behind.

## Styling Rules

Preferred:
- CSS modules

Acceptable:
- plain CSS

Avoid:
- adding a styling framework unless already installed
- heavy animations
- unnecessary visual effects

The interface should feel clean and practical.

## Accessibility Rules

Basic accessibility is required:
- labels for form inputs
- keyboard-usable controls
- adequate button semantics
- visible focus states
- readable color contrast

## Performance Expectations

This app is small, so prioritize simplicity over premature optimization.

Still:
- avoid unnecessary rerenders
- memoize only when it clearly helps
- keep derived calculations centralized and predictable

## When Making Changes

Before making changes:
- inspect the existing repo structure
- reuse existing patterns if they are reasonable
- avoid introducing a second pattern for the same problem

When implementing:
- keep the solution minimal
- preserve type safety
- validate calculations with tests
- ensure persistence works
- ensure routes remain simple

## Definition Of Done

A feature is complete only if:
- it works in the browser
- types pass
- math is correct
- tests for calculation logic pass
- state persists correctly
- the UI is understandable without explanation

## Deliverable Expectations For Coding Agents

When finishing work, summarize:
- what files were created or changed
- what logic was added
- how calculations work
- what assumptions were made
- how to run and test the app locally
