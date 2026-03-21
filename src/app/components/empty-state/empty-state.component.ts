import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="text-center py-5">
      <h4 class="mb-2">{{ title }}</h4>
      <p class="text-muted mb-4">{{ description }}</p>
      <button *ngIf="actionLabel" class="btn btn-primary" (click)="action.emit()">
        {{ actionLabel }}
      </button>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here';
  @Input() description = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
