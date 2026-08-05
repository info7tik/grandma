import { Recipe } from '../models/recipe.model';
import { isRecipe, isRecipeArray } from './recipe-validation';

function buildRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe-1',
    title: 'Orange cake',
    type: 'dessert',
    ingredients: [{ name: 'Orange', quantity: 2, unit: 'none' }],
    steps: ['Mix everything', 'Bake for 40 minutes'],
    cooking: { temperatureCelsius: 180, timeMinutes: 40 },
    ...overrides,
  };
}

describe('isRecipe', () => {
  it('accepts a valid recipe', () => {
    expect(isRecipe(buildRecipe())).toBe(true);
  });

  it('accepts a recipe with null cooking info', () => {
    expect(
      isRecipe(buildRecipe({ cooking: { temperatureCelsius: null, timeMinutes: null } })),
    ).toBe(true);
  });

  it('accepts a recipe with no ingredients or steps', () => {
    expect(isRecipe(buildRecipe({ ingredients: [], steps: [] }))).toBe(true);
  });

  it('rejects null and undefined', () => {
    expect(isRecipe(null)).toBe(false);
    expect(isRecipe(undefined)).toBe(false);
  });

  it('rejects a value that is not an object', () => {
    expect(isRecipe('not a recipe')).toBe(false);
    expect(isRecipe(42)).toBe(false);
  });

  it('rejects a recipe missing required fields', () => {
    const { id, ...withoutId } = buildRecipe();
    expect(isRecipe(withoutId)).toBe(false);
  });

  it('rejects a recipe with the wrong type for a field', () => {
    expect(isRecipe(buildRecipe({ title: 42 as unknown as string }))).toBe(false);
  });

  it('rejects a recipe with an unknown recipe type', () => {
    expect(isRecipe(buildRecipe({ type: 'snack' as unknown as Recipe['type'] }))).toBe(false);
  });

  it('rejects an ingredient with an invalid unit', () => {
    const recipe = buildRecipe({
      ingredients: [
        {
          name: 'Flour',
          quantity: 200,
          unit: 'cup' as unknown as Recipe['ingredients'][number]['unit'],
        },
      ],
    });
    expect(isRecipe(recipe)).toBe(false);
  });

  it('rejects a title longer than the max length', () => {
    expect(isRecipe(buildRecipe({ title: 'a'.repeat(121) }))).toBe(false);
  });

  it('rejects a step longer than the max length', () => {
    expect(isRecipe(buildRecipe({ steps: ['a'.repeat(281)] }))).toBe(false);
  });
});

describe('isRecipeArray', () => {
  it('accepts an array of valid recipes', () => {
    expect(isRecipeArray([buildRecipe(), buildRecipe({ id: 'recipe-2' })])).toBe(true);
  });

  it('accepts an empty array', () => {
    expect(isRecipeArray([])).toBe(true);
  });

  it('rejects a single recipe object instead of an array', () => {
    expect(isRecipeArray(buildRecipe())).toBe(false);
  });

  it('rejects an array containing an invalid entry', () => {
    expect(isRecipeArray([buildRecipe(), { not: 'a recipe' }])).toBe(false);
  });

  it('rejects null and undefined', () => {
    expect(isRecipeArray(null)).toBe(false);
    expect(isRecipeArray(undefined)).toBe(false);
  });
});
