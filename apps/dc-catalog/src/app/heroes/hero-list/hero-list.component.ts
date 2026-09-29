import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';

import {
  ALIGNMENT_FILTERS,
  AlignmentFilter,
  Hero,
  HeroFormValue,
} from '../hero.model';
import { filterHeroes } from '../hero.filter';
import { HeroService } from '../hero.service';

@Component({
  selector: 'dc-hero-list',
  templateUrl: './hero-list.component.html',
})
export class HeroListComponent implements OnInit {
  readonly alignmentFilters = ALIGNMENT_FILTERS;

  readonly search = new FormControl('');
  readonly alignment = new FormControl('all');

  showForm = false;

  readonly skeletons = Array.from({ length: 8 });

  private readonly search$: Observable<string> = this.search.valueChanges.pipe(
    debounceTime(250),
    distinctUntilChanged(),
    startWith('')
  );

  private readonly alignment$: Observable<AlignmentFilter> =
    this.alignment.valueChanges.pipe(startWith('all'));

  readonly heroes$: Observable<Hero[]> = combineLatest([
    this.heroService.heroes$,
    this.search$,
    this.alignment$,
  ]).pipe(map(([heroes, term, alignment]) => filterHeroes(heroes, term, alignment)));

  readonly status$ = this.heroService.status$;
  readonly error$ = this.heroService.error$;
  readonly importing$ = this.heroService.importing$;
  readonly discovering$ = this.heroService.discovering$;
  readonly discovered$ = this.heroService.discovered$;

  readonly discoveredImported$: Observable<boolean> = combineLatest([
    this.heroService.discovered$,
    this.heroService.heroes$,
  ]).pipe(
    map(([discovered, heroes]) =>
      !!discovered && heroes.some((h) => h.slug === discovered.slug)
    )
  );

  constructor(private heroService: HeroService) {}

  ngOnInit(): void {
    this.heroService.load();
  }

  onRetry(): void {
    this.heroService.load();
  }

  onHeroSubmitted(value: HeroFormValue): void {
    this.heroService.create(value);
    this.showForm = false;
  }

  onHeroDeleted(id: number): void {
    this.heroService.remove(id);
  }

  onImportDiscovered(hero: Hero): void {
    this.heroService.importHero(hero);
  }

  onDiscoverAnother(): void {
    this.heroService.discoverAnother();
  }

  onDismissError(): void {
    this.heroService.clearError();
  }

  trackById(index: number, hero: Hero): number {
    return hero.id;
  }
}
