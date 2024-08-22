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
    recipeType = RecipeType.none;

    constructor() {

    }
    saveRecipe() {
        const recipeId = this.service.addRecipe(this.recipeTitle, this.recipeType);
        this.router.navigate(['details/', recipeId]);
    }
}
