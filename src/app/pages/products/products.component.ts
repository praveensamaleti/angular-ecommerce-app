import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { combineLatest, take } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  loadProductsRequest,
  loadCategoriesRequest,
  setFiltersQuery,
  setFiltersCategory,
  setFiltersPriceRange,
  setFiltersPage,
  resetFilters,
} from '../../store/products/products.actions';
import { selectFilteredProducts, selectProductsLoading, selectFilters, selectProductsTotalCount, selectCategories } from '../../store/products/products.selectors';
import { selectCartItems } from '../../store/cart/cart.selectors';
import { addToCart, removeFromCart, setQty, recomputeTotals } from '../../store/cart/cart.actions';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { QuickViewModalComponent } from '../../components/quick-view-modal/quick-view-modal.component';
import type { CartItem, Product } from '../../models/domain';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, ReactiveFormsModule, ProductCardComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="container py-4">
      <!-- Page header -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <h2 class="m-0 page-title">Products</h2>
        <div class="d-flex align-items-center gap-2">
          <span *ngIf="totalCount$ | async as total"
            style="background: var(--ec-primary-light, #e0e7ff); color: var(--ec-primary, #6366f1); border-radius: 20px; padding: 4px 12px; font-size: 0.78rem; font-weight: 700;">
            {{ total }} results
          </span>
          <button class="btn btn-outline-primary btn-sm" (click)="onReset()">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
            Reset
          </button>
        </div>
      </div>

      <!-- Filters row -->
      <div class="filter-bar mb-4">
        <div class="row g-3 align-items-end">
          <div class="col-md-5">
            <span class="filter-label">Search</span>
            <div class="input-group">
              <span class="input-group-text" style="background: transparent;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input type="text" class="form-control" placeholder="Search products..." [formControl]="searchControl" style="border-left: none;" />
            </div>
          </div>
          <div class="col-md-4">
            <span class="filter-label">Category</span>
            <select class="form-select" [formControl]="categoryControl">
              <option value="All">All Categories</option>
              <option *ngFor="let cat of categories$ | async" [value]="cat">{{ cat }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <span class="filter-label">Per page</span>
            <select class="form-select" [formControl]="pageSizeControl">
              <option value="8">8 / page</option>
              <option value="16">16 / page</option>
              <option value="32">32 / page</option>
            </select>
          </div>
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
              [cartQty]="getCartQty(product.id)"
              (addToCart)="onAddToCart($event)"
              (removeFromCart)="onRemoveFromCart($event)"
              (qtyChange)="onQtyChange($event)"
              (quickView)="onQuickView($event)"
            ></app-product-card>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="(totalCount$ | async) as total" class="d-flex justify-content-center align-items-center gap-2 mt-4">
          <button
            class="btn btn-outline-primary btn-sm"
            style="border-radius: 8px;"
            [disabled]="(filters$ | async)?.page === 0"
            (click)="onPage(-1)"
          >← Previous</button>
          <span class="text-muted small px-2">
            Page {{ ((filters$ | async)?.page || 0) + 1 }}
          </span>
          <button
            class="btn btn-outline-primary btn-sm"
            style="border-radius: 8px;"
            [disabled]="((filters$ | async)?.page || 0) * ((filters$ | async)?.pageSize || 8) + ((products$ | async)?.length || 0) >= total"
            (click)="onPage(1)"
          >Next →</button>
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
  categories$ = this.store.select(selectCategories);

  searchControl = new FormControl('');
  categoryControl = new FormControl('All');
  pageSizeControl = new FormControl('8');

  private cartItems: CartItem[] = [];

  constructor() {
    combineLatest([
      this.store.select(selectCartItems),
      this.store.select(selectFilteredProducts),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([cartItems, products]) => {
        this.cartItems = cartItems;
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
        this.store.dispatch(setFiltersCategory({ category: category || 'All' }));
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
    this.store.select(selectCategories).pipe(take(1)).subscribe((cats) => {
      if (cats.length === 0) {
        this.store.dispatch(loadCategoriesRequest());
      }
    });
  }

  getCartQty(productId: string): number {
    return this.cartItems.find((i) => i.productId === productId)?.qty ?? 0;
  }

  onAddToCart(product: Product): void {
    this.store.dispatch(addToCart({ productId: product.id }));
  }

  onRemoveFromCart(product: Product): void {
    this.store.dispatch(removeFromCart({ productId: product.id }));
  }

  onQtyChange({ product, qty }: { product: Product; qty: number }): void {
    this.store.dispatch(setQty({ productId: product.id, qty }));
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
    this.store.select(selectFilters).pipe(take(1)).subscribe((f) => {
      this.store.dispatch(setFiltersPage({ page: f.page + delta }));
      this.store.dispatch(loadProductsRequest());
    });
  }
}
