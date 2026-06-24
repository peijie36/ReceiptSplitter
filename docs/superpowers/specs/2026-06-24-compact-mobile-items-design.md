# Compact Mobile Saved Items

## Goal

Reduce the vertical space used by each saved item in the itemized split editor on mobile without changing desktop editing behavior or the split data model.

## Behavior

- Below the `md` breakpoint, each saved item starts collapsed, including an item that was just added.
- The collapsed row shows the item number, current item name, current amount, and assigned participant names.
- The row is a keyboard-usable button with an explicit accessible expanded state and a visual expand/collapse indicator.
- Activating the row reveals the existing name, amount, participant-assignment, and delete controls.
- Activating it again collapses those controls.
- At the `md` breakpoint and above, the existing editor remains visible regardless of the mobile expansion state.
- If an attempted edit is invalid, the mobile editor remains open so its error message and correction controls stay visible.

## Implementation

Keep the change within `src/components/split/ItemSection.tsx`. `ExistingItemEditor` will own a local expanded boolean initialized to `false`. Responsive utility classes will hide or show the editable body based on that state below `md`, while ensuring the body is always displayed from `md` upward.

The existing header content will become the mobile disclosure control. Desktop will retain a non-interactive header presentation to avoid introducing a collapse interaction where none is requested. Assigned participant names will be derived from the existing `participants` and `participantIds` props; no derived data will be persisted.

No new dependency, shared abstraction, route, store field, or persistence change is needed.

## Validation

- Add component coverage proving saved items start collapsed and can be expanded through the disclosure control.
- Verify the disclosure exposes an accurate accessible expanded state.
- Preserve the existing edit-on-blur, participant assignment, validation, and delete behavior tests.
- Run the focused `ItemSection` test file, then the full test suite and production build.

## Assumptions

- "Mobile" means viewport widths below Tailwind's existing `md` breakpoint.
- Compact behavior applies only to saved item editors, not the new-item form or receipt review form.
- Expansion state is transient UI state and resets after a reload or remount.
