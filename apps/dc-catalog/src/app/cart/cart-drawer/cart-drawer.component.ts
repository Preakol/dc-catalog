import { Component, EventEmitter, HostListener, Input, Output } from "@angular/core";
import { Observable } from "rxjs";

import { CartItem,  } from "../cart.model";
import { CartService } from "../cart.service";

@Component({selector: 'dc-cart-drawer', templateUrl: './cart-drawer.component.html'})
export class CartDrawerComponent {
    @Input() open = false;
    @Output() closed = new EventEmitter<void>();

    readonly items$: Observable<CartItem[]> = this.cart.items$;
    readonly total$: Observable<number> = this.cart.total$;

    constructor(private cart: CartService) {}

    @HostListener('document:keydown.escape')
    onClose(): void {
        if (this.open) {
            this.closed.emit();
        }
    }

    onRemove(heroId: number): void {
        this.cart.remove(heroId)
    }

    onClear(): void {
        this.cart.clear();
    }

    trackByHeroId(index: number, item: CartItem): number {
        return item.heroId;
    }
}