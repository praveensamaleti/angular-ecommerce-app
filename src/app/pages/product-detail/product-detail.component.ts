import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe, NgIf, NgFor, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { combineLatest, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { selectFilteredProducts, selectProductsLoading } from '../../store/products/products.selectors';
import { selectCartItems } from '../../store/cart/cart.selectors';
import { addToCart, recomputeTotals } from '../../store/cart/cart.actions';
import { loadProductsRequest } from '../../store/products/products.actions';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { RatingStarsComponent } from '../../components/rating-stars/rating-stars.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import type { Product, ProductVariant } from '../../models/domain';

// ------------------------------------------------------------------
// Pure helper functions (outside component for reuse / testability)
// ------------------------------------------------------------------

/** All attribute keys present across variants, in stable order. */
export function allAttrKeys(variants: ProductVariant[]): string[] {
  const keys = new Set<string>();
  variants.forEach((v) => Object.keys(v.attributes ?? {}).forEach((k) => keys.add(k)));
  return Array.from(keys);
}

/** Unique sorted values for a given attribute key across all variants. */
export function uniqueAttrValues(variants: ProductVariant[], key: string): string[] {
  const seen = new Set<string>();
  variants.forEach((v) => {
    const val = (v.attributes ?? {})[key];
    if (val) seen.add(val);
  });
  return Array.from(seen).sort();
}

/** Returns the variant that exactly matches the selected attribute map, or undefined. */
export function matchVariant(
  variants: ProductVariant[],
  selected: Record<string, string>
): ProductVariant | undefined {
  const keys = allAttrKeys(variants);
  if (keys.some((k) => !selected[k])) return undefined;
  return variants.find((v) =>
    keys.every((k) => (v.attributes ?? {})[k] === selected[k])
  );
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    AsyncPipe, NgIf, NgFor, KeyValuePipe, FormsModule, RouterLink,
    CurrencyFormatPipe, RatingStarsComponent, LoadingSpinnerComponent,
  ],
  template: `
    <div class="container py-4">
      <a routerLink="/products" class="btn btn-outline-secondary btn-sm mb-3">← Back to Products</a>

      <app-loading-spinner *ngIf="loading$ | async"></app-loading-spinner>

      <ng-container *ngIf="product$ | async as product">
        <div class="row g-4">

          <!-- Image gallery -->
          <div class="col-md-6">
            <img
              [src]="product.images[selectedImage] || 'https://placehold.co/600x400?text=No+Image'"
              [alt]="product.name"
              class="img-fluid rounded shadow"
              style="max-height:420px; object-fit:cover; width:100%;"
            />
            <div class="d-flex gap-2 mt-2 flex-wrap">
              <img
                *ngFor="let img of product.images; let i = index"
                [src]="img"
                width="60" height="60"
                class="rounded border"
                style="object-fit:cover; cursor:pointer;"
                [class.border-primary]="selectedImage === i"
                (click)="selectedImage = i"
                [alt]="product.name + ' image ' + (i + 1)"
              />
            </div>
          </div>

          <!-- Details panel -->
          <div class="col-md-6">
            <span class="badge bg-secondary mb-2">{{ product.category }}</span>
            <h2>{{ product.name }}</h2>
            <app-rating-stars [rating]="product.rating" [count]="product.ratingCount" class="mb-2"></app-rating-stars>

            <h3 class="mb-1">{{ effectivePrice(product) | currencyFormat | async }}</h3>
            <p class="text-muted small mb-3">In stock: {{ effectiveStock(product) }}</p>

            <p>{{ product.description }}</p>

            <!-- ---- Variant Selector ---- -->
            <ng-container *ngIf="product.variants && product.variants.length > 0">
              <div *ngFor="let attrKey of getAttrKeys(product)" class="mb-3">
                <label class="form-label fw-semibold text-capitalize small">
                  {{ attrKey }}
                  <span *ngIf="selectedAttrs[attrKey]" class="text-primary ms-1">
                    {{ selectedAttrs[attrKey] }}
                  </span>
                </label>
                <div class="d-flex flex-wrap gap-2" [attr.aria-label]="'Select ' + attrKey">
                  <button
                    *ngFor="let val of getAttrValues(product, attrKey)"
                    type="button"
                    class="btn btn-sm"
                    [class.btn-primary]="selectedAttrs[attrKey] === val"
                    [class.btn-outline-secondary]="selectedAttrs[attrKey] !== val"
                    (click)="toggleAttr(attrKey, val)"
                    [attr.aria-pressed]="selectedAttrs[attrKey] === val"
                  >
                    {{ val }}
                  </button>
                </div>
              </div>

              <p *ngIf="variantRequired(product)" class="text-warning small">
                Please select all options to add to cart.
              </p>
              <p *ngIf="resolvedVariant(product) as v" class="text-muted small mb-2">
                <ng-container *ngIf="v.sku">SKU: {{ v.sku }}</ng-container>
              </p>
            </ng-container>

            <!-- Qty + Add to Cart -->
            <div class="d-flex align-items-center gap-3 mb-3">
              <input
                type="number"
                class="form-control"
                style="width:80px;"
                [(ngModel)]="qty"
                min="1"
                [max]="effectiveStock(product)"
                [disabled]="effectiveStock(product) === 0 || variantRequired(product)"
              />
              <button
                class="btn btn-primary"
                (click)="onAddToCart(product)"
                [disabled]="effectiveStock(product) === 0 || variantRequired(product)"
              >
                <ng-container [ngSwitch]="true">
                  <ng-container *ngSwitchCase="effectiveStock(product) === 0">Out of Stock</ng-container>
                  <ng-container *ngSwitchCase="variantRequired(product)">Select Options</ng-container>
                  <ng-container *ngSwitchDefault>Add to Cart</ng-container>
                </ng-container>
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
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  loading$ = this.store.select(selectProductsLoading);
  product$ = combineLatest([
    this.store.select(selectFilteredProducts),
    this.route.params.pipe(map((p) => p['id'])),
  ]).pipe(map(([products, id]) => products.find((p) => p.id === id) ?? null));

  selectedImage = 0;
  qty = 1;

  /** Tracks which attribute value is selected per attribute key. */
  selectedAttrs: Record<string, string> = {};

  constructor() {
    // Recompute cart totals whenever products or cart items change
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

    // Reset variant selection when product route changes
    this.product$.pipe(takeUntilDestroyed()).subscribe((product) => {
      if (product) {
        this.selectedAttrs = {};
        this.qty = 1;
        this.selectedImage = 0;
      }
    });
  }

  ngOnInit(): void {
    this.store.select(selectFilteredProducts)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => {
        if (products.length === 0) {
          this.store.dispatch(loadProductsRequest());
        }
      });
  }

  // ------------------------------------------------------------------
  // Variant helpers (delegates to pure functions above)
  // ------------------------------------------------------------------

  getAttrKeys(product: Product): string[] {
    return allAttrKeys(product.variants ?? []);
  }

  getAttrValues(product: Product, key: string): string[] {
    return uniqueAttrValues(product.variants ?? [], key);
  }

  resolvedVariant(product: Product): ProductVariant | undefined {
    if (!product.variants?.length) return undefined;
    return matchVariant(product.variants, this.selectedAttrs);
  }

  variantRequired(product: Product): boolean {
    return (product.variants?.length ?? 0) > 0 && !this.resolvedVariant(product);
  }

  effectivePrice(product: Product): number {
    const variant = this.resolvedVariant(product);
    return (variant?.price != null) ? variant.price : product.price;
  }

  effectiveStock(product: Product): number {
    const variant = this.resolvedVariant(product);
    return variant != null ? variant.stock : (product.stock ?? 0);
  }

  toggleAttr(key: string, value: string): void {
    this.selectedAttrs = {
      ...this.selectedAttrs,
      [key]: this.selectedAttrs[key] === value ? '' : value,
    };
    this.qty = 1;
  }

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------

  onAddToCart(product: Product): void {
    if (this.variantRequired(product)) {
      this.toastr.warning('Please select all options before adding to cart.');
      return;
    }
    const variant = this.resolvedVariant(product);
    this.store.dispatch(
      addToCart({ productId: product.id, qty: this.qty, variantId: variant?.id })
    );
    this.toastr.success('Added to cart.');
  }

  specKeys(product: Product): string[] {
    return Object.keys(product.specs ?? {});
  }
}
