export interface RecipeStorage {
    recipes: RecipeMap;
}

export type RecipeMap = { [id: RecipeId]: Recipe; };

export interface Recipe {
    id: RecipeId,
    title: string,
    type: RecipeType,
    ingredients: Ingredient[];
    steps: Step[];
    cooking: CookingInfo;
}

export enum RecipeType { "none" = "none", "main-course" = "main-course", "dessert" = "dessert" }

export interface Ingredient {
    name: string,
    quantity: number,
    unit: IngredientUnit;
}

export enum IngredientUnit { "none" = "none", "grams" = "grams", "millilitres" = "millilitres" }

export interface Step {
    description: string;
}

export interface CookingInfo {
    time: number,
    temperature: number;
}

export type RecipeId = string;

export interface InputWithName {
    html: HTMLInputElement,
    name: string;
}

export interface InputWithOrder {
    html: HTMLInputElement,
    order: number;
}