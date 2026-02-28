export function buildMercadoPagoEventKey(type: string | null, dataId: string | null) {
    return `mp:${type || 'unknown'}:${dataId || 'unknown'}`;
}
