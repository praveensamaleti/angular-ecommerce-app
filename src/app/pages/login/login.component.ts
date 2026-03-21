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
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-5">
          <div class="card shadow-sm">
            <div class="card-body p-4">
              <h3 class="card-title mb-4">Sign In</h3>
              <div *ngIf="error$ | async as error" class="alert alert-danger">{{ error }}</div>
              <form [formGroup]="form" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" formControlName="email" placeholder="you@example.com" />
                  <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched" class="text-danger small mt-1">
                    Valid email is required.
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Password</label>
                  <input type="password" class="form-control" formControlName="password" placeholder="Password" />
                  <div *ngIf="form.get('password')?.invalid && form.get('password')?.touched" class="text-danger small mt-1">
                    Password is required.
                  </div>
                </div>
                <button type="submit" class="btn btn-primary w-100" [disabled]="loading$ | async">
                  <span *ngIf="loading$ | async" class="spinner-border spinner-border-sm me-2"></span>
                  Sign In
                </button>
              </form>
              <p class="mt-3 text-center text-muted">
                Don't have an account? <a routerLink="/register">Register</a>
              </p>
            </div>
          </div>
        </div>
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
