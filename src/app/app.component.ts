import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { selectTheme } from './store/theme/theme.selectors';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="d-flex flex-column min-vh-100">
      <app-navbar></app-navbar>
      <main class="flex-grow-1">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
})
export class AppComponent implements OnInit {
  private store = inject(Store);

  ngOnInit(): void {
    this.store.select(selectTheme).subscribe((theme) => {
      document.documentElement.setAttribute('data-bs-theme', theme);
    });
  }
}
