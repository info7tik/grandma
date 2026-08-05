import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { RecipeService } from '../../data/recipe.service';
import { INGREDIENT_UNIT_LABELS, RECIPE_TYPE_LABELS } from '../../models/recipe.model';

/** Read-only recipe view with edit/delete actions. */
@Component({
  selector: 'app-recipe-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ConfirmDialog],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.scss',
})
export class RecipeDetailPage {
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);

  /** Bound automatically from the `:id` route param. */
  readonly id = input.required<string>();

  readonly unitLabels = INGREDIENT_UNIT_LABELS;
  readonly typeLabels = RECIPE_TYPE_LABELS;

  readonly recipe = computed(() => this.recipeService.getById(this.id()));

  private readonly deleteDialog = viewChild.required<ConfirmDialog>(ConfirmDialog);

  constructor() {
    effect(() => {
      if (!this.recipeService.isLoading() && !this.recipe()) {
        void this.router.navigate(['/recipes']);
      }
    });
  }

  openDeleteDialog(): void {
    this.deleteDialog().open();
  }

  onDeleteConfirmed(): void {
    this.recipeService.remove(this.id());
    void this.router.navigate(['/recipes']);
  }
}
