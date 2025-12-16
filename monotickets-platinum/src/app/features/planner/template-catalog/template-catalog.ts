import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Template, PlannerService } from '../services/planner.service';
import { EventType, TemplateType } from '../../../core/models';

@Component({
  selector: 'app-template-catalog',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './template-catalog.html',
  styleUrl: './template-catalog.scss'
})
export class TemplateCatalog implements OnInit {
  eventId = '';
  loading = true;
  saving = false;
  uploading = false;
  templates: Template[] = [];
  filteredTemplates: Template[] = [];
  templateTypes = TemplateType;
  selectedCategory: EventType | 'ALL' = 'ALL';
  categories: Array<EventType | 'ALL'> = ['ALL', ...Object.values(EventType)];
  selectedTemplate?: Template;
  searchText = '';

  constructor(
    private plannerService: PlannerService,
    private route: ActivatedRoute,
    public router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    if (!this.eventId) {
      this.showSnack('Evento no encontrado');
      this.router.navigate(['/planner/events']);
      return;
    }
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.plannerService.getTemplates().subscribe({
      next: (templates) => {
        this.templates = templates.filter(t => t.type === this.templateTypes.PDF);
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading templates', error);
        this.loading = false;
        this.showSnack('No se pudo cargar el catálogo');
      }
    });
  }

  applyFilters(): void {
    this.filteredTemplates = this.templates.filter(template => {
      const matchesCategory = this.selectedCategory === 'ALL' || template.category === this.selectedCategory;
      const matchesSearch = !this.searchText ||
        template.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        template.description?.toLowerCase().includes(this.searchText.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  selectCategory(category: EventType | 'ALL'): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  selectTemplate(template: Template): void {
    this.selectedTemplate = template;
  }

  confirmSelection(): void {
    if (!this.selectedTemplate || this.saving) {
      return;
    }
    this.saving = true;
    this.plannerService.selectPdfTemplate(this.eventId, this.selectedTemplate.id).subscribe({
      next: () => {
        this.saving = false;
        this.showSnack('Plantilla seleccionada. Ahora coloca el QR exactamente donde lo necesitas.');
        this.router.navigate(['/planner/events', this.eventId, 'templates', 'qr']);
      },
      error: (error) => {
        console.error('Error selecting template', error);
        this.saving = false;
        this.showSnack('No se pudo seleccionar la plantilla');
      }
    });
  }

  onUploadFile(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file || this.uploading) {
      return;
    }
    this.uploading = true;
    this.plannerService.uploadPdfTemplate(this.eventId, file).subscribe({
      next: () => {
        this.uploading = false;
        this.showSnack('PDF subido. Selecciona el área de QR en el siguiente paso.');
        this.loadTemplates();
      },
      error: (error) => {
        console.error('Error uploading template', error);
        this.uploading = false;
        this.showSnack('No se pudo subir el PDF');
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchText = value;
    this.applyFilters();
  }

  private showSnack(message: string, action: string = 'OK'): void {
    this.snackBar.open(message, action, { duration: 3000 });
  }
}
