import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import {
  ALIGNMENT_FILTERS,
  AlignmentFilter,
  ExternalHero,
  Hero,
  HeroFormValue,
} from '../hero.model';
import { HeroService } from '../hero.service';

@Component({
  selector: 'dc-hero-list',
  templateUrl: './hero-list.component.html',
})
export class HeroListComponent implements OnInit, OnDestroy {
  readonly alignmentFilters = ALIGNMENT_FILTERS;
  readonly search = new FormControl('');

  showForm = false;

  readonly skeletons = Array.from({ length: 12 });

  readonly heroes$ = this.heroService.heroes$;
  readonly total$ = this.heroService.total$;
  readonly query$ = this.heroService.query$$;
  readonly totalPages$ = this.heroService.totalPages$;
  readonly status$ = this.heroService.status$;
  readonly error$ = this.heroService.error$;
  readonly importing$ = this.heroService.importing$;
  readonly discovering$ = this.heroService.discovering$;
  readonly discovered$ = this.heroService.discovered$;
  readonly discoveredImported$ = this.heroService.discoveredImported$;

  private readonly destroy$ = new Subject<void>();

  constructor(private heroService: HeroService) {}

  ngOnInit(): void {
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term: string) => this.heroService.setSearch(term));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAlignment(alignment: AlignmentFilter): void {
    this.heroService.setAlignment(alignment);
  }

  onPage(page: number): void {
    this.heroService.goToPage(page);
  }

  onRetry(): void {
    this.heroService.reload();
  }

  onHeroSubmitted(value: HeroFormValue): void {
    this.heroService.create(value);
    this.showForm = false;
  }

  onHeroDeleted(id: number): void {
    this.heroService.remove(id);
  }

  onImportDiscovered(hero: ExternalHero): void {
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
