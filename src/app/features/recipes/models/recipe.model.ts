export type RecipeType = 'dessert' | 'main-course' | 'drink';

export const RECIPE_TYPES: readonly RecipeType[] = ['dessert', 'main-course', 'drink'];

export const RECIPE_TYPE_LABELS: Record<RecipeType, string> = {
  dessert: 'Dessert',
  'main-course': 'Main course',
  drink: 'Drink',
};

export type IngredientUnit =
  | 'none'
  | 'grams'
  | 'millilitres'
  | 'tablespoons'
  | 'teaspoons'
  | 'pinches'
  | 'cups';

export const INGREDIENT_UNITS: readonly IngredientUnit[] = [
  'none',
  'grams',
  'millilitres',
  'tablespoons',
  'teaspoons',
  'pinches',
  'cups',
];

export const INGREDIENT_UNIT_LABELS: Record<IngredientUnit, string> = {
  none: 'No unit',
  grams: 'grams',
  millilitres: 'millilitres',
  tablespoons: 'tablespoons',
  teaspoons: 'teaspoons',
  pinches: 'pinches',
  cups: 'cups',
};

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
  addedCount: number; // new ids, not previously present
  overwrittenCount: number; // ids that matched an existing recipe and were replaced
  skippedCount: number; // entries that failed validation
  errors: string[];
}
