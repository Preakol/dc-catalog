import { afterNextRender, DestroyRef, Directive, ElementRef, inject, output } from '@angular/core';

/** Emits when the host scrolls within 200px of the viewport (infinite scrolling). */
@Directive({ selector: '[dcInView]' })
export class InViewDirective {
  readonly dcInView = output<void>();

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.dcInView.emit();
          }
        },
        { root: null, rootMargin: '200px', threshold: 0 },
      );

      observer.observe(host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
