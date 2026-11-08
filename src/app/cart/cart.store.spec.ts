import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { makeHero } from '../../testing/heroes';
import { CartStore } from './cart.store';
import { loadOrders } from './cart.storage';
import { PaymentService } from './payment.service';

const batman = makeHero({ id: 1, name: 'Batman' });
const robin = makeHero({ id: 2, name: 'Robin' });

describe('CartStore', () => {
  let payment: { available: () => boolean; createPaymentMethod: ReturnType<typeof vi.fn> };

  function create(): CartStore {
    TestBed.configureTestingModule({ providers: [{ provide: PaymentService, useValue: payment }] });
    return TestBed.inject(CartStore);
  }

  beforeEach(() => {
    localStorage.clear();
    payment = {
      available: () => true,
      createPaymentMethod: vi.fn(() => of({ id: 'pm_1', card: { brand: 'visa', last4: '4242' } })),
    };
  });

  it('adds each hero once and persists the cart', () => {
    const cart = create();
    cart.add(batman);
    cart.add(batman);
    cart.add(robin);

    expect(cart.count()).toBe(2);
    expect(cart.total()).toBe(1200);

    TestBed.resetTestingModule();
    expect(create().count()).toBe(2);
  });

  it('turns the cart into an order on checkout', () => {
    const cart = create();
    cart.add(batman);
    cart.checkout();

    expect(cart.status()).toBe('done');
    expect(cart.count()).toBe(0);
    expect(cart.ownedIds().has(1)).toBe(true);
    expect(loadOrders()[0]).toMatchObject({ cardBrand: 'visa', cardLast4: '4242', total: 600 });

    cart.add(batman);
    expect(cart.count()).toBe(0);
  });

  it('keeps the cart and shows the error when payment fails', () => {
    payment.createPaymentMethod = vi.fn(() =>
      throwError(() => new Error('Your card was declined.')),
    );
    const cart = create();
    cart.add(batman);
    cart.checkout();

    expect(cart.status()).toBe('error');
    expect(cart.error()).toBe('Your card was declined.');
    expect(cart.count()).toBe(1);
  });

  it('does not check out without a payment provider', () => {
    payment.available = () => false;
    const cart = create();
    cart.add(batman);
    cart.checkout();

    expect(payment.createPaymentMethod).not.toHaveBeenCalled();
    expect(cart.status()).toBe('idle');
  });
});
