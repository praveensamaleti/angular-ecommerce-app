import { createSelector, createFeatureSelector } from '@ngrx/store';
import type { ThemeState } from './theme.reducer';

export const selectThemeState = createFeatureSelector<ThemeState>('theme');
export const selectTheme = createSelector(selectThemeState, (s) => s.theme);
