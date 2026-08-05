import { Injectable, inject } from '@angular/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

import { Recipe, RecipeImportResult } from '../models/recipe.model';
import { isRecipe } from '../validation/recipe-validation';
import { RecipeService } from './recipe.service';

export const RECIPE_BACKUP_FILE_NAME = 'grandma-recipes-backup.json';

/**
 * Reads/writes the user-facing backup file in `Directory.Documents`. Distinct from the app's
 * live data store in `Directory.Data`, which is owned exclusively by `RecipeStorageService`.
 */
@Injectable({ providedIn: 'root' })
export class RecipeImportExportService {
  private readonly recipeService = inject(RecipeService);

  /** Serializes the current recipes and (over)writes the fixed backup file path. */
  async exportToFile(): Promise<void> {
    const data = JSON.stringify(this.recipeService.recipes(), null, 2);
    await Filesystem.writeFile({
      path: RECIPE_BACKUP_FILE_NAME,
      directory: Directory.Documents,
      data,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  }

  /** Parses, validates and upserts every valid entry. Never throws on malformed input. */
  async importFromFile(file: File): Promise<RecipeImportResult> {
    const result: RecipeImportResult = {
      addedCount: 0,
      overwrittenCount: 0,
      skippedCount: 0,
      errors: [],
    };

    let parsed: unknown;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      result.errors.push('The selected file is not valid JSON.');
      return result;
    }

    if (!Array.isArray(parsed)) {
      result.errors.push('The selected file does not contain a list of recipes.');
      return result;
    }

    for (const entry of parsed) {
      if (!isRecipe(entry)) {
        result.skippedCount++;
        result.errors.push('Skipped an entry that is not a valid recipe.');
        continue;
      }
      this.upsertEntry(entry, result);
    }

    return result;
  }

  private upsertEntry(entry: Recipe, result: RecipeImportResult): void {
    const outcome = this.recipeService.upsert(entry);
    if (outcome === 'added') {
      result.addedCount++;
    } else {
      result.overwrittenCount++;
    }
  }
}
