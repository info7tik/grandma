import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from '../storage.service';
import { RecipeType } from '../types';

@Component({
    selector: 'app-recipe-detail',
    standalone: true,
    imports: [],
    templateUrl: './recipe-detail.component.html',
    styleUrl: './recipe-detail.component.css'
})
export class RecipeDetailComponent {
    private route = inject(ActivatedRoute);
    private service = inject(StorageService);
    recipeTitle = "";
    recipeType = RecipeType.none;


    ngOnInit() {
        this.route.params.subscribe(params => {
            const recipe = this.service.getById(parseInt(params["id"]));
            this.recipeTitle = recipe.title;
            this.recipeType = recipe.type;
        });
    }
}
