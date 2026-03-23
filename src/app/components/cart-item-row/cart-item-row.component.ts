import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import type { Product } from '../../models/domain';

@Component({
  selector: 'app-cart-item-row',
  standalone: true,
  imports: [AsyncPipe, NgIf, FormsModule, CurrencyFormatPipe],
  template: `
    <div class="cart-item-row">
      <div class="d-flex gap-3 align-items-start">
        <img
          [src]="product.images[0] || 'https://placehold.co/88x88?text=No+Image'"
          [alt]="product.name"
          width="88"
          height="88"
          style="object-fit: cover; border-radius: 12px; flex-shrink: 0;"
        />
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <div class="fw-semibold" style="font-size: 0.95rem;">{{ product.name }}</div>
              <div class="d-flex gap-1 mt-1 flex-wrap">
                <span *ngIf="outOfStock" class="badge bg-danger" style="border-radius: 20px; font-size: 0.67rem;">Out of stock</span>
                <span *ngIf="!outOfStock && qty > availableStock" class="badge bg-warning text-dark" style="border-radius: 20px; font-size: 0.67rem;">
                  Only {{ availableStock }} available
                </span>
              </div>
              <small class="text-muted" style="font-size: 0.82rem;">{{ product.price | currencyFormat | async }} each</small>
            </div>
            <button
              class="btn btn-sm"
              style="border: 1px solid #fee2e2; border-radius: 8px; color: #ef4444; padding: 5px 7px; background: none; transition: all 0.15s ease;"
              (click)="remove.emit()"
              title="Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <div class="d-flex align-items-center gap-2">
              <label class="text-muted" style="font-size: 0.82rem; margin: 0;">Qty</label>
              <input
                type="number"
                class="form-control form-control-sm"
                style="width: 70px; border-radius: 10px; text-align: center; font-weight: 600;"
                [ngModel]="qty"
                (ngModelChange)="qtyChange.emit($event)"
                min="1"
                max="99"
              />
            </div>
            <strong style="color: var(--ec-primary); font-size: 1rem;">
              {{ product.price * qty | currencyFormat | async }}
            </strong>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CartItemRowComponent {
  @Input({ required: true }) product!: Product;
  @Input({ required: true }) qty!: number;
  @Input() outOfStock: boolean = false;
  @Input() availableStock: number = 0;
  @Output() qtyChange = new EventEmitter<number>();
  @Output() remove = new EventEmitter<void>();
}
