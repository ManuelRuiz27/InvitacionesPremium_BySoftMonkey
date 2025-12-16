import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TemplateType } from '../../../core/models';

import {
  PlannerService,
  PlannerSettings,
  PlannerBrandDefaults
} from '../services/planner.service';

interface SettingsFormValue {
  preferredInviteMode: TemplateType;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

const DEFAULT_COLORS = {
  primary: '#1a1a1a',
  secondary: '#ffffff',
  accent: '#d4af37',
  background: '#f7f5f2'
};

@Component({
  selector: 'app-planner-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './planner-settings.html',
  styleUrl: './planner-settings.scss'
})
export class PlannerSettingsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly plannerService = inject(PlannerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly inviteModes = [
    { value: 'PDF', label: 'Invitación PDF estándar' },
    { value: 'PREMIUM', label: 'Landing Premium (digital)' }
  ];

  form = this.fb.nonNullable.group({
    preferredInviteMode: ['PDF' as SettingsFormValue['preferredInviteMode'], Validators.required],
    logoUrl: [''],
    contactEmail: ['', Validators.email],
    contactPhone: [''],
    primary: [DEFAULT_COLORS.primary, Validators.required],
    secondary: [DEFAULT_COLORS.secondary, Validators.required],
    accent: [DEFAULT_COLORS.accent, Validators.required],
    background: [DEFAULT_COLORS.background, Validators.required]
  });

  loading = true;
  saving = false;
  error: string | null = null;
  lastUpdated?: string;

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.error = null;
    this.plannerService.getPlannerSettings().subscribe({
      next: (settings) => {
        this.patchForm(settings);
        this.lastUpdated = settings.updatedAt;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading planner settings', err);
        this.error = 'No pudimos recuperar tu configuración. Intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  private patchForm(settings: PlannerSettings): void {
    const brand = settings.brandDefaults || {};
    const colors = brand.colors || {};
    this.form.patchValue({
      preferredInviteMode: (settings.preferredInviteMode || 'PDF') as SettingsFormValue['preferredInviteMode'],
      logoUrl: brand.logoUrl || '',
      contactEmail: brand.contactEmail || '',
      contactPhone: brand.contactPhone || '',
      primary: colors.primary || DEFAULT_COLORS.primary,
      secondary: colors.secondary || DEFAULT_COLORS.secondary,
      accent: colors.accent || DEFAULT_COLORS.accent,
      background: colors.background || DEFAULT_COLORS.background
    });
  }

  saveSettings(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = this.buildPayload();
    this.plannerService.updatePlannerSettings(payload).subscribe({
      next: (settings) => {
        this.saving = false;
        this.lastUpdated = settings.updatedAt;
        this.snackBar.open('Configuración actualizada', 'OK', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error updating settings', err);
        this.saving = false;
        this.snackBar.open('No se pudo guardar. Intenta nuevamente.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  resetBranding(): void {
    this.form.patchValue({
      primary: DEFAULT_COLORS.primary,
      secondary: DEFAULT_COLORS.secondary,
      accent: DEFAULT_COLORS.accent,
      background: DEFAULT_COLORS.background
    });
  }

  goBack(): void {
    this.router.navigate(['/planner/dashboard']);
  }

  private buildPayload(): {
    brandDefaults: PlannerBrandDefaults | null;
    preferredInviteMode: SettingsFormValue['preferredInviteMode'];
  } {
    const value = this.form.getRawValue();
    const colors = {
      primary: value.primary,
      secondary: value.secondary,
      accent: value.accent,
      background: value.background
    };

    const brandDefaults: PlannerBrandDefaults = {
      logoUrl: value.logoUrl?.trim() || undefined,
      contactEmail: value.contactEmail?.trim() || undefined,
      contactPhone: value.contactPhone?.trim() || undefined,
      colors
    };

    const hasBrandInfo = Boolean(
      brandDefaults.logoUrl ||
      brandDefaults.contactEmail ||
      brandDefaults.contactPhone ||
      Object.values(colors).some(color => !!color)
    );

    return {
      brandDefaults: hasBrandInfo ? brandDefaults : null,
      preferredInviteMode: value.preferredInviteMode
    };
  }

  get palettePreviewStyle(): Record<string, string> {
    const value = this.form.getRawValue();
    return {
      '--color-primary': value.primary,
      '--color-secondary': value.secondary,
      '--color-accent': value.accent,
      '--color-background': value.background
    };
  }
}
