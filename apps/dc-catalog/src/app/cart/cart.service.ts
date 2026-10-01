import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Hero } from '../heroes/hero.model';
import { PLACEHOLDER_IMAGE, priceOf } from '../heroes/hero.utils';
import { CartItem, Order } from './cart.model';
import { CartState, CheckoutStatus, initialCartState } from './cart.state';
import { cartTotal, ownsHero } from './cart.utils';
import { loadCart, loadOrders, saveCart, saveOrders } from './cart.storage';
import { PaymentService, paymentErrorMessage } from './payment.service';

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

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly state$ = new BehaviorSubject<CartState>({
    ...initialCartState,
    items: loadCart(),
    orders: loadOrders(),
  });

  readonly items$: Observable<CartItem[]> = this.state$.pipe(map((s) => s.items));
  readonly count$: Observable<number> = this.state$.pipe(map((s) => s.items.length));
  readonly total$: Observable<number> = this.state$.pipe(map((s) => cartTotal(s.items)));
  readonly orders$: Observable<Order[]> = this.state$.pipe(map((s) => s.orders));
  readonly status$: Observable<CheckoutStatus> = this.state$.pipe(map((s) => s.status));
  readonly error$: Observable<string | null> = this.state$.pipe(map((s) => s.error));

  readonly cartIds$: Observable<Set<number>> = this.items$.pipe(
    map((items) => new Set(items.map((item) => item.heroId)))
  );

  readonly ownedIds$: Observable<Set<number>> = this.orders$.pipe(
    map((orders) => {
      const ids = new Set<number>();
      orders.forEach((order) => order.items.forEach((item) => ids.add(item.heroId)));
      return ids;
    })
  );

  readonly checkoutAvailable = this.payment.available;

  constructor(private payment: PaymentService) {}

  add(hero: Hero): void {
    const { items, orders } = this.state$.value;

    if (ownsHero(orders, hero.id) || items.some((item) => item.heroId === hero.id)) {
      return;
    }

    this.persist([...items, toCartItem(hero)]);
  }

  remove(heroId: number): void {
    this.persist(this.state$.value.items.filter((item) => item.heroId !== heroId));
  }

  clear(): void {
    this.persist([]);
  }

  inCart(heroId: number): Observable<boolean> {
    return this.items$.pipe(map((items) => items.some((item) => item.heroId === heroId)));
  }

  owns(heroId: number): Observable<boolean> {
    return this.orders$.pipe(map((orders) => ownsHero(orders, heroId)));
  }

  dismissError(): void {
    if (this.state$.value.error !== null) {
      this.patch({ error: null });
    }
  }

  resetCheckout(): void {
    this.patch({ status: 'idle', error: null });
  }

  checkout(): void {
    const { items } = this.state$.value;

    if (items.length === 0 || !this.payment.available) {
      return;
    }

    this.patch({ status: 'paying', error: null });

    this.payment.createPaymentMethod().subscribe({
      next: (method) => this.recordOrder(items, method.id, method.card),
      error: (error: unknown) =>
        this.patch({ status: 'error', error: paymentErrorMessage(error) }),
    });
  }

  private recordOrder(
    items: CartItem[],
    paymentMethodId: string,
    card: { brand: string; last4: string }
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

    const orders = [order, ...this.state$.value.orders];

    saveOrders(orders);
    saveCart([]);
    this.patch({ items: [], orders, status: 'done', error: null });
  }

  private persist(items: CartItem[]): void {
    saveCart(items);
    this.patch({ items });
  }

  private patch(changes: Partial<CartState>): void {
    this.state$.next({ ...this.state$.value, ...changes });
  }
}
