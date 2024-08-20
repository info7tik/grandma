import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-new-recipe',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './new-recipe.component.html',
    styleUrl: './new-recipe.component.css'
})
export class NewRecipeComponent {
    private router = inject(Router);
    recipeTitle = "";
    recipeType = "";

    saveRecipe() {
        this.router.navigate(['details/', this.recipeTitle]);
    }
}
