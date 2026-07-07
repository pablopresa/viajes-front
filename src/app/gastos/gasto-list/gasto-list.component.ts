import { Component, OnInit, inject, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GastoService } from '../../core/services/gasto.service';
import { Gasto } from '../../core/models/gasto.model';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-gasto-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, TableModule, ButtonModule],
  templateUrl: './gasto-list.component.html',
  styleUrl: './gasto-list.component.css',
})
export class GastoListComponent implements OnInit {

  private gastoService = inject(GastoService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  @Input()
  viajeId?: number;

  gastos: Gasto[] = [];
  totalsByCurrency: Record<string, number> = {};
  totalCount = 0;
  minCosto = 0;
  maxCosto = 0;

  get currencyKeys(): string[] {
    return Object.keys(this.totalsByCurrency);
  }

  ngOnInit(): void {
    // determine viajeId: prefer @Input, otherwise read from route params
    if (!this.viajeId) {
      const idParam = this.route.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('viajeId');
      if (idParam) this.viajeId = Number(idParam);
    }

    if (!this.viajeId) {
      console.error('No viajeId provided for GastoListComponent; skipping load.');
      return;
    }

    this.load();
  }

  load(): void {
    this.gastoService.listar(this.viajeId!).subscribe({
      next: (gastos: Gasto[]) => {
        this.gastos = [...(gastos || [])];
        this.totalCount = this.gastos.length;
        this.totalsByCurrency = {};
        this.minCosto = Number.POSITIVE_INFINITY;
        this.maxCosto = Number.NEGATIVE_INFINITY;

        this.gastos.forEach(g => {
          const m = g.moneda ?? 'N/A';
          this.totalsByCurrency[m] = (this.totalsByCurrency[m] || 0) + (g.costo ?? 0);
          const costo = g.costo ?? 0;
          if (costo < this.minCosto) this.minCosto = costo;
          if (costo > this.maxCosto) this.maxCosto = costo;
        });

        if (this.minCosto === Number.POSITIVE_INFINITY) {
          this.minCosto = 0;
          this.maxCosto = 0;
        }

        this.cdr.detectChanges();
      },
      error: err => console.error('Error cargando gastos', err)
    });
  }

  goBack() {
    window.history.back();
  }

  formatCurrency(amount: number, moneda: string): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ` ${moneda}`;
  }

  costGradient(costo: number): string {
    if (this.maxCosto === this.minCosto) {
      return 'rgba(255, 229, 100, 0.2)';
    }

    const position = (costo - this.minCosto) / (this.maxCosto - this.minCosto);
    const from = [235, 230, 240];
    const to = [152, 58, 183];
    const r = Math.round(from[0] + (to[0] - from[0]) * position);
    const g = Math.round(from[1] + (to[1] - from[1]) * position);
    const b = Math.round(from[2] + (to[2] - from[2]) * position);
    return `rgba(${r}, ${g}, ${b}, 0.18)`;
  }
}
