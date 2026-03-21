import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { combineLatest, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectFilteredProducts, selectProductsLoading } from '../../store/products/products.selectors';
import { selectCartItems } from '../../store/cart/cart.selectors';
import { addToCart, recomputeTotals } from '../../store/cart/cart.actions';
import { loadProductsRequest } from '../../store/products/products.actions';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { RatingStarsComponent } from '../../components/rating-stars/rating-stars.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import type { Product } from '../../models/domain';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, FormsModule, RouterLink, CurrencyFormatPipe, RatingStarsComponent, LoadingSpinnerComponent],
  template: `
    <div class="container py-4">
      <a routerLink="/products" class="btn btn-outline-secondary btn-sm mb-3">← Back to Products</a>
      <app-loading-spinner *ngIf="loading$ | async"></app-loading-spinner>
      <ng-container *ngIf="product$ | async as product">
        <div class="row g-4">
          <div class="col-md-6">
            <img
              [src]="product.images[selectedImage] || 'https://placehold.co/600x400?text=No+Image'"
              [alt]="product.name"
              class="img-fluid rounded shadow"
            />
            <div class="d-flex gap-2 mt-2 flex-wrap">
              <img
                *ngFor="let img of product.images; let i = index"
                [src]="img"
                width="60"
                height="60"
                class="rounded border"
                style="object-fit: cover; cursor: pointer;"
                [class.border-primary]="selectedImage === i"
                (click)="selectedImage = i"
                [alt]="product.name + ' image ' + i"
              />
            </div>
          </div>
          <div class="col-md-6">
            <span class="badge bg-secondary mb-2">{{ product.category }}</span>
            <h2>{{ product.name }}</h2>
            <app-rating-stars [rating]="product.rating" [count]="product.ratingCount" class="mb-2"></app-rating-stars>
            <h3 class="mb-3">{{ product.price | currencyFormat | async }}</h3>
            <p>{{ product.description }}</p>
            <p class="text-muted">In stock: {{ product.stock }}</p>
            <div class="d-flex align-items-center gap-3 mb-3">
              <input type="number" class="form-control" style="width: 80px;" [(ngModel)]="qty" min="1" max="99" />
              <button
                class="btn btn-primary"
                (click)="onAddToCart(product)"
                [disabled]="product.stock === 0"
              >
                {{ product.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
              </button>
            </div>

            <!-- Specs -->
            <div *ngIf="specKeys(product).length > 0" class="mb-3">
              <h5>Specifications</h5>
              <dl class="row">
                <ng-container *ngFor="let key of specKeys(product)">
                  <dt class="col-sm-4">{{ key }}</dt>
                  <dd class="col-sm-8">{{ product.specs[key] }}</dd>
                </ng-container>
              </dl>
            </div>
          </div>
        </div>

        <!-- Reviews -->
        <div class="mt-5" *ngIf="product.reviews?.length">
          <h4 class="mb-3">Customer Reviews</h4>
          <div *ngFor="let review of product.reviews" class="card mb-2">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <strong>{{ review.userName }}</strong>
                <app-rating-stars [rating]="review.rating"></app-rating-stars>
              </div>
              <p class="fw-semibold mb-1">{{ review.title }}</p>
              <p class="mb-0 text-muted">{{ review.body }}</p>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  loading$ = this.store.select(selectProductsLoading);
  product$ = combineLatest([
    this.store.select(selectFilteredProducts),
    this.route.params.pipe(map((p) => p['id'])),
  ]).pipe(map(([products, id]) => products.find((p) => p.id === id) || null));

  selectedImage = 0;
  qty = 1;

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

  ngOnInit(): void {
    this.store.select(selectFilteredProducts).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((products) => {
      if (products.length === 0) {
        this.store.dispatch(loadProductsRequest());
      }
    });
  }

  onAddToCart(product: Product): void {
    this.store.dispatch(addToCart({ productId: product.id, qty: this.qty }));
  }

  specKeys(product: Product): string[] {
    return Object.keys(product.specs || {});
  }
}
