import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import { from, Observable, of, switchMap, throwError } from 'rxjs';

import {
  StripeCardElement,
  StripeCardElementOptions,
  StripeInstance,
  StripePaymentMethod,
  StripePaymentMethodResult,
} from './stripe.types';

const CARD_OPTIONS: StripeCardElementOptions = {
  hidePostalCode: true,
  style: {
    base: {
      color: '#e2e8f0',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '14px',
      iconColor: '#7dd3fc',
      '::placeholder': { color: '#64748b' },
    },
    invalid: { color: '#fda4af', iconColor: '#fda4af' },
  },
};

/** Stripe publishable test key (pk_test_...); empty disables checkout. */
export const STRIPE_PUBLISHABLE_KEY = new InjectionToken<string>('STRIPE_PUBLISHABLE_KEY', {
  factory: () => '',
});

export function paymentErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : 'The payment provider did not answer.';
}

/** Stripe card tokenisation in test mode. There is no server, so nothing is charged. */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly publishableKey = inject(STRIPE_PUBLISHABLE_KEY);

  readonly keyPresent = this.publishableKey.length > 0;

  private readonly fieldErrorState = signal<string | null>(null);
  private readonly cardCompleteState = signal(false);

  readonly fieldError = this.fieldErrorState.asReadonly();
  readonly cardComplete = this.cardCompleteState.asReadonly();

  private stripe: StripeInstance | null = null;
  private card: StripeCardElement | null = null;

  scriptLoaded(): boolean {
    return window.Stripe !== undefined;
  }

  available(): boolean {
    return this.keyPresent && this.scriptLoaded();
  }

  mount(host: HTMLElement): void {
    const instance = this.instance();

    if (instance === null || this.card !== null) {
      return;
    }

    const card = instance.elements().create('card', CARD_OPTIONS);

    card.on('change', (event) => {
      this.fieldErrorState.set(event.error?.message ?? null);
      this.cardCompleteState.set(event.complete);
    });

    card.mount(host);
    this.card = card;
  }

  unmount(): void {
    this.card?.destroy();
    this.card = null;
    this.fieldErrorState.set(null);
    this.cardCompleteState.set(false);
  }

  createPaymentMethod(): Observable<StripePaymentMethod> {
    const instance = this.instance();
    const card = this.card;

    if (instance === null || card === null) {
      return throwError(() => new Error('The card form is not ready.'));
    }

    return from(instance.createPaymentMethod({ type: 'card', card })).pipe(
      switchMap((result: StripePaymentMethodResult) =>
        result.paymentMethod === undefined
          ? throwError(() => new Error(result.error?.message ?? 'The card was rejected.'))
          : of(result.paymentMethod),
      ),
    );
  }

  private instance(): StripeInstance | null {
    if (this.stripe !== null) {
      return this.stripe;
    }

    const factory = window.Stripe;

    if (factory === undefined || !this.keyPresent) {
      return null;
    }

    this.stripe = factory(this.publishableKey);
    return this.stripe;
  }
}
