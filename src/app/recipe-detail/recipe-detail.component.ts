import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CookingFormComponent } from "../cooking-form/cooking-form.component";
import { IngredientFormComponent } from "../ingredient-form/ingredient-form.component";
import { StepFormComponent } from "../step-form/step-form.component";
import { StorageService } from '../storage.service';
import { Ingredient, RecipeId, RecipeType, Step } from '../types';

@Component({
    selector: 'app-recipe-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, IngredientFormComponent, CookingFormComponent, StepFormComponent],
    templateUrl: './recipe-detail.component.html',
    styleUrl: './recipe-detail.component.css'
})
export class RecipeDetailComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private service = inject(StorageService);
    recipeId: RecipeId = "";
    recipeTitle = "";
    recipeType = RecipeType.none;
    recipeTemperature = 0;
    recipeCookingTime = 0;
    ingredients: Ingredient[] = [];
    steps: Step[] = [];
    isNewIngredientShown = false;
    isNewStepShown = false;

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.recipeId = params["id"];
            this.loadRecipe();
        });
    }


    loadRecipe() {
        const recipe = this.service.getById(this.recipeId);
        this.recipeTitle = recipe.title;
        this.recipeType = recipe.type;
        this.recipeTemperature = recipe.cooking.temperature;
        this.recipeCookingTime = recipe.cooking.time;
        this.ingredients = recipe.ingredients;
        this.steps = recipe.steps;
    }

    deleteRecipe() {
        this.service.removeRecipe(this.recipeId);
        this.router.navigate(['recipes/', this.recipeType]);
    }

    deleteIngredient(ingredientName: string) {
        this.service.deleteIngredient(this.recipeId, ingredientName);
    }
}
