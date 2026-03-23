import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { EMPTY, fromEvent } from 'rxjs';
import { switchMap, map, catchError, tap, exhaustMap, withLatestFrom } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { StorageService } from '../../services/storage.service';
import * as AuthActions from './auth.actions';
import * as CartActions from '../cart/cart.actions';
import { selectCartItems } from '../cart/cart.selectors';
import { clearCart } from '../cart/cart.actions';
import type { User } from '../../models/domain';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private storage = inject(StorageService);
  private router = inject(Router);
  private store = inject(Store);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginRequest),
      exhaustMap(({ email, password }) =>
        this.api.post<{ user: User; token: string; refreshToken: string }>('/api/auth/login', { email, password }).pipe(
          map(({ user, token, refreshToken }) => {
            this.storage.setItem('token', token);
            this.storage.setItem('refreshToken', refreshToken);
            return AuthActions.loginSuccess({ user, token, refreshToken });
          }),
          catchError((err) => {
            const error = err?.error?.message || 'Invalid email or password.';
            return [AuthActions.loginFailure({ error })];
          })
        )
      )
    )
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerRequest),
      exhaustMap(({ name, email, password }) =>
        this.api.post<{ user: User; token: string; refreshToken: string }>('/api/auth/register', { name, email, password }).pipe(
          map(({ user, token, refreshToken }) => {
            this.storage.setItem('token', token);
            this.storage.setItem('refreshToken', refreshToken);
            return AuthActions.registerSuccess({ user, token, refreshToken });
          }),
          catchError((err) => {
            const error = err?.error?.message || 'Registration failed.';
            return [AuthActions.registerFailure({ error })];
          })
        )
      )
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutRequest),
      exhaustMap(() =>
        this.api.post('/api/auth/logout').pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => [AuthActions.logoutSuccess()])
        )
      )
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          this.storage.removeItem('token');
          this.storage.removeItem('refreshToken');
        })
      ),
    { dispatch: false }
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess, AuthActions.registerSuccess),
        tap(() => this.router.navigate(['/']))
      ),
    { dispatch: false }
  );

  authLogout$ = createEffect(() =>
    fromEvent<CustomEvent>(window, 'auth-logout').pipe(
      map(() => AuthActions.forceLogout())
    )
  );

  syncCartAfterLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess, AuthActions.registerSuccess),
      withLatestFrom(this.store.select(selectCartItems)),
      switchMap(([, items]) => {
        if (items.length > 0) {
          return [CartActions.syncCartRequest({ items })];
        }
        return [CartActions.fetchCartRequest()];
      })
    )
  );

  clearCartOnLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutSuccess, AuthActions.forceLogout),
      map(() => clearCart())
    )
  );
}
