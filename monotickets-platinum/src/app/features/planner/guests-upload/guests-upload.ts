import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import * as Papa from 'papaparse';

import { GuestsService } from '../services/guests.service';

@Component({
  selector: 'app-guests-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule
  ],
  templateUrl: './guests-upload.html',
  styleUrl: './guests-upload.scss'
})
export class GuestsUpload {
  eventId: string = '';
  file: File | null = null;
  previewData: any[] = [];
  uploading = false;
  uploadProgress = 0;
  result: { imported: number; errors: string[] } | null = null;

  constructor(
    private guestsService: GuestsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  processFile(file: File): void {
    this.file = file;
    this.result = null;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        this.previewData = results.data.slice(0, 5);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Error al procesar el archivo CSV');
      }
    });
  }

  uploadCSV(): void {
    if (!this.file) return;

    this.uploading = true;
    this.uploadProgress = 0;

    const interval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 90) {
        clearInterval(interval);
      }
    }, 100);

    this.guestsService.uploadGuestsCSV(this.eventId, this.file).subscribe({
      next: (result) => {
        clearInterval(interval);
        this.uploadProgress = 100;
        this.result = result;
        this.uploading = false;

        setTimeout(() => {
          if (result.errors.length === 0) {
            this.goBack();
          }
        }, 2000);
      },
      error: (error) => {
        clearInterval(interval);
        console.error('Error uploading CSV:', error);
        alert('Error al importar invitados');
        this.uploading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/planner/events', this.eventId, 'guests']);
  }
}
