import {
    AfterViewInit,
    Directive,
    ElementRef,
    EventEmitter,
    OnDestroy,
    Output,
} from '@angular/core';

@Directive({selector: '[dcInView]'})
export class InViewDirective implements AfterViewInit, OnDestroy {
    @Output() dcInView = new EventEmitter<void>();

    private observer: IntersectionObserver | null = null;

    constructor(private host: ElementRef<HTMLElement>) {}

    ngAfterViewInit(): void {
        this.observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    this.dcInView.emit();
                }
            },
            { root: null, rootMargin: '200px', threshold: 0 }
        );

        this.observer.observe(this.host.nativeElement);
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        this.observer = null;
    }
}