import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer-dark mt-auto">
      <div class="container">
        <div class="row gy-3 align-items-center">
          <div class="col-md-6">
            <div class="footer-brand">ShopNG</div>
            <div style="font-size: 0.82rem; margin-top: 4px;">
              Modern e-commerce, powered by Angular & NgRx.
            </div>
          </div>
          <div class="col-md-6 text-md-end">
            <div style="font-size: 0.82rem;">Built with Angular 18 · NgRx · Bootstrap 5</div>
            <div style="font-size: 0.78rem; color: #475569; margin-top: 4px;">
              &copy; {{ year }} ShopNG
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
