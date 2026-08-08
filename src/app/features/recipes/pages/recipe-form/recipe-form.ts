import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import {
  IngredientFormGroup,
  IngredientsFieldArray,
  createIngredientFormGroup,
} from '../../components/ingredients-field-array/ingredients-field-array';
import {
  StepFormGroup,
  StepsFieldArray,
  createStepFormGroup,
} from '../../components/steps-field-array/steps-field-array';
import { RecipeService } from '../../data/recipe.service';
import { RECIPE_TYPES, RECIPE_TYPE_LABELS, Recipe, RecipeType } from '../../models/recipe.model';
import { RECIPE_TITLE_MAX_LENGTH } from '../../validation/recipe-validation';

type RecipeForm = FormGroup<{
  title: FormControl<string>;
  type: FormControl<RecipeType>;
  ingredients: FormArray<IngredientFormGroup>;
  steps: FormArray<StepFormGroup>;
  cookingTemperature: FormControl<number | null>;
  cookingTime: FormControl<number | null>;
}>;

/** Reactive form for creating and editing a recipe, driven by an optional `id` route param. */
@Component({
  selector: 'app-recipe-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IngredientsFieldArray, StepsFieldArray],
  templateUrl: './recipe-form.html',
  styleUrl: './recipe-form.scss',
})
export class RecipeFormPage implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);

  /** Bound automatically from the `:id` route param on the edit route; absent on the create route. */
  readonly id = input<string>();

  readonly recipeTypes = RECIPE_TYPES;
  readonly typeLabels = RECIPE_TYPE_LABELS;
  readonly titleMaxLength = RECIPE_TITLE_MAX_LENGTH;

  readonly liveMessage = signal('');
  readonly isEditMode = computed(() => !!this.id());

  readonly form: RecipeForm = this.formBuilder.group({
    title: this.formBuilder.control('', [
      Validators.required,
      Validators.maxLength(RECIPE_TITLE_MAX_LENGTH),
    ]),
    type: this.formBuilder.control<RecipeType>('dessert', { validators: [Validators.required] }),
    ingredients: this.formBuilder.array<IngredientFormGroup>([]),
    steps: this.formBuilder.array<StepFormGroup>([]),
    cookingTemperature: this.formBuilder.control<number | null>(null),
    cookingTime: this.formBuilder.control<number | null>(null, [Validators.min(0)]),
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      this.form.controls.ingredients.push(createIngredientFormGroup(this.formBuilder));
      this.form.controls.steps.push(createStepFormGroup(this.formBuilder));
      return;
    }

    const existing = this.recipeService.getById(id);
    if (!existing) {
      void this.router.navigate(['/recipes']);
      return;
    }
    this.patchForm(existing);
  }

  onFieldArrayAnnouncement(message: string): void {
    this.liveMessage.set(message);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.liveMessage.set('The form has errors. Please review the highlighted fields.');
      return;
    }

    const value = this.form.getRawValue();
    const recipe: Omit<Recipe, 'id'> = {
      title: value.title,
      type: value.type,
      ingredients: value.ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      })),
      steps: value.steps.map((step) => step.text),
      cooking: {
        temperatureCelsius: value.cookingTemperature,
        timeMinutes: value.cookingTime,
      },
    };

    const id = this.id();
    if (id) {
      this.recipeService.update(id, recipe);
      void this.router.navigate(['/recipes', id]);
    } else {
      const created = this.recipeService.create(recipe);
      void this.router.navigate(['/recipes', created.id]);
    }
  }

  cancel(): void {
    const id = this.id();
    void this.router.navigate(id ? ['/recipes', id] : ['']);
  }

  private patchForm(recipe: Recipe): void {
    this.form.controls.title.setValue(recipe.title);
    this.form.controls.type.setValue(recipe.type);
    this.form.controls.cookingTemperature.setValue(recipe.cooking.temperatureCelsius);
    this.form.controls.cookingTime.setValue(recipe.cooking.timeMinutes);
    for (const ingredient of recipe.ingredients) {
      this.form.controls.ingredients.push(createIngredientFormGroup(this.formBuilder, ingredient));
    }
    for (const step of recipe.steps) {
      this.form.controls.steps.push(createStepFormGroup(this.formBuilder, step));
    }
  }
}
