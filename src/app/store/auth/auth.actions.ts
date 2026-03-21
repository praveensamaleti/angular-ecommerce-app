import { createAction, props } from '@ngrx/store';
import type { User } from '../../models/domain';

export const loginRequest = createAction(
  '[Auth] Login Request',
  props<{ email: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User; token: string; refreshToken: string }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const registerRequest = createAction(
  '[Auth] Register Request',
  props<{ name: string; email: string; password: string }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ user: User; token: string; refreshToken: string }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

export const logoutRequest = createAction('[Auth] Logout Request');

export const logoutSuccess = createAction('[Auth] Logout Success');

export const clearError = createAction('[Auth] Clear Error');

export const forceLogout = createAction('[Auth] Force Logout');

export const updateProfile = createAction(
  '[Auth] Update Profile',
  props<{ name?: string; email?: string }>()
);
