import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { selectUser, selectIsAdmin } from '../../store/auth/auth.selectors';
import { selectItemCount } from '../../store/cart/cart.selectors';
import { logoutRequest } from '../../store/auth/auth.actions';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { CurrencySelectorComponent } from '../currency-selector/currency-selector.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [AsyncPipe, NgIf, RouterLink, RouterLinkActive, ThemeToggleComponent, CurrencySelectorComponent],
  template: `
    <nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom sticky-top">
      <div class="container">
        <a class="navbar-brand fw-bold" routerLink="/">🛍 ShopNG</a>
        <button
          class="navbar-toggler"
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
            <a routerLink="/cart" class="btn btn-outline-primary btn-sm position-relative">
              🛒 Cart
              <span
                *ngIf="(itemCount$ | async) as count"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              >
                {{ count }}
              </span>
            </a>
            <ng-container *ngIf="user$ | async as user; else guestLinks">
              <div class="dropdown">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                  {{ user.name }}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" routerLink="/profile">Profile</a></li>
                  <li><hr class="dropdown-divider" /></li>
                  <li><button class="dropdown-item text-danger" (click)="logout()">Logout</button></li>
                </ul>
              </div>
            </ng-container>
            <ng-template #guestLinks>
              <a routerLink="/login" class="btn btn-outline-secondary btn-sm">Login</a>
              <a routerLink="/register" class="btn btn-primary btn-sm">Register</a>
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
