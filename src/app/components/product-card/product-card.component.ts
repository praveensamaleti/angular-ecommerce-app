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
      <a [routerLink]="['/products', product.id]">
        <img
          [src]="product.images[0] || 'https://placehold.co/400x300?text=No+Image'"
          class="card-img-top"
          [alt]="product.name"
          style="height: 220px; object-fit: cover;"
        />
      </a>
      <div class="card-body d-flex flex-column">
        <span class="badge bg-secondary mb-1">{{ product.category }}</span>
        <h6 class="card-title mb-1">
          <a [routerLink]="['/products', product.id]" class="text-decoration-none">{{ product.name }}</a>
        </h6>
        <app-rating-stars [rating]="product.rating" [count]="product.ratingCount" class="mb-2"></app-rating-stars>
        <p class="fw-bold mb-2">{{ product.price | currencyFormat | async }}</p>
        <div class="mt-auto d-flex gap-2">
          <!-- Qty counter when item is in cart -->
          <div *ngIf="cartQty > 0" class="d-flex align-items-center gap-1 flex-grow-1" role="group" [attr.aria-label]="'Quantity for ' + product.name">
            <button
              class="btn btn-outline-secondary btn-sm"
              (click)="onDecrement()"
              [attr.aria-label]="'Decrease quantity for ' + product.name"
            >−</button>
            <span class="px-2 fw-semibold">{{ cartQty }}</span>
            <button
              class="btn btn-outline-secondary btn-sm"
              (click)="qtyChange.emit({ product: product, qty: cartQty + 1 })"
              [attr.aria-label]="'Increase quantity for ' + product.name"
            >+</button>
          </div>
          <!-- Add to Cart button when item not in cart -->
          <button
            *ngIf="cartQty === 0"
            class="btn btn-primary btn-sm flex-grow-1"
            (click)="addToCart.emit(product)"
            [disabled]="product.stock === 0"
          >
            {{ product.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
          </button>
          <button class="btn btn-outline-secondary btn-sm" (click)="quickView.emit(product)" title="Quick view">👁</button>
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
