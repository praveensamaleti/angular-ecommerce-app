import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { loadProductsRequest, resetFilters } from '../../store/products/products.actions';
import { selectFilteredProducts, selectProductsLoading } from '../../store/products/products.selectors';
import { selectCartItems } from '../../store/cart/cart.selectors';
import { addToCart, recomputeTotals } from '../../store/cart/cart.actions';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { QuickViewModalComponent } from '../../components/quick-view-modal/quick-view-modal.component';
import type { Product } from '../../models/domain';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, RouterLink, ProductCardComponent, LoadingSpinnerComponent],
  template: `
    <div class="container py-5">
      <!-- Hero -->
      <section class="text-center py-5 mb-5 bg-body-secondary rounded-3">
        <h1 class="display-5 fw-bold">Welcome to ShopNG</h1>
        <p class="lead text-muted">Discover amazing products at great prices</p>
        <a routerLink="/products" class="btn btn-primary btn-lg">Shop Now</a>
      </section>

      <!-- Featured Products -->
      <section>
        <h2 class="mb-4">Featured Products</h2>
        <app-loading-spinner *ngIf="loading$ | async"></app-loading-spinner>
        <div *ngIf="!(loading$ | async)" class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
          <div *ngFor="let product of featured$ | async" class="col">
            <app-product-card
              [product]="product"
              (addToCart)="onAddToCart($event)"
              (quickView)="onQuickView($event)"
            ></app-product-card>
          </div>
        </div>
        <div class="text-center mt-4">
          <a routerLink="/products" class="btn btn-outline-primary">View All Products</a>
        </div>
      </section>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private store = inject(Store);
  private modal = inject(NgbModal);
  private destroyRef = inject(DestroyRef);

  loading$ = this.store.select(selectProductsLoading);
  products$ = this.store.select(selectFilteredProducts);
  featured$ = this.products$.pipe(map((products) => products.filter((p) => p.featured).slice(0, 8)));

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
    // Reset filters so home page always loads all products unfiltered,
    // ensuring featured$ has the full product set to filter from.
    this.store.dispatch(resetFilters());
    this.store.select(selectFilteredProducts).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((products) => {
      if (products.length === 0) {
        this.store.dispatch(loadProductsRequest());
      }
    });
  }

  onAddToCart(product: Product): void {
    this.store.dispatch(addToCart({ productId: product.id }));
  }

  onQuickView(product: Product): void {
    const ref = this.modal.open(QuickViewModalComponent, { size: 'lg' });
    ref.componentInstance.product = product;
    ref.result.then(
      ({ product: p, qty }: { product: Product; qty: number }) => {
        this.store.dispatch(addToCart({ productId: p.id, qty }));
      },
      () => {}
    );
  }
}
