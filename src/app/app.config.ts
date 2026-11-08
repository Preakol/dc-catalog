import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  EnvironmentProviders,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { STRIPE_PUBLISHABLE_KEY } from './cart/payment.service';
import { provideHeroData } from './heroes/data/data-source';

/** Route params are bound to component inputs (e.g. `id` on the detail page). */
export function provideAppRouter(): EnvironmentProviders {
  return provideRouter(routes, withComponentInputBinding());
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppRouter(),
    provideHttpClient(withFetch()),
    provideHeroData(environment),
    { provide: STRIPE_PUBLISHABLE_KEY, useValue: environment.stripePublishableKey },
  ],
};
