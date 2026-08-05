import { Routes } from '@angular/router';

export const RECIPES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/recipe-list/recipe-list').then((m) => m.RecipeListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/recipe-form/recipe-form').then((m) => m.RecipeFormPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/recipe-detail/recipe-detail').then((m) => m.RecipeDetailPage),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/recipe-form/recipe-form').then((m) => m.RecipeFormPage),
  },
];
