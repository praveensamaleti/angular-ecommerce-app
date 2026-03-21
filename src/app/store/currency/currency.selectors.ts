import { createSelector, createFeatureSelector } from '@ngrx/store';
import type { CurrencyState } from './currency.reducer';

export const selectCurrencyState = createFeatureSelector<CurrencyState>('currency');
export const selectCurrency = createSelector(selectCurrencyState, (s) => s.currency);
