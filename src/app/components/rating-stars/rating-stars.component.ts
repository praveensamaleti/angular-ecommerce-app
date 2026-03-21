import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="rating-stars d-inline-flex align-items-center gap-1">
      <ng-container *ngFor="let star of stars">
        <span [class]="star"></span>
      </ng-container>
      <small class="text-muted ms-1" *ngIf="count !== undefined">({{ count }})</small>
    </span>
  `,
  styles: [`
    .full::before { content: '★'; color: #ffc107; }
    .half::before { content: '½'; color: #ffc107; }
    .empty::before { content: '☆'; color: #ccc; }
  `],
})
export class RatingStarsComponent {
  @Input() rating = 0;
  @Input() count?: number;

  get stars(): string[] {
    const result: string[] = [];
    for (let i = 1; i <= 5; i++) {
      if (this.rating >= i) result.push('full');
      else if (this.rating >= i - 0.5) result.push('half');
      else result.push('empty');
    }
    return result;
  }
}
