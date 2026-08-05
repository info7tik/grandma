import { TestBed } from '@angular/core/testing';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

import { Recipe } from '../models/recipe.model';
import { RecipeStorageService } from './recipe-storage.service';

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    readFile: vi.fn(),
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

describe('RecipeStorageService', () => {
  let service: RecipeStorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecipeStorageService);
  });

  describe('load', () => {
    it('returns an empty array when no file exists yet', async () => {
      vi.mocked(Filesystem.readFile).mockRejectedValue(new Error('File does not exist.'));

      const recipes = await service.load();

      expect(recipes).toEqual([]);
    });

    it('returns the parsed recipes when the file exists', async () => {
      const recipes = [buildRecipe()];
      vi.mocked(Filesystem.readFile).mockResolvedValue({ data: JSON.stringify(recipes) });

      const result = await service.load();

      expect(result).toEqual(recipes);
      expect(Filesystem.readFile).toHaveBeenCalledWith({
        path: 'recipes.json',
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
    });

    it('returns an empty array when the stored content is not a valid recipe array', async () => {
      vi.mocked(Filesystem.readFile).mockResolvedValue({
        data: JSON.stringify({ not: 'an array' }),
      });

      const result = await service.load();

      expect(result).toEqual([]);
    });

    it('rejects when the underlying filesystem call fails for a reason other than a missing file', async () => {
      vi.mocked(Filesystem.readFile).mockRejectedValue(new Error('Permission denied'));

      await expect(service.load()).rejects.toThrow('Permission denied');
    });
  });

  describe('save', () => {
    it('writes the given recipes as JSON to Directory.Data', async () => {
      vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: 'file://recipes.json' });
      const recipes = [buildRecipe()];

      await service.save(recipes);

      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: 'recipes.json',
        directory: Directory.Data,
        data: JSON.stringify(recipes),
        encoding: Encoding.UTF8,
        recursive: true,
      });
    });

    it('round-trips through load after a save', async () => {
      const recipes = [buildRecipe()];
      let savedData = '';
      vi.mocked(Filesystem.writeFile).mockImplementation(async (options) => {
        savedData = options.data as string;
        return { uri: 'file://recipes.json' };
      });
      vi.mocked(Filesystem.readFile).mockImplementation(async () => ({ data: savedData }));

      await service.save(recipes);
      const result = await service.load();

      expect(result).toEqual(recipes);
    });

    it('surfaces filesystem errors as a rejected promise', async () => {
      vi.mocked(Filesystem.writeFile).mockRejectedValue(new Error('Disk full'));

      await expect(service.save([buildRecipe()])).rejects.toThrow('Disk full');
    });
  });

  describe('clear', () => {
    it('saves an empty array', async () => {
      vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: 'file://recipes.json' });

      await service.clear();

      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: 'recipes.json',
        directory: Directory.Data,
        data: '[]',
        encoding: Encoding.UTF8,
        recursive: true,
      });
    });
  });
});
