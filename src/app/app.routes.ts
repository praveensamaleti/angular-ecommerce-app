import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.component').then((m) => m.ProductsComponent),
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.component').then((m) => m.ProductDetailComponent),
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'order-success',
    loadComponent: () => import('./pages/order-success/order-success.component').then((m) => m.OrderSuccessComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
