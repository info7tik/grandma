import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StorageService } from '../storage.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  items = [
    {
      title: 'Recipes',
      subtitle: 'Consult your recipes',
      image: '/assets/menu/book.png',
      route: '/recipes'
    },
    {
      title: 'Add New Recipes',
      subtitle: 'Add recipes to your cookbook',
      image: '/assets/menu/list.png',
      route: '/newrecipe'
    },
    {
      title: 'Settings',
      subtitle: 'Import or export data',
      image: '/assets/menu/open-source.png',
      route: '/settings'
    }
  ];

  constructor(private storageService: StorageService) { }

  ngOnInit() {
    const defaultType = this.storageService.getDefaultRecipeType();
    this.items[0].route = "/recipes/" + defaultType;
  }
}