import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card [class]="getCardClass()">
      <mat-card-header *ngIf="title || subtitle">
        <mat-card-title *ngIf="title">{{ title }}</mat-card-title>
        <mat-card-subtitle *ngIf="subtitle">{{ subtitle }}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <ng-content></ng-content>
      </mat-card-content>
      
      <mat-card-actions *ngIf="hasFooter">
        <ng-content select="[footer]"></ng-content>
      </mat-card-actions>
    </mat-card>
  `,
  styles: []
})
export class CardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() shadow: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() hasFooter = false;

  getCardClass(): string {
    return `elevation-${this.shadow === 'none' ? '0' : this.shadow === 'sm' ? '2' : this.shadow === 'md' ? '4' : '8'}`;
  }
}
