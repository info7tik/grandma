import { Injectable } from '@angular/core';
import { Recipe, RecipeType, RecipeStorage as StorageData } from './types';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private RECIPES_KEY = "recipes";
    constructor() {
    }

    getAll(): Recipe[] {
        return this.loadRecipes().recipes;
    }

    getById(id: number): Recipe {
        const foundRecipe = this.loadRecipes().recipes.filter(r => r.id === id);
        if (foundRecipe.length > 0) {
            return foundRecipe[0];
        } else {
            throw Error("no recipe with id '" + id + "'");
        }
    }

    getByType(type: RecipeType): Recipe[] {
        const foundRecipes = this.loadRecipes().recipes.filter(r => r.type === type);
        if (foundRecipes.length > 0) {
            return foundRecipes;
        } else {
            throw Error("no recipe with type '" + type + "'");
        }
    }

    save(recipeTitle: string, recipeType: RecipeType): number {
        let storageData = this.loadRecipes();
        const recipeId = storageData.recipes.length;
        storageData.recipes.push({ id: recipeId, title: recipeTitle, type: recipeType });
        this.saveRecipes(storageData);
        return recipeId;
    }

    private loadRecipes(): StorageData {
        const storageData = localStorage.getItem(this.RECIPES_KEY);
        if (storageData === null) {
            return { recipes: [] };
        } else {
            return JSON.parse(storageData);
        }
    }

    private saveRecipes(data: StorageData) {
        localStorage.setItem(this.RECIPES_KEY, JSON.stringify(data));
    }
}
