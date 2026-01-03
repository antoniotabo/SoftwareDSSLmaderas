// Interfaz para los items del packing (según tabla packing_items)
export interface PackingItem {
    id?: number;
    packing_id?: number;
    cantidad_piezas: number;
    e: number;           // Espesor (pulgadas con 3 decimales)
    a: number;           // Ancho (pulgadas con 3 decimales)
    l: number;           // Largo (pies con 3 decimales)
    volumen_pt: number;  // Volumen en pies tablares
    categoria?: string;  // Categoría de la madera
}

// Interfaz para el packing (según tabla packing)
export interface Packing {
    id?: number;
    fecha: string;                // Formato: YYYY-MM-DD
    cliente_id: number;
    cliente_nombre?: string;      // Para mostrar en tabla (JOIN con clientes)
    especie?: string;             // Especie de madera (60 chars)
    tipo_madera?: string;         // Tipo de madera (60 chars)
    observaciones?: string;       // Observaciones (255 chars) - ⚠️ Es PLURAL
    total_pt?: number;            // Calculado: suma de volumen_pt de items
    items?: PackingItem[];        // Items del packing
}

// Interfaz para crear un nuevo packing
export interface CrearPackingDTO {
    cliente_id: number;
    fecha: string;
    especie?: string;
    tipo_madera?: string;
    observaciones?: string;
    items: Omit<PackingItem, 'id' | 'packing_id'>[];
}

// Interfaz para la respuesta del listado
export interface PackingListResponse {
    success: boolean;
    data: Packing[];
}

// Interfaz para la respuesta de un packing individual
export interface PackingDetailResponse {
    success: boolean;
    data: Packing;
}