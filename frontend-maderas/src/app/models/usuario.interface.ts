export interface Usuario {
    id: number;
    nombre: string;
    email: string;
    rol: string;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    usuario: Usuario;
    mensaje?: string;
}