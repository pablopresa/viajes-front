import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'viajes',
    pathMatch: 'full'
  },
  {
    path: 'viajes',
    loadChildren: () =>
      import('./viajes/viaje.routes')
        .then(m => m.VIAJE_ROUTES)
  },
  {
    path: 'mapa',
    loadComponent: () =>
      import('./mapa/mapa.component')
        .then(m => m.MapaComponent)
  },
  {
    path: '**',
    redirectTo: 'viajes'
  }
];
