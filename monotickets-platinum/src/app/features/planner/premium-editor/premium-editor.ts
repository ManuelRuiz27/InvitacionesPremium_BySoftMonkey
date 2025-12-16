import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PlannerService, PremiumConfig, PremiumEffect } from '../services/planner.service';

const DEFAULT_PREMIUM_CONFIG: PremiumConfig = {
  effect: 'FLIPBOOK',
  reduceMotion: false,
  palette: {
    primary: '#6B4EFF',
    secondary: '#F97316',
    accent: '#0EA5E9',
    background: '#FFFFFF'
  },
  cover: {
    title: 'Nombre del evento',
    subtitle: 'Fecha y lugar',
    imageUrl: ''
  },
  story: {
    text: '',
    photoUrls: []
  },
  gallery: {
    enabled: true,
    imageUrls: []
  },
  location: {
    enabled: true,
    address: '',
    mapUrl: ''
  },
  infoBlocks: [
    { title: '', details: '' },
    { title: '', details: '' }
  ],
  rsvp: {
    message: 'Confirma tu asistencia para reservar tu lugar.',
    buttonLabel: 'Confirmar asistencia'
  },
  access: {
    placeholder: 'Tu QR estará disponible el día del evento'
  }
};

interface PalettePreset {
  name: string;
  palette: { primary: string; secondary: string; accent: string; background: string };
}

@Component({
  selector: 'app-premium-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './premium-editor.html',
  styleUrl: './premium-editor.scss'
})
export class PremiumEditor implements OnInit {
  eventId = '';
  loading = true;
  saving = false;
  configForm: FormGroup;
  lastSaved?: Date;

  palettePresets: PalettePreset[] = [
    { name: 'Clásico', palette: { primary: '#442B74', secondary: '#F8B4B4', accent: '#FBBF24', background: '#FFFFFF' } },
    { name: 'Minimal', palette: { primary: '#0F172A', secondary: '#CBD5F5', accent: '#6366F1', background: '#F1F5F9' } },
    { name: 'Fiesta', palette: { primary: '#DB2777', secondary: '#F97316', accent: '#10B981', background: '#FFF7ED' } },
    { name: 'Oscuro', palette: { primary: '#F8FAFC', secondary: '#94A3B8', accent: '#C084FC', background: '#111827' } }
  ];

  constructor(
    private fb: FormBuilder,
    private plannerService: PlannerService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.configForm = this.fb.group({
      effect: ['FLIPBOOK' as PremiumEffect, Validators.required],
      reduceMotion: [false],
      palettePrimary: ['#6B4EFF', Validators.required],
      paletteSecondary: ['#F97316', Validators.required],
      paletteAccent: ['#0EA5E9', Validators.required],
      paletteBackground: ['#FFFFFF', Validators.required],
      coverTitle: ['', Validators.required],
      coverSubtitle: [''],
      coverImageUrl: [''],
      storyText: [''],
      storyPhoto1: [''],
      storyPhoto2: [''],
      galleryEnabled: [true],
      galleryImages: [''],
      locationEnabled: [true],
      locationAddress: [''],
      locationMapUrl: [''],
      info1Title: [''],
      info1Details: [''],
      info2Title: [''],
      info2Details: [''],
      rsvpMessage: ['Confirma tu asistencia para reservar tu lugar.'],
      rsvpButton: ['Confirmar asistencia'],
      accessPlaceholder: ['Tu QR estará disponible el día del evento']
    });
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    if (!this.eventId) {
      this.showSnack('Evento no encontrado');
      this.router.navigate(['/planner/events']);
      return;
    }
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading = true;
    this.plannerService.getPremiumConfig(this.eventId).subscribe({
      next: (config) => {
        this.patchForm(config || DEFAULT_PREMIUM_CONFIG);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading premium config', error);
        this.patchForm(DEFAULT_PREMIUM_CONFIG);
        this.loading = false;
        this.showSnack('No se pudo cargar la configuración premium. Usando valores base.');
      }
    });
  }

  patchForm(config: PremiumConfig): void {
    const galleryImages = config.gallery.imageUrls.join('\n');
    const info1 = config.infoBlocks[0] || { title: '', details: '' };
    const info2 = config.infoBlocks[1] || { title: '', details: '' };
    this.configForm.patchValue({
      effect: config.effect,
      reduceMotion: config.reduceMotion,
      palettePrimary: config.palette.primary,
      paletteSecondary: config.palette.secondary,
      paletteAccent: config.palette.accent,
      paletteBackground: config.palette.background || '#FFFFFF',
      coverTitle: config.cover.title,
      coverSubtitle: config.cover.subtitle,
      coverImageUrl: config.cover.imageUrl,
      storyText: config.story.text,
      storyPhoto1: config.story.photoUrls[0] || '',
      storyPhoto2: config.story.photoUrls[1] || '',
      galleryEnabled: config.gallery.enabled,
      galleryImages,
      locationEnabled: config.location.enabled,
      locationAddress: config.location.address,
      locationMapUrl: config.location.mapUrl,
      info1Title: info1.title,
      info1Details: info1.details,
      info2Title: info2.title,
      info2Details: info2.details,
      rsvpMessage: config.rsvp.message,
      rsvpButton: config.rsvp.buttonLabel,
      accessPlaceholder: config.access.placeholder
    });
  }

  applyPreset(preset: PalettePreset): void {
    this.configForm.patchValue({
      palettePrimary: preset.palette.primary,
      paletteSecondary: preset.palette.secondary,
      paletteAccent: preset.palette.accent,
      paletteBackground: preset.palette.background
    });
    this.validatePalette();
  }

  save(): void {
    this.validatePalette();
    if (this.configForm.invalid || !this.eventId) {
      this.configForm.markAllAsTouched();
      return;
    }
    const payload = this.mapFormToConfig();
    this.saving = true;
    this.plannerService.updatePremiumConfig(this.eventId, payload).subscribe({
      next: (updated) => {
        this.saving = false;
        this.lastSaved = new Date();
        this.showSnack('Configuración premium guardada');
        this.patchForm(updated);
      },
      error: (error) => {
        console.error('Error saving premium config', error);
        this.saving = false;
        this.showSnack('No se pudo guardar la configuración');
      }
    });
  }

  private validatePalette(): void {
    const { palettePrimary, paletteSecondary, paletteAccent, paletteBackground } = this.configForm.value;
    const problems: string[] = [];
    const combos: Array<[string, string, string]> = [
      ['principal-secundario', palettePrimary, paletteSecondary],
      ['principal-fondo', palettePrimary, paletteBackground],
      ['acento-fondo', paletteAccent, paletteBackground]
    ];

    combos.forEach(([label, colorA, colorB]) => {
      if (colorA && colorB && !this.hasAAContrast(colorA, colorB)) {
        problems.push(`Contraste insuficiente (${label})`);
      }
    });

    if (problems.length) {
      this.configForm.setErrors({ paletteContrast: problems });
    } else {
      const errors = this.configForm.errors || {};
      delete errors['paletteContrast'];
      if (Object.keys(errors).length) {
        this.configForm.setErrors(errors);
      } else {
        this.configForm.setErrors(null);
      }
    }
  }

  private hasAAContrast(hex1: string, hex2: string): boolean {
    const ratio = this.getContrastRatio(hex1, hex2);
    return ratio >= 4.5;
  }

  private getContrastRatio(hex1: string, hex2: string): number {
    const lum1 = this.relativeLuminance(hex1);
    const lum2 = this.relativeLuminance(hex2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  private relativeLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    const [r, g, b] = rgb.map(component => {
      const c = component / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private hexToRgb(hex: string): [number, number, number] {
    const cleaned = hex.replace('#', '');
    const bigint = parseInt(cleaned, 16);
    return [
      (bigint >> 16) & 255,
      (bigint >> 8) & 255,
      bigint & 255
    ];
  }

  private mapFormToConfig(): PremiumConfig {
    const value = this.configForm.value;
    const galleryImages = (value.galleryImages || '')
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => !!line);
    const storyPhotos = [value.storyPhoto1, value.storyPhoto2]
      .map((url: string) => url?.trim())
      .filter((url: string | undefined) => !!url) as string[];

    const infoBlocks = [
      { title: value.info1Title?.trim(), details: value.info1Details?.trim() },
      { title: value.info2Title?.trim(), details: value.info2Details?.trim() }
    ].filter(block => block.title || block.details)
      .map(block => ({ title: block.title || 'Detalle', details: block.details || '' }));

    return {
      effect: value.effect,
      reduceMotion: value.reduceMotion,
      palette: {
        primary: value.palettePrimary,
        secondary: value.paletteSecondary,
        accent: value.paletteAccent,
        background: value.paletteBackground
      },
      cover: {
        title: value.coverTitle,
        subtitle: value.coverSubtitle,
        imageUrl: value.coverImageUrl
      },
      story: {
        text: value.storyText,
        photoUrls: storyPhotos
      },
      gallery: {
        enabled: value.galleryEnabled,
        imageUrls: galleryImages
      },
      location: {
        enabled: value.locationEnabled,
        address: value.locationAddress,
        mapUrl: value.locationMapUrl
      },
      infoBlocks,
      rsvp: {
        message: value.rsvpMessage,
        buttonLabel: value.rsvpButton
      },
      access: {
        placeholder: value.accessPlaceholder
      }
    };
  }

  get previewPalette() {
    return {
      '--cover-bg': this.configForm.value.palettePrimary,
      '--accent': this.configForm.value.paletteAccent,
      '--secondary': this.configForm.value.paletteSecondary,
      '--background': this.configForm.value.paletteBackground
    };
  }

  get galleryPreview(): string[] {
    const images = this.configForm.value.galleryImages || '';
    return images
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => !!line)
      .slice(0, 5);
  }

  private showSnack(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }
}
