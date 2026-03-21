import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [RouterLink, NgIf],
  template: `
    <div class="container py-5 text-center">
      <div class="mb-4" style="font-size: 4rem;">✅</div>
      <h2 class="mb-3">Order Placed Successfully!</h2>
      <p class="text-muted mb-1">Thank you for your purchase.</p>
      <p *ngIf="orderId" class="text-muted">Order ID: <strong>{{ orderId }}</strong></p>
      <div class="d-flex gap-3 justify-content-center mt-4">
        <a routerLink="/profile" class="btn btn-outline-primary">View Orders</a>
        <a routerLink="/products" class="btn btn-primary">Continue Shopping</a>
      </div>
    </div>
  `,
})
export class OrderSuccessComponent {
  private router = inject(Router);
  orderId: string | null = null;

  constructor() {
    const nav = this.router.getCurrentNavigation();
    this.orderId = nav?.extras?.state?.['orderId'] ?? null;
  }
}
