import { Pipe, PipeTransform, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { selectCurrency } from '../store/currency/currency.selectors';
import { formatMoney } from '../services/money.service';

@Pipe({
  name: 'currencyFormat',
  standalone: true,
  pure: false,
})
export class CurrencyFormatPipe implements PipeTransform {
  private store = inject(Store);

  transform(value: number): Observable<string> {
    return this.store.select(selectCurrency).pipe(
      map((currency) => formatMoney(value, currency))
    );
  }
}
