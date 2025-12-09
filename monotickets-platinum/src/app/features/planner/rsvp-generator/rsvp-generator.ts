import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-rsvp-generator',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule
  ],
  template: `
    <div class="rsvp-generator">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>Generador de Formulario RSVP</h2>
      </div>
      <mat-card>
        <mat-card-header>
          <mat-icon>link</mat-icon>
          <h3>URL Pública del Evento</h3>
        </mat-card-header>
        <mat-card-content>
          <p class="description">Genera un link público para que los invitados se registren automáticamente</p>
          
          <div class="url-section">
            <mat-form-field appearance="outline">
              <mat-label>URL Pública</mat-label>
              <input matInput [value]="rsvpUrl" readonly>
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="copyUrl()">
              <mat-icon>content_copy</mat-icon>
              Copiar
            </button>
          </div>

          <div class="qr-section">
            <canvas #qrCanvas></canvas>
            <button mat-stroked-button (click)="downloadQR()">
              <mat-icon>download</mat-icon>
              Descargar QR
            </button>
          </div>

          <div class="stats">
            <div class="stat-item">
              <mat-icon>people</mat-icon>
              <span>12 registros vía RSVP</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .rsvp-generator {
      padding: 32px;
      background: #1a1a1a;
      color: #e5e4e2;

      mat-card {
        background: #0a0a0a;
        border: 1px solid #a8a8a8;
        border-radius: 12px;

        mat-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;

          mat-icon {
            color: #D4AF37;
            font-size: 32px;
            width: 32px;
            height: 32px;
          }

          h2 {
            margin: 0;
            color: #e5e4e2;
          }
        }

        .description {
          color: #c0c0c0;
          margin-bottom: 24px;
        }

        .url-section {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;

          mat-form-field {
            flex: 1;
          }

          button {
            background: #D4AF37;
            color: #1a1a1a;
            font-weight: 600;
          }
        }

        .qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 24px;
          background: #1a1a1a;
          border-radius: 8px;
          margin-bottom: 24px;

          canvas {
            border-radius: 8px;
          }
        }

        .stats {
          .stat-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: #1a1a1a;
            border-radius: 8px;

            mat-icon {
              color: #D4AF37;
            }

            span {
              color: #c0c0c0;
            }
          }
        }
      }
    }
  `]
})
export class RsvpGenerator implements OnInit {
  eventId: string = '';
  rsvpUrl: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    this.rsvpUrl = `https://monotickets.com/rsvp/${this.eventId}`;
    // Esperar un tick para que el canvas esté disponible
    setTimeout(() => this.generateQR(), 100);
  }

  goBack(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId]);
    }
  }

  generateQR() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      QRCode.toCanvas(canvas, this.rsvpUrl, { width: 200 });
    }
  }

  copyUrl() {
    navigator.clipboard.writeText(this.rsvpUrl);
    alert('✅ URL copiada al portapapeles');
  }

  downloadQR() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `rsvp-qr-${this.eventId}.png`;
          link.click();
        }
      });
    }
  }
}
