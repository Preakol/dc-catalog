import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Hero, HeroFormValue, applyFormValue } from '../hero.model';
import { switchMap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { HeroService } from '../hero.service';

@Component({
  selector: 'dc-hero-edit',
  templateUrl: './hero-edit.component.html',
  styleUrls: ['./hero-edit.component.css']
})
export class HeroEditComponent implements OnInit {
  readonly hero$: Observable<Hero | undefined> = this.route.paramMap.pipe(
    switchMap((params) => this.heroService.getHero(Number(params.get('id'))))
  );

  constructor(
    private route: ActivatedRoute,
    private heroService: HeroService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.heroService.ensureLoaded();
  }

  onSubmit(hero: Hero, value: HeroFormValue): void {
    this.heroService.update(hero.id, applyFormValue(hero, value));
    this.router.navigate(['/']);
  }
}
