import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { RECIPE_STEP_MAX_LENGTH } from '../../validation/recipe-validation';

export type StepFormGroup = FormGroup<{
  text: FormControl<string>;
}>;

/** Builds one step row, optionally prefilled; shared between this component and `recipe-form`. */
export function createStepFormGroup(
  formBuilder: NonNullableFormBuilder,
  initial?: string,
): StepFormGroup {
  return formBuilder.group({
    text: formBuilder.control(initial ?? '', {
      validators: [Validators.required, Validators.maxLength(RECIPE_STEP_MAX_LENGTH)],
    }),
  });
}

/** Encapsulates the steps `FormArray`: renders one text row per step, with add/remove. */
@Component({
  selector: 'app-steps-field-array',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './steps-field-array.html',
  styleUrl: './steps-field-array.scss',
})
export class StepsFieldArray {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly steps = input.required<FormArray<StepFormGroup>>();

  /** Emits a human-readable description of list changes for a shared aria-live region. */
  readonly announcement = output<string>();

  readonly stepMaxLength = RECIPE_STEP_MAX_LENGTH;

  addStep(): void {
    this.steps().push(createStepFormGroup(this.formBuilder));
    this.announcement.emit(`Step ${this.steps().length} added.`);
  }

  removeStep(index: number): void {
    this.steps().removeAt(index);
    this.announcement.emit(`Step ${index + 1} removed.`);
  }
}
