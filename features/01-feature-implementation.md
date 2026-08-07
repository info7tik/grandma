# Implementation Summary: Recipe Recording

## What was built

A local-first recipe management feature under `src/app/features/recipes`: create, edit, delete,
delete-all, list-by-type, and title search for recipes, plus JSON export/import backup, all backed
by Capacitor Filesystem. The app now redirects to `/recipes` and lazy-loads the feature's list,
detail, and create/edit form pages, each built with standalone OnPush components, signals, and
reactive forms per the project's Angular conventions. Two independent persistence paths exist as
specified: `RecipeStorageService` (live data, `Directory.Data`) and `RecipeImportExportService`
(user-facing backup, `Directory.Documents`).

## Files changed

**New — models/validation**
- `src/app/features/recipes/models/recipe.model.ts` — `Recipe`, `Ingredient`, `IngredientUnit`, `RecipeType`, `CookingInfo`, DTOs, and display-label maps.
- `src/app/features/recipes/validation/recipe-validation.ts` — `isRecipe`/`isRecipeArray` type guards and the two length constants.
- `src/app/features/recipes/validation/recipe-validation.spec.ts` — unit tests for the guards.

**New — data layer**
- `src/app/features/recipes/data/recipe-storage.service.ts` — live-data persistence (`Directory.Data`).
- `src/app/features/recipes/data/recipe-storage.service.spec.ts` — tests (mocked `@capacitor/filesystem`).
- `src/app/features/recipes/data/recipe.service.ts` — signal-based CRUD/state service.
- `src/app/features/recipes/data/recipe.service.spec.ts` — tests (mocked `RecipeStorageService`).
- `src/app/features/recipes/data/recipe-import-export.service.ts` — backup export/import (`Directory.Documents`).
- `src/app/features/recipes/data/recipe-import-export.service.spec.ts` — tests (mocked `@capacitor/filesystem` and `RecipeService`).

**New — routing**
- `src/app/features/recipes/recipes.routes.ts` — `''` (list), `'new'` (form), `':id'` (detail), `':id/edit'` (form), all `loadComponent`.

**New — pages**
- `src/app/features/recipes/pages/recipe-list/recipe-list.{ts,html,scss}` — list, type filter, search, new/export/import/delete-all entry points, shared `aria-live` region.
- `src/app/features/recipes/pages/recipe-detail/recipe-detail.{ts,html,scss}` — read-only view, edit/delete actions, redirects to list if the id is missing.
- `src/app/features/recipes/pages/recipe-form/recipe-form.{ts,html,scss}` — reactive create/edit form.

**New — components**
- `src/app/features/recipes/components/recipe-card/recipe-card.{ts,html,scss}`
- `src/app/features/recipes/components/type-filter/type-filter.{ts,html,scss}`
- `src/app/features/recipes/components/ingredients-field-array/ingredients-field-array.{ts,html,scss}` (also exports `createIngredientFormGroup`, reused by `recipe-form` for prefill)
- `src/app/features/recipes/components/steps-field-array/steps-field-array.{ts,html,scss}` (also exports `createStepFormGroup`)
- `src/app/shared/components/confirm-dialog/confirm-dialog.{ts,html,scss}` — native `<dialog>`-based reusable confirmation dialog.

**Modified**
- `package.json`, `package-lock.json` — added `@capacitor/filesystem@^8.1.2` (resolved `8.1.2`), matching the installed `@capacitor/core`/`@capacitor/android` major version (8.x).
- `src/app/app.routes.ts` — redirect `''` → `recipes`, lazy `loadChildren` for the feature.
- `src/app/app.config.ts` — added `withComponentInputBinding()` so `recipe-detail`/`recipe-form` can bind the `:id` route param directly via `input()`.
- `src/app/app.html` / `src/app/app.ts` / `src/app/app.spec.ts` — stripped the generated Angular starter template down to `<router-outlet />` (no extra header/chrome added — `feature.md` doesn't ask for any app-level branding, so the minimal option from the plan's step 17 was chosen; easy to add later if wanted). Updated the pre-existing spec accordingly (it asserted on the removed placeholder title).
- `src/styles.scss` — added a small set of global, reusable styles (focus-visible outline, `.button`/`.button-secondary`/`.button-danger`, `.field`, `.visually-hidden`) used consistently by every new component to satisfy the plan's accessibility requirements (44×44 touch targets, visible focus, non-color-only state) without duplicating the same CSS in every component file.
- `android/` — regenerated via `npx cap sync android` after adding the plugin (registers `@capacitor/filesystem` in `capacitor.settings.gradle`/`capacitor.build.gradle`); **`AndroidManifest.xml` was deliberately left unchanged** — see verification below.

## Deviations from the plan

- **Recipe card interactivity**: the plan describes the card as "a single focusable interactive element." Since the card also needs a separate delete action, and nesting a `<button>` inside another `<button>` is invalid HTML/ARIA, `recipe-card` renders the title/type/counts as one focusable "open" button and a sibling "Delete" button, rather than literally one element. This is the standard accessible pattern for this requirement, not a scope change.
- **Import validation granularity**: the plan's implementation-step wording says "validate with `isRecipeArray`," but the plan's own `RecipeImportResult`/edge-case requirements (per-entry `skippedCount`, duplicate-id "last one wins," partial imports) require per-entry validation, since `isRecipeArray` is all-or-nothing. `importFromFile` validates each entry individually with `isRecipe` (which `isRecipeArray` is built from) so a single invalid entry is skipped and reported without discarding the rest of a valid import.
- Everything else (data model, service interfaces, storage split, routes, accessibility patterns, validation rules, import/export semantics) matches the plan as written.

## Information collected from the user

None — the plan's "Open questions" section had already resolved every product-level decision, and no new fork-in-the-road ambiguity came up that wasn't already answered there (see the native-storage verification note below, which the plan explicitly asked to be verified rather than assumed, and which resolved in favor of the plan's own stated default).

## Verification

- **Native storage verification (plan step 18 / Open Question #1)**: inspected the actual `@capacitor/filesystem@8.1.2` source (Kotlin plugin + bundled TypeScript docs) rather than assuming. Confirmed:
  - `Directory.Documents` on Android resolves to the public Documents folder, but per the plugin's own docs "On Android 11 or newer the app can only access the files/folders the app created" — i.e. inherently app-scoped, permission-free, matching option (a) from the plan's Open Question #1.
  - The plugin's `runWithPermission` logic auto-grants when `Build.VERSION.SDK_INT >= 33`, and also auto-grants for API 30–32 when a `Directory` enum (not a raw path) is passed, which is what `RecipeStorageService`/`RecipeImportExportService` always do. Only API 24–29 devices would need a declared runtime storage permission, and Android 10 (API 29) specifically also requires `requestLegacyExternalStorage`, which Android ignores once `targetSdkVersion` ≥ 30 (this app targets 36) — so that tier would remain broken regardless of manifest changes.
  - Given this, and the plan's explicit preference to "stay permission-free and avoid a much larger native surface," **no `AndroidManifest.xml` changes were made** and no explicit `Filesystem.requestPermissions()` call was added — the native plugin already requests/auto-resolves permissions transparently inside `writeFile`/`readFile` when needed. `exportToFile()`/`importFromFile()` let any rejection propagate instead of swallowing it, so a genuine permission denial on old devices surfaces through the list page's `aria-live` region instead of failing silently.
  - Confirmed `@capacitor/filesystem`'s own `minSdkVersion`/`targetSdkVersion` defaults (24/36) match the project's `android/variables.gradle`.
- **Build**: `npx ng build` — succeeds (lazy chunks generated for `recipe-list`, `recipe-form`, `recipe-detail`, `recipes-routes`).
- **Unit tests**: `npx ng test` (Vitest) — 51 tests pass across 5 spec files (`recipe-validation`, `recipe-storage.service`, `recipe.service`, `recipe-import-export.service`, plus the pre-existing `app.spec.ts` updated for the trimmed shell). No spec files were added for any UI component/page, per the plan and testing-scope instructions.
- **Formatting**: ran `npx prettier --write` over all new/modified files to match the repo's `.prettierrc` (single quotes, 100-char width); no logic changes resulted.
- **Capacitor sync**: `npx cap sync android` run after adding the plugin; `@capacitor/filesystem@8.1.2` is registered for Android, no manifest diff produced by the sync itself.
- No lint script exists in this repo (`package.json` has no `lint` command), so none was run.
- Manual/on-device verification (the primary verification method for all UI components per the plan's Testing section) was **not** performed by this agent — it requires a physical/emulated Android device and is called out in the plan as the appropriate follow-up (see below).

## Follow-ups / known gaps

- **Manual/on-device pass**: per the plan's Testing section, this is the primary verification method for every UI component (list/detail/form pages, card, type-filter, field arrays, confirm-dialog) and for the real Filesystem export/import round-trip, TalkBack pass, and low-end/API-24 device behavior. None of this was exercised in this session — recommend running `tools/build-and-install.sh` and walking through the plan's manual test checklist before shipping.
- Android API 24–29 devices will hit a permission-denied error on export/import (surfaced via the `aria-live` region, not a crash) rather than working — this is a known, accepted limitation per the plan's own risk analysis and the verification above, not a bug.
