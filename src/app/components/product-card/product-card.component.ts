import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import type { Product } from '../../models/domain';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [AsyncPipe, RouterLink, CurrencyFormatPipe, RatingStarsComponent],
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
          <button class="btn btn-primary btn-sm flex-grow-1" (click)="addToCart.emit(product)" [disabled]="product.stock === 0">
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
  @Output() addToCart = new EventEmitter<Product>();
  @Output() quickView = new EventEmitter<Product>();
}
