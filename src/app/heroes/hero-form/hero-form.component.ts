import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { toFormValue } from '../hero.mapper';
import { ALIGNMENTS, Hero, HeroFormValue } from '../hero.model';
import { STAT_FIELDS } from '../hero.utils';

const DEFAULT_FORM_VALUE: HeroFormValue = {
  name: '',
  fullName: '',
  alignment: 'good',
  imageUrl: '',
  powerstats: {
    intelligence: 50,
    strength: 50,
    speed: 50,
    durability: 50,
    power: 50,
    combat: 50,
  },
};

const STAT_VALIDATORS = [Validators.required, Validators.min(0), Validators.max(100)];

/** Create/edit form for a hero; emits the value on a valid submit. */
@Component({
  selector: 'dc-hero-form',
  imports: [ReactiveFormsModule],
  templateUrl: './hero-form.component.html',
  styleUrl: './hero-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroFormComponent {
  readonly submitLabel = input('Create hero');
  readonly hero = input<Hero>();
  readonly submitted = output<HeroFormValue>();

  protected readonly alignments = ALIGNMENTS;
  protected readonly statFields = STAT_FIELDS;

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly stats = DEFAULT_FORM_VALUE.powerstats;

  protected readonly form = this.fb.group({
    name: [DEFAULT_FORM_VALUE.name, [Validators.required, Validators.minLength(2)]],
    fullName: [DEFAULT_FORM_VALUE.fullName],
    alignment: [DEFAULT_FORM_VALUE.alignment, Validators.required],
    imageUrl: [DEFAULT_FORM_VALUE.imageUrl],
    powerstats: this.fb.group({
      intelligence: [this.stats.intelligence, STAT_VALIDATORS],
      strength: [this.stats.strength, STAT_VALIDATORS],
      speed: [this.stats.speed, STAT_VALIDATORS],
      durability: [this.stats.durability, STAT_VALIDATORS],
      power: [this.stats.power, STAT_VALIDATORS],
      combat: [this.stats.combat, STAT_VALIDATORS],
    }),
  });

  constructor() {
    effect(() => {
      const hero = this.hero();

      if (hero !== undefined) {
        this.form.patchValue(toFormValue(hero));
      }
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.form.getRawValue());
    this.form.reset(DEFAULT_FORM_VALUE);
  }
}
