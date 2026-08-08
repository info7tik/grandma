import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { RecipeImportExportService } from '../../../recipes/data/recipe-import-export.service';
import { RecipeService } from '../../../recipes/data/recipe.service';
import { RecipeImportResult } from '../../../recipes/models/recipe.model';

/** Landing page: entry points to explore, create, export, import and delete-all recipes. */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ConfirmDialog],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  private readonly recipeService = inject(RecipeService);
  private readonly importExportService = inject(RecipeImportExportService);

  readonly hasAnyRecipes = computed(() => this.recipeService.recipes().length > 0);
  readonly liveMessage = signal('');

  private readonly deleteAllDialog = viewChild.required(ConfirmDialog);
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

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

  requestDeleteAll(): void {
    this.deleteAllDialog().open();
  }

  onDeleteAllConfirmed(): void {
    this.recipeService.removeAll();
    this.liveMessage.set('All recipes deleted.');
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
