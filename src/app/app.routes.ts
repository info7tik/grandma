import { Routes } from '@angular/router';
import { NewRecipeComponent } from './new-recipe/new-recipe.component';
import { RecipeDetailComponent } from './recipe-detail/recipe-detail.component';
import { RecipesComponent } from './recipes/recipes.component';

export const routes: Routes = [
    { path: "recipes/:type", component: RecipesComponent },
    { path: "details/:id", component: RecipeDetailComponent },
    { path: "newrecipe", component: NewRecipeComponent },
];
