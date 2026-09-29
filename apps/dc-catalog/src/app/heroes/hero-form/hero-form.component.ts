import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ALIGNMENTS, Hero, HeroFormValue } from '../hero.model';
import { toFormValue } from '../hero.mapper';

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

const STAT_FIELDS: { key: keyof HeroFormValue['powerstats']; label: string }[] = [
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'strength', label: 'Strength' },
  { key: 'speed', label: 'Speed' },
  { key: 'durability', label: 'Durability' },
  { key: 'power', label: 'Power' },
  { key: 'combat', label: 'Combat' },
];

const STAT_VALIDATORS = [
  Validators.required,
  Validators.min(0),
  Validators.max(100),
];

@Component({
  selector: 'dc-hero-form',
  templateUrl: './hero-form.component.html',
  styleUrls: ['./hero-form.component.css'],
})
export class HeroFormComponent {
  readonly alignments = ALIGNMENTS;
  readonly statFields = STAT_FIELDS;

  @Input() submitLabel = 'Create hero';

  @Input() set hero(value: Hero | undefined) {
    if (value) {
      this.form.patchValue(toFormValue(value));
    }
  }

  @Output() submitted = new EventEmitter<HeroFormValue>();

  readonly form: FormGroup = this.fb.group({
    name: [DEFAULT_FORM_VALUE.name, [Validators.required, Validators.minLength(2)]],
    fullName: [DEFAULT_FORM_VALUE.fullName],
    alignment: [DEFAULT_FORM_VALUE.alignment, Validators.required],
    imageUrl: [DEFAULT_FORM_VALUE.imageUrl],
    powerstats: this.fb.group(
      STAT_FIELDS.reduce(
        (group, { key }) => ({
          ...group,
          [key]: [DEFAULT_FORM_VALUE.powerstats[key], STAT_VALIDATORS],
        }),
        {} as Record<string, unknown>
      )
    ),
  });

  constructor(private fb: FormBuilder) {}

  onSubmit(): void {
    // Enter submits the form past the disabled button, so check again here.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.form.value as HeroFormValue);
    // With no argument reset() would set every control to null, not to the defaults.
    this.form.reset(DEFAULT_FORM_VALUE);
  }
}
