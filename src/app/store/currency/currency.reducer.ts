import { createReducer, on } from '@ngrx/store';
import type { CurrencyCode } from '../../models/domain';
import * as CurrencyActions from './currency.actions';

export interface CurrencyState {
  currency: CurrencyCode;
}

export const initialCurrencyState: CurrencyState = {
  currency: 'USD',
};

export const currencyReducer = createReducer(
  initialCurrencyState,
  on(CurrencyActions.setCurrency, (state, { currency }) => ({ ...state, currency }))
);
