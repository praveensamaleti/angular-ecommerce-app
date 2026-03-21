import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import type { Product } from '../../models/domain';

@Component({
  selector: 'app-quick-view-modal',
  standalone: true,
  imports: [AsyncPipe, FormsModule, CurrencyFormatPipe, RatingStarsComponent],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ product?.name }}</h5>
      <button type="button" class="btn-close" (click)="modal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <div class="row">
        <div class="col-md-6">
          <img
            [src]="product?.images?.[0] || 'https://placehold.co/400x300?text=No+Image'"
            [alt]="product?.name"
            class="img-fluid rounded"
          />
        </div>
        <div class="col-md-6">
          <p class="text-muted">{{ product?.category }}</p>
          <app-rating-stars [rating]="product?.rating || 0" [count]="product?.ratingCount"></app-rating-stars>
          <h4 class="my-2">{{ (product?.price || 0) | currencyFormat | async }}</h4>
          <p>{{ product?.description }}</p>
          <p class="text-muted small">Stock: {{ product?.stock }}</p>
          <div class="d-flex align-items-center gap-2 mt-3">
            <input type="number" class="form-control" style="width: 80px;" [(ngModel)]="qty" min="1" max="99" />
            <button
              class="btn btn-primary"
              (click)="onAddToCart()"
              [disabled]="!product || product.stock === 0"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class QuickViewModalComponent {
  modal = inject(NgbActiveModal);

  @Input() product: Product | null = null;
  qty = 1;

  onAddToCart(): void {
    if (this.product) {
      this.modal.close({ product: this.product, qty: this.qty });
    }
  }
}
