import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StorageService } from '../storage.service';
import { Recipe, RecipeId, RecipeType } from '../types';

@Component({
    selector: 'app-recipes',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './recipes.component.html',
    styleUrl: './recipes.component.css'
})
export class RecipesComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private service = inject(StorageService)
    recipes: Recipe[] = [];
    selectedRecipe: string = "";
    type: RecipeType = RecipeType['main-course'];

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.type = params["type"];
            this.recipes = this.service.getByType(this.type).sort((r1, r2) => r1.title.localeCompare(r2.title))
        });
    }

    selectRecipe(recipeId: RecipeId) {
        this.router.navigate(['/details', recipeId]);
    }
}
