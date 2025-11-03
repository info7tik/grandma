import { Component } from '@angular/core';

@Component({
  selector: 'app-message',
  standalone: true,
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent {
  readonly NO_MESSAGE: string = 'no_message';
  errorMessage: string = this.NO_MESSAGE;
  successMessage: string = this.NO_MESSAGE;

  showError(message: string) {
    this.successMessage = this.NO_MESSAGE;
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = this.NO_MESSAGE, 3000);
  };

  showSuccess(message: string) {
    this.errorMessage = this.NO_MESSAGE;
    this.successMessage = message;
    setTimeout(() => this.successMessage = this.NO_MESSAGE, 3000);
  };
}
