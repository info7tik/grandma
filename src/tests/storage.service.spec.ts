import { TestBed } from '@angular/core/testing';

import { StorageService } from '../app/storage.service';
import { RecipeMap, RecipeType } from '../app/types';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [StorageService]
    }).compileComponents();
    service = TestBed.inject(StorageService);
    service.clearData();
  });

  it('exportData() Test', () => {
    service.clearData();
    const recipeTitle = "Test Recipe";
    service.addRecipe(recipeTitle, RecipeType['main-course'], 30, 180);
    const data = service.exportData();
    expect(data.length).toBeGreaterThan(0);
    const recipes = JSON.parse(data) as RecipeMap;
    const identifiers = Object.keys(recipes);
    expect(identifiers.length).toBe(1);
    expect(recipes[identifiers[0]].title).toBe(recipeTitle);
  });

  it('importData() Test', () => {
    const recipeId = "test-recipe-id";
    const recipeTitle = "Test Recipe";
    const recipes = {
      [recipeId]: {
        id: recipeId, title: recipeTitle, type: RecipeType['main-course'],
        ingredients: [], steps: [], cooking: { time: 30, temperature: 180 }
      }
    };
    const jsonData = JSON.stringify(recipes);
    service.importData(jsonData);
    const importedRecipes = service.getAll();
    expect(Object.keys(importedRecipes).length).toBe(1);
    expect(importedRecipes[recipeId].title).toBe(recipeTitle);
  });
});
