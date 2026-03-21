import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectCartItems, selectCartTotals } from '../../store/cart/cart.selectors';
import { selectFilteredProducts } from '../../store/products/products.selectors';
import { removeFromCart, setQty, recomputeTotals } from '../../store/cart/cart.actions';
import { loadProductsRequest } from '../../store/products/products.actions';
import { CartItemRowComponent } from '../../components/cart-item-row/cart-item-row.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import type { Product } from '../../models/domain';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, RouterLink, CartItemRowComponent, EmptyStateComponent, CurrencyFormatPipe],
  template: `
    <div class="container py-4">
      <h2 class="mb-4">Your Cart</h2>
      <app-empty-state
        *ngIf="(cartItems$ | async)?.length === 0"
        title="Your cart is empty"
        description="Add some products to get started."
        actionLabel="Browse Products"
        (action)="goShop()"
      ></app-empty-state>

      <div *ngIf="(cartItems$ | async)?.length as itemsLen">
        <div class="row">
          <div class="col-lg-8">
            <ng-container *ngFor="let item of cartItems$ | async">
              <ng-container *ngIf="getProduct(item.productId) as product">
                <app-cart-item-row
                  [product]="product"
                  [qty]="item.qty"
                  (qtyChange)="onQtyChange(item.productId, $event)"
                  (remove)="onRemove(item.productId)"
                ></app-cart-item-row>
              </ng-container>
            </ng-container>
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
                <a routerLink="/checkout" class="btn btn-primary w-100 mt-3">Proceed to Checkout</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CartComponent implements OnInit {
  private store = inject(Store);

  cartItems$ = this.store.select(selectCartItems);
  totals$ = this.store.select(selectCartTotals);
  products: Product[] = [];

  constructor() {
    combineLatest([
      this.store.select(selectCartItems),
      this.store.select(selectFilteredProducts),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([, products]) => {
        this.products = products;
        if (products.length > 0) {
          this.store.dispatch(recomputeTotals({ products }));
        }
      });
  }

  ngOnInit(): void {
    this.store.select(selectFilteredProducts).pipe(takeUntilDestroyed()).subscribe((products) => {
      if (products.length === 0) {
        this.store.dispatch(loadProductsRequest());
      }
    });
  }

  getProduct(productId: string): Product | undefined {
    return this.products.find((p) => p.id === productId);
  }

  onQtyChange(productId: string, qty: number): void {
    this.store.dispatch(setQty({ productId, qty }));
  }

  onRemove(productId: string): void {
    this.store.dispatch(removeFromCart({ productId }));
  }

  goShop(): void {
    window.location.href = '/products';
  }
}
