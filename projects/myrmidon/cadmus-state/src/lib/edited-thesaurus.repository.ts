import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { createStore, select, setProp, withProps } from '@ngneat/elf';
import { withRequestsStatus } from '@ngneat/elf-requests';

import { Thesaurus } from '@myrmidon/cadmus-core';
import { ThesaurusService } from '@myrmidon/cadmus-api';

export interface EditedThesaurusState {
  thesaurus?: Thesaurus;
}

@Injectable({ providedIn: 'root' })
export class EditedThesaurusRepository {
  private _store;
  private _loading$: BehaviorSubject<boolean>;
  private _saving$: BehaviorSubject<boolean>;

  public loading$: Observable<boolean>;
  public saving$: Observable<boolean>;

  public thesaurus$: Observable<Thesaurus | undefined>;

  constructor(private _thesaurusService: ThesaurusService) {
    this._store = createStore(
      { name: 'edited-thesaurus' },
      withProps<EditedThesaurusState>({}),
      withRequestsStatus()
    );
    this._loading$ = new BehaviorSubject<boolean>(false);
    this.loading$ = this._loading$.asObservable();
    this._saving$ = new BehaviorSubject<boolean>(false);
    this.saving$ = this._saving$.asObservable();
    this.thesaurus$ = this._store.pipe(select((state) => state.thesaurus));
  }

  public getValue(): EditedThesaurusState {
    return this._store.getValue();
  }

  public getThesaurus(): Thesaurus | undefined {
    return this._store.query((state) => state.thesaurus);
  }

  /**
   * Load the specified thesaurus.
   *
   * @param id The thesaurus ID or undefined to load a new thesaurus.
   */
  public load(id?: string): void {
    this._loading$.next(true);

    if (id) {
      this._thesaurusService.getThesaurus(id, true).subscribe({
        next: (thesaurus) => {
          this._loading$.next(false);
          this._store.update(setProp('thesaurus', thesaurus));
        },
        error: (error) => {
          this._loading$.next(false);
          console.error(
            'Error loding thesaurus: ' + JSON.stringify(error || {})
          );
        },
      });
    } else {
      this._store.update(
        setProp('thesaurus', {
          id: '',
          language: 'en',
          entries: [],
        })
      );
    }
  }

  /**
   * Save the specified thesaurus.
   *
   * @param thesaurus The thesaurus to save.
   * @returns Promise with saved thesaurus.
   */
  public save(thesaurus: Thesaurus): Promise<Thesaurus> {
    this._saving$.next(true);

    return new Promise((resolve, reject) => {
      this._thesaurusService.addThesaurus(thesaurus).subscribe({
        next: (saved) => {
          this._saving$.next(false);
          this.load(saved.id);
          resolve(saved);
        },
        error: (error) => {
          this._saving$.next(false);
          console.error(
            'Error loding thesaurus: ' + JSON.stringify(error || {})
          );
          reject(error);
        },
      });
    });
  }
}
