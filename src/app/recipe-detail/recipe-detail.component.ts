import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CookingFormComponent } from "../cooking-form/cooking-form.component";
import { IngredientFormComponent } from "../ingredient-form/ingredient-form.component";
import { StepFormComponent } from "../step-form/step-form.component";
import { StorageService } from '../storage.service';
import { Ingredient, InputWithName, InputWithOrder, RecipeId, RecipeType, Step } from '../types';

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
    @ViewChild("ingredientForm") ingredientForm!: IngredientFormComponent;
    @ViewChild("stepForm") stepForm!: StepFormComponent;
    recipeId: RecipeId = "";
    recipeTitle = "";
    recipeType = RecipeType['main-course'];
    recipeTemperature = 0;
    recipeCookingTime = 0;
    ingredients: Ingredient[] = [];
    selectedIngredientNames: InputWithName[] = [];
    selectedStepOrders: InputWithOrder[] = [];
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

    selectIngredient($event: Event, ingredientName: string) {
        const htmlInput = $event.target as HTMLInputElement;
        if (htmlInput.checked) {
            this.selectedIngredientNames.push({ html: htmlInput, name: ingredientName });
        } else {
            const indexToRemove = this.selectedIngredientNames.findIndex(selected => selected.name === ingredientName);
            if (indexToRemove === -1) {
                console.log(`can not unselect ingredient '${ingredientName}'`)
            } else {
                this.selectedIngredientNames.splice(indexToRemove, 1);
            }
        }
    }

    deleteIngredient() {
        this.selectedIngredientNames.forEach(selected => this.service.deleteIngredient(this.recipeId, selected.name))
        this.selectedIngredientNames = [];
    }

    showUpdateIngredientForm() {
        if (this.selectedIngredientNames.length === 1) {
            const ingredient = this.getSelectedByName(this.selectedIngredientNames[0].name);
            if (ingredient) {
                this.ingredientForm.showUpdateForm(ingredient);
                this.selectedIngredientNames[0].html.checked = false;
                this.selectedIngredientNames = [];
            } else {
                console.log(`ingredient not found from '${this.selectedIngredientNames[0]}'`);
            }
        } else {
            console.log("can not show form: too many selected ingredients");
        }
    }

    private getSelectedByName(ingredientName: string): Ingredient | undefined {
        const found = this.ingredients.filter(ing => ing.name === ingredientName);
        if (found.length > 0) {
            return found[0];
        } else {
            return undefined
        }
    }

    showNewStepForm() {
        this.stepForm.showNewForm(this.steps.length + 1);
    }

    selectStep($event: Event, stepOrder: number) {
        const htmlInput = $event.target as HTMLInputElement;
        if (htmlInput.checked) {
            this.selectedStepOrders.push({ html: htmlInput, order: stepOrder });
        } else {
            const indexToRemove = this.selectedStepOrders.findIndex(selected => selected.order === stepOrder);
            if (indexToRemove >= 0) {
                this.selectedStepOrders.splice(indexToRemove, 1);
            }
        }
    }

    showUpdateStepForm() {
        if (this.selectedStepOrders.length === 1) {
            const stepIndex = this.selectedStepOrders[0].order - 1;
            if (stepIndex < this.steps.length) {
                this.stepForm.showUpdateForm(stepIndex + 1, this.steps[stepIndex].description);
                this.selectedStepOrders[0].html.checked = false;
                this.selectedStepOrders = [];
            } else {
                console.log(`ingredient not found from '${this.selectedIngredientNames[0]}'`);
            }
        } else {
            console.log("can not show form: too many selected ingredients");
        }
    }

    deleteSteps() {
        this.service.deleteSteps(this.recipeId, this.selectedStepOrders.map(selected => selected.order));
        this.selectedStepOrders = [];
    }
}
