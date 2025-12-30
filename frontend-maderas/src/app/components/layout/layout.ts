import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink], 
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class LayoutComponent {
  private auth = inject(AuthService);

  logout() {
    this.auth.logout();
  }
}