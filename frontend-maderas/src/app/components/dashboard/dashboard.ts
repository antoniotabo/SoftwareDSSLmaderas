import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PackingService } from '../../services/packing.service';
import { ClienteService } from '../../services/cliente.service';
import { FacturaService } from '../../services/factura.service';
import { CompraService } from '../../services/compra.service';
import { AuthService } from '../../services/auth.service';
// ✅ 1. IMPORTAMOS EL SERVICIO DE INVENTARIO
import { InventarioService } from '../../services/inventario.service';

interface MesHistorial {
  etiqueta: string;
  ventas: number;
  gastos: number;
  balance: number;
  porcentaje: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private packingService = inject(PackingService);
  private clienteService = inject(ClienteService);
  private facturaService = inject(FacturaService);
  private compraService = inject(CompraService);
  // ✅ 2. INYECTAMOS INVENTARIO
  private inventarioService = inject(InventarioService);

  isGerente = false;
  nombreUsuario = '';
  loading = true;
  fechaActual = new Date();

  // Estadísticas Generales
  stats = {
    totalClientes: 0,
    clientesActivos: 0,
    totalPackings: 0,
    packingsHoy: 0,
    totalFacturas: 0,
    facturasEmitidas: 0,
    facturasPagadas: 0,
    ventasMes: 0,
    gastosMes: 0,
    balanceMes: 0,
    ventasHoy: 0,
    ticketPromedio: 0,
    ultimosPackings: [] as any[],
    ultimasFacturas: [] as any[],
    topClientes: [] as any[]
  };

  // ✅ 3. VARIABLES PARA STOCK (NUEVO)
  stockStats = {
    totalPT: 0,
    cantidadEspecies: 0,
    alertasBajo: 0,
    topStock: [] as any[]
  };

  historial: MesHistorial[] = [];

  ngOnInit() {
    const user = this.authService.currentUserValue;
    if (user) {
        this.isGerente = user.rol === 'GERENTE'; // O 'admin' según tu BD
        this.nombreUsuario = user.nombre;
    }

    if (this.isGerente) {
        this.cargarDashboard();
    } else {
        this.loading = false;
    }
  }

  cargarDashboard() {
    this.loading = true;
    // Ejecutamos todo en paralelo para que cargue rápido
    this.cargarClientes();
    this.cargarPackings();
    this.cargarFinanzasGlobales();
    this.cargarInventario(); // ✅ Nueva función
  }

  // ✅ 4. LÓGICA DE INVENTARIO
  cargarInventario() {
    this.inventarioService.getStock().subscribe({
        next: (res: any) => {
            const data = res.data || [];
            
            // a) Total de Pies Tablares en almacén
            this.stockStats.totalPT = data.reduce((acc: number, item: any) => acc + (Number(item.cantidad_pt) || 0), 0);
            
            // b) Cantidad de especies distintas
            this.stockStats.cantidadEspecies = data.length;

            // c) Alertas (ejemplo: menos de 1000 PT)
            this.stockStats.alertasBajo = data.filter((item: any) => item.cantidad_pt < 1000 && item.cantidad_pt > 0).length;

            // d) Top 5 especies con más stock
            this.stockStats.topStock = data
                .sort((a: any, b: any) => b.cantidad_pt - a.cantidad_pt)
                .slice(0, 5);
        },
        error: (err) => console.error('Error cargando inventario', err)
    });
  }

  cargarClientes() {
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.stats.totalClientes = data.length;
          this.stats.clientesActivos = data.filter((c: any) => c.estado === 'ACTIVO').length;
        }
      }
    });
  }

  cargarPackings() {
    this.packingService.getPackings().subscribe({
      next: (res: any) => {
        const lista = (res.data && Array.isArray(res.data)) ? res.data : [];
        this.stats.totalPackings = lista.length;
        const hoy = new Date().toISOString().split('T')[0];
        this.stats.packingsHoy = lista.filter((p: any) => p.fecha?.startsWith(hoy)).length;
        this.stats.ultimosPackings = lista.slice(0, 5); 
      }
    });
  }

  cargarFinanzasGlobales() {
    this.facturaService.getFacturas().subscribe((facturas) => {
      this.compraService.getCompras().subscribe((compras) => {
        const listaFacturas = Array.isArray(facturas) ? facturas : [];
        const listaCompras = Array.isArray(compras) ? compras : [];
        this.procesarDatosFinancieros(listaFacturas, listaCompras);
        this.loading = false;
      });
    });
  }

  procesarDatosFinancieros(facturas: any[], compras: any[]) {
    this.stats.totalFacturas = facturas.length;
    this.stats.facturasEmitidas = facturas.filter(f => f.estado === 'EMITIDA').length;
    this.stats.facturasPagadas = facturas.filter(f => f.estado === 'PAGADA').length;
    this.stats.ultimasFacturas = facturas.slice(0, 5);

    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    this.stats.ventasMes = this.calcularTotalPorMes(facturas, mesActual, anioActual, 'venta');
    this.stats.gastosMes = this.calcularTotalPorMes(compras, mesActual, anioActual, 'gasto');
    this.stats.balanceMes = this.stats.ventasMes - this.stats.gastosMes;

    const fechaHoyStr = hoy.toISOString().split('T')[0];
    this.stats.ventasHoy = facturas
      .filter(f => f.fecha?.startsWith(fechaHoyStr))
      .reduce((sum, f) => sum + parseFloat(f.total_calculado || 0), 0);

    if (this.stats.totalFacturas > 0) {
        const totalHistoricoVentas = facturas.reduce((sum, f) => sum + parseFloat(f.total_calculado || 0), 0);
        this.stats.ticketPromedio = totalHistoricoVentas / this.stats.totalFacturas;
    }

    const ventasPorCliente: any = {};
    facturas.forEach((f: any) => {
        const nombre = f.cliente_nombre || 'Desconocido';
        const monto = parseFloat(f.total_calculado || 0);
        if (!ventasPorCliente[nombre]) ventasPorCliente[nombre] = 0;
        ventasPorCliente[nombre] += monto;
    });

    this.stats.topClientes = Object.keys(ventasPorCliente)
        .map(key => ({ nombre: key, total: ventasPorCliente[key] }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

    this.historial = [];
    let maxVenta = 0;

    for (let i = 0; i < 6; i++) { 
      const fechaIteracion = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const mes = fechaIteracion.getMonth();
      const anio = fechaIteracion.getFullYear();

      const ventas = this.calcularTotalPorMes(facturas, mes, anio, 'venta');
      const gastos = this.calcularTotalPorMes(compras, mes, anio, 'gasto');

      if (ventas > maxVenta) maxVenta = ventas;

      this.historial.push({
        etiqueta: this.getNombreMes(mes) + ' ' + anio,
        ventas,
        gastos,
        balance: ventas - gastos,
        porcentaje: 0
      });
    }

    this.historial.forEach(h => {
      h.porcentaje = maxVenta > 0 ? (h.ventas / maxVenta) * 100 : 0;
    });
  }

  calcularTotalPorMes(lista: any[], mes: number, anio: number, tipo: 'venta' | 'gasto'): number {
    return lista
      .filter((item: any) => {
        const d = new Date(item.fecha);
        return d.getMonth() === mes && d.getFullYear() === anio;
      })
      .reduce((sum: number, item: any) => {
        let monto = 0;
        if (tipo === 'venta') {
          monto = parseFloat(item.total_calculado || 0);
        } else {
          monto = item.total_compra ? parseFloat(item.total_compra) : (parseFloat(item.cantidad_pt||0) * parseFloat(item.precio_pt||0));
        }
        return sum + monto;
      }, 0);
  }

  getNombreMes(mesIndex: number): string {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[mesIndex];
  }

  getBadgeClass(estado: string): string {
    const clases: any = { 'EMITIDA': 'bg-warning text-dark', 'PAGADA': 'bg-success', 'PENDIENTE': 'bg-danger' };
    return clases[estado] || 'bg-secondary';
  }

  recargar() {
    this.cargarDashboard();
  }
}