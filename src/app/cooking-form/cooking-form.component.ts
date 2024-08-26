import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../storage.service';

@Component({
    selector: 'app-cooking-form',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './cooking-form.component.html',
    styleUrl: './cooking-form.component.css'
})
export class CookingFormComponent {
    private service = inject(StorageService);
    private router = inject(Router);
    @ViewChild("dialog") dialog!: ElementRef;
    @Input() recipeId: string = "";
    @Output() updated = new EventEmitter<string>();
    cookingTime: number = 0;
    cookingTemperature: number = 0;

    show(cookingTime: number, cookingTemperature: number) {
        this.cookingTime = cookingTime;
        this.cookingTemperature = cookingTemperature;
        this.dialog.nativeElement.show();
    }

    updateCookingInformation() {
        const isUpdated = this.service.updateCookingInformation(this.recipeId, this.cookingTime, this.cookingTemperature);
        if (isUpdated) {
            this.updated.emit(this.recipeId);
        }
        this.dialog.nativeElement.close();
    }

    cancel() {
        this.dialog.nativeElement.close();
    }
}

