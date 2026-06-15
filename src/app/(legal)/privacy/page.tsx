import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Política de Privacidad · UAI Platform',
    description: 'Cómo UAI Platform recopila, usa y protege tus datos personales.',
};

const LAST_UPDATED = '15 de junio de 2026';

export default function PrivacyPage() {
    return (
        <article>
            <header className="mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tighter gold-text-gradient">
                    Política de Privacidad
                </h1>
                <p className="text-[11px] text-white/30 uppercase tracking-widest mt-2">
                    Última actualización: {LAST_UPDATED}
                </p>
            </header>

            <div className="mb-8 p-4 rounded-xl bg-accent/5 border border-accent/20 text-[12px] text-white/50 leading-relaxed">
                <strong className="text-accent">Aviso:</strong> Esta plantilla debe revisarse con
                asesoría legal para confirmar el cumplimiento del RGPD (UE), la LGPD u otras normativas
                aplicables según los países donde operes.
            </div>

            <div className="legal-prose">
                <h2>1. Responsable del Tratamiento</h2>
                <p>
                    UAI Platform es responsable del tratamiento de los datos personales recabados a
                    través del Servicio. Para ejercer tus derechos o realizar consultas, contáctanos en{' '}
                    <a href="mailto:privacidad@uaiplatform.store">privacidad@uaiplatform.store</a>.
                </p>

                <h2>2. Datos que Recopilamos</h2>
                <ul>
                    <li><strong>Datos de cuenta:</strong> nombre, dirección de correo electrónico y contraseña cifrada.</li>
                    <li><strong>Datos de uso:</strong> misiones ejecutadas, agentes creados, consumo de créditos y tokens, registros de actividad.</li>
                    <li><strong>Datos de pago:</strong> gestionados por nuestros procesadores (Stripe, Mercado Pago). No almacenamos los datos completos de tu tarjeta.</li>
                    <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador y datos de sesión necesarios para la seguridad.</li>
                    <li><strong>Contenido:</strong> las instrucciones y el contenido que envías a los agentes de IA.</li>
                </ul>

                <h2>3. Finalidades y Base Legal</h2>
                <p>Tratamos tus datos para:</p>
                <ul>
                    <li>Prestar y mantener el Servicio (ejecución del contrato).</li>
                    <li>Procesar pagos y gestionar suscripciones (ejecución del contrato).</li>
                    <li>Garantizar la seguridad y prevenir el fraude (interés legítimo).</li>
                    <li>Cumplir obligaciones legales y fiscales (obligación legal).</li>
                    <li>Mejorar el producto y comunicarnos contigo (interés legítimo o consentimiento).</li>
                </ul>

                <h2>4. Compartición con Terceros</h2>
                <p>
                    Compartimos datos únicamente con proveedores que actúan como encargados del
                    tratamiento y solo en lo necesario para operar el Servicio:
                </p>
                <ul>
                    <li><strong>Proveedores de modelos de IA</strong> (p. ej. OpenAI, Anthropic) para procesar tus solicitudes.</li>
                    <li><strong>Procesadores de pago</strong> (Stripe, Mercado Pago) para gestionar las transacciones.</li>
                    <li><strong>Proveedores de infraestructura y hosting</strong> para alojar la aplicación y la base de datos.</li>
                </ul>
                <p>No vendemos tus datos personales a terceros.</p>

                <h2>5. Transferencias Internacionales</h2>
                <p>
                    Algunos proveedores pueden procesar datos fuera de tu país o del Espacio Económico
                    Europeo. En tales casos aplicamos garantías adecuadas, como las Cláusulas
                    Contractuales Tipo de la Comisión Europea.
                </p>

                <h2>6. Conservación de Datos</h2>
                <p>
                    Conservamos tus datos mientras tu cuenta esté activa y durante el tiempo necesario
                    para cumplir obligaciones legales. Cuando eliminas tu cuenta, suprimimos o
                    anonimizamos tus datos personales, salvo aquellos que debamos conservar por ley.
                </p>

                <h2>7. Tus Derechos</h2>
                <p>De acuerdo con la normativa aplicable, tienes derecho a:</p>
                <ul>
                    <li>Acceder a tus datos personales.</li>
                    <li>Rectificar datos inexactos.</li>
                    <li>Solicitar la supresión (&laquo;derecho al olvido&raquo;).</li>
                    <li>Limitar u oponerte al tratamiento.</li>
                    <li>Solicitar la portabilidad de tus datos.</li>
                    <li>Retirar tu consentimiento en cualquier momento.</li>
                </ul>
                <p>
                    Para ejercerlos, escríbenos a{' '}
                    <a href="mailto:privacidad@uaiplatform.store">privacidad@uaiplatform.store</a>.
                    También puedes presentar una reclamación ante la autoridad de control competente.
                </p>

                <h2>8. Seguridad</h2>
                <p>
                    Aplicamos medidas técnicas y organizativas razonables para proteger tus datos,
                    incluyendo el cifrado de contraseñas y el control de acceso. Ningún sistema es
                    completamente infalible, por lo que no podemos garantizar una seguridad absoluta.
                </p>

                <h2>9. Cookies</h2>
                <p>
                    Utilizamos cookies y tecnologías similares según se describe en nuestra{' '}
                    <a href="/cookies">Política de Cookies</a>.
                </p>

                <h2>10. Menores de Edad</h2>
                <p>
                    El Servicio no está dirigido a menores de 18 años. No recopilamos
                    conscientemente datos de menores; si detectamos lo contrario, los eliminaremos.
                </p>

                <h2>11. Cambios en esta Política</h2>
                <p>
                    Podemos actualizar esta Política periódicamente. Publicaremos la versión vigente en
                    esta página e indicaremos la fecha de la última actualización.
                </p>

                <h2>12. Contacto</h2>
                <p>
                    Si tienes dudas sobre esta Política o sobre el tratamiento de tus datos, escríbenos
                    a <a href="mailto:privacidad@uaiplatform.store">privacidad@uaiplatform.store</a>.
                </p>
            </div>
        </article>
    );
}
