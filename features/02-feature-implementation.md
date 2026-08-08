# Implementation Summary: Home page

## What was built
The app now launches into a new lazy-loaded `HomePage` at the root route (`''`), which exposes
five entry points: "Explore recipes" (primary, navigates to `/recipes`), "New recipe" (navigates
to `/recipes/new`), "Export recipes", "Import recipes", and a visually separated destructive
"Delete all recipes" action. The four moved actions (New/Export/Import/Delete-all), along with
their handlers, hidden file input, live-region announcements, and confirm-dialog wiring, were
relocated out of `RecipeListPage` (not duplicated). `RecipeListPage` (now reached via
`/recipes`) keeps only browsing, type filtering, search, and single-recipe delete.

## Files changed
- `src/app/features/home/pages/home/home.ts` — created: new standalone, `OnPush` `HomePage`
  component; injects `RecipeService` and `RecipeImportExportService`; holds `hasAnyRecipes`,
  `liveMessage`, and the moved `triggerImport`/`onFileSelected`/`exportRecipes`/
  `requestDeleteAll`/`onDeleteAllConfirmed`/`describeImportResult` methods.
- `src/app/features/home/pages/home/home.html` — created: the 5 actions in order (Explore
  first, Delete-all visually separated), the hidden file `<input>`, the live region, and the
  delete-all `<app-confirm-dialog>`.
- `src/app/features/home/pages/home/home.scss` — created: page layout (`:host` sizing/padding,
  `.home-actions` flex row, `.home-danger-zone` visually separated via a top border/margin).
- `src/app/app.routes.ts` — modified: root path `''` now `loadComponent`s `HomePage` instead of
  `redirectTo: 'recipes'`; the `/recipes` lazy route is unchanged.
- `src/app/features/recipes/pages/recipe-list/recipe-list.ts` — modified: removed
  `RecipeImportExportService` injection, `fileInput` viewChild, `triggerImport`,
  `onFileSelected`, `exportRecipes`, `describeImportResult`; simplified `PendingDelete` to drop
  the `'all'` variant; simplified `onDeleteConfirmed`/`onDeleteCancelled`/`deleteDialogMessage`
  to the single-recipe case; kept `hasAnyRecipes` (see Deviations).
- `src/app/features/recipes/pages/recipe-list/recipe-list.html` — modified: removed the "New
  recipe" link, Export/Import/Delete-all buttons, and hidden file input; removed the
  `.recipe-list-toolbar` wrapper entirely; dialog heading is now the static string
  `"Delete recipe"`.
- `src/app/features/recipes/pages/recipe-list/recipe-list.scss` — modified: removed the
  now-unused `.recipe-list-toolbar` rule.

## Deviations from the plan
1. **`hasAnyRecipes` kept in `RecipeListPage`, not deleted.** The plan's Data & interfaces
   section states `hasAnyRecipes` should be "deleted, not renamed" from `RecipeListPage`, but
   the existing template also uses it to choose between "No recipes match your search" and "No
   recipes yet" empty-state text — a second, unrelated use the plan did not account for.
   Resolution (approved by user): kept a `hasAnyRecipes` computed in `RecipeListPage` for the
   empty-state message, and added a separate, independent `hasAnyRecipes` computed in `HomePage`
   for the delete-all disabled state. Each is a one-line `computed()` over
   `recipeService.recipes()`; duplicating a one-liner across two independent components was
   preferred over introducing a shared abstraction for a single-line expression.
2. **No `onDeleteAllCancelled`/`(cancelled)` binding on `HomePage`'s delete-all dialog.** The
   plan's Data & interfaces sketch lists `onDeleteAllCancelled(): void` as a `HomePage` member.
   Once "delete all" moved out of `RecipeListPage`'s shared `pendingDelete` state, there is no
   state left to reset on cancel in `HomePage` (the dialog's heading/message are static strings,
   not derived from a `pendingDelete` signal). Resolution (approved by user): implemented
   `HomePage` without a `cancelled` handler/binding on `<app-confirm-dialog>` for the delete-all
   dialog, matching the existing convention already used in `RecipeDetailPage` (which also
   doesn't bind `(cancelled)` since there's nothing to reset — the native `<dialog>` already
   handles Esc-to-close via `ConfirmDialog` itself).

## Information collected from the user
The plan's four Open Questions were already answered in `02-feature-plan.md` before
implementation started (home page at root `''`, app name "GrandMa" as the heading, "Explore
recipes" styled as the primary action, "Delete all recipes" visually separated) — no new
questions were needed for those.

During implementation, two deviations from the plan's exact Data & interfaces wording were
identified (see above) and flagged to the user via plan mode; both were reviewed and approved
as implemented, with no changes requested.

## Verification
- `npm run build` — passes; `home` appears as its own lazy chunk alongside `recipe-list`,
  `recipe-form`, and `recipe-detail`.
- `npm run test` — passes: 5 test files, 51 tests (no service logic was added or changed, so no
  new specs were required; existing `recipe.service.spec.ts` and
  `recipe-import-export.service.spec.ts` coverage is unchanged).
- No `lint` script exists in `package.json`, so no lint step was run.
- Repo-wide `grep` confirmed no remaining references to the removed `RecipeListPage` members
  (`triggerImport`, `onFileSelected`, `exportRecipes`, `describeImportResult`,
  `deleteDialogHeading`, `fileInput`, the `RecipeImportExportService` injection) outside
  `recipe-list.ts`, and that `recipes.routes.ts` is the only remaining reference to
  `recipe-list`.
- **Manual/on-device verification per the plan's Testing section (items 1–9) has NOT been
  performed** — no device/emulator was available in this environment. This remains the user's
  responsibility before shipping: confirming the app launches to the home page, all 5 actions
  work end-to-end (navigation, export/import file I/O, delete-all confirm/cancel/Esc), keyboard
  tab order and focus visibility, and a screen-reader spot-check of the live-region
  announcements and dialog copy.

## Follow-ups / known gaps
- Manual/on-device verification (plan's Testing section, items 1–9) is outstanding and should be
  performed by the user.
- If a third screen ever needs the same `hasAnyRecipes` check, consider extracting a shared
  helper at that point (not done now, per KISS/no speculative abstraction).
