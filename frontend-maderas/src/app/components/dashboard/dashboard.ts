import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PackingService } from '../../services/packing.service'; // Reusamos servicios existentes
import { ClienteService } from '../../services/cliente.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  // Inyectamos servicios para contar datos
  private packingService = inject(PackingService);
  private clienteService = inject(ClienteService);

  totalPackings = 0;
  totalClientes = 0;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // Obtenemos los packings y contamos cuántos hay
    this.packingService.getPackings().subscribe(res => {
      if(res.success) this.totalPackings = res.data.length;
    });

    // Obtenemos clientes y contamos
    this.clienteService.getClientes().subscribe(data => {
      this.totalClientes = data.length;
    });
  }
}