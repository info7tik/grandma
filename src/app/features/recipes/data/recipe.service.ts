import { Injectable, inject, signal } from '@angular/core';

import { NewRecipe, Recipe, RecipeType, RecipeUpdate } from '../models/recipe.model';
import { RecipeStorageService } from './recipe-storage.service';

/** State/CRUD service for recipes, backed by `RecipeStorageService`. */
@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly storage = inject(RecipeStorageService);

  private readonly recipesState = signal<Recipe[]>([]);
  private readonly isLoadingState = signal(true);

  readonly recipes = this.recipesState.asReadonly();
  readonly isLoading = this.isLoadingState.asReadonly();

  constructor() {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const recipes = await this.storage.load();
      this.recipesState.set(recipes);
    } finally {
      this.isLoadingState.set(false);
    }
  }

  recipesByType(type: RecipeType | 'all'): Recipe[] {
    const recipes = this.recipesState();
    return type === 'all' ? recipes : recipes.filter((recipe) => recipe.type === type);
  }

  /** Case-insensitive substring match on title; an empty query returns all recipes. */
  search(query: string): Recipe[] {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return this.recipesState();
    }
    return this.recipesState().filter((recipe) =>
      recipe.title.toLowerCase().includes(normalizedQuery),
    );
  }

  getById(id: string): Recipe | undefined {
    return this.recipesState().find((recipe) => recipe.id === id);
  }

  create(recipe: NewRecipe): Recipe {
    const newRecipe: Recipe = { ...recipe, id: crypto.randomUUID() };
    this.recipesState.update((recipes) => [...recipes, newRecipe]);
    void this.persist();
    return newRecipe;
  }

  update(id: string, changes: RecipeUpdate): void {
    this.recipesState.update((recipes) =>
      recipes.map((recipe) => (recipe.id === id ? { ...recipe, ...changes } : recipe)),
    );
    void this.persist();
  }

  /** Adds the recipe if its id is new, or fully replaces the existing entry with the same id. */
  upsert(recipe: Recipe): 'added' | 'overwritten' {
    const alreadyExists = this.recipesState().some((existing) => existing.id === recipe.id);
    this.recipesState.update((recipes) =>
      alreadyExists
        ? recipes.map((existing) => (existing.id === recipe.id ? recipe : existing))
        : [...recipes, recipe],
    );
    void this.persist();
    return alreadyExists ? 'overwritten' : 'added';
  }

  remove(id: string): void {
    this.recipesState.update((recipes) => recipes.filter((recipe) => recipe.id !== id));
    void this.persist();
  }

  removeAll(): void {
    this.recipesState.set([]);
    void this.storage.clear();
  }

  private async persist(): Promise<void> {
    await this.storage.save(this.recipesState());
  }
}
