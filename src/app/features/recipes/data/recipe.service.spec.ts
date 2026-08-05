import { TestBed } from '@angular/core/testing';

import { Recipe } from '../models/recipe.model';
import { RecipeStorageService } from './recipe-storage.service';
import { RecipeService } from './recipe.service';

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

/** Flushes the microtask queue so the service's constructor-time load() has resolved. */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('RecipeService', () => {
  let service: RecipeService;
  let storage: {
    load: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  async function createService(initialRecipes: Recipe[] = []): Promise<RecipeService> {
    storage = {
      load: vi.fn().mockResolvedValue(initialRecipes),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: RecipeStorageService, useValue: storage }],
    });
    const instance = TestBed.inject(RecipeService);
    await flushMicrotasks();
    return instance;
  }

  beforeEach(async () => {
    service = await createService();
  });

  it('loads recipes from storage on construction', async () => {
    service = await createService([buildRecipe()]);

    expect(service.recipes()).toEqual([buildRecipe()]);
    expect(service.isLoading()).toBe(false);
  });

  describe('create', () => {
    it('adds a new recipe with a generated id and persists it', () => {
      const created = service.create({
        title: 'Lemonade',
        type: 'drink',
        ingredients: [],
        steps: [],
        cooking: { temperatureCelsius: null, timeMinutes: null },
      });

      expect(created.id).toBeTruthy();
      expect(service.recipes()).toEqual([created]);
      expect(storage.save).toHaveBeenCalledWith([created]);
    });
  });

  describe('update', () => {
    it('merges changes into the matching recipe and persists the full list', async () => {
      service = await createService([buildRecipe()]);

      service.update('recipe-1', { title: 'Updated cake' });

      expect(service.recipes()[0].title).toBe('Updated cake');
      expect(storage.save).toHaveBeenCalledWith(service.recipes());
    });

    it('does not change other recipes', async () => {
      service = await createService([buildRecipe(), buildRecipe({ id: 'recipe-2' })]);

      service.update('recipe-1', { title: 'Updated cake' });

      expect(service.recipes()[1]).toEqual(buildRecipe({ id: 'recipe-2' }));
    });
  });

  describe('upsert', () => {
    it('adds the recipe and reports "added" when the id is new', () => {
      const outcome = service.upsert(buildRecipe());

      expect(outcome).toBe('added');
      expect(service.recipes()).toEqual([buildRecipe()]);
    });

    it('replaces the existing recipe and reports "overwritten" when the id already exists, preserving the id', async () => {
      service = await createService([buildRecipe({ title: 'Original title' })]);

      const outcome = service.upsert(buildRecipe({ title: 'Replaced title' }));

      expect(outcome).toBe('overwritten');
      expect(service.recipes()).toEqual([buildRecipe({ title: 'Replaced title' })]);
      expect(service.recipes()[0].id).toBe('recipe-1');
    });
  });

  describe('remove', () => {
    it('removes the recipe with the matching id and persists the result', async () => {
      service = await createService([buildRecipe(), buildRecipe({ id: 'recipe-2' })]);

      service.remove('recipe-1');

      expect(service.recipes()).toEqual([buildRecipe({ id: 'recipe-2' })]);
      expect(storage.save).toHaveBeenCalledWith([buildRecipe({ id: 'recipe-2' })]);
    });
  });

  describe('removeAll', () => {
    it('empties the recipe list and clears storage', async () => {
      service = await createService([buildRecipe()]);

      service.removeAll();

      expect(service.recipes()).toEqual([]);
      expect(storage.clear).toHaveBeenCalled();
    });
  });

  describe('recipesByType', () => {
    it('returns only recipes matching the given type', async () => {
      service = await createService([
        buildRecipe({ type: 'dessert' }),
        buildRecipe({ id: 'recipe-2', type: 'drink' }),
      ]);

      expect(service.recipesByType('drink')).toEqual([
        buildRecipe({ id: 'recipe-2', type: 'drink' }),
      ]);
    });

    it('returns all recipes when the type is "all"', async () => {
      const recipes = [
        buildRecipe({ type: 'dessert' }),
        buildRecipe({ id: 'recipe-2', type: 'drink' }),
      ];
      service = await createService(recipes);

      expect(service.recipesByType('all')).toEqual(recipes);
    });
  });

  describe('search', () => {
    it('matches titles case-insensitively by substring', async () => {
      service = await createService([buildRecipe({ title: 'Orange Cake' })]);

      expect(service.search('orange')).toEqual([buildRecipe({ title: 'Orange Cake' })]);
    });

    it('returns all recipes when the query is empty', async () => {
      const recipes = [buildRecipe()];
      service = await createService(recipes);

      expect(service.search('')).toEqual(recipes);
    });

    it('returns no recipes when nothing matches', async () => {
      service = await createService([buildRecipe({ title: 'Orange Cake' })]);

      expect(service.search('chocolate')).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns the recipe with the matching id', async () => {
      service = await createService([buildRecipe()]);

      expect(service.getById('recipe-1')).toEqual(buildRecipe());
    });

    it('returns undefined when no recipe matches', () => {
      expect(service.getById('missing')).toBeUndefined();
    });
  });
});
