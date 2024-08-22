export type RecipeId = number

export interface RecipeStorage {
    recipes: Recipe[];
}

export interface Recipe {
    id: RecipeId,
    title: string,
    type: RecipeType,
    ingredients: Ingredient[];
    steps: Step[];
}

export enum RecipeType { "none", "main-course", "dessert" }

export interface Ingredient {
    name: string,
    quantity: number,
    unit: IngredientUnit;
}

export enum IngredientUnit { "none", "grams", "millilitres" }

export interface Step {
    description: string;
}
