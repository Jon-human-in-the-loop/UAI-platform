import { MercadoPagoConfig, Preference } from 'mercadopago';

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!MP_ACCESS_TOKEN) {
    console.warn("⚠️ MERCADOPAGO_ACCESS_TOKEN no está definido. La integración de Mercado Pago no funcionará.");
}

export const mpClient = new MercadoPagoConfig({
    accessToken: MP_ACCESS_TOKEN || 'APP_USR-dummy-access-token',
});

export const preference = new Preference(mpClient);
