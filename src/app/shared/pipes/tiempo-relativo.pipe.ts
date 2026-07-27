import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: 'tiempoRelativo'
})

export class TiempoRelativoPipe implements PipeTransform {
    transform(valor: string | Date | null | undefined) {
        if (!valor) return;

        const fecha = valor instanceof Date ? valor : new Date(valor);
        if (isNaN(fecha.getTime())) return '';

        const ahora = new Date();

        // Comparamos por día calendario, no por diferencia de horas:
        // algo de las 23:50 de ayer es "ayer" aunque hayan pasado 40 minutos.
        const diaDe = (d: Date) =>
            new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

        const diasDeDiferencia = Math.round(
            (diaDe(ahora) - diaDe(fecha)) / 86_400_000
        );

        if (diasDeDiferencia === 0) {
            return fecha.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
            });
        }

        if (diasDeDiferencia === 1) return 'ayer';

        if (diasDeDiferencia < 7) {
            return fecha.toLocaleDateString('es-AR', { weekday: 'long' });
        }

        if (fecha.getFullYear() === ahora.getFullYear()) {
            return fecha.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
            });
        }

        return fecha.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        });
    }
}