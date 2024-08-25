import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IngredientFormComponent } from "../ingredient-form/ingredient-form.component";
import { StorageService } from '../storage.service';
import { Ingredient, RecipeId, RecipeType, Step } from '../types';

@Component({
    selector: 'app-recipe-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, IngredientFormComponent],
    templateUrl: './recipe-detail.component.html',
    styleUrl: './recipe-detail.component.css'
})
export class RecipeDetailComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private service = inject(StorageService);
    recipeId: RecipeId = "";
    @ViewChild("ingredientForm") ingredientForm!: IngredientFormComponent;
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


    private loadRecipe() {
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
