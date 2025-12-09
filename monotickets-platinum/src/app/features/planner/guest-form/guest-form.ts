import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { GuestsService } from '../services/guests.service';

@Component({
  selector: 'app-guest-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './guest-form.html',
  styleUrl: './guest-form.scss'
})
export class GuestForm implements OnInit {
  guestForm!: FormGroup;
  loading = false;
  isEditMode = false;
  eventId: string = '';
  guestId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private guestsService: GuestsService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    this.guestId = this.route.snapshot.paramMap.get('guestId');
    this.isEditMode = !!this.guestId;

    this.initForm();

    if (this.isEditMode && this.guestId) {
      this.loadGuest(this.guestId);
    }
  }

  initForm(): void {
    this.guestForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.email]],
      notes: ['']
    });
  }

  loadGuest(guestId: string): void {
    this.loading = true;
    this.guestsService.getGuestById(this.eventId, guestId).subscribe({
      next: (guest) => {
        this.guestForm.patchValue({
          fullName: guest.fullName,
          phone: guest.phone,
          email: guest.email,
          notes: guest.notes
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading guest:', error);
        alert('Error al cargar invitado');
        this.goBack();
      }
    });
  }

  onSubmit(): void {
    if (this.guestForm.invalid) {
      Object.keys(this.guestForm.controls).forEach(key => {
        this.guestForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formValue = this.guestForm.value;

    if (this.isEditMode && this.guestId) {
      this.guestsService.updateGuest(this.eventId, this.guestId, formValue).subscribe({
        next: () => {
          alert('Invitado actualizado exitosamente');
          this.goBack();
        },
        error: (error) => {
          console.error('Error updating guest:', error);
          alert('Error al actualizar invitado');
          this.loading = false;
        }
      });
    } else {
      this.guestsService.createGuest(this.eventId, formValue).subscribe({
        next: () => {
          alert('Invitado creado exitosamente');
          this.goBack();
        },
        error: (error) => {
          console.error('Error creating guest:', error);
          alert('Error al crear invitado');
          this.loading = false;
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/planner/events', this.eventId, 'guests']);
  }
}
