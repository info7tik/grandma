import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { RECIPE_TYPE_LABELS, Recipe } from '../../models/recipe.model';

/** Presentational card summarizing a recipe in the list. */
@Component({
  selector: 'app-recipe-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.scss',
})
export class RecipeCard {
  readonly recipe = input.required<Recipe>();

  readonly open = output<string>();
  readonly delete = output<string>();

  readonly typeLabel = computed(() => RECIPE_TYPE_LABELS[this.recipe().type]);

  readonly accessibleName = computed(() => `${this.recipe().title}, ${this.typeLabel()}`);

  onOpen(): void {
    this.open.emit(this.recipe().id);
  }

  onDelete(): void {
    this.delete.emit(this.recipe().id);
  }
}
