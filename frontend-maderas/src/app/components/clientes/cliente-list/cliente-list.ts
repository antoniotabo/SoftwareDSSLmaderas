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
      next: (data) => this.clientes = data,
      error: (e) => console.error(e)
    });
  }
}