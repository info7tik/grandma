import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { RecipeCard } from '../../components/recipe-card/recipe-card';
import { TypeFilter } from '../../components/type-filter/type-filter';
import { RecipeService } from '../../data/recipe.service';
import { RecipeType } from '../../models/recipe.model';

type PendingDelete = { id: string; title: string } | null;

/** Recipe list: type filter, search, and single-recipe delete. */
@Component({
  selector: 'app-recipe-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RecipeCard, TypeFilter, ConfirmDialog],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.scss',
})
export class RecipeListPage {
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);

  readonly isLoading = this.recipeService.isLoading;

  readonly typeFilter = signal<RecipeType | 'all'>('all');
  readonly searchQuery = signal('');
  readonly liveMessage = signal('');

  readonly filteredRecipes = computed(() => {
    const byType = this.recipeService.recipesByType(this.typeFilter());
    const query = this.searchQuery().trim().toLowerCase();
    return query ? byType.filter((recipe) => recipe.title.toLowerCase().includes(query)) : byType;
  });

  readonly hasAnyRecipes = computed(() => this.recipeService.recipes().length > 0);

  private readonly pendingDelete = signal<PendingDelete>(null);

  readonly deleteDialogMessage = computed(() => {
    const pending = this.pendingDelete();
    return pending ? `Delete '${pending.title}'? This cannot be undone.` : '';
  });

  private readonly deleteDialog = viewChild.required(ConfirmDialog);

  onTypeFilterChange(type: RecipeType | 'all'): void {
    this.typeFilter.set(type);
    this.announceResultCount();
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.announceResultCount();
  }

  openRecipe(id: string): void {
    void this.router.navigate(['/recipes', id]);
  }

  requestDeleteRecipe(id: string): void {
    const recipe = this.recipeService.getById(id);
    if (!recipe) {
      return;
    }
    this.pendingDelete.set({ id, title: recipe.title });
    this.deleteDialog().open();
  }

  onDeleteConfirmed(): void {
    const pending = this.pendingDelete();
    if (!pending) {
      return;
    }
    this.recipeService.remove(pending.id);
    this.liveMessage.set(`Deleted '${pending.title}'.`);
    this.pendingDelete.set(null);
  }

  onDeleteCancelled(): void {
    this.pendingDelete.set(null);
  }

  private announceResultCount(): void {
    const count = this.filteredRecipes().length;
    this.liveMessage.set(`${count} recipe${count === 1 ? '' : 's'} found.`);
  }
}
