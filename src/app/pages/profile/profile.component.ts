import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectUser } from '../../store/auth/auth.selectors';
import { selectOrders, selectOrdersLoading } from '../../store/orders/orders.selectors';
import { updateProfile } from '../../store/auth/auth.actions';
import { loadOrdersRequest } from '../../store/orders/orders.actions';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, NgIf, NgFor, CurrencyFormatPipe],
  template: `
    <div class="container py-4">
      <h2 class="mb-4">My Profile</h2>
      <div class="row g-4">
        <!-- Profile Form -->
        <div class="col-md-5">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Account Details</h5>
              <form [formGroup]="form" (ngSubmit)="onSave()">
                <div class="mb-3">
                  <label class="form-label">Name</label>
                  <input type="text" class="form-control" formControlName="name" />
                </div>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" formControlName="email" />
                </div>
                <div class="mb-3">
                  <label class="form-label">Role</label>
                  <input type="text" class="form-control" [value]="(user$ | async)?.role" readonly />
                </div>
                <button type="submit" class="btn btn-primary w-100">Save Changes</button>
              </form>
            </div>
          </div>
        </div>

        <!-- Orders -->
        <div class="col-md-7">
          <h5 class="mb-3">Order History</h5>
          <div *ngIf="loading$ | async" class="text-center py-3">
            <div class="spinner-border text-primary"></div>
          </div>
          <div *ngIf="!(loading$ | async) && (orders$ | async)?.length === 0" class="text-muted">
            No orders yet.
          </div>
          <div *ngFor="let order of orders$ | async" class="card mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <small class="text-muted">Order #{{ order.id }}</small>
                  <p class="mb-0">{{ order.items.length }} item(s)</p>
                </div>
                <div class="text-end">
                  <span class="badge" [class.bg-warning]="order.status === 'pending'" [class.bg-success]="order.status === 'shipped'">
                    {{ order.status }}
                  </span>
                  <p class="mb-0 fw-bold">{{ order.total | currencyFormat | async }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);

  user$ = this.store.select(selectUser);
  orders$ = this.store.select(selectOrders);
  loading$ = this.store.select(selectOrdersLoading);

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.store.select(selectUser).pipe(takeUntilDestroyed()).subscribe((user) => {
      if (user) {
        this.form.patchValue({ name: user.name, email: user.email });
      }
    });
  }

  ngOnInit(): void {
    this.store.select(selectUser).pipe(takeUntilDestroyed()).subscribe((user) => {
      if (user) {
        this.store.dispatch(loadOrdersRequest({ userId: user.id }));
      }
    });
  }

  onSave(): void {
    if (this.form.invalid) return;
    const { name, email } = this.form.value;
    this.store.dispatch(updateProfile({ name: name!, email: email! }));
  }
}
