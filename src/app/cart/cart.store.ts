import { computed, inject, Injectable, signal } from '@angular/core';

import { Hero } from '../heroes/hero.model';
import { PLACEHOLDER_IMAGE, priceOf } from '../heroes/hero.utils';
import { CartItem, Order } from './cart.model';
import { CartState, initialCartState } from './cart.state';
import { loadCart, loadOrders, saveCart, saveOrders } from './cart.storage';
import { cartTotal, ownsHero } from './cart.utils';
import { paymentErrorMessage, PaymentService } from './payment.service';

function newOrderId(): string {
  return `ord_${Date.now().toString(36)}`;
}

function toCartItem(hero: Hero): CartItem {
  return {
    heroId: hero.id,
    name: hero.name,
    imageUrl: hero.images?.md || PLACEHOLDER_IMAGE,
    price: priceOf(hero),
  };
}

/** Cart and order history, persisted in localStorage. */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly payment = inject(PaymentService);

  private readonly state = signal<CartState>({
    ...initialCartState,
    items: loadCart(),
    orders: loadOrders(),
  });

  readonly items = computed(() => this.state().items);
  readonly count = computed(() => this.state().items.length);
  readonly total = computed(() => cartTotal(this.state().items));
  readonly orders = computed(() => this.state().orders);
  readonly status = computed(() => this.state().status);
  readonly error = computed(() => this.state().error);

  readonly cartIds = computed(() => new Set(this.items().map((item) => item.heroId)));

  readonly ownedIds = computed(
    () => new Set(this.orders().flatMap((order) => order.items.map((item) => item.heroId))),
  );

  add(hero: Hero): void {
    const { items, orders } = this.state();

    if (ownsHero(orders, hero.id) || items.some((item) => item.heroId === hero.id)) {
      return;
    }

    this.persist([...items, toCartItem(hero)]);
  }

  remove(heroId: number): void {
    this.persist(this.items().filter((item) => item.heroId !== heroId));
  }

  clear(): void {
    this.persist([]);
  }

  dismissError(): void {
    if (this.error() !== null) {
      this.patch({ error: null });
    }
  }

  resetCheckout(): void {
    this.patch({ status: 'idle', error: null });
  }

  checkout(): void {
    const items = this.items();

    if (items.length === 0 || !this.payment.available()) {
      return;
    }

    this.patch({ status: 'paying', error: null });

    this.payment.createPaymentMethod().subscribe({
      next: (method) => this.recordOrder(items, method.id, method.card),
      error: (error: unknown) => this.patch({ status: 'error', error: paymentErrorMessage(error) }),
    });
  }

  private recordOrder(
    items: CartItem[],
    paymentMethodId: string,
    card: { brand: string; last4: string },
  ): void {
    const order: Order = {
      id: newOrderId(),
      placedAt: new Date().toISOString(),
      total: cartTotal(items),
      items: items.map((item) => ({ ...item })),
      paymentMethodId,
      cardBrand: card.brand,
      cardLast4: card.last4,
    };

    const orders = [order, ...this.orders()];

    saveOrders(orders);
    saveCart([]);
    this.patch({ items: [], orders, status: 'done', error: null });
  }

  private persist(items: CartItem[]): void {
    saveCart(items);
    this.patch({ items });
  }

  private patch(changes: Partial<CartState>): void {
    this.state.update((state) => ({ ...state, ...changes }));
  }
}
