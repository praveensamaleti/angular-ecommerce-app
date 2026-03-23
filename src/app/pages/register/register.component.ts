import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { registerRequest, clearError } from '../../store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../store/auth/auth.selectors';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, RouterLink, NgIf],
  template: `
    <div class="auth-wrap">
      <div class="auth-card" style="max-width:520px">
        <div class="auth-card__logo">Angular Store</div>
        <h1 class="auth-card__title">Create an account</h1>
        <p class="auth-card__subtitle">Join to track orders and checkout faster</p>

        <div *ngIf="error$ | async as error" class="alert alert-danger py-2 small">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="mb-3">
            <label class="form-label fw-semibold small">Full name</label>
            <input type="text" class="form-control" formControlName="name" placeholder="Your name" />
            <div *ngIf="form.get('name')?.invalid && form.get('name')?.touched" class="text-danger small mt-1">
              Name is required.
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold small">Email address</label>
            <input type="email" class="form-control" formControlName="email" placeholder="you@example.com" />
            <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched" class="text-danger small mt-1">
              Valid email is required.
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold small">Password</label>
            <input type="password" class="form-control" formControlName="password" placeholder="Min. 6 characters" />
            <div *ngIf="form.get('password')?.invalid && form.get('password')?.touched" class="text-danger small mt-1">
              Password must be at least 6 characters.
            </div>
          </div>
          <div class="mb-4">
            <label class="form-label fw-semibold small">Confirm password</label>
            <input type="password" class="form-control" formControlName="confirmPassword" placeholder="Repeat password" />
            <div *ngIf="form.errors?.['passwordsMismatch'] && form.get('confirmPassword')?.touched" class="text-danger small mt-1">
              Passwords do not match.
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-100 btn-lg" [disabled]="loading$ | async">
            <span *ngIf="loading$ | async" class="spinner-border spinner-border-sm me-2"></span>
            Create account
          </button>
        </form>

        <p class="text-center mt-4" style="font-size:0.875rem">
          <span style="color:var(--ec-muted)">Already have an account?</span>
          <a routerLink="/login" class="fw-semibold ms-1" style="color:var(--ec-primary)">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  form = this.fb.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch }
  );

  ngOnInit(): void {
    this.store.dispatch(clearError());
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.value;
    this.store.dispatch(registerRequest({ name: name!, email: email!, password: password! }));
  }
}
