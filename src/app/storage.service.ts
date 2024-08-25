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

    addIngredient(recipeId: RecipeId, ingredient: Ingredient): boolean {
        if (recipeId.length === 0 || ingredient.name.length === 0) {
            console.log(`can not add ingredient '${ingredient.name}' to '${recipeId}': field is empty`);
            return false;
        }
        let recipe = this.getById(recipeId);
        if (!this.ingredientExists(recipe.ingredients, ingredient.name)) {
            console.log(`add ingredient '${ingredient.name}' to '${recipeId}'`);
            recipe.ingredients.push(ingredient);
            recipe.ingredients.sort(this.compareIngredient)
            this.saveStorageData();
            return true;
        } else {
            console.log(`ingredient '${ingredient.name}' is already recipe '${recipeId}'`);
            return false;
        }
    }

    private compareIngredient(a: Ingredient, b: Ingredient): number {
        return a.name.localeCompare(b.name);
    }

    updateIngredient(recipeId: RecipeId, ingredient: Ingredient): boolean {
        if (recipeId.length === 0) {
            console.log(`can not update ingredient: recipe ID is empty`);
            return false;
        }
        let recipe = this.getById(recipeId);
        let existingIngredient = this.getIngredientByName(recipe.ingredients, ingredient.name);
        if (existingIngredient === undefined) {
            console.log(`can not update ingredient of '${recipeId}': ingredient not found`);
            return false;
        } else {
            existingIngredient.quantity = ingredient.quantity;
            existingIngredient.unit = ingredient.unit;
            this.saveStorageData();
            return true;
        }
    }

    deleteIngredient(recipeId: RecipeId, ingredientName: string): boolean {
        let recipe = this.getById(recipeId);
        const existingIngredient = this.getIngredientByName(recipe.ingredients, ingredientName);
        if (existingIngredient === undefined) {
            console.log(`can not delete ingredient of '${recipeId}': ingredient not found`);
            return false;
        } else {
            const index = recipe.ingredients.indexOf(existingIngredient);
            recipe.ingredients.splice(index, 1);
            this.saveStorageData();
            return true;
        }
    }

    private ingredientExists(recipeIngredients: Ingredient[], ingredientName: string): boolean {
        const found = this.getIngredientByName(recipeIngredients, ingredientName);
        return found !== undefined;
    }

    private getIngredientByName(recipeIngredients: Ingredient[], ingredientName: string): Ingredient | undefined {
        return recipeIngredients.find(rI => rI.name == ingredientName);
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
