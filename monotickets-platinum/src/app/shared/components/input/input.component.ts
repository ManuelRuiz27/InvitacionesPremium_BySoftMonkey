import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label *ngIf="label">
        {{ label }}
        <span *ngIf="required" class="text-red-500">*</span>
      </mat-label>
      <input
        matInput
        [id]="id"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [(ngModel)]="value"
        (blur)="onTouched()"
        (input)="onChange($any($event.target).value)"
      />
      <mat-hint *ngIf="helperText && !error">{{ helperText }}</mat-hint>
      <mat-error *ngIf="error">{{ error }}</mat-error>
    </mat-form-field>
  `,
  styles: [`
    .w-full {
      width: 100%;
    }
  `]
})
export class InputComponent implements ControlValueAccessor {
  @Input() id = `input-${Math.random().toString(36).substr(2, 9)}`;
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' | 'tel' | 'number' | 'datetime-local' = 'text';
  @Input() placeholder = '';
  @Input() helperText = '';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;

  value = '';

  onChange: any = () => { };
  onTouched: any = () => { };

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
