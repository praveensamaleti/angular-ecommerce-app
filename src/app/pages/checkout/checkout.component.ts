import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AsyncPipe, NgIf } from '@angular/common';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectCartItems, selectCartTotals } from '../../store/cart/cart.selectors';
import { selectFilteredProducts } from '../../store/products/products.selectors';
import { recomputeTotals } from '../../store/cart/cart.actions';
import { placeOrderRequest } from '../../store/orders/orders.actions';
import { selectOrdersLoading, selectOrdersError } from '../../store/orders/orders.selectors';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, NgIf, CurrencyFormatPipe],
  template: `
    <div class="container py-4">
      <h2 class="mb-4">Checkout</h2>
      <div *ngIf="error$ | async as error" class="alert alert-danger">{{ error }}</div>
      <div class="row g-4">
        <div class="col-lg-8">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <!-- Shipping -->
            <div class="card mb-3">
              <div class="card-body">
                <h5 class="card-title">Shipping Address</h5>
                <div formGroupName="shipping" class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-control" formControlName="fullName" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" formControlName="email" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-control" formControlName="phone" />
                  </div>
                  <div class="col-12">
                    <label class="form-label">Address</label>
                    <input type="text" class="form-control" formControlName="address1" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">City</label>
                    <input type="text" class="form-control" formControlName="city" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">State</label>
                    <input type="text" class="form-control" formControlName="state" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">ZIP</label>
                    <input type="text" class="form-control" formControlName="zip" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Country</label>
                    <input type="text" class="form-control" formControlName="country" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment -->
            <div class="card mb-3">
              <div class="card-body">
                <h5 class="card-title">Payment</h5>
                <div formGroupName="payment" class="row g-3">
                  <div class="col-12">
                    <label class="form-label">Card Name</label>
                    <input type="text" class="form-control" formControlName="cardName" />
                  </div>
                  <div class="col-12">
                    <label class="form-label">Card Number</label>
                    <input type="text" class="form-control" formControlName="cardNumber" placeholder="•••• •••• •••• ••••" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Expiry (MM/YY)</label>
                    <input type="text" class="form-control" formControlName="exp" placeholder="MM/YY" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">CVC</label>
                    <input type="text" class="form-control" formControlName="cvc" placeholder="•••" />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-100" [disabled]="loading$ | async">
              <span *ngIf="loading$ | async" class="spinner-border spinner-border-sm me-2"></span>
              Place Order
            </button>
          </form>
        </div>

        <div class="col-lg-4">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Order Summary</h5>
              <div *ngIf="totals$ | async as totals">
                <div class="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>{{ totals.subtotal | currencyFormat | async }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2 text-success">
                  <span>Discount (10%)</span>
                  <span>-{{ totals.discount | currencyFormat | async }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span>Tax (8%)</span>
                  <span>{{ totals.tax | currencyFormat | async }}</span>
                </div>
                <hr />
                <div class="d-flex justify-content-between fw-bold fs-5">
                  <span>Total</span>
                  <span>{{ totals.total | currencyFormat | async }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CheckoutComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);

  loading$ = this.store.select(selectOrdersLoading);
  error$ = this.store.select(selectOrdersError);
  totals$ = this.store.select(selectCartTotals);

  form = this.fb.group({
    shipping: this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address1: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
      country: ['', Validators.required],
    }),
    payment: this.fb.group({
      cardName: ['', Validators.required],
      cardNumber: ['', Validators.required],
      exp: ['', Validators.required],
      cvc: ['', Validators.required],
    }),
  });

  constructor() {
    combineLatest([
      this.store.select(selectCartItems),
      this.store.select(selectFilteredProducts),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([, products]) => {
        if (products.length > 0) {
          this.store.dispatch(recomputeTotals({ products }));
        }
      });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { shipping, payment } = this.form.value as any;
    this.store.select(selectCartItems).pipe(takeUntilDestroyed()).subscribe((items) => {
      this.store.dispatch(
        placeOrderRequest({
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          shipping,
          billing: shipping,
          payment,
        })
      );
    });
  }
}
