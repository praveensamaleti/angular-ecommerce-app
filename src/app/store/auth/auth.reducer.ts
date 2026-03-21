import { createReducer, on } from '@ngrx/store';
import type { User } from '../../models/domain';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.loginRequest, AuthActions.registerRequest, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  on(AuthActions.loginSuccess, AuthActions.registerSuccess, (state, { user, token }) => ({
    ...state,
    isLoading: false,
    user,
    token,
    error: null,
  })),
  on(AuthActions.loginFailure, AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),
  on(AuthActions.logoutRequest, (state) => ({
    ...state,
    isLoading: true,
  })),
  on(AuthActions.logoutSuccess, AuthActions.forceLogout, () => ({
    ...initialAuthState,
  })),
  on(AuthActions.clearError, (state) => ({
    ...state,
    error: null,
  })),
  on(AuthActions.updateProfile, (state, { name, email }) => ({
    ...state,
    user: state.user
      ? { ...state.user, ...(name !== undefined ? { name } : {}), ...(email !== undefined ? { email } : {}) }
      : null,
  }))
);
