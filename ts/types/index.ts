export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  precioOriginal?: number;
  categoria: Categoria;
  imagen?: string;
  imagenes?: string[];
  stock: number;
  unidad: 'kg' | 'pza' | 'paquete';
  destacado?: boolean;
  oferta?: boolean;
  tags?: string[];
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface CarritoItem {
  id: string;
  producto: Producto;
  cantidad: number;
  peso?: number;
  piezas?: number;
  grosor?: 'delgado' | 'mediano' | 'grueso';
  notas?: string;
  precioUnitario: number;
  precioTotal: number;
}

export interface Cliente {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  direccion?: Direccion;
  role: 'cliente' | 'admin';
  fechaRegistro?: string;
  ultimoPedido?: string;
  pedidosCount?: number;
}

export interface Direccion {
  calle: string;
  numero?: string;
  colonia: string;
  ciudad: string;
  estado: string;
  cp: string;
  referencias?: string;
}

export interface Pedido {
  id: string;
  clienteId: string;
  cliente?: Cliente;
  items: CarritoItem[];
  subtotal: number;
  costoEntrega: number;
  descuento?: number;
  total: number;
  estado: PedidoEstado;
  metodoEntrega: 'delivery' | 'pickup';
  direccionEntrega?: Direccion;
  notas?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export type PedidoEstado = 
  | 'pendiente'
  | 'confirmado'
  | 'preparando'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export type Categoria = 
  | 'res'
  | 'cerdo'
  | 'pollo'
  | 'embutidos'
  | 'preparadas'
  | 'premium'
  | 'merch'
  | 'otros'
  | 'ofertas';

export interface AuthUser {
  id: string;
  email: string;
  role: 'cliente' | 'admin';
  emailConfirmed: boolean;
  createdAt: string;
}

export interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CartSummary {
  items: CarritoItem[];
  cantidadTotal: number;
  subtotal: number;
  costoEntrega: number;
  descuento: number;
  total: number;
}

export interface AdminStats {
  pedidosHoy: number;
  pedidosSemana: number;
  pedidosMes: number;
  ingresosHoy: number;
  ingresosSemana: number;
  ingresosMes: number;
  clientesActivos: number;
  productosStockBajo: number;
  productosTotales: number;
}