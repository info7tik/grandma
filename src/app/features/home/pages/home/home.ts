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

type FeedbackKind = 'success' | 'error';

interface Feedback {
  kind: FeedbackKind;
  message: string;
}

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
  readonly feedback = signal<Feedback | null>(null);

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
    this.feedback.set(this.describeImportResult(result));
  }

  async exportRecipes(): Promise<void> {
    try {
      await this.importExportService.exportToFile();
      this.feedback.set({ kind: 'success', message: 'Recipes exported to the Documents folder.' });
    } catch {
      this.feedback.set({
        kind: 'error',
        message: 'Export failed. Please check permissions and try again.',
      });
    }
  }

  requestDeleteAll(): void {
    this.deleteAllDialog().open();
  }

  onDeleteAllConfirmed(): void {
    this.recipeService.removeAll();
    this.feedback.set({ kind: 'success', message: 'All recipes deleted.' });
  }

  private describeImportResult(result: RecipeImportResult): Feedback {
    if (result.errors.length > 0 && result.addedCount === 0 && result.overwrittenCount === 0) {
      return { kind: 'error', message: `Import failed: ${result.errors[0]}` };
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
    return { kind: 'success', message: `${parts.join(', ')}.` };
  }
}
