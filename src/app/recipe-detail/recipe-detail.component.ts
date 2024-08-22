import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
    private router = inject(Router)
    private service = inject(StorageService);
    private recipeId: RecipeId = "";
    recipeTitle = "";
    recipeType = RecipeType.none;
    ingredients: Ingredient[] = [];
    steps: Step[] = [];
    isNewIngredientShown = false;
    ingredientName = "";
    ingredientQuantity = 5;
    ingredientUnit: string = IngredientUnit[IngredientUnit.none];
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
        const castedUnit = this.ingredientUnit as keyof typeof IngredientUnit;
        const ingredient: Ingredient = { name: this.ingredientName, quantity: this.ingredientQuantity, unit: IngredientUnit[castedUnit] };
        this.service.addIngredient(this.recipeId, ingredient);
        this.loadRecipe();
        this.hideNewIngredient();
    }

    deleteRecipe() {
        this.service.removeRecipe(this.recipeId);
        this.router.navigate(['recipes/', this.recipeType]);
    }
}
