import { animate, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';

import { FlagDefinition } from '@myrmidon/cadmus-core';
import { DialogService } from '@myrmidon/ng-mat-tools';

import { FlagListRepository } from './flag-list.repository';
import { Observable } from 'rxjs';

@Component({
  selector: 'cadmus-flag-list',
  templateUrl: './flag-list.component.html',
  styleUrls: ['./flag-list.component.scss'],
  animations: [
    trigger('inOutAnimation', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('1s ease-out', style({ height: '100%', opacity: 1 })),
      ]),
      transition(':leave', [
        style({ height: 300, opacity: 1 }),
        animate('0.5s ease-in', style({ height: 0, opacity: 0 })),
      ]),
    ]),
  ],
})
export class FlagListComponent {
  public flags$: Observable<FlagDefinition[]>;
  public editedFlag$: Observable<FlagDefinition | null>;
  public loading$: Observable<boolean>;

  constructor(
    private _repository: FlagListRepository,
    private _dialogService: DialogService
  ) {
    this.flags$ = _repository.flags$;
    this.editedFlag$ = _repository.activeFlag$;
    this.loading$ = _repository.loading$;
  }

  public addFlag(): void {
    this._repository.addNewFlag();
  }

  public deleteFlag(index: number): void {
    this._dialogService
      .confirm('Confirmation', 'Delete this flag?')
      .subscribe((yes) => {
        if (yes) {
          this._repository.deleteFlag(index);
        }
      });
  }

  public editFlag(flag: FlagDefinition): void {
    this._repository.setActive(flag.id);
  }

  public onFlagEditorClose(): void {
    this._repository.setActive(null);
  }

  public onFlagChange(flag: FlagDefinition): void {
    this._repository.addFlag(flag);
    this._repository.setActive(null);
  }

  public reset(): void {
    this._repository.reset();
  }

  public save(): void {
    this._repository.save();
  }
}
