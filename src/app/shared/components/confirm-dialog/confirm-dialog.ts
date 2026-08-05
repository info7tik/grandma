import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * Reusable accessible confirmation dialog built on the native `<dialog>` element for its
 * built-in focus trap and Esc-to-dismiss behaviour. The invoking component is responsible for
 * calling `open()` and, once done, for returning focus to its own trigger element.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Confirm');
  readonly cancelLabel = input<string>('Cancel');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialogRef().nativeElement.showModal();
  }

  confirm(): void {
    this.dialogRef().nativeElement.close();
    this.confirmed.emit();
  }

  cancel(): void {
    this.dialogRef().nativeElement.close();
    this.cancelled.emit();
  }

  onDialogCancel(): void {
    // Fired when the user dismisses the dialog with Esc; treat it the same as Cancel.
    this.cancelled.emit();
  }
}
