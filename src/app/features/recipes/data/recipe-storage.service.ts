import { Injectable } from '@angular/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

import { Recipe } from '../models/recipe.model';
import { isRecipeArray } from '../validation/recipe-validation';

const RECIPES_FILE_NAME = 'recipes.json';

/**
 * Persists the app's live recipe list to a single JSON document in `Directory.Data`
 * (app-private, no permissions required). This is the source of truth for `RecipeService`
 * and is unrelated to the user-facing backup file written by `RecipeImportExportService`.
 */
@Injectable({ providedIn: 'root' })
export class RecipeStorageService {
  async load(): Promise<Recipe[]> {
    try {
      const { data } = await Filesystem.readFile({
        path: RECIPES_FILE_NAME,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const parsed: unknown = JSON.parse(typeof data === 'string' ? data : '');
      return isRecipeArray(parsed) ? parsed : [];
    } catch (error) {
      if (this.isFileNotFoundError(error)) {
        return [];
      }
      throw error;
    }
  }

  async save(recipes: Recipe[]): Promise<void> {
    await Filesystem.writeFile({
      path: RECIPES_FILE_NAME,
      directory: Directory.Data,
      data: JSON.stringify(recipes),
      encoding: Encoding.UTF8,
      recursive: true,
    });
  }

  async clear(): Promise<void> {
    await this.save([]);
  }

  private isFileNotFoundError(error: unknown): boolean {
    return error instanceof Error && /does not exist/i.test(error.message);
  }
}
