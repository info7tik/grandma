import { Injectable } from '@angular/core';
import SHA from 'sha.js';
import { Ingredient, Recipe, RecipeId, RecipeMap, RecipeType, Step, RecipeStorage as StorageData } from './types';
@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private readonly RECIPES_KEY = "recipes";
    private readonly EMPTY_STORAGE_DATA = { recipes: {} };
    private storageData: StorageData = this.EMPTY_STORAGE_DATA;

    constructor() {
        this.loadStorageData();
    }

    getDefaultRecipeType(): RecipeType {
        let defaultType = RecipeType['main-course'];
        let maxRecipeNumber = -1;
        Object.values(RecipeType).forEach(type => {
            const recipes = this.getByType(type);
            if (recipes.length > maxRecipeNumber) {
                maxRecipeNumber = recipes.length;
                defaultType = type;
            }
        });
        return defaultType;
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
            recipe.ingredients.sort(this.compareIngredient);
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

    updateCookingInformation(recipeId: RecipeId, cookingTime: number, cookingTemperature: number) {
        if (recipeId.length === 0) {
            console.log(`can not update cooking information: recipe ID is empty`);
            return false;
        }
        let recipe = this.getById(recipeId);
        recipe.cooking.time = cookingTime;
        recipe.cooking.temperature = cookingTemperature;
        this.saveStorageData();
        return true;
    }

    addStep(recipeId: RecipeId, stepOrder: number, description: string): boolean {
        if (recipeId.length === 0) {
            console.log(`can not add new step: recipe ID is empty`);
            return false;
        }
        stepOrder = stepOrder < 1 ? 1 : stepOrder;
        let recipe = this.getById(recipeId);
        recipe.steps.splice(stepOrder - 1, 0, { "description": description });
        this.saveStorageData();
        return true;
    }

    updateStep(recipeId: RecipeId, currentOrder: number, newOrder: number, newDescription: string): boolean {
        if (recipeId.length === 0) {
            console.log(`can not update step: recipe ID is empty`);
            return false;
        }
        const newIndex = currentOrder < newOrder ? newOrder : newOrder - 1;
        const existingIndex = currentOrder - 1;
        let recipe = this.getById(recipeId);
        if (existingIndex < recipe.steps.length) {
            const existingStep = recipe.steps[existingIndex];
            recipe.steps.splice(newIndex, 0, { "description": newDescription });
            const existingStepIndex = recipe.steps.indexOf(existingStep);
            recipe.steps.splice(existingStepIndex, 1);
            this.saveStorageData();
            return true;
        } else {
            console.log(`can not update step: index ${currentOrder} is too large`);
            return false;
        }
    }

    deleteSteps(recipeId: RecipeId, stepOrders: number[]): boolean {
        console.log(`delete steps '${stepOrders}' of ${recipeId}`);
        if (recipeId.length === 0) {
            console.log(`can not delete steps: recipe ID is empty`);
            return false;
        }
        let recipe = this.getById(recipeId);
        const stepsToDelete: Step[] = [];
        stepOrders.forEach(order => {
            const stepIndex = order - 1;
            if (stepIndex < recipe.steps.length) {
                stepsToDelete.push(recipe.steps[stepIndex]);
            } else {
                console.log(`can not delete step: index ${stepIndex} is too large`);
            }
        });
        if (stepsToDelete.length > 0) {
            stepsToDelete.forEach(step => {
                const stepIndex = recipe.steps.indexOf(step);
                recipe.steps.splice(stepIndex, 1);
            });
            this.saveStorageData();
            return true;
        } else {
            return false;
        }
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
