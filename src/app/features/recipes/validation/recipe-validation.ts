import {
  CookingInfo,
  INGREDIENT_UNITS,
  Ingredient,
  RECIPE_TYPES,
  Recipe,
} from '../models/recipe.model';

export const RECIPE_TITLE_MAX_LENGTH = 120;
export const RECIPE_STEP_MAX_LENGTH = 280;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isIngredient(value: unknown): value is Ingredient {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value['name'] === 'string' &&
    typeof value['quantity'] === 'number' &&
    typeof value['unit'] === 'string' &&
    INGREDIENT_UNITS.includes(value['unit'] as Ingredient['unit'])
  );
}

function isStep(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= RECIPE_STEP_MAX_LENGTH;
}

function isCookingInfo(value: unknown): value is CookingInfo {
  if (!isRecord(value)) {
    return false;
  }
  return (
    (value['temperatureCelsius'] === null || typeof value['temperatureCelsius'] === 'number') &&
    (value['timeMinutes'] === null || typeof value['timeMinutes'] === 'number')
  );
}

/** Runtime type guard for a single recipe, used both by the reactive form save path and import parsing. */
export function isRecipe(value: unknown): value is Recipe {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value['id'] === 'string' &&
    value['id'].length > 0 &&
    typeof value['title'] === 'string' &&
    value['title'].length > 0 &&
    value['title'].length <= RECIPE_TITLE_MAX_LENGTH &&
    typeof value['type'] === 'string' &&
    RECIPE_TYPES.includes(value['type'] as Recipe['type']) &&
    Array.isArray(value['ingredients']) &&
    value['ingredients'].every(isIngredient) &&
    Array.isArray(value['steps']) &&
    value['steps'].every(isStep) &&
    isCookingInfo(value['cooking'])
  );
}

/** Runtime type guard for an imported backup file's top-level shape. */
export function isRecipeArray(value: unknown): value is Recipe[] {
  return Array.isArray(value) && value.every(isRecipe);
}
