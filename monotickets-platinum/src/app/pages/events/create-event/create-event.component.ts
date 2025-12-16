import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { EventsService, CreateEventDto } from '../../../core/services/events.service';

@Component({
    selector: 'app-create-event',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonComponent,
        InputComponent,
        CardComponent
    ],
    templateUrl: './create-event.component.html',
    styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent implements OnInit, OnDestroy {
    currentStep = 1;
    totalSteps = 4;
    isSubmitting = false;

    // Forms for each step
    basicInfoForm!: FormGroup;
    configForm!: FormGroup;

    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private eventsService: EventsService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initForms();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    initForms(): void {
        // Step 1: Basic Information
        this.basicInfoForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            date: ['', Validators.required],
            location: ['', Validators.required],
            description: ['']
        });

        // Step 2: Configuration
        this.configForm = this.fb.group({
            maxGuests: [1000, [Validators.required, Validators.min(1), Validators.max(1000)]],
            maxInvitations: [1000, [Validators.required, Validators.min(1), Validators.max(1000)]],
            template: ['PDF', Validators.required]
        });
    }

    get stepProgress(): number {
        return (this.currentStep / this.totalSteps) * 100;
    }

    get canGoNext(): boolean {
        switch (this.currentStep) {
            case 1:
                return this.basicInfoForm.valid;
            case 2:
                return this.configForm.valid;
            case 3:
                return true; // Preview step
            default:
                return false;
        }
    }

    nextStep(): void {
        if (this.canGoNext && this.currentStep < this.totalSteps) {
            this.currentStep++;
        }
    }

    previousStep(): void {
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    getEventData(): CreateEventDto {
        return {
            name: this.basicInfoForm.value.name,
            date: this.basicInfoForm.value.date,
            location: this.basicInfoForm.value.location,
            description: this.basicInfoForm.value.description || undefined,
        };
    }

    saveDraft(): void {
        this.isSubmitting = true;
        const eventData = this.getEventData();

        this.eventsService.createEvent(eventData)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (event) => {
                    console.log('Draft saved:', event);
                    this.router.navigate(['/dashboard']);
                },
                error: (error) => {
                    console.error('Error saving draft:', error);
                    this.isSubmitting = false;
                }
            });
    }

    publishEvent(): void {
        this.isSubmitting = true;
        const eventData = this.getEventData();

        // First create the event
        this.eventsService.createEvent(eventData)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (event) => {
                    // Then publish it
                    this.eventsService.publishEvent(event.id)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: (publishedEvent) => {
                                console.log('Event published:', publishedEvent);
                                this.router.navigate(['/events', publishedEvent.id]);
                            },
                            error: (error) => {
                                console.error('Error publishing event:', error);
                                this.isSubmitting = false;
                            }
                        });
                },
                error: (error) => {
                    console.error('Error creating event:', error);
                    this.isSubmitting = false;
                }
            });
    }

    cancel(): void {
        if (confirm('¿Estás seguro de que quieres cancelar? Se perderán los cambios.')) {
            this.router.navigate(['/dashboard']);
        }
    }

    // Helper methods for template
    getFieldError(form: FormGroup, field: string): string {
        const control = form.get(field);
        if (control?.hasError('required')) {
            return 'Este campo es requerido';
        }
        if (control?.hasError('minlength')) {
            return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
        }
        if (control?.hasError('min')) {
            return `Valor mínimo: ${control.errors?.['min'].min}`;
        }
        if (control?.hasError('max')) {
            return `Valor máximo: ${control.errors?.['max'].max}`;
        }
        return '';
    }

    hasError(form: FormGroup, field: string): boolean {
        const control = form.get(field);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }
}
