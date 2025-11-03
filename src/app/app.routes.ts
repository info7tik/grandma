import { Routes } from '@angular/router';
import { NewRecipeComponent } from './new-recipe/new-recipe.component';
import { RecipeDetailComponent } from './recipe-detail/recipe-detail.component';
import { RecipesComponent } from './recipes/recipes.component';
import { MenuComponent } from './menu/menu.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
    { path: '', redirectTo: 'menu', pathMatch: 'full' },
    { path: "menu", component: MenuComponent },
    { path: "recipes/:type", component: RecipesComponent },
    { path: "details/:id", component: RecipeDetailComponent },
    { path: "newrecipe", component: NewRecipeComponent },
    { path: "settings", component: SettingsComponent },
];
