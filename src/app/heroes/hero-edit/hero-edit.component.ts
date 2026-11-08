import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { map, startWith, switchMap } from 'rxjs';

import { HeroFormComponent } from '../hero-form/hero-form.component';
import { applyFormValue } from '../hero.mapper';
import { Hero, HeroFormValue } from '../hero.model';
import { HeroStore } from '../hero.store';

type EditState = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; hero: Hero };

@Component({
  selector: 'dc-hero-edit',
  imports: [HeroFormComponent, RouterLink],
  templateUrl: './hero-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroEditComponent {
  /** Route param, bound by withComponentInputBinding(). */
  readonly id = input.required<string>();

  private readonly store = inject(HeroStore);
  private readonly router = inject(Router);

  protected readonly state = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.store.getHero(Number(id)).pipe(
          map((hero): EditState =>
            hero === undefined ? { status: 'missing' } : { status: 'ready', hero },
          ),
          startWith<EditState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } satisfies EditState },
  );

  protected readonly readyHero = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.hero : null;
  });

  protected onSubmit(hero: Hero, value: HeroFormValue): void {
    this.store.update(applyFormValue(hero, value));
    void this.router.navigate(['/']);
  }
}
