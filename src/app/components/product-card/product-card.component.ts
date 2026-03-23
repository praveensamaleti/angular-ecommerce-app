import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import type { Product } from '../../models/domain';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [AsyncPipe, NgIf, RouterLink, CurrencyFormatPipe, RatingStarsComponent],
  template: `
    <div class="card h-100 shadow-sm">
      <!-- Image with zoom + category overlay -->
      <a [routerLink]="['/products', product.id]" class="product-img-wrap">
        <img
          [src]="product.images[0] || 'https://placehold.co/400x300?text=No+Image'"
          class="card-img-top"
          [alt]="product.name"
          style="height: 210px; object-fit: cover; display: block; width: 100%;"
        />
        <span *ngIf="product.category" class="product-category-tag">{{ product.category }}</span>
        <span
          *ngIf="product.stock === 0"
          class="badge bg-danger"
          style="position: absolute; top: 10px; right: 10px; border-radius: 20px; font-size: 0.67rem;"
        >Out of stock</span>
      </a>

      <div class="card-body d-flex flex-column pt-3">
        <h6 class="card-title mb-1" style="font-size: 0.92rem; font-weight: 600; line-height: 1.35;">
          <a [routerLink]="['/products', product.id]" class="text-decoration-none text-body">{{ product.name }}</a>
        </h6>
        <div class="d-flex align-items-center justify-content-between mt-1 mb-auto">
          <p class="fw-bold mb-0" style="color: var(--ec-primary); font-size: 1rem;">
            {{ product.price | currencyFormat | async }}
          </p>
          <app-rating-stars [rating]="product.rating" [count]="product.ratingCount"></app-rating-stars>
        </div>

        <div class="mt-3 d-flex gap-2">
          <!-- Qty counter when item is in cart -->
          <div *ngIf="cartQty > 0" class="d-flex align-items-center gap-1 flex-grow-1" role="group" [attr.aria-label]="'Quantity for ' + product.name">
            <button
              class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
              style="border-radius: 8px; width: 30px; height: 30px; padding: 0;"
              (click)="onDecrement()"
              [attr.aria-label]="'Decrease quantity for ' + product.name"
            >−</button>
            <span class="fw-bold" style="min-width: 24px; text-align: center; font-size: 0.95rem;">{{ cartQty }}</span>
            <button
              class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
              style="border-radius: 8px; width: 30px; height: 30px; padding: 0;"
              (click)="qtyChange.emit({ product: product, qty: cartQty + 1 })"
              [attr.aria-label]="'Increase quantity for ' + product.name"
            >+</button>
          </div>
          <!-- Add to Cart button -->
          <button
            *ngIf="cartQty === 0"
            class="btn btn-primary btn-sm flex-grow-1"
            (click)="addToCart.emit(product)"
            [disabled]="product.stock === 0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {{ product.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
          </button>
          <button
            class="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center"
            style="border-radius: 8px; min-width: 34px; padding: 0.25rem 0.5rem;"
            (click)="quickView.emit(product)"
            title="Quick view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() cartQty: number = 0;
  @Output() addToCart = new EventEmitter<Product>();
  @Output() removeFromCart = new EventEmitter<Product>();
  @Output() qtyChange = new EventEmitter<{ product: Product; qty: number }>();
  @Output() quickView = new EventEmitter<Product>();

  onDecrement(): void {
    if (this.cartQty <= 1) {
      this.removeFromCart.emit(this.product);
    } else {
      this.qtyChange.emit({ product: this.product, qty: this.cartQty - 1 });
    }
  }
}
