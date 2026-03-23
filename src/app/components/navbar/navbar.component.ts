import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap';
import { selectUser, selectIsAdmin } from '../../store/auth/auth.selectors';
import { selectItemCount } from '../../store/cart/cart.selectors';
import { logoutRequest } from '../../store/auth/auth.actions';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { CurrencySelectorComponent } from '../currency-selector/currency-selector.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [AsyncPipe, NgIf, RouterLink, RouterLinkActive, NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbDropdownItem, ThemeToggleComponent, CurrencySelectorComponent],
  template: `
    <nav class="navbar navbar-expand-lg sticky-top">
      <div class="container">
        <a class="navbar-brand" routerLink="/">ShopNG</a>
        <button
          class="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/products" routerLinkActive="active">Products</a>
            </li>
            <li class="nav-item" *ngIf="isAdmin$ | async">
              <a class="nav-link" routerLink="/admin" routerLinkActive="active">Admin</a>
            </li>
          </ul>
          <div class="d-flex align-items-center gap-2">
            <app-currency-selector></app-currency-selector>
            <app-theme-toggle></app-theme-toggle>
            <a routerLink="/cart" class="btn btn-primary btn-sm position-relative" style="border-radius:10px; padding: 0.4rem 0.85rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Cart
              <span
                *ngIf="(itemCount$ | async) as count"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style="font-size:0.65rem;"
              >
                {{ count }}
              </span>
            </a>
            <ng-container *ngIf="user$ | async as user; else guestLinks">
              <div ngbDropdown>
                <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" style="border-radius:10px;" ngbDropdownToggle>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {{ user.name }}
                </button>
                <div ngbDropdownMenu class="dropdown-menu-end" style="border-radius:12px; border: 1px solid var(--ec-card-border); box-shadow: 0 8px 24px rgba(0,0,0,0.1); padding: 0.5rem;">
                  <a ngbDropdownItem routerLink="/profile" style="border-radius:8px; font-size:0.9rem;">Profile</a>
                  <div class="dropdown-divider my-1"></div>
                  <button ngbDropdownItem class="text-danger" style="border-radius:8px; font-size:0.9rem;" (click)="logout()">Logout</button>
                </div>
              </div>
            </ng-container>
            <ng-template #guestLinks>
              <a routerLink="/login" class="btn btn-outline-secondary btn-sm" style="border-radius:10px;">Login</a>
              <a routerLink="/register" class="btn btn-primary btn-sm" style="border-radius:10px;">Register</a>
            </ng-template>
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  private store = inject(Store);
  user$ = this.store.select(selectUser);
  isAdmin$ = this.store.select(selectIsAdmin);
  itemCount$ = this.store.select(selectItemCount);

  logout(): void {
    this.store.dispatch(logoutRequest());
  }
}
