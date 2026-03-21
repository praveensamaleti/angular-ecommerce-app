import { createReducer, on } from '@ngrx/store';
import * as ThemeActions from './theme.actions';

export interface ThemeState {
  theme: 'light' | 'dark';
}

export const initialThemeState: ThemeState = {
  theme: 'light',
};

export const themeReducer = createReducer(
  initialThemeState,
  on(ThemeActions.setTheme, (state, { theme }) => ({ ...state, theme })),
  on(ThemeActions.toggleTheme, (state) => ({
    ...state,
    theme: (state.theme === 'light' ? 'dark' : 'light') as 'light' | 'dark',
  }))
);
