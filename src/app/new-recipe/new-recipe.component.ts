import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { RecipeType } from '../types';

@Component({
    selector: 'app-new-recipe',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './new-recipe.component.html',
    styleUrl: './new-recipe.component.css'
})
export class NewRecipeComponent {
    private router = inject(Router);
    private service = inject(StorageService);
    recipeTitle = "";
    recipeType: string = RecipeType[RecipeType['main-course']];

    constructor() { }

    saveRecipe() {
        const castedType = this.recipeType as keyof typeof RecipeType;
        const recipeId = this.service.addRecipe(this.recipeTitle, RecipeType[castedType]);
        this.router.navigate(['details/', recipeId]);
    }
}
