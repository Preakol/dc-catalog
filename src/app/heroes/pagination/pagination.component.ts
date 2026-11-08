import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

const BUTTON_CLASS =
  'rounded-lg px-3 py-2 text-sm text-slate-300 ring-1 ring-slate-700 transition ' +
  'hover:text-sky-400 hover:ring-sky-500/50 ' +
  'disabled:opacity-30 disabled:hover:text-slate-300 disabled:hover:ring-slate-700';

@Component({
  selector: 'dc-pagination',
  templateUrl: './pagination.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly page = input(1);
  readonly totalPages = input(1);
  readonly goTo = output<number>();

  protected readonly buttonClass = BUTTON_CLASS;
}
