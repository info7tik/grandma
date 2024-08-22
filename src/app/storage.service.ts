import { Injectable } from '@angular/core';
import { Ingredient, Recipe, RecipeId, RecipeType, RecipeStorage as StorageData } from './types';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private RECIPES_KEY = "recipes";
    private EMPTY_STORAGE_DATA = { recipes: [] };
    private storageData: StorageData = this.EMPTY_STORAGE_DATA;

    constructor() {
        // localStorage.clear()
        this.loadStorageData();
    }

    getAll(): Recipe[] {
        return this.storageData.recipes;
    }

    getById(id: RecipeId): Recipe {
        const foundRecipe = this.storageData.recipes.filter(r => r.id === id);
        if (foundRecipe.length > 0) {
            return foundRecipe[0];
        } else {
            throw Error("no recipe with id '" + id + "'");
        }
    }

    getByType(type: RecipeType): Recipe[] {
        const foundRecipes = this.storageData.recipes.filter(r => r.type === type);
        if (foundRecipes.length > 0) {
            return foundRecipes;
        } else {
            throw Error("no recipe with type '" + type + "'");
        }
    }

    addIngredient(recipeId: RecipeId, ingredient: Ingredient) {
        let recipe = this.getById(recipeId);
        recipe.ingredients.push(ingredient);
        this.saveStorageData();
    }

    // TODO remplace save() by addRecipe (see below addIngredient())
    save(recipeTitle: string, recipeType: RecipeType): number {
        const recipeId = this.storageData.recipes.length;
        this.storageData.recipes.push({ id: recipeId, title: recipeTitle, type: recipeType, ingredients: [], steps: [] });
        this.saveStorageData();
        return recipeId;
    }

    private loadStorageData(): StorageData {
        const storageData = localStorage.getItem(this.RECIPES_KEY);
        if (storageData === null) {
            this.storageData = this.EMPTY_STORAGE_DATA;
        } else {
            this.storageData = JSON.parse(storageData);
        }
        return this.storageData;
    }

    private saveStorageData() {
        localStorage.setItem(this.RECIPES_KEY, JSON.stringify(this.storageData));
    }
}
