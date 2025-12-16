import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { GuestsService, ImportResult, ImportError } from '../../../core/services/guests.service';

@Component({
    selector: 'app-import-guests',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatSnackBarModule
    ],
    templateUrl: './import-guests.component.html',
    styleUrls: ['./import-guests.component.css']
})
export class ImportGuestsComponent implements OnInit, OnDestroy {
    eventId: string = '';
    selectedFile: File | null = null;
    isDragging = false;
    isUploading = false;
    importResult: ImportResult | null = null;
    displayedColumns: string[] = ['row', 'field', 'value', 'reason'];

    private destroy$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private guestsService: GuestsService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.eventId = this.route.snapshot.paramMap.get('id') || '';
        if (!this.eventId) {
            this.router.navigate(['/dashboard']);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleFile(input.files[0]);
        }
    }

    handleFile(file: File): void {
        // Validate file type
        const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
            this.snackBar.open('Por favor selecciona un archivo CSV', 'Cerrar', { duration: 3000 });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.snackBar.open('El archivo es demasiado grande (máx 5MB)', 'Cerrar', { duration: 3000 });
            return;
        }

        this.selectedFile = file;
        this.importResult = null;
    }

    uploadFile(): void {
        if (!this.selectedFile) return;

        this.isUploading = true;
        this.guestsService.importGuests(this.eventId, this.selectedFile)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    this.importResult = result;
                    this.isUploading = false;

                    if (result.created > 0) {
                        this.snackBar.open(
                            `✓ ${result.created} invitados importados correctamente`,
                            'Cerrar',
                            { duration: 5000 }
                        );
                    }

                    if (result.invalid > 0) {
                        this.snackBar.open(
                            `⚠ ${result.invalid} filas con errores`,
                            'Ver Errores',
                            { duration: 5000 }
                        );
                    }
                },
                error: (error) => {
                    console.error('Error importing guests:', error);
                    this.isUploading = false;
                    this.snackBar.open(
                        'Error al importar invitados. Intenta de nuevo.',
                        'Cerrar',
                        { duration: 5000 }
                    );
                }
            });
    }

    downloadTemplate(): void {
        this.guestsService.downloadTemplate(this.eventId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'plantilla_invitados.csv';
                    link.click();
                    window.URL.revokeObjectURL(url);

                    this.snackBar.open('Plantilla descargada', 'Cerrar', { duration: 3000 });
                },
                error: (error) => {
                    console.error('Error downloading template:', error);
                    this.snackBar.open('Error al descargar plantilla', 'Cerrar', { duration: 3000 });
                }
            });
    }

    reset(): void {
        this.selectedFile = null;
        this.importResult = null;
    }

    get successRate(): number {
        if (!this.importResult) return 0;
        const total = this.importResult.created + this.importResult.skipped + this.importResult.invalid;
        if (total === 0) return 0;
        return (this.importResult.created / total) * 100;
    }
}
