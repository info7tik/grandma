# Implementation Plan: Recipe Recording

## Summary
Add a local-first recipe management feature to the Grandma app: create, edit, delete, list-by-type, search, and JSON-based backup (export/import) of recipes, built as a lazy-loaded Angular feature area with local Capacitor-backed persistence.

## Scope
- In scope: recipe CRUD (create/update/delete/delete-all), list-by-type view, title/substring search, JSON export (written to the Documents directory), JSON import (file picker), local persistence, all supporting UI/forms/dialogs, accessibility.
- Out of scope: cloud sync/auth, multi-device sync, recipe photos/media, sharing a single recipe (as opposed to a full backup), nutrition data, unit conversion, localization/i18n, iOS (confirmed out of scope — only `android/` exists in this repo).

## Affected areas
This is a greenfield feature; the codebase currently has only the generated Angular shell (`src/app/app.ts`, `app.html`, `app.routes.ts`, `app.config.ts`). All files below are new unless marked "(modify)". File naming follows the repo's existing convention (no `.component` suffix, e.g. `app.ts`/`app.html`/`app.scss`).

- `src/app/app.routes.ts` (modify) — add redirect to `recipes` and lazy `loadChildren` entry.
- `src/app/app.html` (modify) — remove Angular boilerplate placeholder markup, keep `<router-outlet />` (and a minimal app shell/header if desired).
- `package.json` (modify) — add `@capacitor/filesystem`.
- `android/app/src/main/AndroidManifest.xml` (modify, conditional) — add storage permissions **only if** the pinned `@capacitor/filesystem` version's Android implementation of `Directory.Documents` requires them (see Capacitor / native considerations — this must be verified, not assumed).
- `src/app/features/recipes/models/recipe.model.ts` — domain types (`Recipe`, `Ingredient`, `IngredientUnit`, `RecipeType`, `CookingInfo`, DTOs).
- `src/app/features/recipes/validation/recipe-validation.ts` — pure type guards + shared validation constants/messages used by both the reactive form and import parsing.
- `src/app/features/recipes/data/recipe-storage.service.ts` — Capacitor Filesystem-backed persistence adapter for the app's **live** data store (`Directory.Data`; load/save/clear one JSON document). Distinct from the user-facing backup file below.
- `src/app/features/recipes/data/recipe.service.ts` — `providedIn: 'root'` state/CRUD service exposing signals; orchestrates the storage adapter.
- `src/app/features/recipes/data/recipe-import-export.service.ts` — export (write JSON directly to `Directory.Documents`) and import (parse + validate + upsert) logic; depends on `RecipeService` for state mutation.
- `src/app/features/recipes/recipes.routes.ts` — feature route table (list/new/detail/edit), each using `loadComponent`.
- `src/app/features/recipes/pages/recipe-list/recipe-list.ts|html|scss` — list, type filter, search, entry points to create/import/export/delete-all.
- `src/app/features/recipes/pages/recipe-detail/recipe-detail.ts|html|scss` — read-only recipe view with edit/delete actions.
- `src/app/features/recipes/pages/recipe-form/recipe-form.ts|html|scss` — reactive form for create and update, driven by an optional `id` route param.
- `src/app/features/recipes/components/recipe-card/recipe-card.ts|html|scss` — presentational card for the list (`input(recipe)`, `output(select)`, `output(delete)`).
- `src/app/features/recipes/components/type-filter/type-filter.ts|html|scss` — segmented control for filtering by `RecipeType | 'all'`.
- `src/app/features/recipes/components/ingredients-field-array/ingredients-field-array.ts|html|scss` — encapsulates the ingredients `FormArray` (add/remove rows; unit rendered as a fixed-option `<select>`).
- `src/app/features/recipes/components/steps-field-array/steps-field-array.ts|html|scss` — encapsulates the steps `FormArray` (add/remove/reorder rows).
- `src/app/shared/components/confirm-dialog/confirm-dialog.ts|html|scss` — reusable accessible confirmation dialog (used for delete recipe / delete all).
- `*.spec.ts` alongside every **service and helper/utility file** above only (`recipe-validation.ts`, `recipe-storage.service.ts`, `recipe.service.ts`, `recipe-import-export.service.ts`) using Vitest + `TestBed` where DI is involved, matching `src/app/app.spec.ts` style. Per project convention, UI components (list/detail/form pages, `recipe-card`, `type-filter`, the field-array components, `confirm-dialog`) do **not** get unit test files — see Testing section.

## Data & interfaces

```ts
// recipe.model.ts
export type RecipeType = 'dessert' | 'main-course' | 'drink';

export type IngredientUnit = 'none' | 'grams' | 'millilitres' | 'tablespoon' | 'teaspoon';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: IngredientUnit;
}

export interface CookingInfo {
  temperatureCelsius: number | null; // nullable: not all recipes need cooking
  timeMinutes: number | null;
}

export interface Recipe {
  id: string;
  title: string;
  type: RecipeType;
  ingredients: Ingredient[];
  steps: string[]; // short instruction text, order = array index
  cooking: CookingInfo;
}

export type NewRecipe = Omit<Recipe, 'id'>;
export type RecipeUpdate = Partial<Omit<Recipe, 'id'>>;

export interface RecipeImportResult {
  addedCount: number;       // new ids, not previously present
  overwrittenCount: number; // ids that matched an existing recipe and were replaced
  skippedCount: number;     // entries that failed validation
  errors: string[];
}
```

Display labels for `IngredientUnit` (used by the ingredient row `<select>` and read-only views) live alongside the model, e.g. `none → "No unit"`, `grams → "Grams (g)"`, `millilitres → "Millilitres (ml)"`, `tablespoon → "Tablespoon (tbsp)"`, `teaspoon → "Teaspoon (tsp)"`.

```ts
// recipe-storage.service.ts — live app data store (Directory.Data)
export class RecipeStorageService {
  load(): Promise<Recipe[]>;
  save(recipes: Recipe[]): Promise<void>;
  clear(): Promise<void>;
}
```

```ts
// recipe.service.ts
export class RecipeService {
  readonly recipes: Signal<Recipe[]>;          // readonly view of internal writable signal
  readonly isLoading: Signal<boolean>;
  recipesByType(type: RecipeType | 'all'): Recipe[];  // pure filter over recipes()
  search(query: string): Recipe[];             // case-insensitive substring match on title
  getById(id: string): Recipe | undefined;
  create(recipe: NewRecipe): Recipe;           // generates a new id
  update(id: string, changes: RecipeUpdate): void;
  upsert(recipe: Recipe): 'added' | 'overwritten'; // used by import: adds if id is new, fully replaces if id exists
  remove(id: string): void;
  removeAll(): void;
}
```

```ts
// recipe-import-export.service.ts — user-facing backup file (Directory.Documents)
export const RECIPE_BACKUP_FILE_NAME = 'grandma-recipes-backup.json';

export class RecipeImportExportService {
  exportToFile(): Promise<void>;                // serialize RecipeService.recipes(), write to Directory.Documents/RECIPE_BACKUP_FILE_NAME (overwrites any existing file at that path)
  importFromFile(file: File): Promise<RecipeImportResult>; // parse, validate, upsert each valid entry via RecipeService.upsert (overwrite-in-place on id match)
}
```

```ts
// recipe-validation.ts
export function isRecipe(value: unknown): value is Recipe;
export function isRecipeArray(value: unknown): value is Recipe[];
export const RECIPE_TITLE_MAX_LENGTH = 120;
export const RECIPE_STEP_MAX_LENGTH = 280;
```

Reactive form shape for `recipe-form`:
```ts
interface RecipeFormValue {
  title: string;
  type: RecipeType;
  ingredients: { name: string; quantity: number; unit: IngredientUnit }[];
  steps: { text: string }[];
  cookingTemperature: number | null;
  cookingTime: number | null;
}
```

## Implementation steps

1. Add `@capacitor/filesystem` to `package.json` (version aligned with the existing `@capacitor/core`/`@capacitor/android` major version already installed); run `npx cap sync android`.
2. Create `recipe.model.ts` with the types above, including `IngredientUnit` and its display-label map.
3. Create `recipe-validation.ts`: runtime type guards (`isRecipe`, `isRecipeArray`) — `isRecipe` must check `unit` against the fixed `IngredientUnit` set — and shared constants used by both the form and the importer. Keep pure/no framework dependencies (testable in isolation, SRP).
4. Create `RecipeStorageService`: wraps `@capacitor/filesystem` `readFile`/`writeFile`/`mkdir` against a single `recipes.json` in `Directory.Data` (app-private, no permissions needed); handles "file does not exist yet" (first run) by returning `[]`; JSON encode/decode isolated here so `RecipeService` has no knowledge of the storage medium (SOLID: single responsibility, dependency inversion). This is the app's source of truth and is unrelated to the backup file in step 6.
5. Create `RecipeService`: internal `WritableSignal<Recipe[]>`, exposes readonly signal via `.asReadonly()`; loads from `RecipeStorageService` on construction (`inject`-time `effect`/`toSignal` or explicit `initialize()` called from an app initializer — pick one and keep consistent); every mutation method (`create`/`update`/`upsert`/`remove`/`removeAll`) updates the signal via `update()`/`set()` (never `mutate`) then persists the full array through `RecipeStorageService.save()`. Generate ids with `crypto.randomUUID()`. `upsert(recipe)` replaces the entry with the same `id` if present (preserving that id, overwriting every other field) or appends it as-is if the id is new; return which case occurred for reporting.
6. Create `RecipeImportExportService`:
   - `exportToFile()`: serialize `recipeService.recipes()` to pretty JSON and write it directly to `Directory.Documents/RECIPE_BACKUP_FILE_NAME` via `Filesystem.writeFile` (`recursive: true` to create the directory if missing, `encoding: Encoding.UTF8`). No share sheet — the file is simply (over)written at a fixed, known path. Before the first write, verify (per step 0 of this task / Capacitor considerations below) whether `Filesystem.requestPermissions()` must be called for `Directory.Documents` on the pinned plugin version, and call it if so; surface a clear error if permission is denied rather than failing silently.
   - `importFromFile(file)`: read `file.text()`, `JSON.parse`, validate with `isRecipeArray`; for every valid entry call `RecipeService.upsert(entry)` (overwrite-in-place if the id already exists, add otherwise); accumulate `addedCount`/`overwrittenCount`/`skippedCount`/`errors` into `RecipeImportResult`. Never throws on malformed input — always resolves with a result object describing what happened.
7. Create `shared/components/confirm-dialog`: standalone, `OnPush`, built on native `<dialog>` (`showModal()`/`close()`) for built-in focus trap and `Esc`-to-dismiss; `input()`s for title/message/confirmLabel, `output()` for confirm/cancel; returns focus to the invoking trigger element on close.
8. Create `components/type-filter`: `input(selected)`/`output(selectedChange)` segmented control (`role="tablist"`/`role="tab"` with `aria-selected`), options `All | Dessert | Main course | Drink`.
9. Create `components/ingredients-field-array`: takes a `FormArray` via `input()`, renders one fieldset row per ingredient (`name` text input, `quantity` number input, `unit` `<select>` with the 5 fixed `IngredientUnit` options and their display labels), add/remove row buttons with descriptive `aria-label`s (e.g. "Remove ingredient 2").
10. Create `components/steps-field-array`: same pattern for steps (single textarea/input per step, add/remove row).
11. Create `components/recipe-card`: presentational, `input(recipe)`, `output(open)`, `output(delete)`; displays title, type badge (text label, not color-only), ingredient/step counts.
12. Create `pages/recipe-list`: injects `RecipeService`; local signals for `typeFilter` and `searchQuery`; `computed()` combining both over `recipeService.recipes()`; renders `recipe-card` via `@for` with `track recipe.id`; wires `type-filter`; search `<input>` with associated `<label>`; buttons for "New recipe", "Export" (calls `exportToFile()`), "Import" (hidden `<input type="file" accept="application/json">` triggered programmatically), "Delete all" (opens `confirm-dialog`); `aria-live="polite"` region announcing result count and import/export outcomes, including permission or parse failures (e.g. "Imported 3 new recipes, updated 2, skipped 1 invalid entry").
13. Create `pages/recipe-detail`: reads `id` route param via `input()` (route param binding) or `ActivatedRoute` + `inject()`, resolves via `RecipeService.getById`; renders read-only recipe; redirects to list if id not found; edit/delete actions (delete opens `confirm-dialog`).
14. Create `pages/recipe-form`: reactive form (`FormBuilder` via `inject()`) with validators (see Data & interfaces / Implementation steps #4); reads optional `id` route param to prefetch and patch the form for edit mode vs create mode; on submit calls `RecipeService.create()` or `RecipeService.update()`, then navigates to the detail page; surfaces validation errors via `aria-describedby`/`aria-invalid`. Titles are **not** required to be unique — `id` is the sole unique identifier.
15. Create `recipes.routes.ts` with `loadComponent` for `''` (list), `'new'` (form), `':id'` (detail), `':id/edit'` (form).
16. Modify `app.routes.ts`: `{ path: '', pathMatch: 'full', redirectTo: 'recipes' }` and `{ path: 'recipes', loadChildren: () => import('./features/recipes/recipes.routes').then(m => m.RECIPES_ROUTES) }`.
17. Modify `app.html`/`app.ts`: strip the generated Angular starter template, leaving `<router-outlet />` (add a minimal `<header>` with app title if desired — confirm with user before adding extra chrome not in `feature.md`).
18. Verify, against the exact `@capacitor/filesystem` version pinned in step 1 and this project's `targetSdkVersion 36`, whether writing to `Directory.Documents` on Android needs any `AndroidManifest.xml` permission or a `Filesystem.requestPermissions()` call; add the manifest entries only if actually required (see Capacitor / native considerations and Open Questions #1).
19. Write/adjust spec files for steps 2–6 only (`recipe.model.ts` type guards live in `recipe-validation.ts`, `RecipeStorageService`, `RecipeService`, `RecipeImportExportService`) using Vitest + `TestBed` where DI is involved, matching the existing `app.spec.ts` style; mock `@capacitor/filesystem` at the module boundary (do not touch native code in tests). Do **not** create spec files for the components/pages built in steps 7–14 (see Testing section).

## Capacitor / native considerations

- **Plugins**: `@capacitor/filesystem` only — no `@capacitor/share` (explicitly excluded per requirements).
- **Two separate files, two separate purposes**:
  - Live app data (`recipes.json`) lives in `Directory.Data` (app-private, no permissions needed on any supported Android version) and is managed exclusively by `RecipeStorageService`.
  - The user-facing backup (`grandma-recipes-backup.json`) lives in `Directory.Documents` and is written/read directly by `RecipeImportExportService`, independent of the live data store.
- **Permissions (Android) — needs verification, not assumption**: `@capacitor/filesystem`'s Android implementation of `Directory.Documents` has changed across plugin major versions (older versions mapped it to the legacy public "Documents" folder, requiring `WRITE_EXTERNAL_STORAGE`/`READ_EXTERNAL_STORAGE` and `android:requestLegacyExternalStorage="true"`, which Android ignores once `targetSdkVersion` is 30+; newer versions map it to an **app-scoped** external "Documents" folder that needs no manifest permission at all). This project's `android/variables.gradle` sets `targetSdkVersion 36`, which strictly enforces scoped storage, so the legacy/public-folder behavior would not work here regardless of manifest entries. **Before implementing step 6/18, confirm which behavior the pinned plugin version implements** and only add manifest permissions if that version genuinely requires them. See Open Questions #1 for the product-level tradeoff this implies.
- **iOS**: out of scope (confirmed) — no `ios/` project exists in this repo and none is added by this plan.
- **Import mechanism**: relies on a native `<input type="file" accept="application/json">` inside the Capacitor WebView (opens the system file/document picker on Android) rather than a dedicated file-picker plugin — avoids extra native dependencies and permission prompts (KISS). Read the picked `File` via `file.text()`; no filesystem read permission is needed since the browser mediates access via a content URI. This is independent of where `exportToFile()` writes, so a user can still import a backup file from anywhere (e.g. received via email/USB), not only the app's own export path.
- **Data integrity**: because import parses arbitrary user-supplied files, all parsed content MUST go through `isRecipeArray` before being merged into state — treat this as an external boundary, never trust the shape at compile time.
- **Overwrite semantics**: `exportToFile()` always writes to the same fixed filename, silently replacing any prior export at that path (single canonical backup, not timestamped/versioned) — flagged as an assumption in Risks below since `feature.md` doesn't specify backup retention.
- **WebView JS API assumption**: `crypto.randomUUID()` requires a reasonably current WebView; Android's WebView auto-updates independently of `minSdkVersion 24`, so risk is low but not zero on very old, un-updated devices (see Risks).

## UI/UX & accessibility

- **Screens**: Recipe List (default route), Recipe Detail, Recipe Form (create + edit, single component), Confirm Dialog (delete one / delete all).
- **List**: type filter as a tab-like segmented control (`role="tablist"`, `aria-selected` on the active tab, arrow-key navigation between options); search `<input>` with a real (visually-hidden if needed) `<label>`, not a placeholder-only label; result count changes announced via `aria-live="polite"`; empty states ("No recipes yet" / "No recipes match your search") exposed with `role="status"`.
- **Recipe card**: entire card is a single focusable interactive element (button/link) with an accessible name including title and type; type is conveyed by visible text, never color alone; visible focus outline (not solely a color/box-shadow shift that fails contrast).
- **Confirm dialog**: native `<dialog>` with `aria-labelledby` pointing at its heading; focus moves into the dialog on open and returns to the triggering control on close; destructive action clearly labeled ("Delete recipe" / "Delete all recipes"), not relying on red color alone.
- **Form**: `<fieldset>`/`<legend>` grouping for the ingredients list and the steps list; every field has a bound `<label>`, including the ingredient unit `<select>`; invalid fields get `aria-invalid="true"` and `aria-describedby` pointing at the error message; add/remove row buttons have descriptive `aria-label`s (e.g. "Remove step 3") since visually they may be icon-only; numeric fields use `inputmode` (`decimal`/`numeric`) and `type="number"` with sane `min`; row add/remove announced via a shared `aria-live="polite"` region so screen-reader users know the list changed.
- **Contrast/touch targets**: all text/interactive elements meet WCAG AA contrast (4.5:1 normal text, 3:1 large text/UI components); interactive controls sized at least 44×44px given this is a touch-first mobile app (mobile UX best practice beyond strict AA, called out because the target audience/persona implied by the app name skews toward users who benefit from larger targets).
- **AXE**: no `ngClass`/`ngStyle` (use `class`/`style` bindings per project convention, which also keeps markup axe-friendly by avoiding dynamically-injected invalid attribute combinations); every icon-only control has an accessible name; color is never the sole means of conveying recipe type or validation state.

## Testing

Per project convention, **unit tests are written only for services and other non-component helper/utility code — never for UI components** (anything with a template, e.g. the pages and components scaffolded in steps 7–14). Component correctness is verified manually/on-device instead (see below).

- **Unit (Vitest + TestBed)**:
  - `RecipeService`: `create`/`update`/`upsert`/`remove`/`removeAll` mutate the signal correctly and call storage; `upsert` correctly distinguishes "added" vs "overwritten" and preserves the given id in both cases; `recipesByType`/`search` filtering logic (case-insensitive, substring, empty query returns all).
  - `RecipeStorageService`: load with no existing file returns `[]`; save/load round-trip; mocked Filesystem errors surface as rejected promises, not silent failures.
  - `recipe-validation.ts`: `isRecipe`/`isRecipeArray` accept valid shapes and reject missing fields, wrong types (including invalid `unit` values outside the fixed `IngredientUnit` set), extra/unexpected top-level shape (e.g. a single object instead of an array), `null`/`undefined`, non-JSON.
  - `RecipeImportExportService`: export writes the expected JSON payload to `Directory.Documents/RECIPE_BACKUP_FILE_NAME` (mocked Filesystem, assert path/content/encoding); re-exporting overwrites rather than duplicating; import upserts valid entries (overwrite-in-place on id collision, add on new id), records `skippedCount`/`errors` for invalid entries, never throws on malformed input.
  - No unit specs for `recipe-list`, `recipe-detail`, `recipe-form`, `recipe-card`, `type-filter`, `ingredients-field-array`, `steps-field-array`, or `confirm-dialog` — cover their behavior via the manual/on-device pass below.
- **Manual / on-device (Android, the only built platform)** — also the primary verification method for all UI components listed above:
  - List: type filter switches correctly between All/Dessert/Main course/Drink; search narrows results by title substring, case-insensitively; empty states render for "no recipes" and "no search matches"; delete and delete-all confirmations work and actually remove data.
  - Form: create and edit flows validate title/ingredients/steps/quantity per the rules above, allow duplicate titles, submit successfully, and correctly prefill in edit mode; add/remove works for both ingredient and step rows; unit `<select>` only offers the 5 fixed values.
  - Detail: renders a recipe fully (including cooking info when present/absent) and routes to edit/delete correctly; navigates back to the list if the id no longer exists.
  - Confirm dialog: focus moves in on open and returns to the trigger on close/cancel/confirm; `Esc` dismisses it.
  - Export, inspect the resulting file's location/permissions behavior on a real device/emulator matching `targetSdkVersion 36`, then re-import it; verify the recipe set is identical (ids, all fields) and that no permission dialog crashes or silently no-ops the write.
  - Cancel the native file picker mid-import; verify no crash and no partial state change.
  - Re-import a backup file where one entry's `id` matches an existing recipe with different content: verify that recipe is overwritten in place (no duplicate created, other recipes untouched) and the reported counts (`addedCount`/`overwrittenCount`) are correct.
  - Airplane mode: confirm all CRUD, list/search, export, and import work fully offline, since everything is local (no network/share dependency).
  - Screen reader (TalkBack) pass through list, form, and delete confirmation flows.
  - Small/low-end device check given `minSdkVersion 24` support.
- **Critical edge cases**: importing an empty array; importing malformed JSON text; importing a JSON object that isn't an array; importing a recipe with an invalid `unit` value; importing recipes with duplicate ids within the *same* file (last one wins, or first — decide and test deterministically); deleting the last remaining recipe (list must show empty state, not error); exporting with zero recipes (should still produce valid `[]` JSON, not fail); search string containing special characters (must use plain substring comparison, not treat the query as a regex); very long title/step text (layout must wrap, not overflow); unicode/emoji in text fields; two recipes with identical titles (must both persist independently, distinguished only by id).

## Risks & assumptions
- Assumed local-only, single-user, no backend — `feature.md` only describes local CRUD plus manual JSON backup, no sync/auth is mentioned.
- Assumed recipe volume stays small-to-moderate (tens to low hundreds); persisting the whole live-data list as one JSON document via `RecipeStorageService` is simple (KISS) but means every mutation rewrites the entire file. If recipe volume grows large, this becomes a performance/SRP concern and would justify moving to `@capacitor-community/sqlite` — flagged rather than pre-built, per YAGNI.
- Assumed `crypto.randomUUID()` is available in the target WebView (modern, auto-updated Android System WebView on `minSdkVersion 24`); low risk, not zero.
- **Risk (elevated from a plain assumption): `Directory.Documents` on Android vs. `targetSdkVersion 36`.** The plan writes the backup file to `Directory.Documents` per explicit instruction, but the concrete Android storage location and permission requirements for that constant depend on the exact `@capacitor/filesystem` version and are not fully knowable without checking that version's source/docs against this app's `targetSdkVersion 36` scoped-storage constraints. Implementation must verify this before relying on it (steps 6 and 18); see Open Questions #1 for the fallback tradeoff.
- Assumed the export file uses one fixed filename that is silently overwritten on every export (no versioned/timestamped backups) — `feature.md` only asks for "a JSON file to backup," not backup history.
- Ingredients and steps field-arrays are implemented as two separate components even though both are "dynamic list of rows" UI. Kept separate for clarity given the feature's current small scope (YAGNI); if a third similar list appears later, extracting a shared generic list-editor would better satisfy DRY.
- No unit tests are planned for any UI component (per project/agent convention); this trades automated regression coverage on component logic (e.g. form validity wiring, filter/search computed signals as expressed in the template) for reliance on manual/on-device verification — acceptable at this feature's scope, but worth revisiting if the component logic grows complex enough to warrant extraction into a testable, non-component service.

## Open questions

1. **`Directory.Documents` on Android given `targetSdkVersion 36`**: the instruction to "write the JSON file to the documents directory" is adopted, but Android's scoped storage (strictly enforced at this app's target SDK) means the Capacitor Filesystem plugin's resolved behavior for `Directory.Documents` could be either (a) an **app-scoped** external "Documents" folder requiring no extra permissions (accessible via a file manager under the app's own storage area, but not the shared/public Documents folder other apps see), or (b) the legacy **public** Documents folder, which is not writable this way on `targetSdkVersion` 30+ without additional Storage Access Framework work. The plan defaults to (a) — whatever the pinned plugin version resolves `Directory.Documents` to, without adding SAF/MediaStore code — to stay permission-free and avoid a much larger native surface. Confirm this is acceptable, or state that the backup file must be visible in the device's shared/public Files app, which would require extra native work not currently scoped.

None of the previously raised questions remain open; they were answered as follows and are reflected throughout this plan:

- Storage mechanism (Capacitor Filesystem, `Directory.Data`, one JSON document): confirmed as-is.
- Export/import mechanism: **no** `@capacitor/share`; export writes directly to the Documents directory (see Open Question #1 above for the one remaining nuance this introduces); import still uses a native file picker.
- Ingredient units: fixed set — `none`, `grams`, `millilitres`, `tablespoon`, `teaspoon` (rendered as a `<select>`, not free text).
- Validation rules: adopted as originally proposed, except titles may be duplicated — `id` is the sole unique identifier.
- Import id collisions: **overwrite-in-place** (matching id replaces the existing recipe entirely; non-matching id is added).
- iOS: confirmed out of scope.
- Delete-all confirmation: a single confirmation dialog is sufficient, no extra backup-first safeguard required.
- Test scope: unit tests limited to services/helpers only; UI components are verified manually/on-device, not via unit specs.
