import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
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

export function paymentErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : 'The payment provider did not answer.';
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  readonly keyPresent = environment.stripePublishableKey.length > 0;

  private readonly fieldError = new BehaviorSubject<string | null>(null);
  private readonly cardComplete = new BehaviorSubject<boolean>(false);

  readonly fieldError$: Observable<string | null> = this.fieldError.asObservable();
  readonly cardComplete$: Observable<boolean> = this.cardComplete.asObservable();

  private stripe: StripeInstance | null = null;
  private card: StripeCardElement | null = null;

  constructor(private zone: NgZone) {}

  get scriptLoaded(): boolean {
    return window.Stripe !== undefined;
  }

  get available(): boolean {
    return this.keyPresent && this.scriptLoaded;
  }

  mount(host: HTMLElement): void {
    const instance = this.instance();

    if (instance === null || this.card !== null) {
      return;
    }

    const card = instance.elements().create('card', CARD_OPTIONS);

    card.on('change', (event) =>
      this.zone.run(() => {
        this.fieldError.next(event.error?.message ?? null);
        this.cardComplete.next(event.complete);
      })
    );

    card.mount(host);
    this.card = card;
  }

  unmount(): void {
    this.card?.destroy();
    this.card = null;
    this.fieldError.next(null);
    this.cardComplete.next(false);
  }

  createPaymentMethod(): Observable<StripePaymentMethod> {
    const instance = this.instance();
    const card = this.card;

    if (instance === null || card === null) {
      return throwError(new Error('The card form is not ready.'));
    }

    return from(instance.createPaymentMethod({ type: 'card', card })).pipe(
      switchMap((result: StripePaymentMethodResult) =>
        result.paymentMethod === undefined
          ? throwError(new Error(result.error?.message ?? 'The card was rejected.'))
          : from([result.paymentMethod])
      )
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

    this.stripe = factory(environment.stripePublishableKey);
    return this.stripe;
  }
}
