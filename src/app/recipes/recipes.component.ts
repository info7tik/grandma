import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.css'
})
export class RecipesComponent {
    private route = inject(ActivatedRoute);
    type = "";

    ngOnInit() {
      this.route.params.subscribe(params => {
         this.type = params["type"];
      });
    }
}
