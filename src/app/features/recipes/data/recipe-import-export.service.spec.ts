import { TestBed } from '@angular/core/testing';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

import { Recipe } from '../models/recipe.model';
import { RECIPE_BACKUP_FILE_NAME, RecipeImportExportService } from './recipe-import-export.service';
import { RecipeService } from './recipe.service';

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: vi.fn(),
  },
  Directory: { Data: 'DATA', Documents: 'DOCUMENTS' },
  Encoding: { UTF8: 'utf8' },
}));

function buildRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe-1',
    title: 'Orange cake',
    type: 'dessert',
    ingredients: [{ name: 'Orange', quantity: 2, unit: 'none' }],
    steps: ['Mix everything'],
    cooking: { temperatureCelsius: 180, timeMinutes: 40 },
    ...overrides,
  };
}

describe('RecipeImportExportService', () => {
  let service: RecipeImportExportService;
  let recipeService: { recipes: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    recipeService = {
      recipes: vi.fn().mockReturnValue([]),
      upsert: vi.fn().mockReturnValue('added'),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: RecipeService, useValue: recipeService }],
    });
    service = TestBed.inject(RecipeImportExportService);
  });

  describe('exportToFile', () => {
    it('writes the current recipes as pretty JSON to Directory.Documents', async () => {
      const recipes = [buildRecipe()];
      recipeService.recipes.mockReturnValue(recipes);
      vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: 'file://backup.json' });

      await service.exportToFile();

      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: RECIPE_BACKUP_FILE_NAME,
        directory: Directory.Documents,
        data: JSON.stringify(recipes, null, 2),
        encoding: Encoding.UTF8,
        recursive: true,
      });
    });

    it('writes a valid empty array when there are no recipes', async () => {
      vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: 'file://backup.json' });

      await service.exportToFile();

      expect(Filesystem.writeFile).toHaveBeenCalledWith(expect.objectContaining({ data: '[]' }));
    });

    it('overwrites rather than duplicates on a second export', async () => {
      vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: 'file://backup.json' });

      await service.exportToFile();
      await service.exportToFile();

      expect(Filesystem.writeFile).toHaveBeenCalledTimes(2);
      expect(Filesystem.writeFile).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ path: RECIPE_BACKUP_FILE_NAME }),
      );
      expect(Filesystem.writeFile).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ path: RECIPE_BACKUP_FILE_NAME }),
      );
    });

    it('propagates filesystem errors instead of failing silently', async () => {
      vi.mocked(Filesystem.writeFile).mockRejectedValue(new Error('Permission denied'));

      await expect(service.exportToFile()).rejects.toThrow('Permission denied');
    });
  });

  describe('importFromFile', () => {
    function jsonFile(content: string): File {
      return new File([content], 'backup.json', { type: 'application/json' });
    }

    it('upserts every valid entry and reports added/overwritten counts', async () => {
      recipeService.upsert.mockReturnValueOnce('added').mockReturnValueOnce('overwritten');
      const file = jsonFile(JSON.stringify([buildRecipe(), buildRecipe({ id: 'recipe-2' })]));

      const result = await service.importFromFile(file);

      expect(result).toEqual({ addedCount: 1, overwrittenCount: 1, skippedCount: 0, errors: [] });
      expect(recipeService.upsert).toHaveBeenCalledTimes(2);
    });

    it('skips invalid entries and records an error for each, without throwing', async () => {
      const invalidEntry: unknown = { id: 'bad', title: 'x', type: 'invalid-type' };
      const file = jsonFile(JSON.stringify([buildRecipe(), invalidEntry]));

      const result = await service.importFromFile(file);

      expect(result.addedCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('resolves with an empty-array result for an empty import file, without throwing', async () => {
      const file = jsonFile('[]');

      const result = await service.importFromFile(file);

      expect(result).toEqual({ addedCount: 0, overwrittenCount: 0, skippedCount: 0, errors: [] });
      expect(recipeService.upsert).not.toHaveBeenCalled();
    });

    it('never throws on malformed JSON text and reports an error instead', async () => {
      const file = jsonFile('{ this is not json');

      const result = await service.importFromFile(file);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(recipeService.upsert).not.toHaveBeenCalled();
    });

    it('never throws when the JSON is a valid object but not an array', async () => {
      const file = jsonFile(JSON.stringify({ not: 'an array' }));

      const result = await service.importFromFile(file);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(recipeService.upsert).not.toHaveBeenCalled();
    });

    it('rejects an entry with an invalid ingredient unit', async () => {
      const recipeWithInvalidUnit: unknown = {
        ...buildRecipe(),
        ingredients: [{ name: 'Flour', quantity: 200, unit: 'cup' }],
      };
      const file = jsonFile(JSON.stringify([recipeWithInvalidUnit]));

      const result = await service.importFromFile(file);

      expect(result.skippedCount).toBe(1);
      expect(recipeService.upsert).not.toHaveBeenCalled();
    });

    it('processes duplicate ids within the same file deterministically, last one wins', async () => {
      recipeService.upsert.mockReturnValueOnce('added').mockReturnValueOnce('overwritten');
      const file = jsonFile(
        JSON.stringify([
          buildRecipe({ title: 'First version' }),
          buildRecipe({ title: 'Second version' }),
        ]),
      );

      const result = await service.importFromFile(file);

      expect(recipeService.upsert).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ title: 'First version' }),
      );
      expect(recipeService.upsert).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ title: 'Second version' }),
      );
      expect(result).toEqual({ addedCount: 1, overwrittenCount: 1, skippedCount: 0, errors: [] });
    });
  });
});
