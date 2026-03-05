import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { cacheInterceptor } from './core/interceptors/cache-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi(),
      withInterceptors([cacheInterceptor])),
    provideHttpClient(),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false
        }
      },
      translation: {
        noFileChosenMessage: '',
        choose: 'Seleccionar',
        upload: 'Subir',
        cancel: 'Cancelar'
      }
    })
  ]
};
