import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-host-link-generator',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule
  ],
  template: `
    <div class="host-link-generator">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>Generador de Links para Anfitriones</h2>
      </div>
      <mat-card>
        <mat-card-header>
          <mat-icon>admin_panel_settings</mat-icon>
          <h3>Gestión de Accesos</h3>
        </mat-card-header>
        <mat-card-content>
          <p class="description">Genera links protegidos para que los anfitriones gestionen sus invitados</p>
          
          <div class="url-section">
            <mat-form-field appearance="outline">
              <mat-label>URL Protegida</mat-label>
              <input matInput [value]="hostUrl" readonly>
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="copyUrl()">
              <mat-icon>content_copy</mat-icon>
              Copiar
            </button>
            <button mat-stroked-button color="warn" (click)="revokeToken()">
              <mat-icon>block</mat-icon>
              Revocar
            </button>
          </div>

          <div class="security-info">
            <mat-icon>security</mat-icon>
            <div>
              <strong>Token activo</strong>
              <p>Este link permite al anfitrión subir su lista de invitados</p>
            </div>
          </div>

          <div class="hosts-table">
            <h3>Invitados Subidos por Anfitriones</h3>
            <table mat-table [dataSource]="hostGuests">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let guest">{{ guest.name }}</td>
              </ng-container>

              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>Teléfono</th>
                <td mat-cell *matCellDef="let guest">{{ guest.phone }}</td>
              </ng-container>

              <ng-container matColumnDef="uploadedBy">
                <th mat-header-cell *matHeaderCellDef>Subido por</th>
                <td mat-cell *matCellDef="let guest">{{ guest.uploadedBy }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .host-link-generator {
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
          margin-bottom: 24px;

          mat-form-field {
            flex: 1;
          }

          button {
            &[color="primary"] {
              background: #D4AF37;
              color: #1a1a1a;
            }
          }
        }

        .security-info {
          display: flex;
          gap: 16px;
          padding: 20px;
          background: #1a1a1a;
          border-left: 4px solid #D4AF37;
          border-radius: 8px;
          margin-bottom: 32px;

          mat-icon {
            color: #D4AF37;
            font-size: 32px;
            width: 32px;
            height: 32px;
          }

          strong {
            color: #e5e4e2;
            display: block;
            margin-bottom: 4px;
          }

          p {
            margin: 0;
            color: #c0c0c0;
            font-size: 14px;
          }
        }

        .hosts-table {
          h3 {
            color: #e5e4e2;
            margin-bottom: 16px;
          }

          table {
            width: 100%;
            background: #0a0a0a;

            th {
              background: #2a2a2a;
              color: #a8a8a8;
              font-weight: 600;
              padding: 16px;
            }

            td {
              color: #c0c0c0;
              padding: 16px;
              border-bottom: 1px solid #2a2a2a;
            }

            tr:hover {
              background: #1a1a1a;
            }
          }
        }
      }
    }
  `]
})
export class HostLinkGenerator implements OnInit {
  eventId: string = '';
  hostUrl: string = '';
  displayedColumns = ['name', 'phone', 'uploadedBy'];
  hostGuests = [
    { name: 'Laura Fernández', phone: '+52 55 1111 1111', uploadedBy: 'Novios' },
    { name: 'Roberto Gómez', phone: '+52 55 2222 2222', uploadedBy: 'Novios' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    this.hostUrl = `https://monotickets.com/host/token-${this.eventId}`;
  }

  goBack(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId]);
    }
  }

  copyUrl() {
    navigator.clipboard.writeText(this.hostUrl);
    alert('✅ URL copiada al portapapeles');
  }

  revokeToken() {
    if (confirm('¿Estás seguro de revocar este token? El anfitrión no podrá acceder más.')) {
      alert('✅ Token revocado');
    }
  }
}
