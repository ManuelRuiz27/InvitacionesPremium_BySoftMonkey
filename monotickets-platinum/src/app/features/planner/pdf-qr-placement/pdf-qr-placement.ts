import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

import { PlannerService, PdfTemplateConfig, QrPlacement } from '../services/planner.service';

const workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
GlobalWorkerOptions.workerSrc = workerSrc;

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

@Component({
  selector: 'app-pdf-qr-placement',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './pdf-qr-placement.html',
  styleUrl: './pdf-qr-placement.scss'
})
export class PdfQrPlacement implements OnInit, OnDestroy, AfterViewInit {
  eventId = '';
  loading = true;
  saving = false;
  renderingPage = false;
  template?: PdfTemplateConfig;
  placement: QrPlacement = {
    page: 1,
    x: 20,
    y: 30,
    width: 25,
    height: 25,
    rotation: 0
  };

  @ViewChild('pdfCanvas') pdfCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('previewWrapper') previewWrapper?: ElementRef<HTMLDivElement>;

  private pdfDoc?: PDFDocumentProxy;
  private pdfTask?: PDFDocumentLoadingTask;
  private renderTask?: RenderTask;
  private readonly minSize = 10;
  private interaction?: {
    type: 'move' | 'resize';
    handle?: ResizeHandle;
    startX: number;
    startY: number;
    initial: QrPlacement;
  };
  private hasViewLoaded = false;

  constructor(
    private plannerService: PlannerService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    protected router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    if (!this.eventId) {
      this.showSnack('Evento no encontrado');
      this.router.navigate(['/planner/events']);
      return;
    }
    this.loadTemplate();
  }

  ngAfterViewInit(): void {
    this.hasViewLoaded = true;
    if (this.template?.pdfUrl) {
      this.setupPdfDocument(this.template.pdfUrl);
    }
  }

  ngOnDestroy(): void {
    this.destroyPdfResources();
  }

  loadTemplate(): void {
    this.loading = true;
    this.plannerService.getPdfTemplate(this.eventId).subscribe({
      next: (template) => {
        this.template = template;
        if (template.qrPlacement) {
          this.placement = { ...template.qrPlacement };
        } else {
          this.placement.page = 1;
        }
        if (this.hasViewLoaded) {
          this.setupPdfDocument(template.pdfUrl);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading template', error);
        this.loading = false;
        this.showSnack('No se pudo cargar la plantilla seleccionada');
      }
    });
  }

  save(): void {
    if (this.saving || !this.template) {
      return;
    }
    this.saving = true;
    this.plannerService.updateQrPlacement(this.eventId, this.placement).subscribe({
      next: () => {
        this.saving = false;
        this.showSnack('Área del QR guardada. Tu invitación ya está lista.');
        this.router.navigate(['/planner/events', this.eventId]);
      },
      error: (error) => {
        console.error('Error saving placement', error);
        this.saving = false;
        this.showSnack('No se pudo guardar el área del QR');
      }
    });
  }

  getOverlayStyles() {
    return {
      left: `${this.placement.x}%`,
      top: `${this.placement.y}%`,
      width: `${this.placement.width}%`,
      height: `${this.placement.height}%`,
      transform: `rotate(${this.placement.rotation || 0}deg)`
    };
  }

  onPageChange(value: number): void {
    if (!this.template) return;
    const safeValue = this.clamp(Math.round(value), 1, this.template.totalPages);
    if (safeValue !== this.placement.page) {
      this.placement = { ...this.placement, page: safeValue };
      if (this.pdfDoc) {
        this.renderPage(safeValue);
      }
    }
  }

  startInteraction(event: PointerEvent, type: 'move' | 'resize', handle?: ResizeHandle): void {
    if (!this.previewWrapper) return;
    event.preventDefault();
    event.stopPropagation();
    this.interaction = {
      type,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      initial: { ...this.placement }
    };
  }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this.interaction || !this.previewWrapper) return;
    const rect = this.previewWrapper.nativeElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    event.preventDefault();
    const deltaXPercent = ((event.clientX - this.interaction.startX) / rect.width) * 100;
    const deltaYPercent = ((event.clientY - this.interaction.startY) / rect.height) * 100;

    if (this.interaction.type === 'move') {
      const nextX = this.clamp(
        this.interaction.initial.x + deltaXPercent,
        0,
        100 - this.interaction.initial.width
      );
      const nextY = this.clamp(
        this.interaction.initial.y + deltaYPercent,
        0,
        100 - this.interaction.initial.height
      );
      this.placement = { ...this.placement, x: nextX, y: nextY };
      return;
    }

    if (!this.interaction.handle) return;
    this.placement = this.calculateResize(deltaXPercent, deltaYPercent, this.interaction.handle);
  }

  @HostListener('window:pointerup')
  onPointerUp(): void {
    this.interaction = undefined;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.pdfDoc && !this.loading) {
      this.renderPage(this.placement.page);
    }
  }

  updateCoordinate(axis: 'x' | 'y', value: number): void {
    const isX = axis === 'x';
    const max = 100 - (isX ? this.placement.width : this.placement.height);
    const safeValue = this.clamp(value, 0, max);
    this.placement = { ...this.placement, [axis]: safeValue } as QrPlacement;
  }

  updateDimension(axis: 'width' | 'height', value: number): void {
    const isWidth = axis === 'width';
    const max = 100 - (isWidth ? this.placement.x : this.placement.y);
    const safeValue = this.clamp(value, this.minSize, max);
    this.placement = { ...this.placement, [axis]: safeValue } as QrPlacement;
  }

  updateRotation(value: number): void {
    this.placement = { ...this.placement, rotation: value };
  }

  resetPlacement(): void {
    this.placement = {
      ...this.placement,
      x: 20,
      y: 30,
      width: 25,
      height: 25,
      rotation: 0
    };
  }

  private setupPdfDocument(url?: string): void {
    if (!url) {
      this.destroyPdfResources();
      return;
    }
    this.renderingPage = true;
    this.ngZone.runOutsideAngular(async () => {
      try {
        this.destroyPdfResources();
        this.pdfTask = getDocument(url);
        this.pdfDoc = await this.pdfTask.promise;
        await this.renderPage(this.placement.page);
      } catch (error) {
        console.error('Error rendering PDF preview', error);
        this.ngZone.run(() => {
          this.renderingPage = false;
          this.showSnack('No se pudo cargar la vista previa del PDF');
        });
      }
    });
  }

  private async renderPage(pageNumber: number): Promise<void> {
    if (!this.pdfDoc || !this.pdfCanvas || !this.previewWrapper) {
      this.renderingPage = false;
      return;
    }

    this.ngZone.run(() => (this.renderingPage = true));

    const unscaled = await this.pdfDoc.getPage(pageNumber);
    const baseViewport = unscaled.getViewport({ scale: 1 });
    const containerWidth = this.previewWrapper.nativeElement.clientWidth || baseViewport.width;
    const viewport = unscaled.getViewport({ scale: containerWidth / baseViewport.width });
    const canvas = this.pdfCanvas.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) {
      this.renderingPage = false;
      return;
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    this.renderTask?.cancel();
    const renderTask = unscaled.render({ canvasContext: context, viewport, canvas });
    this.renderTask = renderTask;

    try {
      await renderTask.promise;
    } catch (error: any) {
      if (error?.name !== 'RenderingCancelledException') {
        console.error('Error rendering page', error);
      }
    } finally {
      if (this.renderTask === renderTask) {
        this.renderTask = undefined;
        this.ngZone.run(() => (this.renderingPage = false));
      }
    }
  }

  private calculateResize(deltaX: number, deltaY: number, handle: ResizeHandle): QrPlacement {
    const base = { ...this.interaction!.initial };
    let { x, y, width, height } = base;

    if (handle.includes('e')) {
      width = this.clamp(width + deltaX, this.minSize, 100 - x);
    }
    if (handle.includes('s')) {
      height = this.clamp(height + deltaY, this.minSize, 100 - y);
    }
    if (handle.includes('w')) {
      const maxX = x + width - this.minSize;
      const newX = this.clamp(x + deltaX, 0, maxX);
      width = width - (newX - x);
      x = newX;
    }
    if (handle.includes('n')) {
      const maxY = y + height - this.minSize;
      const newY = this.clamp(y + deltaY, 0, maxY);
      height = height - (newY - y);
      y = newY;
    }

    return { ...this.placement, x, y, width, height };
  }

  private destroyPdfResources(): void {
    this.renderTask?.cancel();
    this.renderTask = undefined;
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = undefined;
    }
    if (this.pdfTask) {
      this.pdfTask.destroy();
      this.pdfTask = undefined;
    }
    this.renderingPage = false;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private showSnack(message: string, action: string = 'OK'): void {
    this.snackBar.open(message, action, { duration: 3000 });
  }
}
