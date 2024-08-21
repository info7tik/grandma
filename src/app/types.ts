export enum RecipeType { "none", "main-course", "dessert" }
export interface Recipe {
    id: number,
    title: string,
    type: RecipeType
}
export interface RecipeStorage {
    recipes: Recipe[]
}
