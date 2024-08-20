import { Routes } from '@angular/router';
import { RecipesComponent } from './recipes/recipes.component';

export const routes: Routes = [
    { path: "recipes/:type", component: RecipesComponent },
];
