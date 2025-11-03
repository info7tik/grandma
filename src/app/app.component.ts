import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StorageService } from './storage.service';
import { RecipeType } from './types';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
    title = 'GrandMa';
    service = inject(StorageService);
    router = inject(Router);
    isNewRecipeShown = false;
    newRecipeTitle = "";
    defaultType: RecipeType = RecipeType['main-course'];
    private saveButtonIdleColor = 'grey';
    private saveButtonBusyColor = 'orange';
    saveButtonColor = this.saveButtonIdleColor;
    saveMessage = "";

    saveOnLocalStorage() {
        this.saveButtonColor = this.saveButtonBusyColor;
        this.service.saveOnLocalStorage()
            .then(() => {
                this.saveButtonColor = this.saveButtonIdleColor;
                this.saveMessage = "recipes saved to Documents";
            })
            .catch((error) => this.saveMessage = error);
    }
}
