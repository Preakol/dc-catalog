import { Component, EventEmitter, Input, Output,  } from '@angular/core';
import { Hero, StatEntry, toStatEntries, raceOf, fullNameOf} from '../hero.model';

@Component({
  selector: 'dc-hero-card',
  templateUrl: './hero-card.component.html',
  styleUrls: ['./hero-card.component.css']
})

export class HeroCardComponent {
  @Input() hero!: Hero;
  @Output() deleted = new EventEmitter<number>()

  get race(): string {
    return raceOf(this.hero)
  }
  get fullName(): string {
    return fullNameOf(this.hero)
  }
  get stats(): StatEntry[] {
    return toStatEntries(this.hero.powerstats)
  }

  onDeleteClick(): void {
    this.deleted.emit(this.hero.id);
  }
}