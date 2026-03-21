import { createAction, props } from '@ngrx/store';
import type { CurrencyCode } from '../../models/domain';

export const setCurrency = createAction(
  '[Currency] Set Currency',
  props<{ currency: CurrencyCode }>()
);
