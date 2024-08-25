import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../storage.service';
import { Ingredient, IngredientUnit } from '../types';

@Component({
    selector: 'app-ingredient-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ingredient-form.component.html',
    styleUrl: './ingredient-form.component.css'
})
export class IngredientFormComponent {
    private service = inject(StorageService);
    @ViewChild("dialog") dialog!: ElementRef;
    @Input() recipeId: string = "";
    private isNewIngredient = false;
    ingredientName = "";
    ingredientQuantity = 5;
    ingredientUnit: string = IngredientUnit[IngredientUnit.none];

    showNewForm() {
        this.isNewIngredient = true;
        this.dialog.nativeElement.show();
    }

    showUpdateForm(ingredient: Ingredient) {
        this.isNewIngredient = false;
        this.ingredientName = ingredient.name;
        this.ingredientQuantity = ingredient.quantity;
        this.ingredientUnit = ingredient.unit;
        this.dialog.nativeElement.show();
    }

    addNewIngredient() {
        const castedUnit = this.ingredientUnit as keyof typeof IngredientUnit;
        const ingredient: Ingredient = { name: this.ingredientName, quantity: this.ingredientQuantity, unit: IngredientUnit[castedUnit] };
        if (this.isNewIngredient) {
            this.service.addIngredient(this.recipeId, ingredient);
        } else {
            this.service.updateIngredient(this.recipeId, ingredient);
        }
        this.dialog.nativeElement.close();
    }

    cancel() {
        this.dialog.nativeElement.close();
    }
}
