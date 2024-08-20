import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-recipes',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './recipes.component.html',
    styleUrl: './recipes.component.css'
})
export class RecipesComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    recipes: string[] = ["carrot soup", "carrot cake", "crumble"];
    selectedRecipe: string = "";
    type = "";

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.type = params["type"];
        });
    }

    selectRecipe(recipeId: string) {
        this.router.navigate(['/details', recipeId]);
    }
}
