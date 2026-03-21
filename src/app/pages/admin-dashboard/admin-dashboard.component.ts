import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { selectFilteredProducts, selectProductsLoading } from '../../store/products/products.selectors';
import { selectOrders, selectOrdersLoading } from '../../store/orders/orders.selectors';
import {
  loadProductsRequest,
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
  imports: [ReactiveFormsModule, AsyncPipe, NgIf, NgFor, NgbNavModule, CurrencyFormatPipe],
  template: `
    <div class="container py-4">
      <h2 class="mb-4">Admin Dashboard</h2>
      <ul ngbNav #nav="ngbNav" [(activeId)]="activeTab" class="nav-tabs mb-3">
        <li [ngbNavItem]="1">
          <button ngbNavLink>Products</button>
          <ng-template ngbNavContent>
            <div class="mb-3">
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
                      <option value="Electronics">Electronics</option>
                      <option value="Clothing">Clothing</option>
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

            <!-- Products Table -->
            <div class="table-responsive">
              <table class="table table-hover">
                <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr *ngFor="let product of products$ | async">
                    <td>{{ product.name }}</td>
                    <td>{{ product.category }}</td>
                    <td>{{ product.price | currencyFormat | async }}</td>
                    <td>{{ product.stock }}</td>
                    <td>
                      <button class="btn btn-outline-secondary btn-sm me-1" (click)="onEditProduct(product)">Edit</button>
                      <button class="btn btn-outline-danger btn-sm" (click)="onDeleteProduct(product.id)">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-template>
        </li>
        <li [ngbNavItem]="2">
          <button ngbNavLink>Orders</button>
          <ng-template ngbNavContent>
            <div class="table-responsive">
              <table class="table table-hover">
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
      </ul>
      <div [ngbNavOutlet]="nav"></div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);

  activeTab = 1;
  showProductForm = false;
  editingProduct: Product | null = null;

  products$ = this.store.select(selectFilteredProducts);
  orders$ = this.store.select(selectOrders);

  productForm = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    category: ['Electronics', Validators.required],
    description: [''],
  });

  constructor() {
    this.store.select(selectUser).pipe(takeUntilDestroyed()).subscribe((user) => {
      if (user) {
        this.store.dispatch(loadOrdersRequest({ userId: user.id }));
      }
    });
  }

  ngOnInit(): void {
    this.store.dispatch(loadProductsRequest());
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
