import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectFilteredProducts, selectCategories } from '../../store/products/products.selectors';
import { selectOrders, selectOrdersLoading } from '../../store/orders/orders.selectors';
import {
  loadProductsRequest,
  loadCategoriesRequest,
  upsertProductRequest,
  deleteProductRequest,
} from '../../store/products/products.actions';
import {
  loadOrdersRequest,
  updateOrderStatusRequest,
} from '../../store/orders/orders.actions';
import { selectUser } from '../../store/auth/auth.selectors';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import type { Product, Order, OrderStatus } from '../../models/domain';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, AsyncPipe, NgIf, NgFor, NgbNavModule, CurrencyFormatPipe],
  template: `
    <div class="container py-4">
      <h2 class="mb-4 page-title">Admin Dashboard</h2>
      <ul ngbNav #nav="ngbNav" [(activeId)]="activeTab" class="nav-tabs mb-3">
        <!-- Products Tab -->
        <li [ngbNavItem]="1">
          <button ngbNavLink>Products</button>
          <ng-template ngbNavContent>
            <div class="mb-3 d-flex justify-content-between align-items-center">
              <button class="btn btn-primary btn-sm" (click)="showProductForm = !showProductForm">
                {{ showProductForm ? 'Cancel' : '+ Add Product' }}
              </button>
            </div>

            <!-- Product Form -->
            <div *ngIf="showProductForm" class="card mb-3">
              <div class="card-body">
                <h6>{{ editingProduct ? 'Edit Product' : 'New Product' }}</h6>
                <form [formGroup]="productForm" (ngSubmit)="onSaveProduct()" class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-control" formControlName="name" />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Price</label>
                    <input type="number" class="form-control" formControlName="price" />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Stock</label>
                    <input type="number" class="form-control" formControlName="stock" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Category</label>
                    <select class="form-select" formControlName="category">
                      <option *ngFor="let cat of categories$ | async" [value]="cat">{{ cat }}</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" formControlName="description" rows="2"></textarea>
                  </div>
                  <div class="col-12">
                    <button type="submit" class="btn btn-success btn-sm">Save</button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Search -->
            <div class="mb-3">
              <input
                type="text"
                class="form-control"
                placeholder="Search products..."
                aria-label="Search products"
                [(ngModel)]="productSearch"
                (ngModelChange)="onProductSearch($event)"
                [ngModelOptions]="{ standalone: true }"
              />
            </div>

            <!-- Products Table -->
            <div class="table-responsive">
              <table class="table table-hover" style="--bs-table-hover-bg: rgba(99,102,241,0.04);">
                <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr *ngFor="let product of pagedProducts">
                    <td>{{ product.name }}</td>
                    <td>{{ product.category }}</td>
                    <td>{{ product.price | currencyFormat | async }}</td>
                    <td>
                      <span [class]="stockClass(product.stock)">{{ product.stock }}</span>
                    </td>
                    <td>
                      <button class="btn btn-outline-secondary btn-sm me-1" (click)="onEditProduct(product)">Edit</button>
                      <button class="btn btn-outline-danger btn-sm" (click)="onDeleteProduct(product.id)">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div *ngIf="totalProductPages > 1" class="d-flex justify-content-center gap-2 mt-3">
              <button
                class="btn btn-outline-secondary btn-sm"
                [disabled]="productPage === 0"
                (click)="productPage = productPage - 1"
              >Prev</button>
              <span class="align-self-center small">Page {{ productPage + 1 }} / {{ totalProductPages }}</span>
              <button
                class="btn btn-outline-secondary btn-sm"
                [disabled]="productPage >= totalProductPages - 1"
                (click)="productPage = productPage + 1"
              >Next</button>
            </div>
          </ng-template>
        </li>

        <!-- Orders Tab -->
        <li [ngbNavItem]="2">
          <button ngbNavLink>Orders</button>
          <ng-template ngbNavContent>
            <div class="table-responsive">
              <table class="table table-hover" style="--bs-table-hover-bg: rgba(99,102,241,0.04);">
                <thead><tr><th>Order ID</th><th>User ID</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr *ngFor="let order of orders$ | async">
                    <td><small>{{ order.id }}</small></td>
                    <td><small>{{ order.userId }}</small></td>
                    <td>{{ order.total | currencyFormat | async }}</td>
                    <td>
                      <span class="badge" [class.bg-warning]="order.status === 'pending'" [class.bg-success]="order.status === 'shipped'">
                        {{ order.status }}
                      </span>
                    </td>
                    <td>
                      <button
                        *ngIf="order.status === 'pending'"
                        class="btn btn-success btn-sm"
                        (click)="onMarkShipped(order)"
                      >
                        Mark Shipped
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-template>
        </li>

        <!-- Inventory Tab -->
        <li [ngbNavItem]="3">
          <button ngbNavLink>Inventory</button>
          <ng-template ngbNavContent>
            <div class="mb-3">
              <input
                type="text"
                class="form-control"
                placeholder="Search inventory..."
                aria-label="Search inventory"
                [(ngModel)]="inventorySearch"
                (ngModelChange)="onInventorySearch($event)"
                [ngModelOptions]="{ standalone: true }"
              />
            </div>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead><tr><th>Name</th><th>Category</th><th class="text-end">Stock</th></tr></thead>
                <tbody>
                  <tr *ngFor="let product of pagedInventory">
                    <td>{{ product.name }}</td>
                    <td>{{ product.category }}</td>
                    <td class="text-end">
                      <span [class]="stockClass(product.stock)">{{ product.stock }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Inventory Pagination -->
            <div *ngIf="totalInventoryPages > 1" class="d-flex justify-content-center gap-2 mt-3">
              <button
                class="btn btn-outline-secondary btn-sm"
                [disabled]="inventoryPage === 0"
                (click)="inventoryPage = inventoryPage - 1"
              >Prev</button>
              <span class="align-self-center small">Page {{ inventoryPage + 1 }} / {{ totalInventoryPages }}</span>
              <button
                class="btn btn-outline-secondary btn-sm"
                [disabled]="inventoryPage >= totalInventoryPages - 1"
                (click)="inventoryPage = inventoryPage + 1"
              >Next</button>
            </div>
          </ng-template>
        </li>
      </ul>
      <div [ngbNavOutlet]="nav"></div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);

  readonly PAGE_SIZE = 10;

  activeTab = 1;
  showProductForm = false;
  editingProduct: Product | null = null;

  productSearch = '';
  productPage = 0;
  inventorySearch = '';
  inventoryPage = 0;

  private allProducts: Product[] = [];

  categories$ = this.store.select(selectCategories);
  orders$ = this.store.select(selectOrders);

  productForm = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    category: ['Electronics', Validators.required],
    description: [''],
  });

  constructor() {
    this.store.select(selectFilteredProducts).pipe(takeUntilDestroyed()).subscribe((products) => {
      this.allProducts = products;
    });

    this.store.select(selectUser).pipe(takeUntilDestroyed()).subscribe((user) => {
      if (user) {
        this.store.dispatch(loadOrdersRequest({ userId: user.id }));
      }
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

  get filteredProducts(): Product[] {
    return this.allProducts.filter((p) =>
      p.name.toLowerCase().includes(this.productSearch.toLowerCase())
    );
  }

  get pagedProducts(): Product[] {
    const filtered = this.filteredProducts;
    return filtered.slice(this.productPage * this.PAGE_SIZE, (this.productPage + 1) * this.PAGE_SIZE);
  }

  get totalProductPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.PAGE_SIZE));
  }

  get sortedInventory(): Product[] {
    return this.allProducts.slice().sort((a, b) => a.stock - b.stock);
  }

  get filteredInventory(): Product[] {
    return this.sortedInventory.filter((p) =>
      p.name.toLowerCase().includes(this.inventorySearch.toLowerCase())
    );
  }

  get pagedInventory(): Product[] {
    const filtered = this.filteredInventory;
    return filtered.slice(this.inventoryPage * this.PAGE_SIZE, (this.inventoryPage + 1) * this.PAGE_SIZE);
  }

  get totalInventoryPages(): number {
    return Math.max(1, Math.ceil(this.filteredInventory.length / this.PAGE_SIZE));
  }

  stockClass(qty: number): string {
    if (qty < 10) return 'badge bg-danger';
    if (qty <= 30) return 'badge bg-warning text-dark';
    return 'badge bg-success';
  }

  onProductSearch(val: string): void {
    this.productSearch = val;
    this.productPage = 0;
  }

  onInventorySearch(val: string): void {
    this.inventorySearch = val;
    this.inventoryPage = 0;
  }

  onEditProduct(product: Product): void {
    this.editingProduct = product;
    this.showProductForm = true;
    this.productForm.patchValue({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      description: product.description,
    });
  }

  onSaveProduct(): void {
    if (this.productForm.invalid) return;
    const values = this.productForm.value as any;
    const product: Product = {
      ...(this.editingProduct || {
        id: '',
        images: [],
        rating: 0,
        ratingCount: 0,
        specs: {},
        reviews: [],
      }),
      name: values.name,
      price: values.price,
      stock: values.stock,
      category: values.category,
      description: values.description || '',
    };
    this.store.dispatch(upsertProductRequest({ product }));
    this.showProductForm = false;
    this.editingProduct = null;
    this.productForm.reset({ category: 'Electronics', price: 0, stock: 0 });
  }

  onDeleteProduct(id: string): void {
    if (confirm('Delete this product?')) {
      this.store.dispatch(deleteProductRequest({ id }));
    }
  }

  onMarkShipped(order: Order): void {
    this.store.dispatch(updateOrderStatusRequest({ orderId: order.id, status: 'shipped' as OrderStatus }));
  }
}
