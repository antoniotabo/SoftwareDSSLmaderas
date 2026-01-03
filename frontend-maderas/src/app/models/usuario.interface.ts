export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  password?: string;
  rol: string; // ⚠️ Cambió de ENUM a VARCHAR en tu BD
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface UsuarioResponse {
  success: boolean;
  message?: string;
  mensaje?: string;
  data?: Usuario | Usuario[];
  id?: number;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  usuario: Usuario;
  mensaje?: string;
}