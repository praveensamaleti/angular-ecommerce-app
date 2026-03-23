import { Component, OnInit, inject, DestroyRef } from '@angular/core';
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
import type { CartItem, Product } from '../../models/domain';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, RouterLink, CartItemRowComponent, EmptyStateComponent, CurrencyFormatPipe],
  template: `
    <div class="container py-4">
      <h2 class="mb-4 page-title">Your Cart</h2>
      <app-empty-state
        *ngIf="(cartItems$ | async)?.length === 0"
        title="Your cart is empty"
        description="Add some products to get started."
        actionLabel="Browse Products"
        (action)="goShop()"
      ></app-empty-state>

      <div *ngIf="(cartItems$ | async)?.length as itemsLen">
        <div
          *ngIf="hasOutOfStockItems"
          class="alert alert-warning mb-3"
          style="border-radius: 12px; font-size: 0.9rem;"
          role="alert"
        >
          Some items in your cart are out of stock or have insufficient inventory. Please update quantities before checkout.
        </div>
        <div class="row g-4">
          <div class="col-lg-8">
            <div class="cart-items-panel">
              <ng-container *ngFor="let item of cartItems$ | async">
                <ng-container *ngIf="getProduct(item.productId) as product">
                  <app-cart-item-row
                    [product]="product"
                    [qty]="item.qty"
                    [outOfStock]="product.stock === 0"
                    [availableStock]="product.stock"
                    (qtyChange)="onQtyChange(item.productId, $event)"
                    (remove)="onRemove(item.productId)"
                  ></app-cart-item-row>
                </ng-container>
              </ng-container>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="card order-summary-card shadow-sm">
              <div class="card-body p-4">
                <h5 class="fw-bold mb-4" style="letter-spacing: -0.02em;">Order Summary</h5>
                <div *ngIf="totals$ | async as totals">
                  <div class="d-flex justify-content-between py-2 border-bottom" style="border-color: var(--ec-card-border) !important;">
                    <span class="text-muted" style="font-size: 0.9rem;">Subtotal</span>
                    <span class="fw-semibold">{{ totals.subtotal | currencyFormat | async }}</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom" style="border-color: var(--ec-card-border) !important; color: #10b981;">
                    <span style="font-size: 0.9rem;">Discount (10%)</span>
                    <span class="fw-semibold">-{{ totals.discount | currencyFormat | async }}</span>
                  </div>
                  <div class="d-flex justify-content-between py-2" style="border-color: var(--ec-card-border) !important;">
                    <span class="text-muted" style="font-size: 0.9rem;">Tax (8%)</span>
                    <span class="fw-semibold">{{ totals.tax | currencyFormat | async }}</span>
                  </div>
                  <hr style="border-color: var(--ec-card-border); margin: 0.75rem 0;" />
                  <div class="d-flex justify-content-between align-items-center mb-4">
                    <span class="fw-bold" style="font-size: 1rem;">Total</span>
                    <span class="fw-bold" style="font-size: 1.3rem; color: var(--ec-primary);">
                      {{ totals.total | currencyFormat | async }}
                    </span>
                  </div>
                </div>
                <a
                  [routerLink]="hasOutOfStockItems ? null : '/checkout'"
                  class="btn btn-primary w-100 mb-2"
                  [class.disabled]="hasOutOfStockItems"
                  [attr.aria-disabled]="hasOutOfStockItems ? 'true' : null"
                  [attr.tabindex]="hasOutOfStockItems ? -1 : null"
                >Proceed to Checkout</a>
                <a routerLink="/products" class="btn btn-outline-primary w-100">Continue Shopping</a>
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
  private destroyRef = inject(DestroyRef);

  cartItems$ = this.store.select(selectCartItems);
  totals$ = this.store.select(selectCartTotals);
  products: Product[] = [];
  cartItems: CartItem[] = [];

  get hasOutOfStockItems(): boolean {
    return this.cartItems.some((item) => {
      const product = this.getProduct(item.productId);
      return product !== undefined && (product.stock === 0 || product.stock < item.qty);
    });
  }

  constructor() {
    combineLatest([
      this.store.select(selectCartItems),
      this.store.select(selectFilteredProducts),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([cartItems, products]) => {
        this.cartItems = cartItems;
        this.products = products;
        if (products.length > 0) {
          this.store.dispatch(recomputeTotals({ products }));
        }
      });
  }

  ngOnInit(): void {
    this.store.select(selectFilteredProducts).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((products) => {
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
