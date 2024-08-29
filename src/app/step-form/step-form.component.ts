import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../storage.service';

@Component({
    selector: 'app-step-form',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './step-form.component.html',
    styleUrl: './step-form.component.css'
})
export class StepFormComponent {
    private service = inject(StorageService);
    @ViewChild("dialog") dialog!: ElementRef;
    @Input() recipeId: string = "";
    stepNumber: number = 1;
    stepIndex: number = 0;
    description: string = "";
    private isNewStep = false;

    private resetFields() {
        this.stepNumber = 1;
        this.description = "";
    }

    showNewForm() {
        this.isNewStep = true;
        this.resetFields();
        this.dialog.nativeElement.show();
    }

    showUpdateForm(stepNumber: number, description: string) {
        this.isNewStep = false;
        this.stepNumber = stepNumber;
        this.stepIndex = stepNumber - 1;
        this.description = description;
        this.dialog.nativeElement.show();
    }

    addNewStep() {
        if (this.isNewStep) {
            this.service.addStep(this.recipeId, this.stepNumber, this.description);
        } else {
            this.service.updateStep(this.recipeId, this.stepIndex, this.stepNumber, this.description);
        }
        this.dialog.nativeElement.close();
    }

    cancel() {
        this.dialog.nativeElement.close();
    }
}
