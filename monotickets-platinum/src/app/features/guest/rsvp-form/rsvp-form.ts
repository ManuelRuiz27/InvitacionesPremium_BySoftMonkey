import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { GuestService, type RsvpData } from '../services/guest';

@Component({
  selector: 'app-rsvp-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './rsvp-form.html',
  styleUrl: './rsvp-form.scss'
})
export class RsvpForm implements OnInit {
  rsvpForm!: FormGroup;
  inviteCode: string = '';
  loading = false;
  submitted = false;
  qrGenerated = false;

  constructor(
    private fb: FormBuilder,
    private guestService: GuestService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.inviteCode = this.route.snapshot.paramMap.get('inviteCode') || '';

    this.rsvpForm = this.fb.group({
      rsvpStatus: ['CONFIRMED', Validators.required],
      guestCount: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      notes: ['', Validators.maxLength(500)]
    });

    // Disable guestCount if declined
    this.rsvpForm.get('rsvpStatus')?.valueChanges.subscribe(status => {
      if (status === 'DECLINED') {
        this.rsvpForm.get('guestCount')?.disable();
        this.rsvpForm.get('guestCount')?.setValue(0);
      } else {
        this.rsvpForm.get('guestCount')?.enable();
        this.rsvpForm.get('guestCount')?.setValue(1);
      }
    });
  }

  onSubmit(): void {
    if (this.rsvpForm.invalid) {
      Object.keys(this.rsvpForm.controls).forEach(key => {
        this.rsvpForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formValue = this.rsvpForm.value;

    const rsvpData: RsvpData = {
      rsvpStatus: formValue.rsvpStatus,
      guestCount: formValue.rsvpStatus === 'CONFIRMED' ? formValue.guestCount : 0,
      notes: formValue.notes
    };

    this.guestService.confirmRsvp(this.inviteCode, rsvpData).subscribe({
      next: (response) => {
        this.submitted = true;
        this.qrGenerated = response.qrGenerated;
        this.loading = false;

        // Redirect to QR display if confirmed
        if (response.qrGenerated) {
          setTimeout(() => {
            this.router.navigate(['/i', this.inviteCode, 'qr']);
          }, 2000);
        } else {
          // Redirect to landing if declined
          setTimeout(() => {
            this.router.navigate(['/i', this.inviteCode]);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Error confirming RSVP:', error);
        alert('Error al confirmar asistencia. Intenta nuevamente.');
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/i', this.inviteCode]);
  }

  isConfirming(): boolean {
    return this.rsvpForm.get('rsvpStatus')?.value === 'CONFIRMED';
  }
}
