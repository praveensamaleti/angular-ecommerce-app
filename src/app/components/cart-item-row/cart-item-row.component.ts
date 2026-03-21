import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import type { Product } from '../../models/domain';

@Component({
  selector: 'app-cart-item-row',
  standalone: true,
  imports: [AsyncPipe, FormsModule, CurrencyFormatPipe],
  template: `
    <div class="d-flex align-items-center gap-3 py-3 border-bottom">
      <img
        [src]="product.images[0] || 'https://placehold.co/80x80?text=No+Image'"
        [alt]="product.name"
        width="80"
        height="80"
        style="object-fit: cover; border-radius: 8px;"
      />
      <div class="flex-grow-1">
        <h6 class="mb-0">{{ product.name }}</h6>
        <small class="text-muted">{{ product.price | currencyFormat | async }} each</small>
      </div>
      <div class="d-flex align-items-center gap-2">
        <input
          type="number"
          class="form-control form-control-sm"
          style="width: 70px;"
          [ngModel]="qty"
          (ngModelChange)="qtyChange.emit($event)"
          min="1"
          max="99"
        />
        <button class="btn btn-outline-danger btn-sm" (click)="remove.emit()">✕</button>
      </div>
      <div class="text-end" style="min-width: 80px;">
        <strong>{{ product.price * qty | currencyFormat | async }}</strong>
      </div>
    </div>
  `,
})
export class CartItemRowComponent {
  @Input({ required: true }) product!: Product;
  @Input({ required: true }) qty!: number;
  @Output() qtyChange = new EventEmitter<number>();
  @Output() remove = new EventEmitter<void>();
}
