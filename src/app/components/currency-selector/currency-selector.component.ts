import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { setCurrency } from '../../store/currency/currency.actions';
import { selectCurrency } from '../../store/currency/currency.selectors';
import type { CurrencyCode } from '../../models/domain';

@Component({
  selector: 'app-currency-selector',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  template: `
    <select
      class="form-select form-select-sm"
      [ngModel]="currency$ | async"
      (ngModelChange)="onChange($event)"
      style="width: auto;"
    >
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="GBP">GBP</option>
      <option value="INR">INR</option>
      <option value="JPY">JPY</option>
    </select>
  `,
})
export class CurrencySelectorComponent {
  private store = inject(Store);
  currency$ = this.store.select(selectCurrency);

  onChange(currency: CurrencyCode): void {
    this.store.dispatch(setCurrency({ currency }));
  }
}
