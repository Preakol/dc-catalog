import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { HeroFormValue, Hero, toFormValue } from '../hero.model';

const DEFAULT_FORM_VALUE: HeroFormValue = {
  name: '', fullName: '', alignment: 'good', imageUrl: '',
  powerstats: { intelligence: 50, strength: 50, speed: 50, durability: 50, power: 50, combat: 50 },
};

@Component({
  selector: 'dc-hero-form',
  templateUrl: './hero-form.component.html',
  styleUrls: ['./hero-form.component.css']
})
export class HeroFormComponent {
  @Input() submitLabel = 'Create hero';
  @Input() set hero(value: Hero | undefined) {
    if (value) {
      this.form.patchValue(toFormValue(value));
    }
  }
  @Output() submitted = new EventEmitter<HeroFormValue>();

  readonly form: FormGroup = this.fb.group({
    name:      [DEFAULT_FORM_VALUE.name, [Validators.required, Validators.minLength(2)]],
    fullName:  [DEFAULT_FORM_VALUE.fullName],
    alignment: [DEFAULT_FORM_VALUE.alignment, Validators.required],
    imageUrl: [DEFAULT_FORM_VALUE.imageUrl],
    powerstats: this.fb.group({
      intelligence: [DEFAULT_FORM_VALUE.powerstats.intelligence, [Validators.required, Validators.min(0), Validators.max(100)]],
      strength: [DEFAULT_FORM_VALUE.powerstats.strength, [Validators.required, Validators.min(0), Validators.max(100)]],
      speed: [DEFAULT_FORM_VALUE.powerstats.speed, [Validators.required, Validators.min(0), Validators.max(100)]],
      durability: [DEFAULT_FORM_VALUE.powerstats.durability, [Validators.required, Validators.min(0), Validators.max(100)]],
      power: [DEFAULT_FORM_VALUE.powerstats.power, [Validators.required, Validators.min(0), Validators.max(100)]],
      combat: [DEFAULT_FORM_VALUE.powerstats.combat, [Validators.required, Validators.min(0), Validators.max(100)]]
    }),
  });

  constructor(private fb: FormBuilder) { }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value: HeroFormValue = this.form.value;
    this.submitted.emit(value);
    this.form.reset(DEFAULT_FORM_VALUE);
  }
}
