import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Hero, HeroFormValue } from '../hero.model';
import { applyFormValue } from '../hero.mapper';
import { HeroService } from '../hero.service';

@Component({
  selector: 'dc-hero-edit',
  templateUrl: './hero-edit.component.html',
})
export class HeroEditComponent {
  readonly hero$: Observable<Hero | undefined> = this.route.paramMap.pipe(
    switchMap((params) => this.heroService.getHero(Number(params.get('id'))))
  );

  constructor(
    private route: ActivatedRoute,
    private heroService: HeroService,
    private router: Router
  ) {}

  onSubmit(hero: Hero, value: HeroFormValue): void {
    this.heroService.update(hero.id, applyFormValue(hero, value));
    this.router.navigate(['/']);
  }
}
