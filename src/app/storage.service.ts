import { Injectable } from '@angular/core';
import SHA from 'sha.js';
import { Ingredient, Recipe, RecipeId, RecipeMap, RecipeType, RecipeStorage as StorageData } from './types';
@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private readonly RECIPES_KEY = "recipes";
    private readonly EMPTY_STORAGE_DATA = { recipes: {} };
    private storageData: StorageData = this.EMPTY_STORAGE_DATA;

    constructor() {
        // localStorage.clear();
        this.loadStorageData();
    }

    getAll(): RecipeMap {
        return this.storageData.recipes;
    }

    getById(id: RecipeId): Recipe {
        if (id in this.storageData.recipes) {
            return this.storageData.recipes[id];
        } else {
            throw `no recipe with id '${id}'`;
        }
    }

    getByType(type: RecipeType): Recipe[] {
        const foundRecipes = Object.values(this.storageData.recipes).filter(r => r.type === type);
        if (foundRecipes.length > 0) {
            return foundRecipes;
        } else {
            console.log(`no recipe with type '${type}'`);
            return [];
        }
    }

    addIngredient(recipeId: RecipeId, ingredient: Ingredient) {
        let recipe = this.getById(recipeId);
        console.log(`add ingredient '${ingredient.name}' to recipe '${recipeId}'`);
        recipe.ingredients.push(ingredient);
        this.saveStorageData();
    }

    addRecipe(recipeTitle: string, recipeType: RecipeType, cookingTime: number, cookingTemperature: number): RecipeId {
        if (recipeTitle.length === 0) {
            throw "can not add recipe: missing title";
        }
        const recipeId = SHA('sha256').update(recipeTitle).digest("hex");
        console.log(`add recipe '${recipeTitle}' with id '${recipeId}' and type '${recipeType}'`);
        this.storageData.recipes[recipeId] = {
            id: recipeId,
            title: recipeTitle,
            type: recipeType,
            ingredients: [],
            steps: [],
            cooking: { time: cookingTime, temperature: cookingTemperature }
        };
        this.saveStorageData();
        return recipeId;
    }

    removeRecipe(recipeId: RecipeId) {
        if (recipeId.length === 0) {
            throw "can not remove recipe: no recipe ID";
        }
        delete this.storageData.recipes[recipeId];
        this.saveStorageData();
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
