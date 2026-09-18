import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Hero, HeroFormValue, buildNewHero } from './hero.model';

const ALL_HEROES_URL =
  'http://localhost:3000/heroes';

export type HeroesStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface HeroesState {
  heroes: Hero[];
  status: HeroesStatus;
  error: string | null;
}

const initialState: HeroesState = { heroes:[], status:'idle', error:null };

@Injectable({ providedIn: 'root' })
export class HeroService {
  private readonly state$ = new BehaviorSubject<HeroesState>(initialState);

  readonly heroes$: Observable<Hero[]> = this.state$.pipe(map((s) => s.heroes));
  readonly status$: Observable<HeroesStatus> = this.state$.pipe(map((s) => s.status))
  readonly error$:  Observable<string | null> = this.state$.pipe(map((s) => s.error))

  constructor(private http: HttpClient) {}

  private patch(changes: Partial<HeroesState>): void {
    this.state$.next({ ...this.state$.value, ...changes });
  }

  load(): void {
    this.patch({ status: 'loading', error: null });

    this.http.get<Hero[]>(ALL_HEROES_URL).subscribe({
      next: (heroes) => this.patch({ heroes:heroes, status:'loaded' }),
      error: () => this.patch({ status:'error', error:'Request Failed' }),
    });
  }

  remove(id: number): void {
    this.http.delete<void>(`${ALL_HEROES_URL}/${id}`).subscribe({
      next: () => this.patch({ heroes: this.state$.value.heroes.filter(h => h.id !== id) }),
      error: () => this.patch({ error: 'Could not delete hero.' }),
    });
  }

  create(input: HeroFormValue): void {
    this.http.post<Hero>(ALL_HEROES_URL, buildNewHero(input)).subscribe({
      next: (created) => this.patch({ heroes: [...this.state$.value.heroes, created] }),
      error: () => this.patch({ error: 'Could not create hero.' }),
    });
  }

  getHero(id: number): Observable<Hero | undefined> {
    return this.heroes$.pipe(map((heroes) => heroes.find((h) => h.id === id)));
  }

  ensureLoaded(): void {
    if (this.state$.value.status === 'idle') {
      this.load();
    }
  }

  update(id: number, updated: Hero): void {
    this.http.put<Hero>(`${ALL_HEROES_URL}/${id}`, updated).subscribe({
      next: (saved) => this.patch({ heroes: this.state$.value.heroes.map( h => h.id === saved.id ? saved : h) }),
      error: () => this.patch({ error: 'Could not update hero.' }),
    });
  }
}
