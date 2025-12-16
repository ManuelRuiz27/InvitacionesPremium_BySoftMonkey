import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription, debounceTime } from 'rxjs';

import { PlannerService } from '../services/planner.service';
import { EventType, TemplateType } from '../../../core/models';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './event-form.html',
  styleUrl: './event-form.scss'
})
export class EventForm implements OnInit, OnDestroy {
  eventForm!: FormGroup;
  loading = false;
  isEditMode = false;
  eventId: string | null = null;
  eventTypes = Object.values(EventType);
  templateTypes = TemplateType;
  inviteModes = [
    {
      type: TemplateType.PDF,
      title: 'Estándar PDF',
      description: 'Descarga lista para imprimir o compartir como archivo.',
      icon: 'picture_as_pdf'
    },
    {
      type: TemplateType.PREMIUM,
      title: 'Premium (Landing)',
      description: 'Landing animada tipo flipbook con personalización avanzada.',
      icon: 'phone_iphone'
    }
  ];
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  lastSavedAt?: Date;
  rsvpLink?: string;
  hostLink?: string;
  generatingRsvpLink = false;
  generatingHostLink = false;
  private formChangesSub?: Subscription;
  private isPatchingForm = false;
  private autoSaveEnabled = false;
  private pendingCreation = false;

  constructor(
    private fb: FormBuilder,
    private plannerService: PlannerService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.eventId;

    this.initForm();

    if (this.isEditMode && this.eventId) {
      this.loadEvent(this.eventId);
    } else {
      this.autoSaveEnabled = false;
    }

    this.formChangesSub = this.eventForm.valueChanges
      .pipe(debounceTime(800))
      .subscribe(() => this.handleAutoSave());
  }

  ngOnDestroy(): void {
    this.formChangesSub?.unsubscribe();
  }

  initForm(): void {
    this.eventForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      locationText: ['', Validators.required],
      locationLat: [null],
      locationLng: [null],
      templateType: ['PREMIUM', Validators.required],
      templateVariant: ['elegant-rose'],
      guestCountDefault: [2, [Validators.min(1), Validators.max(10)]],
      allowPartialEntry: [true]
    });
  }

  loadEvent(id: string): void {
    this.loading = true;
    this.isPatchingForm = true;
    this.plannerService.getEventById(id).subscribe({
      next: (event) => {
        this.eventForm.patchValue({
          name: event.name,
          type: event.type,
          date: new Date(event.date),
          time: event.time,
          locationText: event.locationText,
          locationLat: event.locationLat,
          locationLng: event.locationLng,
          templateType: event.templateType,
          templateVariant: event.templateVariant,
          guestCountDefault: event.guestCountDefault || 2,
          allowPartialEntry: event.allowPartialEntry ?? true
        });
        this.rsvpLink = event.rsvpFormUrl || undefined;
        this.hostLink = event.hostFormUrl || undefined;
        this.autoSaveEnabled = true;
        this.autoSaveStatus = 'saved';
        this.lastSavedAt = new Date();
        this.loading = false;
        this.isPatchingForm = false;
      },
      error: (error) => {
        console.error('Error loading event:', error);
        alert('Error al cargar el evento');
        this.goBack();
        this.isPatchingForm = false;
      }
    });
  }

  getTypeLabel(type: EventType): string {
    const labels: Record<EventType, string> = {
      [EventType.BODA]: 'Boda',
      [EventType.XV]: 'XV Años',
      [EventType.GRADUACION]: 'Graduación',
      [EventType.BAUTIZO]: 'Bautizo',
      [EventType.BABY_SHOWER]: 'Baby Shower',
      [EventType.ANIVERSARIO]: 'Aniversario',
      [EventType.COMUNION]: 'Comunión',
      [EventType.SOCIAL]: 'Social'
    };
    return labels[type] || type;
  }

  selectInviteMode(mode: TemplateType): void {
    this.eventForm.patchValue({ templateType: mode });
  }

  goBack(): void {
    this.router.navigate(['/planner/events']);
  }

  navigateToGuests(): void {
    if (!this.ensureEventReady()) return;
    this.router.navigate(['/planner/events', this.eventId, 'guests']);
  }

  navigateToGuestUpload(): void {
    if (!this.ensureEventReady()) return;
    this.router.navigate(['/planner/events', this.eventId, 'guests', 'upload']);
  }

  openRsvpGenerator(): void {
    if (!this.ensureEventReady()) return;
    this.generatingRsvpLink = true;
    this.plannerService.generateRsvpLink(this.eventId!).subscribe({
      next: (response) => {
        this.rsvpLink = response.publicUrl;
        this.generatingRsvpLink = false;
        this.showSnack('Link RSVP generado. Nada se envía sin tu confirmación.');
      },
      error: (error) => {
        console.error('Error generating RSVP link', error);
        this.generatingRsvpLink = false;
        this.showSnack('No se pudo generar el link RSVP', 'Reintentar');
      }
    });
  }

  openHostLinkGenerator(): void {
    if (!this.ensureEventReady()) return;
    this.generatingHostLink = true;
    this.plannerService.generateHostLink(this.eventId!).subscribe({
      next: (response) => {
        this.hostLink = response.publicUrl;
        this.generatingHostLink = false;
        this.showSnack('Link de anfitriones generado.');
      },
      error: (error) => {
        console.error('Error generating host link', error);
        this.generatingHostLink = false;
        this.showSnack('No se pudo generar el link de anfitriones', 'Reintentar');
      }
    });
  }

  copyLink(link?: string): void {
    if (!link) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        this.showSnack('Link copiado al portapapeles');
      });
    } else {
      this.showSnack('No se pudo copiar automáticamente. Selecciona el texto manualmente.');
    }
  }

  generateInvitations(): void {
    if (!this.ensureEventReady()) return;
    this.router.navigate(['/planner/events', this.eventId, 'invitations', 'generate']);
  }

  goToTemplateCatalog(): void {
    if (!this.ensureEventReady()) return;
    this.router.navigate(['/planner/events', this.eventId, 'templates']);
  }

  get isAutosaveInProgress(): boolean {
    return this.autoSaveStatus === 'saving' || this.pendingCreation;
  }

  private handleAutoSave(): void {
    if (this.loading || this.isPatchingForm) return;
    if (!this.eventForm.valid) return;

    if (!this.eventId) {
      if (this.isEventDetailsValid() && !this.pendingCreation) {
        this.createDraftEvent();
      }
      return;
    }

    if (!this.autoSaveEnabled) {
      this.autoSaveEnabled = true;
    }

    if (!this.autoSaveEnabled) return;

    this.autoSaveStatus = 'saving';
    this.plannerService.updateEvent(this.eventId, this.buildPayload()).subscribe({
      next: () => {
        this.autoSaveStatus = 'saved';
        this.lastSavedAt = new Date();
      },
      error: (error) => {
        console.error('AutoSave error', error);
        this.autoSaveStatus = 'error';
      }
    });
  }

  private createDraftEvent(): void {
    this.pendingCreation = true;
    this.autoSaveStatus = 'saving';
    this.plannerService.createEvent(this.buildPayload()).subscribe({
      next: (event) => {
        this.pendingCreation = false;
        this.autoSaveStatus = 'saved';
        this.lastSavedAt = new Date();
        this.eventId = event.id;
        this.isEditMode = true;
        this.autoSaveEnabled = true;
        this.showSnack('Borrador creado. Nada se envía sin tu confirmación.');
        this.router.navigate(['/planner/events', event.id, 'edit'], { replaceUrl: true });
      },
      error: (error) => {
        console.error('Error creating draft', error);
        this.pendingCreation = false;
        this.autoSaveStatus = 'error';
        this.showSnack('No se pudo guardar el borrador');
      }
    });
  }

  private isEventDetailsValid(): boolean {
    const requiredFields = ['name', 'type', 'date', 'time', 'locationText'];
    return requiredFields.every(field => this.eventForm.get(field)?.valid);
  }

  private buildPayload() {
    const formValue = this.eventForm.getRawValue();
    return {
      name: formValue.name,
      type: formValue.type,
      date: formValue.date,
      time: formValue.time,
      locationText: formValue.locationText,
      locationLat: formValue.locationLat,
      locationLng: formValue.locationLng,
      templateType: formValue.templateType,
      templateVariant: formValue.templateVariant,
      guestCountDefault: formValue.guestCountDefault,
      allowPartialEntry: formValue.allowPartialEntry
    };
  }

  private ensureEventReady(): boolean {
    if (this.eventId) return true;
    if (!this.isEventDetailsValid()) {
      this.showSnack('Completa los datos del evento para habilitar esta acción.');
      return false;
    }
    this.showSnack('Guardando borrador. Intenta nuevamente en unos segundos.');
    return false;
  }

  private showSnack(message: string, action: string = 'OK'): void {
    this.snackBar.open(message, action, { duration: 3000 });
  }
}
