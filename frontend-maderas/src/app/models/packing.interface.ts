export interface PackingItem {
    id?: number;
    especie: string;
    espesor: number; // Pulgadas
    ancho: number;   // Pulgadas
    largo: number;   // Pies
    cantidad: number;
    vol_pt?: number; // Calculado
}

export interface Packing {
    id?: number;
    cliente_id: number;
    cliente_nombre?: string; // Para mostrar en tabla
    fecha: string;
    observacion?: string;
    items: PackingItem[];
}