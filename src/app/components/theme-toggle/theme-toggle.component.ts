import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgIf } from '@angular/common';
import { toggleTheme } from '../../store/theme/theme.actions';
import { selectTheme } from '../../store/theme/theme.selectors';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [AsyncPipe, NgIf],
  template: `
    <button
      class="btn btn-outline-secondary btn-sm"
      (click)="toggle()"
      [title]="(theme$ | async) === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <span *ngIf="(theme$ | async) === 'dark'">☀️</span>
      <span *ngIf="(theme$ | async) !== 'dark'">🌙</span>
    </button>
  `,
})
export class ThemeToggleComponent {
  private store = inject(Store);
  theme$ = this.store.select(selectTheme);

  toggle(): void {
    this.store.dispatch(toggleTheme());
  }
}
