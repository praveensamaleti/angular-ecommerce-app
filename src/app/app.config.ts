import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { routes } from './app.routes';
import { reducers, metaReducers } from './store/app.state';
import { AuthEffects } from './store/auth/auth.effects';
import { OrdersEffects } from './store/orders/orders.effects';
import { ProductsEffects } from './store/products/products.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(reducers, { metaReducers }),
    provideEffects([AuthEffects, OrdersEffects, ProductsEffects]),
    provideAnimations(),
    importProvidersFrom(
      NgbModule,
      ToastrModule.forRoot({ positionClass: 'toast-top-right', timeOut: 3000 })
    ),
  ],
};
