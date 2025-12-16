import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

@Component({
    selector: 'app-badge',
    standalone: true,
    imports: [CommonModule, MatChipsModule],
    template: `
    <mat-chip [class]="getBadgeClass()">
      <ng-content></ng-content>
    </mat-chip>
  `,
    styles: [`
    mat-chip {
      font-size: 0.75rem;
      height: auto;
      min-height: 24px;
    }
  `]
})
export class BadgeComponent {
    @Input() variant: BadgeVariant = 'default';
    @Input() size: 'sm' | 'md' = 'md';

    getBadgeClass(): string {
        const variantClasses: Record<BadgeVariant, string> = {
            default: 'bg-gray-100',
            success: 'bg-green-100',
            warning: 'bg-yellow-100',
            error: 'bg-red-100',
            info: 'bg-blue-100',
        };
        return variantClasses[this.variant];
    }
}
