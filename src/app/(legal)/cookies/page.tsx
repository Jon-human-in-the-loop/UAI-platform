import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Política de Cookies · UAI Platform',
    description: 'Información sobre el uso de cookies en UAI Platform.',
};

const LAST_UPDATED = '15 de junio de 2026';

export default function CookiesPage() {
    return (
        <article>
            <header className="mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tighter gold-text-gradient">
                    Política de Cookies
                </h1>
                <p className="text-[11px] text-white/30 uppercase tracking-widest mt-2">
                    Última actualización: {LAST_UPDATED}
                </p>
            </header>

            <div className="mb-8 p-4 rounded-xl bg-accent/5 border border-accent/20 text-[12px] text-white/50 leading-relaxed">
                <strong className="text-accent">Aviso:</strong> Ajusta esta plantilla a las cookies
                reales que utilice tu despliegue. Si incorporas analítica o publicidad, deberás añadir
                un banner de consentimiento previo conforme al RGPD y la Directiva ePrivacy.
            </div>

            <div className="legal-prose">
                <h2>1. ¿Qué son las cookies?</h2>
                <p>
                    Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando
                    visitas un sitio web. Permiten que la aplicación recuerde información sobre tu visita,
                    como tu sesión iniciada o tus preferencias.
                </p>

                <h2>2. Cookies que utilizamos</h2>
                <h3>Cookies estrictamente necesarias</h3>
                <p>
                    Imprescindibles para el funcionamiento del Servicio. Incluyen las cookies de sesión
                    e inicio de sesión que gestionan tu autenticación. Sin ellas no podrías acceder a tu
                    cuenta. No requieren consentimiento.
                </p>
                <h3>Cookies de preferencias</h3>
                <p>
                    Recuerdan ajustes que mejoran tu experiencia, como opciones de interfaz.
                </p>
                <h3>Cookies analíticas (si aplica)</h3>
                <p>
                    Si activamos herramientas de analítica, nos ayudarían a entender cómo se usa la
                    Plataforma de forma agregada. Estas cookies solo se instalan con tu consentimiento.
                </p>

                <h2>3. Cookies de terceros</h2>
                <p>
                    Algunos proveedores, como los procesadores de pago (Stripe, Mercado Pago), pueden
                    establecer sus propias cookies cuando interactúas con sus componentes, por ejemplo
                    durante el proceso de pago. Estas cookies se rigen por las políticas de dichos
                    proveedores.
                </p>

                <h2>4. Cómo gestionar las cookies</h2>
                <p>
                    Puedes configurar tu navegador para bloquear o eliminar cookies. Ten en cuenta que
                    desactivar las cookies estrictamente necesarias puede impedir el funcionamiento
                    correcto del Servicio, incluido el inicio de sesión.
                </p>

                <h2>5. Consentimiento</h2>
                <p>
                    Al continuar utilizando la Plataforma con cookies no esenciales habilitadas, aceptas
                    su uso conforme a esta Política. Puedes retirar tu consentimiento en cualquier momento
                    ajustando la configuración de tu navegador.
                </p>

                <h2>6. Cambios en esta Política</h2>
                <p>
                    Podemos actualizar esta Política de Cookies para reflejar cambios en las tecnologías
                    que utilizamos. Publicaremos cualquier modificación en esta página.
                </p>

                <h2>7. Contacto</h2>
                <p>
                    Para cualquier consulta sobre el uso de cookies, escríbenos a{' '}
                    <a href="mailto:privacidad@uaiplatform.store">privacidad@uaiplatform.store</a>.
                </p>
            </div>
        </article>
    );
}
