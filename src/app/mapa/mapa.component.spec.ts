import { describe, expect, it } from 'vitest';
import { MapaComponent } from './mapa.component';

describe('MapaComponent', () => {
  it('should map coordinates to percentages for the map overlay', () => {
    const component = new MapaComponent();

    expect(component.calcularPosicionX({ id: 1, nombre: 'Madrid', pais: 'España', orden: 1, latitud: 40.4168, longitud: -3.7038 } as any)).toBeCloseTo(49.0, 1);
    expect(component.calcularPosicionY({ id: 1, nombre: 'Madrid', pais: 'España', orden: 1, latitud: 40.4168, longitud: -3.7038 } as any)).toBeCloseTo(27.5, 1);
  });
});
