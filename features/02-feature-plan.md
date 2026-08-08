# Implementation Plan: Home page

## Summary
Add a new lazy-loaded home page as the app's landing route, exposing five entry points: "Explore recipes", "New Recipe", "Export Recipes", "Import Recipes", and "Delete all recipes". The last four are relocated from `RecipeListPage` (not duplicated); `RecipeListPage` keeps only recipe browsing, search, filtering, and single-recipe delete.

## Scope
- In scope: new `HomePage` standalone component and route; moving the New/Export/Import/Delete-all buttons, their template markup, and their orchestration logic (click handlers, hidden file input, live-region announcements, confirm-dialog wiring) from `RecipeListPage` to `HomePage`; updating `app.routes.ts` so `''` resolves to the home page and `/recipes` becomes the explicit "explore" destination; trimming `RecipeListPage` to remove the now-unused state/markup.
- Out of scope: any change to `RecipeService`, `RecipeStorageService`, or `RecipeImportExportService` business logic (already correctly isolated in services, reused as-is); recipe form/detail pages; visual redesign beyond reusing existing global `.button` classes; adding new native plugins or permissions (none required beyond what's already in use).

## Affected areas
- `src/app/app.routes.ts` — modify: replace the `redirectTo: 'recipes'` root route with a lazy-loaded `HomePage` route at `''`.
- `src/app/features/home/pages/home/home.ts` — create: new standalone `HomePage` component holding the moved logic (import/export/delete-all handlers, file input trigger, confirm dialog wiring, live announcements) plus a link to `/recipes`.
- `src/app/features/home/pages/home/home.html` — create: template with the 5 buttons/links and the moved hidden file input + confirm dialog + live region.
- `src/app/features/home/pages/home/home.scss` — create: layout styles for the home page (adapted from the removed `.recipe-list-toolbar` block).
- `src/app/features/recipes/pages/recipe-list/recipe-list.ts` — modify: remove `RecipeImportExportService` injection, `router`-based nothing-else-uses-it code, `hasAnyRecipes`, `fileInput` viewChild, `triggerImport`, `onFileSelected`, `exportRecipes`, `describeImportResult`, and the `'all'` branch of `PendingDelete`/`requestDeleteAll`/dialog copy; keep single-recipe delete flow and search/filter state.
- `src/app/features/recipes/pages/recipe-list/recipe-list.html` — modify: remove the "New recipe" link, "Export recipes"/"Import recipes"/"Delete all recipes" buttons and the hidden file input from the toolbar; keep the type filter, search field, and recipe list/confirm-dialog for single delete.
- `src/app/features/recipes/pages/recipe-list/recipe-list.scss` — modify: drop or simplify `.recipe-list-toolbar` if it becomes empty/unused after removing the moved buttons (keep it only if the New-recipe link stays — see note in Implementation steps).

## Data & interfaces

```ts
// src/app/features/home/pages/home/home.ts

/** Discriminates the single destructive action available from the home page. */
type ImportExportMessage = string; // reuse plain signal<string>, no new type needed

class HomePage {
  private readonly recipeService = inject(RecipeService);        // for removeAll(), recipes()
  private readonly importExportService = inject(RecipeImportExportService); // exportToFile(), importFromFile()

  readonly hasAnyRecipes: Signal<boolean>;        // computed from recipeService.recipes().length > 0
  readonly liveMessage: WritableSignal<string>;   // status announcements for import/export/delete-all
  readonly isDeleteAllDialogOpen state via viewChild(ConfirmDialog) + open()/close(), same pattern as today

  triggerImport(): void;
  onFileSelected(event: Event): Promise<void>;
  exportRecipes(): Promise<void>;
  requestDeleteAll(): void;
  onDeleteAllConfirmed(): void;
  onDeleteAllCancelled(): void;
  private describeImportResult(result: RecipeImportResult): string; // moved verbatim
}
```

```ts
// src/app/features/recipes/pages/recipe-list/recipe-list.ts (simplified)
type PendingDelete = { id: string; title: string } | null; // 'all' kind removed, no longer a union
// hasAnyRecipes, fileInput, triggerImport, onFileSelected, exportRecipes, requestDeleteAll,
// describeImportResult, and the importExportService injection are deleted, not renamed.
```

No new service methods are needed: `RecipeService.removeAll()` and `RecipeImportExportService.exportToFile()`/`importFromFile()` already encapsulate all the business logic the moved buttons trigger. Only the Angular-component-level orchestration (event handlers, dialog state, live-region text) moves, per the "no unit tests for components" rule this orchestration is not independently unit-testable and was never covered by specs — moving it changes no test surface.

## Implementation steps
1. Create `src/app/features/home/pages/home/home.ts`, `home.html`, `home.scss` following the same file-per-concern convention as `recipe-list`. Component: `selector: 'app-home'`, `changeDetection: OnPush`, imports `RouterLink`, `ConfirmDialog`.
2. Move `exportRecipes`, `triggerImport`, `onFileSelected`, `describeImportResult`, `requestDeleteAll`, the delete-all branch of `onDeleteConfirmed`/`onDeleteCancelled` (renamed `onDeleteAllConfirmed`/`onDeleteAllCancelled`), `hasAnyRecipes`, the `fileInput` viewChild, the `deleteDialog` viewChild, `deleteDialogHeading`/`deleteDialogMessage` (now static strings — "Delete all recipes" / "Delete all recipes? This cannot be undone." — since only one destructive action remains, `computed()` is no longer needed for these two), and a fresh `liveMessage` signal from `RecipeListPage` into `HomePage`. Inject `RecipeService` and `RecipeImportExportService` in `HomePage`.
3. Move the corresponding markup from `recipe-list.html` into `home.html`: the "New recipe" link (`routerLink="/recipes/new"`), "Export recipes" button, "Import recipes" button + hidden file `<input>`, "Delete all recipes" button, the `<app-confirm-dialog>` for delete-all, and a `role="status" aria-live="polite"` live region for `liveMessage()`.
4. Add the "Explore recipes" button/link to `home.html` as `[routerLink]="['/recipes']"`, styled with `.button.button-primary`.
5. Move the toolbar layout styles from `recipe-list.scss` into `home.scss` (rename `.recipe-list-toolbar` to `.home-actions` or similar); add host sizing consistent with other pages (`max-width`, `padding`, centered).
6. Update `src/app/app.routes.ts`: replace the `{ path: '', pathMatch: 'full', redirectTo: 'recipes' }` entry with `{ path: '', loadComponent: () => import('./features/home/pages/home/home').then((m) => m.HomePage) }`. Keep the existing `{ path: 'recipes', loadChildren: ... }` entry unchanged so `/recipes` still resolves to `RecipeListPage`.
7. Trim `recipe-list.ts`: delete `RecipeImportExportService` injection, `hasAnyRecipes`, `fileInput` viewChild, `triggerImport`, `onFileSelected`, `exportRecipes`, `describeImportResult`; simplify `PendingDelete` to drop the `'all'` variant; simplify `requestDeleteRecipe`/`onDeleteConfirmed`/`onDeleteCancelled` accordingly; simplify `deleteDialogHeading`/`deleteDialogMessage` to the single-recipe case only (can likely collapse to non-computed template strings referencing `pendingDelete()?.title` directly, or keep as `computed()` if still deriving from state — keep whichever is simpler while remaining pure).
8. Trim `recipe-list.html`: remove the "New recipe" link, the Export/Import/Delete-all buttons, and the hidden file input from the toolbar `<div>`. If nothing remains in `.recipe-list-toolbar` (no more page-level actions on this route), remove the wrapping `<div class="recipe-list-toolbar">` entirely; otherwise keep it around the type filter/search only if that grouping still makes sense (it currently doesn't — filter/search have their own containers already, so the toolbar div should be deleted).
9. Update `recipe-list.scss` to remove the now-unused `.recipe-list-toolbar` rule.
10. Verify no other file references the removed `RecipeListPage` members (`hasAnyRecipes`, `triggerImport`, etc.) via a repo-wide search before finalizing.

## Capacitor / native considerations
No new plugin usage — `@capacitor/filesystem` calls (`exportToFile`/`importFromFile`, `Directory.Documents`) are unchanged, only relocated to a different component. No new permissions are introduced. iOS/Android behavior for `Filesystem` write/read to `Directory.Documents` remains exactly as already implemented; moving the calling component does not change platform behavior. The native file picker triggered by the hidden `<input type="file">` continues to rely on the browser/WebView file dialog exactly as before.

## UI/UX & accessibility
- Home page must have a single `<h1>` (e.g. "Grandma's Recipes" or similar app title) — confirm exact copy is not specified in feature.md, see Open Questions.
- All 5 actions must be reachable via keyboard in a logical tab order, each with a visible focus indicator (existing `:focus-visible` global rule covers this if standard `button`/`a` elements are used).
- "Delete all recipes" button must remain `[disabled]` when there are no recipes (`!hasAnyRecipes()`), matching current behavior, with `aria-disabled` implied by the native `disabled` attribute (already AXE-clean in the current implementation).
- Reuse the existing `role="status" aria-live="polite"` live region pattern for import/export/delete-all outcome announcements, matching the pattern already validated on `recipe-list`.
- Reuse `<app-confirm-dialog>` for the delete-all confirmation exactly as today — it already provides native `<dialog>` focus trapping and Esc-to-cancel, so no new accessibility work is needed there.
- Button styling should reuse existing global `.button`, `.button-primary`, `.button-danger` classes (already WCAG AA contrast-checked as part of the existing design system) rather than introducing new classes, per DRY.
- Ensure the 5 actions are visually and semantically distinct (e.g. list or button group with adequate spacing) so AXE's target-size and landmark checks pass; keep touch targets at the existing `--touch-target: 44px` minimum.

## Testing
- Unit tests: none required for `HomePage` or `RecipeListPage` (components, per project testing scope). No service logic is added or changed — `RecipeService` and `RecipeImportExportService` keep their existing unit test coverage unchanged (`recipe.service.spec.ts`, `recipe-import-export.service.spec.ts`); do not add new specs unless a helper function is extracted (none planned).
- No e2e framework is present in this repo (no Cypress/Playwright config found) — do not introduce one as part of this feature; rely on manual verification.
- Manual/on-device verification:
  1. App launches to the home page (root route), not directly to the recipe list.
  2. "Explore recipes" navigates to `/recipes` and the list/search/filter/single-delete flow still works unchanged.
  3. "New Recipe" from home navigates to `/recipes/new` and the form still saves correctly.
  4. "Export Recipes" from home writes the backup file and shows a success/failure live announcement identical in wording to today's.
  5. "Import Recipes" from home opens the file picker, imports valid/invalid/mixed files, and announces the same added/overwritten/skipped counts as before.
  6. "Delete all recipes" is disabled with zero recipes, opens the confirm dialog when enabled, deletes all recipes on confirm, and cancels without side effects on cancel/Esc.
  7. Keyboard-only pass over the home page: tab order, focus visibility, Esc closes the confirm dialog and returns focus sensibly.
  8. Screen reader spot-check (VoiceOver/TalkBack) on the live-region announcements and dialog heading/message.
  9. Confirm `RecipeListPage` no longer shows New/Export/Import/Delete-all controls and that its toolbar div/styles were cleanly removed (no leftover empty wrapper, no dead CSS).

## Risks & assumptions
- Assumed the home page becomes the new root (`''`) route rather than living at a separate path like `/home`, since feature.md describes it as "a home page" with "Explore recipes" navigating to the recipe list — implying it is the new landing screen. This is a common pattern and matches "move to the new home page" language, but is confirmed only as an assumption — see Open Questions.
- Assumed `RecipeListPage`'s single-recipe delete confirm dialog stays on `recipe-list` and only the "delete all" dialog moves to `home`, since the feature only asks to move the four listed buttons, not general delete-single behavior.
- Assumed no new shared "actions" service is warranted: the four moved handlers are thin UI-orchestration code with no reuse target beyond `HomePage` itself, so moving them wholesale (not extracting to a service) satisfies KISS/DRY without over-engineering. If a future feature needs the same actions from a second screen, extracting an `HomeActionsService` (or similar) would be the SOLID-friendly follow-up, but doing so now would be speculative.
- Assumed the exact home page heading/copy and app title are not specified and can use a simple placeholder (e.g. "Grandma's Recipes") — flagged in Open Questions since copy is user-facing and unspecified.

## Open Questions
1. Should the new home page live at the root path `''` (making it the app's landing screen, with `/recipes` reserved for the list), or should it live at an explicit path like `/home` while `''` keeps redirecting elsewhere? The plan assumes the former.
Answer : the new home page live at the root path `''`
2. What exact heading/title text and any supporting copy should appear on the home page (e.g. app name, tagline)? feature.md specifies only the 5 buttons.
Answer : add the app name, i.e., GrandMa
3. Should "Explore recipes" be styled as the primary/most prominent action (since it's the main everyday entry point) while the other four are secondary, or should all 5 buttons have equal visual weight?
A: "Explore recipes" should be styled as the primary/most prominent action
4. Is there a desired button order/grouping on the home page (e.g. "Explore recipes" first, destructive "Delete all recipes" visually separated from the others), or is the order in feature.md (Explore, New, Export, Import, Delete all) authoritative for layout too?
A: "Explore recipes" first, destructive "Delete all recipes" visually separated from the others