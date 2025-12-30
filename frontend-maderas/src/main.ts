import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app'; // <--- CORREGIDO: Es AppComponent, no App

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));