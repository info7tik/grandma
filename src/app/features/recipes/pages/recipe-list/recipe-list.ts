import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { RecipeCard } from '../../components/recipe-card/recipe-card';
import { TypeFilter } from '../../components/type-filter/type-filter';
import { RecipeService } from '../../data/recipe.service';
import { RecipeType } from '../../models/recipe.model';

/** Recipe list: type filter and search. */
@Component({
  selector: 'app-recipe-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RecipeCard, TypeFilter],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.scss',
})
export class RecipeListPage {
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);

  readonly isLoading = this.recipeService.isLoading;

  readonly typeFilter = signal<RecipeType | 'all'>('all');
  readonly searchQuery = signal('');

  readonly filteredRecipes = computed(() => {
    const byType = this.recipeService.recipesByType(this.typeFilter());
    const query = this.searchQuery().trim().toLowerCase();
    return query ? byType.filter((recipe) => recipe.title.toLowerCase().includes(query)) : byType;
  });

  readonly hasAnyRecipes = computed(() => this.recipeService.recipes().length > 0);

  readonly resultCountMessage = computed(() => {
    const count = this.filteredRecipes().length;
    return `${count} recipe${count === 1 ? '' : 's'} found.`;
  });

  onTypeFilterChange(type: RecipeType | 'all'): void {
    this.typeFilter.set(type);
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  openRecipe(id: string): void {
    void this.router.navigate(['/recipes', id]);
  }
}
