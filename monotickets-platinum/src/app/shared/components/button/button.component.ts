import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <button
      mat-raised-button
      [color]="getMatColor()"
      [type]="type"
      [disabled]="disabled || isLoading"
      [class.w-full]="fullWidth"
      (click)="handleClick($event)"
    >
      <mat-spinner *ngIf="isLoading" diameter="20" class="inline-block mr-2"></mat-spinner>
      <ng-content *ngIf="!isLoading" select="[leftIcon]"></ng-content>
      <ng-content></ng-content>
      <ng-content *ngIf="!isLoading" select="[rightIcon]"></ng-content>
    </button>
  `,
  styles: [`
    .w-full {
      width: 100%;
    }
    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() isLoading = false;
  @Input() fullWidth = false;
  @Output() clicked = new EventEmitter<Event>();

  getMatColor(): 'primary' | 'accent' | 'warn' | undefined {
    switch (this.variant) {
      case 'primary':
      case 'secondary':
        return 'primary';
      case 'danger':
        return 'warn';
      default:
        return undefined;
    }
  }

  handleClick(event: Event): void {
    if (!this.disabled && !this.isLoading) {
      this.clicked.emit(event);
    }
  }
}
