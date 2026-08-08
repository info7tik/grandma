import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/pages/home/home').then((m) => m.HomePage),
  },
  {
    path: 'recipes',
    loadChildren: () => import('./features/recipes/recipes.routes').then((m) => m.RECIPES_ROUTES),
  },
];
