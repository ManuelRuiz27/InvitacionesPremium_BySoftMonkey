import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Phosphor Icons - Para Guest Landing (Premium)
import 'phosphor-icons';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
