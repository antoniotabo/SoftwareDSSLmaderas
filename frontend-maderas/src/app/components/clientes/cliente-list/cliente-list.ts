import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../../services/cliente.service';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cliente-list.html'
})
export class ClienteListComponent implements OnInit {
  private clienteService = inject(ClienteService);
  clientes: any[] = [];

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        // Si el backend devuelve { success: true, data: [...] } o directo el array
        this.clientes = Array.isArray(data) ? data : (data as any).data || [];
      },
      error: (e) => console.error(e)
    });
  }

  eliminarCliente(id: number) {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      this.clienteService.deleteCliente(id).subscribe({
        next: () => {
          alert('Cliente eliminado correctamente');
          this.cargarClientes(); // Recargar la lista
        },
        
       error: (err) => {
        console.error('❌ Error:', err);
        alert('Error al eliminar: ' + (err.error?.message || 'No se puede eliminar'));
      }
      });
    }
  }
}