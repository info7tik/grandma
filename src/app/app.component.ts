import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StorageService } from './storage.service';
import { RecipeType } from './types';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
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

    ngOnInit(): void {
        this.defaultType = this.service.getDefaultRecipeType();
        this.router.navigate(["/recipes", this.defaultType]);
    }

    showNewRecipe() {
        this.isNewRecipeShown = true;
    }

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
