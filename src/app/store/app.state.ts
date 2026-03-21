import { ActionReducer, MetaReducer } from '@ngrx/store';
import { localStorageSync } from 'ngrx-store-localstorage';
import { authReducer, AuthState } from './auth/auth.reducer';
import { cartReducer, CartState } from './cart/cart.reducer';
import { currencyReducer, CurrencyState } from './currency/currency.reducer';
import { ordersReducer, OrdersState } from './orders/orders.reducer';
import { productsReducer, ProductsState } from './products/products.reducer';
import { themeReducer, ThemeState } from './theme/theme.reducer';

export interface RootState {
  auth: AuthState;
  cart: CartState;
  currency: CurrencyState;
  orders: OrdersState;
  products: ProductsState;
  theme: ThemeState;
}

export const reducers = {
  auth: authReducer,
  cart: cartReducer,
  currency: currencyReducer,
  orders: ordersReducer,
  products: productsReducer,
  theme: themeReducer,
};

export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return localStorageSync({
    keys: [{ auth: ['user', 'token'] }, { cart: ['items'] }, 'currency', 'theme'],
    rehydrate: true,
    storageKeySerializer: (key) => `ecom_${key}`,
  })(reducer);
}

export const metaReducers: MetaReducer[] = [localStorageSyncReducer];
