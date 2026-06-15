import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Términos de Servicio · UAI Platform',
    description: 'Términos y condiciones de uso de UAI Platform.',
};

const LAST_UPDATED = '15 de junio de 2026';

export default function TermsPage() {
    return (
        <article>
            <header className="mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tighter gold-text-gradient">
                    Términos de Servicio
                </h1>
                <p className="text-[11px] text-white/30 uppercase tracking-widest mt-2">
                    Última actualización: {LAST_UPDATED}
                </p>
            </header>

            <div className="mb-8 p-4 rounded-xl bg-accent/5 border border-accent/20 text-[12px] text-white/50 leading-relaxed">
                <strong className="text-accent">Aviso:</strong> Este documento es una plantilla
                inicial. Antes de operar comercialmente debe ser revisado por un profesional
                legal habilitado en tu jurisdicción para garantizar su validez y cumplimiento.
            </div>

            <div className="legal-prose">
                <h2>1. Aceptación de los Términos</h2>
                <p>
                    Al acceder o utilizar UAI Platform (en adelante, &laquo;la Plataforma&raquo;,
                    &laquo;el Servicio&raquo; o &laquo;nosotros&raquo;), aceptas quedar vinculado por
                    estos Términos de Servicio y por nuestra{' '}
                    <a href="/privacy">Política de Privacidad</a>. Si no estás de acuerdo con alguna
                    parte, no debes utilizar el Servicio.
                </p>

                <h2>2. Descripción del Servicio</h2>
                <p>
                    UAI Platform es una plataforma de orquestación de agentes de inteligencia
                    artificial que permite a los usuarios crear, configurar y ejecutar flujos de
                    trabajo automatizados sobre modelos de lenguaje de terceros (incluyendo, entre
                    otros, modelos de OpenAI y Anthropic). El Servicio se ofrece &laquo;tal cual&raquo; y
                    podemos modificar, suspender o discontinuar funcionalidades en cualquier momento.
                </p>

                <h2>3. Cuentas de Usuario</h2>
                <p>
                    Para acceder a determinadas funciones debes crear una cuenta proporcionando
                    información veraz y actualizada. Eres responsable de mantener la confidencialidad
                    de tus credenciales y de toda actividad realizada bajo tu cuenta. Debes notificarnos
                    de inmediato cualquier uso no autorizado.
                </p>

                <h2>4. Planes, Suscripciones y Pagos</h2>
                <p>
                    Ofrecemos planes gratuitos y de pago (Essentials, Advanced y Professional). Las
                    suscripciones de pago se procesan a través de proveedores externos (Stripe y/o
                    Mercado Pago) y se renuevan automáticamente al final de cada período de facturación,
                    salvo cancelación previa.
                </p>
                <ul>
                    <li>Los precios se muestran en la moneda indicada en el momento de la contratación.</li>
                    <li>El consumo de cómputo se mide en créditos asociados al uso de tokens de los modelos de IA.</li>
                    <li>Cada plan incluye límites de uso (número de agentes, consultas por período y créditos) descritos en la página de precios.</li>
                    <li>Puedes cancelar tu suscripción en cualquier momento desde el panel de facturación; la cancelación surte efecto al final del período ya pagado.</li>
                </ul>

                <h2>5. Derecho de Desistimiento y Reembolsos</h2>
                <p>
                    Si resides en la Unión Europea, dispones de un plazo de catorce (14) días naturales
                    para desistir de la contratación sin necesidad de justificación. No obstante, al
                    tratarse de un servicio digital, si solicitas el inicio inmediato de la prestación y
                    consumes créditos durante dicho plazo, reconoces que pierdes el derecho de
                    desistimiento sobre la parte ya consumida. Las solicitudes de reembolso se evalúan
                    conforme a la legislación aplicable.
                </p>

                <h2>6. Uso Aceptable</h2>
                <p>Te comprometes a no utilizar el Servicio para:</p>
                <ul>
                    <li>Actividades ilegales, fraudulentas o que infrinjan derechos de terceros.</li>
                    <li>Generar o distribuir contenido dañino, difamatorio, de odio o que vulnere la privacidad de otros.</li>
                    <li>Intentar vulnerar la seguridad, realizar ingeniería inversa o sobrecargar la infraestructura.</li>
                    <li>Eludir los límites de uso de tu plan o revender el Servicio sin autorización.</li>
                </ul>

                <h2>7. Contenido Generado por IA</h2>
                <p>
                    Los resultados generados por los agentes de IA pueden contener imprecisiones o
                    errores. No garantizamos la exactitud, idoneidad ni adecuación de dichos resultados
                    para un fin determinado. Eres responsable de revisar y validar cualquier contenido
                    antes de utilizarlo, especialmente en contextos críticos.
                </p>

                <h2>8. Propiedad Intelectual</h2>
                <p>
                    La Plataforma, su código, marca y diseño son propiedad de UAI Platform o de sus
                    licenciantes. Conservas la titularidad del contenido que introduces y de los
                    resultados que generas, en la medida permitida por la ley y por los términos de los
                    proveedores de modelos subyacentes.
                </p>

                <h2>9. Protección de Datos</h2>
                <p>
                    El tratamiento de tus datos personales se rige por nuestra{' '}
                    <a href="/privacy">Política de Privacidad</a>. Al usar el Servicio consientes dicho
                    tratamiento.
                </p>

                <h2>10. Limitación de Responsabilidad</h2>
                <p>
                    En la máxima medida permitida por la ley, UAI Platform no será responsable de daños
                    indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso
                    del Servicio. Nuestra responsabilidad total se limita al importe abonado por ti
                    durante los doce (12) meses anteriores al hecho que origine la reclamación.
                </p>

                <h2>11. Terminación</h2>
                <p>
                    Podemos suspender o cancelar tu acceso si incumples estos Términos. Tú puedes dejar
                    de usar el Servicio y eliminar tu cuenta en cualquier momento. Determinadas
                    disposiciones (propiedad intelectual, limitación de responsabilidad) sobrevivirán a
                    la terminación.
                </p>

                <h2>12. Modificaciones</h2>
                <p>
                    Podemos actualizar estos Términos periódicamente. Te notificaremos los cambios
                    materiales con antelación razonable. El uso continuado del Servicio tras la entrada
                    en vigor de los cambios implica su aceptación.
                </p>

                <h2>13. Ley Aplicable</h2>
                <p>
                    Estos Términos se rigen por la legislación aplicable en la jurisdicción de operación
                    de UAI Platform, sin perjuicio de las normas imperativas de protección al consumidor
                    de tu país de residencia.
                </p>

                <h2>14. Contacto</h2>
                <p>
                    Para cualquier consulta sobre estos Términos, escríbenos a{' '}
                    <a href="mailto:legal@uaiplatform.store">legal@uaiplatform.store</a>.
                </p>
            </div>
        </article>
    );
}
