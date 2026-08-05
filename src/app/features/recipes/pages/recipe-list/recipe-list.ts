import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { RecipeCard } from '../../components/recipe-card/recipe-card';
import { TypeFilter } from '../../components/type-filter/type-filter';
import { RecipeImportExportService } from '../../data/recipe-import-export.service';
import { RecipeService } from '../../data/recipe.service';
import { RecipeImportResult, RecipeType } from '../../models/recipe.model';

type PendingDelete = { kind: 'recipe'; id: string; title: string } | { kind: 'all' } | null;

/** Recipe list: type filter, search, and entry points to create/import/export/delete-all. */
@Component({
  selector: 'app-recipe-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RecipeCard, TypeFilter, ConfirmDialog],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.scss',
})
export class RecipeListPage {
  private readonly recipeService = inject(RecipeService);
  private readonly importExportService = inject(RecipeImportExportService);
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

  readonly deleteDialogHeading = computed(() =>
    this.pendingDelete()?.kind === 'all' ? 'Delete all recipes' : 'Delete recipe',
  );

  readonly deleteDialogMessage = computed(() => {
    const pending = this.pendingDelete();
    if (!pending) {
      return '';
    }
    return pending.kind === 'all'
      ? 'Delete all recipes? This cannot be undone.'
      : `Delete '${pending.title}'? This cannot be undone.`;
  });

  private readonly deleteDialog = viewChild.required(ConfirmDialog);
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

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
    this.pendingDelete.set({ kind: 'recipe', id, title: recipe.title });
    this.deleteDialog().open();
  }

  requestDeleteAll(): void {
    this.pendingDelete.set({ kind: 'all' });
    this.deleteDialog().open();
  }

  onDeleteConfirmed(): void {
    const pending = this.pendingDelete();
    if (!pending) {
      return;
    }
    if (pending.kind === 'all') {
      this.recipeService.removeAll();
      this.liveMessage.set('All recipes deleted.');
    } else {
      this.recipeService.remove(pending.id);
      this.liveMessage.set(`Deleted '${pending.title}'.`);
    }
    this.pendingDelete.set(null);
  }

  onDeleteCancelled(): void {
    this.pendingDelete.set(null);
  }

  triggerImport(): void {
    this.fileInput().nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    const result = await this.importExportService.importFromFile(file);
    this.liveMessage.set(this.describeImportResult(result));
  }

  async exportRecipes(): Promise<void> {
    try {
      await this.importExportService.exportToFile();
      this.liveMessage.set('Recipes exported to the Documents folder.');
    } catch {
      this.liveMessage.set('Export failed. Please check permissions and try again.');
    }
  }

  private announceResultCount(): void {
    const count = this.filteredRecipes().length;
    this.liveMessage.set(`${count} recipe${count === 1 ? '' : 's'} found.`);
  }

  private describeImportResult(result: RecipeImportResult): string {
    if (result.errors.length > 0 && result.addedCount === 0 && result.overwrittenCount === 0) {
      return `Import failed: ${result.errors[0]}`;
    }
    const parts = [
      `Imported ${result.addedCount} new recipe${result.addedCount === 1 ? '' : 's'}`,
      `updated ${result.overwrittenCount}`,
    ];
    if (result.skippedCount > 0) {
      parts.push(
        `skipped ${result.skippedCount} invalid entr${result.skippedCount === 1 ? 'y' : 'ies'}`,
      );
    }
    return `${parts.join(', ')}.`;
  }
}
