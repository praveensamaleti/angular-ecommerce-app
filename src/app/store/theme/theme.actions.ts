import { createAction, props } from '@ngrx/store';

export const setTheme = createAction(
  '[Theme] Set Theme',
  props<{ theme: 'light' | 'dark' }>()
);

export const toggleTheme = createAction('[Theme] Toggle Theme');
