import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  loadProductsRequest,
  setFiltersQuery,
  setFiltersCategory,
  setFiltersPriceRange,
  setFiltersPage,
  resetFilters,
} from '../../store/products/products.actions';
import { selectFilteredProducts, selectProductsLoading, selectFilters, selectProductsTotalCount } from '../../store/products/products.selectors';
import { selectCartItems } from '../../store/cart/cart.selectors';
import { addToCart, recomputeTotals } from '../../store/cart/cart.actions';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { QuickViewModalComponent } from '../../components/quick-view-modal/quick-view-modal.component';
import type { Category, Product } from '../../models/domain';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, ReactiveFormsModule, ProductCardComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="container py-4">
      <h2 class="mb-4">Products</h2>

      <!-- Filters -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <input type="text" class="form-control" placeholder="Search products..." [formControl]="searchControl" />
        </div>
        <div class="col-md-3">
          <select class="form-select" [formControl]="categoryControl">
            <option value="All">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select" [formControl]="pageSizeControl">
            <option value="8">8 per page</option>
            <option value="16">16 per page</option>
            <option value="32">32 per page</option>
          </select>
        </div>
        <div class="col-md-2">
          <button class="btn btn-outline-secondary w-100" (click)="onReset()">Reset</button>
        </div>
      </div>

      <!-- Results -->
      <app-loading-spinner *ngIf="loading$ | async"></app-loading-spinner>

      <ng-container *ngIf="!(loading$ | async)">
        <app-empty-state
          *ngIf="(products$ | async)?.length === 0"
          title="No products found"
          description="Try adjusting your search or filters."
          actionLabel="Reset Filters"
          (action)="onReset()"
        ></app-empty-state>

        <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
          <div *ngFor="let product of products$ | async" class="col">
            <app-product-card
              [product]="product"
              (addToCart)="onAddToCart($event)"
              (quickView)="onQuickView($event)"
            ></app-product-card>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="(totalCount$ | async) as total" class="d-flex justify-content-center gap-2 mt-4">
          <button
            class="btn btn-outline-primary btn-sm"
            [disabled]="(filters$ | async)?.page === 0"
            (click)="onPage(-1)"
          >
            Previous
          </button>
          <span class="align-self-center text-muted small">
            Page {{ ((filters$ | async)?.page || 0) + 1 }}
          </span>
          <button
            class="btn btn-outline-primary btn-sm"
            [disabled]="((filters$ | async)?.page || 0) * ((filters$ | async)?.pageSize || 8) + ((products$ | async)?.length || 0) >= total"
            (click)="onPage(1)"
          >
            Next
          </button>
        </div>
      </ng-container>
    </div>
  `,
})
export class ProductsComponent implements OnInit {
  private store = inject(Store);
  private modal = inject(NgbModal);

  loading$ = this.store.select(selectProductsLoading);
  products$ = this.store.select(selectFilteredProducts);
  totalCount$ = this.store.select(selectProductsTotalCount);
  filters$ = this.store.select(selectFilters);

  searchControl = new FormControl('');
  categoryControl = new FormControl('All');
  pageSizeControl = new FormControl('8');

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

    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => {
        this.store.dispatch(setFiltersQuery({ query: query || '' }));
        this.store.dispatch(loadProductsRequest());
      });

    this.categoryControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((category) => {
        this.store.dispatch(setFiltersCategory({ category: (category as Category | 'All') || 'All' }));
        this.store.dispatch(loadProductsRequest());
      });

    this.pageSizeControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((size) => {
        this.store.dispatch({ type: '[Products] Set Filters Page Size', pageSize: Number(size) || 8 });
        this.store.dispatch(loadProductsRequest());
      });
  }

  ngOnInit(): void {
    this.store.dispatch(loadProductsRequest());
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

  onReset(): void {
    this.store.dispatch(resetFilters());
    this.searchControl.setValue('', { emitEvent: false });
    this.categoryControl.setValue('All', { emitEvent: false });
    this.pageSizeControl.setValue('8', { emitEvent: false });
    this.store.dispatch(loadProductsRequest());
  }

  onPage(delta: number): void {
    this.store.select(selectFilters).pipe(takeUntilDestroyed()).subscribe((f) => {
      this.store.dispatch(setFiltersPage({ page: f.page + delta }));
      this.store.dispatch(loadProductsRequest());
    });
  }
}
