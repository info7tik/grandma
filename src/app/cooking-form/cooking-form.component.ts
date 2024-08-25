import { Component, ElementRef, Input, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
    @ViewChild("dialog") dialog!: ElementRef;
    @Input() recipeId: string = "";
    cookingTime: number = 0;
    cookingTemperature: number = 0;

    show(cookingTime: number, cookingTemperature: number) {
        this.cookingTime = cookingTime;
        this.cookingTemperature = cookingTemperature;
        this.dialog.nativeElement.show();
    }

    updateCookingInformation() {
        //TODO
        this.dialog.nativeElement.close();
    }

    cancel() {
        this.dialog.nativeElement.close();
    }
}

