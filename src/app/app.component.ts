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

    ngOnInit(): void {
        this.defaultType = this.service.getDefaultRecipeType();
        this.router.navigate(["/recipes", this.defaultType]);
    }

    showNewRecipe() {
        this.isNewRecipeShown = true;
    }
}
