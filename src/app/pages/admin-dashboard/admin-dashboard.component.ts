import { Component, OnInit, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { NgbNavModule, NgbModalModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { selectFilteredProducts, selectCategories } from '../../store/products/products.selectors';
import { selectOrders } from '../../store/orders/orders.selectors';
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
import { ApiService } from '../../services/api.service';
import type { Product, Order, OrderStatus, ProductVariant } from '../../models/domain';

// ------------------------------------------------------------------
// Variant Manager (standalone modal content component)
// ------------------------------------------------------------------

@Component({
  selector: 'app-variant-manager',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, CurrencyFormatPipe, AsyncPipe],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Variants — {{ product.name }}</h5>
      <button type="button" class="btn-close" (click)="dismiss()"></button>
    </div>
    <div class="modal-body">
      <!-- Existing variants -->
      <table *ngIf="variants().length > 0; else noVariants" class="table table-sm table-hover mb-4">
        <thead>
          <tr>
            <th>Label</th><th>SKU</th>
            <th class="text-end">Stock</th><th class="text-end">Price</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let v of variants()">
            <td class="fw-semibold">{{ v.label || '—' }}</td>
            <td class="text-muted small">{{ v.sku || '—' }}</td>
            <td class="text-end">
              <span [class]="stockClass(v.stock)">{{ v.stock }}</span>
            </td>
            <td class="text-end">
              <ng-container *ngIf="v.price != null; else basePrice">
                {{ v.price | currencyFormat | async }}
              </ng-container>
              <ng-template #basePrice><span class="text-muted">Base</span></ng-template>
            </td>
            <td class="text-end">
              <button class="btn btn-outline-danger btn-sm"
                      (click)="deleteVariant(v.id)"
                      [attr.aria-label]="'Delete variant ' + v.label">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <ng-template #noVariants>
        <p class="text-muted mb-4">No variants yet. Add one below.</p>
      </ng-template>

      <!-- Add variant form -->
      <h6 class="fw-bold mb-3">Add Variant</h6>
      <form [formGroup]="variantForm" (ngSubmit)="onAddVariant()" class="row g-3">
        <div class="col-md-4">
          <label class="form-label">SKU (optional)</label>
          <input type="text" class="form-control" formControlName="sku" placeholder="SHIRT-RED-M" />
        </div>
        <div class="col-md-4">
          <label class="form-label">Stock *</label>
          <input type="number" class="form-control" formControlName="stock" min="0" />
        </div>
        <div class="col-md-4">
          <label class="form-label">Price override (blank = use product price)</label>
          <input type="number" step="0.01" class="form-control" formControlName="price"
                 placeholder="e.g. 34.99" />
        </div>

        <!-- Dynamic attribute rows -->
        <div class="col-12">
          <label class="form-label fw-semibold small">Attributes</label>
          <div formArrayName="attributes">
            <div *ngFor="let row of attrRows.controls; let i = index"
                 [formGroupName]="i"
                 class="row g-2 mb-2">
              <div class="col-5">
                <input type="text" class="form-control form-control-sm"
                       formControlName="key" placeholder="e.g. color" />
              </div>
              <div class="col-5">
                <input type="text" class="form-control form-control-sm"
                       formControlName="value" placeholder="e.g. Red" />
              </div>
              <div class="col-2">
                <button *ngIf="attrRows.length > 1" type="button"
                        class="btn btn-outline-danger btn-sm"
                        (click)="removeAttrRow(i)">✕</button>
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm mt-1"
                  (click)="addAttrRow()">
            + Add attribute
          </button>
        </div>

        <div class="col-12">
          <button type="submit" class="btn btn-success btn-sm"
                  [disabled]="variantForm.invalid || saving">
            {{ saving ? 'Adding…' : 'Add variant' }}
          </button>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary btn-sm" (click)="dismiss()">Close</button>
    </div>
  `,
})
export class VariantManagerComponent {
  private activeModal = inject(NgbModal);
  private api = inject(ApiService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  product!: Product;
  onUpdated!: () => void;

  variants = signal<ProductVariant[]>([]);
  saving = false;

  variantForm = this.fb.group({
    sku: [''],
    stock: [0, [Validators.required, Validators.min(0)]],
    price: [''],
    attributes: this.fb.array([this.buildAttrRow()]),
  });

  get attrRows(): FormArray {
    return this.variantForm.get('attributes') as FormArray;
  }

  private buildAttrRow() {
    return this.fb.group({ key: [''], value: [''] });
  }

  addAttrRow(): void {
    this.attrRows.push(this.buildAttrRow());
  }

  removeAttrRow(index: number): void {
    if (this.attrRows.length > 1) {
      this.attrRows.removeAt(index);
    }
  }

  ngOnInit(): void {
    this.variants.set(this.product.variants ?? []);
  }

  async onAddVariant(): Promise<void> {
    if (this.variantForm.invalid) return;
    const raw = this.variantForm.value as any;

    const attrsMap: Record<string, string> = {};
    (raw.attributes as { key: string; value: string }[]).forEach(({ key, value }) => {
      if (key?.trim()) attrsMap[key.trim()] = value?.trim() ?? '';
    });

    const payload = {
      sku: raw.sku || undefined,
      stock: Number(raw.stock),
      price: raw.price ? Number(raw.price) : undefined,
      attributes: attrsMap,
    };

    this.saving = true;
    try {
      const saved = await this.api
        .post<ProductVariant>(`/api/products/${this.product.id}/variants`, payload)
        .toPromise();
      if (saved) {
        this.variants.update((prev) => [...prev, saved]);
        this.variantForm.reset({ sku: '', stock: 0, price: '' });
        while (this.attrRows.length > 1) this.attrRows.removeAt(1);
        this.toastr.success('Variant added.');
        this.onUpdated();
      }
    } catch {
      this.toastr.error('Failed to add variant.');
    } finally {
      this.saving = false;
    }
  }

  async deleteVariant(variantId: string): Promise<void> {
    try {
      await this.api
        .delete(`/api/products/${this.product.id}/variants/${variantId}`)
        .toPromise();
      this.variants.update((prev) => prev.filter((v) => v.id !== variantId));
      this.toastr.success('Variant deleted.');
      this.onUpdated();
    } catch {
      this.toastr.error('Failed to delete variant.');
    }
  }

  stockClass(qty: number): string {
    if (qty < 10) return 'badge bg-danger';
    if (qty <= 30) return 'badge bg-warning text-dark';
    return 'badge bg-success';
  }

  dismiss(): void {
    this.activeModal.dismissAll();
  }
}

// ------------------------------------------------------------------
// AdminDashboardComponent
// ------------------------------------------------------------------

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, AsyncPipe, NgIf, NgFor, NgbNavModule, NgbModalModule, CurrencyFormatPipe],
  template: `
    <div class="container py-4">
      <h2 class="mb-4 page-title">Admin Dashboard</h2>
      <ul ngbNav #nav="ngbNav" [(activeId)]="activeTab" class="nav-tabs mb-3">

        <!-- ====================== PRODUCTS TAB ====================== -->
        <li [ngbNavItem]="1">
          <button ngbNavLink>Products</button>
          <ng-template ngbNavContent>
            <div class="mb-3 d-flex justify-content-between align-items-center">
              <button class="btn btn-primary btn-sm" (click)="showProductForm = !showProductForm">
                {{ showProductForm ? 'Cancel' : '+ Add Product' }}
              </button>
            </div>

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
                    <label class="form-label">Base stock</label>
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
                    <button type="submit" class="btn btn-success btn-sm me-2">Save</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm"
                            (click)="showProductForm = false">Cancel</button>
                  </div>
                </form>
              </div>
            </div>

            <div class="mb-3">
              <input
                type="text" class="form-control" placeholder="Search products..."
                [(ngModel)]="productSearch"
                (ngModelChange)="onProductSearch($event)"
                [ngModelOptions]="{ standalone: true }"
              />
            </div>

            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th><th>Category</th><th>Price</th>
                    <th>Stock</th><th>Variants</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let product of pagedProducts">
                    <td>{{ product.name }}</td>
                    <td>{{ product.category }}</td>
                    <td>{{ product.price | currencyFormat | async }}</td>
                    <td><span [class]="stockClass(product.stock)">{{ product.stock }}</span></td>
                    <td>
                      <button class="btn btn-outline-info btn-sm"
                              (click)="openVariantManager(product)">
                        {{ product.variants.length > 0
                            ? product.variants.length + ' variants'
                            : '+ Variants' }}
                      </button>
                    </td>
                    <td>
                      <button class="btn btn-outline-secondary btn-sm me-1"
                              (click)="onEditProduct(product)">Edit</button>
                      <button class="btn btn-outline-danger btn-sm"
                              (click)="onDeleteProduct(product.id)">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div *ngIf="totalProductPages > 1" class="d-flex justify-content-center gap-2 mt-3">
              <button class="btn btn-outline-secondary btn-sm"
                      [disabled]="productPage === 0"
                      (click)="productPage = productPage - 1">Prev</button>
              <span class="align-self-center small">Page {{ productPage + 1 }} / {{ totalProductPages }}</span>
              <button class="btn btn-outline-secondary btn-sm"
                      [disabled]="productPage >= totalProductPages - 1"
                      (click)="productPage = productPage + 1">Next</button>
            </div>
          </ng-template>
        </li>

        <!-- ====================== ORDERS TAB ====================== -->
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
                      <span class="badge"
                            [class.bg-warning]="order.status === 'pending'"
                            [class.bg-success]="order.status === 'shipped'">
                        {{ order.status }}
                      </span>
                    </td>
                    <td>
                      <button *ngIf="order.status === 'pending'"
                              class="btn btn-success btn-sm"
                              (click)="onMarkShipped(order)">
                        Mark Shipped
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-template>
        </li>

        <!-- ====================== INVENTORY TAB ====================== -->
        <li [ngbNavItem]="3">
          <button ngbNavLink>Inventory</button>
          <ng-template ngbNavContent>
            <div class="mb-3">
              <input type="text" class="form-control" placeholder="Search inventory..."
                     [(ngModel)]="inventorySearch"
                     (ngModelChange)="onInventorySearch($event)"
                     [ngModelOptions]="{ standalone: true }" />
            </div>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead><tr><th>Name</th><th>Category</th><th class="text-end">Stock</th><th class="text-end">Variants</th></tr></thead>
                <tbody>
                  <tr *ngFor="let product of pagedInventory">
                    <td>{{ product.name }}</td>
                    <td>{{ product.category }}</td>
                    <td class="text-end"><span [class]="stockClass(product.stock)">{{ product.stock }}</span></td>
                    <td class="text-end text-muted small">
                      {{ product.variants.length > 0 ? product.variants.length + ' variants' : '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div *ngIf="totalInventoryPages > 1" class="d-flex justify-content-center gap-2 mt-3">
              <button class="btn btn-outline-secondary btn-sm"
                      [disabled]="inventoryPage === 0"
                      (click)="inventoryPage = inventoryPage - 1">Prev</button>
              <span class="align-self-center small">Page {{ inventoryPage + 1 }} / {{ totalInventoryPages }}</span>
              <button class="btn btn-outline-secondary btn-sm"
                      [disabled]="inventoryPage >= totalInventoryPages - 1"
                      (click)="inventoryPage = inventoryPage + 1">Next</button>
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
  private modal = inject(NgbModal);
  private toastr = inject(ToastrService);

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
      if (user) this.store.dispatch(loadOrdersRequest({ userId: user.id }));
    });
  }

  ngOnInit(): void {
    this.store.dispatch(loadProductsRequest());
    this.store.select(selectCategories).pipe(take(1)).subscribe((cats) => {
      if (cats.length === 0) this.store.dispatch(loadCategoriesRequest());
    });
  }

  // ------------------------------------------------------------------
  // Variant management
  // ------------------------------------------------------------------

  openVariantManager(product: Product): void {
    const modalRef = this.modal.open(VariantManagerComponent, { size: 'lg', scrollable: true });
    const instance = modalRef.componentInstance as VariantManagerComponent;
    instance.product = product;
    instance.onUpdated = () => this.store.dispatch(loadProductsRequest());
  }

  // ------------------------------------------------------------------
  // Filtering / pagination
  // ------------------------------------------------------------------

  get filteredProducts(): Product[] {
    return this.allProducts.filter((p) =>
      p.name.toLowerCase().includes(this.productSearch.toLowerCase())
    );
  }

  get pagedProducts(): Product[] {
    return this.filteredProducts.slice(
      this.productPage * this.PAGE_SIZE, (this.productPage + 1) * this.PAGE_SIZE
    );
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
    return this.filteredInventory.slice(
      this.inventoryPage * this.PAGE_SIZE, (this.inventoryPage + 1) * this.PAGE_SIZE
    );
  }

  get totalInventoryPages(): number {
    return Math.max(1, Math.ceil(this.filteredInventory.length / this.PAGE_SIZE));
  }

  stockClass(qty: number): string {
    if (qty < 10) return 'badge bg-danger';
    if (qty <= 30) return 'badge bg-warning text-dark';
    return 'badge bg-success';
  }

  onProductSearch(val: string): void { this.productSearch = val; this.productPage = 0; }
  onInventorySearch(val: string): void { this.inventorySearch = val; this.inventoryPage = 0; }

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
        id: '', images: [], rating: 0, ratingCount: 0,
        specs: {}, reviews: [], variants: [],
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
    this.store.dispatch(updateOrderStatusRequest({
      orderId: order.id, status: 'shipped' as OrderStatus,
    }));
  }
}
