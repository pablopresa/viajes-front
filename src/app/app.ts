// src/app/app.ts
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <router-outlet />
  `
})
export class AppComponent {
  protected readonly title = signal('viajes-front-2');
}
