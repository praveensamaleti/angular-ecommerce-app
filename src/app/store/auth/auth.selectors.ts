import { createSelector, createFeatureSelector } from '@ngrx/store';
import type { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(selectAuthState, (s) => s.user);
export const selectToken = createSelector(selectAuthState, (s) => s.token);
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.isLoading);
export const selectAuthError = createSelector(selectAuthState, (s) => s.error);
export const selectIsAdmin = createSelector(selectUser, (u) => u?.role === 'admin');
export const selectIsLoggedIn = createSelector(selectUser, (u) => u !== null);
