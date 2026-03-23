import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { loginRequest, clearError } from '../../store/auth/auth.actions';
import { selectAuthLoading, selectAuthError, selectUser } from '../../store/auth/auth.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, RouterLink, NgIf],
  template: `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-card__logo">Angular Store</div>
        <h1 class="auth-card__title">Welcome back</h1>
        <p class="auth-card__subtitle">Sign in to your account to continue shopping</p>

        <div class="rounded-3 mb-4 px-3 py-2"
             style="background:rgba(37,99,235,0.07);border:1px solid rgba(37,99,235,0.15);font-size:0.8rem;color:var(--ec-muted)">
          Demo: <strong>user@example.com</strong> / <strong>Password123!</strong>
          &nbsp;&nbsp;or&nbsp;&nbsp;
          <strong>admin@example.com</strong> / <strong>Admin123!</strong>
        </div>

        <div *ngIf="error$ | async as error" class="alert alert-danger py-2 small">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="mb-3">
            <label class="form-label fw-semibold small">Email address</label>
            <input type="email" class="form-control" formControlName="email" placeholder="you@example.com" />
            <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched" class="text-danger small mt-1">
              Valid email is required.
            </div>
          </div>
          <div class="mb-4">
            <label class="form-label fw-semibold small">Password</label>
            <input type="password" class="form-control" formControlName="password" placeholder="••••••••" />
            <div *ngIf="form.get('password')?.invalid && form.get('password')?.touched" class="text-danger small mt-1">
              Password is required.
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-100 btn-lg" [disabled]="loading$ | async">
            <span *ngIf="loading$ | async" class="spinner-border spinner-border-sm me-2"></span>
            Sign in
          </button>
        </form>

        <p class="text-center mt-4" style="font-size:0.875rem">
          <span style="color:var(--ec-muted)">Don't have an account?</span>
          <a routerLink="/register" class="fw-semibold ms-1" style="color:var(--ec-primary)">Create one</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    this.store.select(selectUser).pipe(takeUntilDestroyed()).subscribe((user) => {
      if (user) this.router.navigate(['/']);
    });
  }

  ngOnInit(): void {
    this.store.dispatch(clearError());
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.value;
    this.store.dispatch(loginRequest({ email: email!, password: password! }));
  }
}
