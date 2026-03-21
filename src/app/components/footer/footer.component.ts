import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="bg-body-tertiary border-top mt-auto py-4">
      <div class="container text-center text-muted">
        <p class="mb-1">&copy; {{ year }} E-Commerce Store. All rights reserved.</p>
        <small>Built with Angular 18 + NgRx</small>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
