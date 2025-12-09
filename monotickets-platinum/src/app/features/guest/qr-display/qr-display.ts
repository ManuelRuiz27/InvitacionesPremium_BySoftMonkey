import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as QRCode from 'qrcode';

import { GuestService, type QrData } from '../services/guest';

@Component({
  selector: 'app-qr-display',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './qr-display.html',
  styleUrl: './qr-display.scss'
})
export class QrDisplay implements OnInit {
  @ViewChild('qrCanvas', { static: false }) qrCanvas!: ElementRef<HTMLCanvasElement>;

  inviteCode: string = '';
  loading = true;
  error: string | null = null;
  qrData: QrData | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private guestService: GuestService
  ) { }

  ngOnInit(): void {
    this.inviteCode = this.route.snapshot.paramMap.get('inviteCode') || '';

    if (!this.inviteCode) {
      this.error = 'Código de invitación inválido';
      this.loading = false;
      return;
    }

    this.loadQrCode();
  }

  loadQrCode(): void {
    this.loading = true;
    this.error = null;

    this.guestService.getQrCode(this.inviteCode).subscribe({
      next: (data) => {
        this.qrData = data;
        this.loading = false;

        // Generate QR code on canvas
        setTimeout(() => this.generateQrCanvas(), 100);
      },
      error: (err) => {
        console.error('Error loading QR:', err);
        this.error = 'No se pudo cargar el código QR. Asegúrate de haber confirmado tu asistencia.';
        this.loading = false;
      }
    });
  }

  generateQrCanvas(): void {
    if (!this.qrData || !this.qrCanvas) return;

    const canvas = this.qrCanvas.nativeElement;
    QRCode.toCanvas(canvas, this.qrData.qrToken, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }, (error) => {
      if (error) {
        console.error('Error generating QR canvas:', error);
      }
    });
  }

  downloadQr(): void {
    if (!this.qrCanvas) return;

    const canvas = this.qrCanvas.nativeElement;
    canvas.toBlob((blob) => {
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-${this.inviteCode}.png`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/i', this.inviteCode]);
  }

  getExpirationDate(): string {
    if (!this.qrData) return '';
    const date = new Date(this.qrData.expiresAt);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async shareQr(): Promise<void> {
    if (!this.qrCanvas) return;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        const canvas = this.qrCanvas.nativeElement;
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!));
        });

        const file = new File([blob], `qr-${this.inviteCode}.png`, { type: 'image/png' });

        await navigator.share({
          title: 'Mi Código QR',
          text: 'Código QR para el evento',
          files: [file]
        });
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback to download if share fails
        this.downloadQr();
      }
    } else {
      // Fallback to download if Web Share API not available
      this.downloadQr();
    }
  }

  printQr(): void {
    window.print();
  }
}
