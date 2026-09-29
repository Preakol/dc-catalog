import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, defer, of } from 'rxjs';
import { catchError, finalize, map, retry, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Hero, HeroFormValue } from './hero.model';
import { HeroesState, HeroesStatus, initialState } from './hero.state';
import { buildNewHero } from './hero.mapper';

const HEROES_URL = `${environment.apiUrl}/heroes`;

const EXTERNAL_API = environment.heroesApiUrl;

const EXTERNAL_MAX_ID = 731;
const EXTERNAL_DRAWS = 5;

function randomExternalId(): number {
  return 1 + Math.floor(Math.random() * EXTERNAL_MAX_ID);
}

@Injectable({ providedIn: 'root' })
export class HeroService {
  private readonly state$ = new BehaviorSubject<HeroesState>(initialState);

  readonly heroes$: Observable<Hero[]> = this.state$.pipe(map((s) => s.heroes));
  readonly status$: Observable<HeroesStatus> = this.state$.pipe(map((s) => s.status));
  readonly error$: Observable<string | null> = this.state$.pipe(map((s) => s.error));
  readonly importing$: Observable<boolean> = this.state$.pipe(map((s) => s.importing));
  readonly discovering$: Observable<boolean> = this.state$.pipe(map((s) => s.discovering));

  private readonly discoverAgain$ = new Subject<void>();

  readonly discovered$: Observable<Hero | null> = this.discoverAgain$.pipe(
    startWith(undefined),
    tap(() => this.patch({ discovering: true })),
    switchMap(() =>
      defer(() =>
        this.http.get<Hero>(`${EXTERNAL_API}/id/${randomExternalId()}.json`)
      ).pipe(
        retry(EXTERNAL_DRAWS),
        catchError(() => of(null)),
        finalize(() => this.patch({ discovering: false }))
      )
    ),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  constructor(private http: HttpClient) {}

  load(): void {
    this.patch({ status: 'loading', error: null });

    this.request(
      this.http.get<Hero[]>(HEROES_URL),
      (heroes) => ({ heroes, status: 'loaded' }),
      { status: 'error', error: 'Could not load heroes.' }
    );
  }

  ensureLoaded(): void {
    if (this.state$.value.status === 'idle') {
      this.load();
    }
  }

  create(input: HeroFormValue): void {
    this.request(
      this.http.post<Hero>(HEROES_URL, buildNewHero(input)),
      (created) => ({ heroes: [...this.currentHeroes, created] }),
      { error: 'Could not create hero.' }
    );
  }

  importHero(hero: Hero): void {
    const { id, ...withoutId } = hero;

    this.patch({ importing: true });

    this.request(
      this.http.post<Hero>(HEROES_URL, withoutId),
      (created) => ({ heroes: [...this.currentHeroes, created], importing: false }),
      { error: 'Could not import hero.', importing: false }
    );
  }

  update(id: number, updated: Hero): void {
    this.request(
      this.http.put<Hero>(`${HEROES_URL}/${id}`, updated),
      (saved) => ({
        heroes: this.currentHeroes.map((h) => (h.id === saved.id ? saved : h)),
      }),
      { error: 'Could not save hero.' }
    );
  }

  remove(id: number): void {
    this.request(
      this.http.delete<void>(`${HEROES_URL}/${id}`),
      () => ({ heroes: this.currentHeroes.filter((h) => h.id !== id) }),
      { error: 'Could not delete hero.' }
    );
  }

  getHero(id: number): Observable<Hero | undefined> {
    return this.heroes$.pipe(map((heroes) => heroes.find((h) => h.id === id)));
  }

  discoverAnother(): void {
    this.discoverAgain$.next();
  }

  clearError(): void {
    if (this.state$.value.error !== null) {
      this.patch({ error: null });
    }
  }

  private get currentHeroes(): Hero[] {
    return this.state$.value.heroes;
  }

  private request<T>(
    request$: Observable<T>,
    onSuccess: (value: T) => Partial<HeroesState>,
    onError: Partial<HeroesState>
  ): void {
    request$.subscribe({
      next: (value) => this.patch(onSuccess(value)),
      error: () => this.patch(onError),
    });
  }

  private patch(changes: Partial<HeroesState>): void {
    this.state$.next({ ...this.state$.value, ...changes });
  }
}
