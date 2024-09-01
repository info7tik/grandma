import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { RecipeType } from '../types';

@Component({
    selector: 'app-new-recipe',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './new-recipe.component.html',
    styleUrl: './new-recipe.component.css'
})
export class NewRecipeComponent {
    private router = inject(Router);
    private service = inject(StorageService);
    recipeTitle = "";
    recipeType: string = RecipeType[RecipeType['main-course']];
    recipeTypeValues: string[] = []
    recipeCookingTime: number = 0;
    recipeCookingTemperature: number = 0;

    constructor() {
        this.recipeTypeValues = Object.values(RecipeType);
    }

    saveRecipe() {
        const castedType = this.recipeType as keyof typeof RecipeType;
        const recipeId = this.service.addRecipe(this.recipeTitle, RecipeType[castedType], this.recipeCookingTime, this.recipeCookingTemperature);
        this.router.navigate(['details/', recipeId]);
    }
}
