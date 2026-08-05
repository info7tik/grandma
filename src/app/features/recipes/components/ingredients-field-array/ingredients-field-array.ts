import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  INGREDIENT_UNITS,
  INGREDIENT_UNIT_LABELS,
  Ingredient,
  IngredientUnit,
} from '../../models/recipe.model';

export type IngredientFormGroup = FormGroup<{
  name: FormControl<string>;
  quantity: FormControl<number>;
  unit: FormControl<IngredientUnit>;
}>;

/** Builds one ingredient row, optionally prefilled; shared between this component and `recipe-form`. */
export function createIngredientFormGroup(
  formBuilder: NonNullableFormBuilder,
  initial?: Ingredient,
): IngredientFormGroup {
  return formBuilder.group({
    name: formBuilder.control(initial?.name ?? '', { validators: [Validators.required] }),
    quantity: formBuilder.control(initial?.quantity ?? 0, { validators: [Validators.min(0)] }),
    unit: formBuilder.control<IngredientUnit>(initial?.unit ?? 'none'),
  });
}

/** Encapsulates the ingredients `FormArray`: renders one fieldset row per ingredient. */
@Component({
  selector: 'app-ingredients-field-array',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './ingredients-field-array.html',
  styleUrl: './ingredients-field-array.scss',
})
export class IngredientsFieldArray {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly ingredients = input.required<FormArray<IngredientFormGroup>>();

  /** Emits a human-readable description of list changes for a shared aria-live region. */
  readonly announcement = output<string>();

  readonly units = INGREDIENT_UNITS;
  readonly unitLabels = INGREDIENT_UNIT_LABELS;

  addIngredient(): void {
    this.ingredients().push(createIngredientFormGroup(this.formBuilder));
    this.announcement.emit(`Ingredient ${this.ingredients().length} added.`);
  }

  removeIngredient(index: number): void {
    this.ingredients().removeAt(index);
    this.announcement.emit(`Ingredient ${index + 1} removed.`);
  }
}
