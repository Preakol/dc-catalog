export interface StripeCardBrand {
  brand: string;
  last4: string;
}

export interface StripePaymentMethod {
  id: string;
  card: StripeCardBrand;
}

export interface StripeFieldError {
  message?: string;
}

export interface StripeChangeEvent {
  complete: boolean;
  empty: boolean;
  error?: StripeFieldError;
}

export interface StripeCardElement {
  mount(target: HTMLElement): void;
  destroy(): void;
  on(event: 'change', handler: (event: StripeChangeEvent) => void): void;
}

export interface StripeElementStyle {
  base?: Record<string, string | Record<string, string>>;
  invalid?: Record<string, string>;
}

export interface StripeCardElementOptions {
  style?: StripeElementStyle;
  hidePostalCode?: boolean;
}

export interface StripeElements {
  create(type: 'card', options?: StripeCardElementOptions): StripeCardElement;
}

export interface StripePaymentMethodResult {
  paymentMethod?: StripePaymentMethod;
  error?: StripeFieldError;
}

export interface StripeInstance {
  elements(): StripeElements;
  createPaymentMethod(data: {
    type: 'card';
    card: StripeCardElement;
  }): Promise<StripePaymentMethodResult>;
}

export type StripeFactory = (publishableKey: string) => StripeInstance;

declare global {
  interface Window {
    Stripe?: StripeFactory;
  }
}
