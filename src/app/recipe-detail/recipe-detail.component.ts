import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from '../storage.service';
import { Ingredient, IngredientUnit, RecipeId, RecipeType, Step } from '../types';

@Component({
    selector: 'app-recipe-detail',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './recipe-detail.component.html',
    styleUrl: './recipe-detail.component.css'
})
export class RecipeDetailComponent {
    private route = inject(ActivatedRoute);
    private service = inject(StorageService);
    private recipeId: RecipeId = 0;
    recipeTitle = "";
    recipeType = RecipeType.none;
    ingredients: Ingredient[] = [];
    steps: Step[] = [];
    isNewIngredientShown = false;
    ingredientName = "";
    ingredientQuantity = 5;
    ingredientUnit = IngredientUnit.none;
    isNewStepShown = false;

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.recipeId = parseInt(params["id"]);
            this.loadRecipe();
        });
    }

    private loadRecipe() {
        const recipe = this.service.getById(this.recipeId);
        this.recipeTitle = recipe.title;
        this.recipeType = recipe.type;
        this.ingredients = recipe.ingredients;
        this.steps = recipe.steps;
    }

    showNewIngredient() {
        this.isNewIngredientShown = true;
    }

    hideNewIngredient() {
        this.isNewIngredientShown = false;
    }

    addNewIngredient() {
        const ingredient: Ingredient = { name: this.ingredientName, quantity: this.ingredientQuantity, unit: this.ingredientUnit };
        this.service.addIngredient(this.recipeId, ingredient);
        this.loadRecipe();
        this.hideNewIngredient();
    }
}
