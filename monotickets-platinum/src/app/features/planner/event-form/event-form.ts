import { Component, OnInit } from '@angular/core';
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

import { PlannerService } from '../services/planner.service';
import { EventType } from '../../../core/models';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './event-form.html',
  styleUrl: './event-form.scss'
})
export class EventForm implements OnInit {
  eventForm!: FormGroup;
  loading = false;
  isEditMode = false;
  eventId: string | null = null;
  eventTypes = Object.values(EventType);

  constructor(
    private fb: FormBuilder,
    private plannerService: PlannerService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.eventId;

    this.initForm();

    if (this.isEditMode && this.eventId) {
      this.loadEvent(this.eventId);
    }
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
      templateVariant: ['elegant-rose']
    });
  }

  loadEvent(id: string): void {
    this.loading = true;
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
          templateVariant: event.templateVariant
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading event:', error);
        alert('Error al cargar el evento');
        this.goBack();
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

  onSubmit(): void {
    if (this.eventForm.invalid) {
      Object.keys(this.eventForm.controls).forEach(key => {
        this.eventForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formValue = this.eventForm.value;

    if (this.isEditMode && this.eventId) {
      this.plannerService.updateEvent(this.eventId, formValue).subscribe({
        next: () => {
          alert('Evento actualizado exitosamente');
          this.router.navigate(['/planner/events']);
        },
        error: (error) => {
          console.error('Error updating event:', error);
          alert('Error al actualizar el evento');
          this.loading = false;
        }
      });
    } else {
      this.plannerService.createEvent(formValue).subscribe({
        next: () => {
          alert('Evento creado exitosamente');
          this.router.navigate(['/planner/events']);
        },
        error: (error) => {
          console.error('Error creating event:', error);
          alert('Error al crear el evento');
          this.loading = false;
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/planner/events']);
  }
}
