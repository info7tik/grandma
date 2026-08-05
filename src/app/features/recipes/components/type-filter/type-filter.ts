import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { RECIPE_TYPE_LABELS, RECIPE_TYPES, RecipeType } from '../../models/recipe.model';

interface TypeFilterOption {
  value: RecipeType | 'all';
  label: string;
}

/** Segmented tab-like control for filtering the recipe list by type. */
@Component({
  selector: 'app-type-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './type-filter.html',
  styleUrl: './type-filter.scss',
})
export class TypeFilter {
  readonly selected = input.required<RecipeType | 'all'>();
  readonly selectedChange = output<RecipeType | 'all'>();

  readonly options: TypeFilterOption[] = [
    { value: 'all', label: 'All' },
    ...RECIPE_TYPES.map((type) => ({ value: type, label: RECIPE_TYPE_LABELS[type] })),
  ];

  readonly selectedIndex = computed(() =>
    this.options.findIndex((option) => option.value === this.selected()),
  );

  select(value: RecipeType | 'all'): void {
    if (value !== this.selected()) {
      this.selectedChange.emit(value);
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % this.options.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + this.options.length) % this.options.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = this.options.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const nextOption = this.options[nextIndex];
      this.select(nextOption.value);
      const tabs = (
        event.currentTarget as HTMLElement
      ).parentElement?.querySelectorAll<HTMLElement>('[role="tab"]');
      tabs?.item(nextIndex)?.focus();
    }
  }
}
