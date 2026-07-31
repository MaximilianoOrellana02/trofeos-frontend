import { Injectable, signal } from '@angular/core';

export type EstadoPermiso = 'default' | 'granted' | 'denied' | 'no-soportado';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    readonly soportado = 'Notification' in window;
    readonly permiso = signal<EstadoPermiso>(this.leerPermiso());

    private leerPermiso(): EstadoPermiso {
        if (!this.soportado) return 'no-soportado';
        return Notification.permission as EstadoPermiso;
    }

    /**
     * Pide permiso al usuario. El navegador solo muestra el diálogo si el
     * estado es "default" (nunca se le preguntó); si ya lo rechazó antes,
     * no hay forma de volver a preguntar por código: tiene que habilitarlo
     * a mano desde la configuración del sitio en el navegador.
     */
    async pedirPermiso(): Promise<EstadoPermiso> {
        if (!this.soportado) return 'no-soportado';

        const resultado = await Notification.requestPermission();
        this.permiso.set(resultado as EstadoPermiso);
        return resultado as EstadoPermiso;
    }

    /**
     * Muestra una notificación del sistema. No hace nada si no hay permiso
     * o el navegador no lo soporta — falla en silencio a propósito, porque
     * el overlay dentro de la app ya cubre el caso principal.
     */
    notificar(titulo: string, cuerpo: string): void {
        if (this.permiso() !== 'granted') return;

        const notif = new Notification(titulo, { body: cuerpo, tag: 'psn-trofeo' });

        // Al tocarla, llevamos el foco de vuelta a la pestaña de la app.
        notif.onclick = () => {
            window.focus();
            notif.close();
        };
    }
}