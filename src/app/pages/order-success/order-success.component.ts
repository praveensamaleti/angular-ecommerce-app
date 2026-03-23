import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [RouterLink, NgIf],
  template: `
    <div class="success-wrap">
      <div class="success-card">
        <div class="success-icon-ring" aria-hidden="true">✓</div>

        <h1 class="success-card__title">Order confirmed!</h1>
        <p style="color:var(--ec-muted);margin-bottom:{{ orderId ? '0.35rem' : '2rem' }}">
          Your purchase was placed successfully.
        </p>
        <p *ngIf="orderId"
           class="mb-4"
           style="font-size:0.875rem;color:var(--ec-muted);background:rgba(37,99,235,0.07);border:1px solid rgba(37,99,235,0.15);border-radius:8px;padding:0.5rem 0.9rem;display:inline-block">
          Order ID: <strong style="color:var(--ec-body-color)">#{{ orderId }}</strong>
        </p>

        <div class="d-flex gap-3 justify-content-center flex-wrap mt-2">
          <a routerLink="/products" class="btn btn-primary">Continue shopping</a>
          <a routerLink="/profile" class="btn btn-outline-primary">View orders</a>
        </div>
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
