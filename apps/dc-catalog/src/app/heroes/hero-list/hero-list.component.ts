import { Component, OnInit } from '@angular/core';
import { HeroService } from '../hero.service';
import { Hero, HeroFormValue } from '../hero.model';
import { FormControl } from '@angular/forms';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith} from 'rxjs/operators';
import { filterHeroes, ALIGNMENT_FILTERS, AlignmentFilter} from '../hero.model';

@Component({
  selector: 'dc-hero-list',
  templateUrl: './hero-list.component.html',
  styleUrls: ['./hero-list.component.css']
})
export class HeroListComponent implements OnInit {
  title = 'DC Catalog';

  search = new FormControl('')

  search$ = this.search.valueChanges.pipe(
    debounceTime(250),
    distinctUntilChanged(),
    startWith('')
  )

  readonly alignmentFilters = ALIGNMENT_FILTERS;

  readonly alignment = new FormControl('all')

  readonly alignment$: Observable<AlignmentFilter> = this.alignment.valueChanges.pipe(startWith('all'))

  readonly heroes$: Observable<Hero[]> = combineLatest([
    this.heroService.heroes$,
    this.search$,
    this.alignment$
  ]).pipe(
    map(([heroes, term, alignment]) => filterHeroes(heroes, term, alignment))
  )

  readonly status$ = this.heroService.status$
  readonly error$ = this.heroService.error$

  constructor(private heroService: HeroService) {}

  ngOnInit(): void {
    this.heroService.load();
  }

  onHeroDeleted(id: number): void {
    this.heroService.remove(id);
  }

  onClickRetry(): void {
    this.heroService.load();
  }

  onHeroSubmitted(value: HeroFormValue): void {
    this.heroService.create(value)
  }

  trackById(index: number, hero: Hero): number {
    return hero.id
  }
}
