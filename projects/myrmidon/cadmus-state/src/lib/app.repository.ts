import {
  FacetDefinition,
  FlagDefinition,
  Thesaurus,
} from '@myrmidon/cadmus-core';
import { Injectable } from '@angular/core';

import { createStore, select, withProps } from '@ngneat/elf';

import {
  FacetService,
  FlagService,
  ThesaurusService,
  PreviewService,
} from '@myrmidon/cadmus-api';
import { updateRequestStatus, withRequestsStatus } from '@ngneat/elf-requests';
import { forkJoin, Observable } from 'rxjs';

/**
 * General app state, mostly filled with lookup data which can be assumed
 * not to change in the whole session.
 */
export interface AppProps {
  /**
   * All the available facets definitions.
   */
  facets: FacetDefinition[];
  /**
   * All the available flags definitions.
   */
  flags: FlagDefinition[];
  /**
   * The thesaurus for model-types. This (if present) is used to display
   * human-friendly part types names from their IDs. Otherwise, the raw
   * IDs are displayed.
   */
  typeThesaurus?: Thesaurus;
  /**
   * The items browsers thesaurus. This (if present) is used to display
   * the items browsers menu.
   */
  itemBrowserThesaurus?: Thesaurus;
  /**
   * The preview JSON renderers keys. Empty when preview is disabled.
   */
  previewJKeys: string[];
  /**
   * The preview text flatteners keys. Empty when preview is disabled.
   */
  previewFKeys: string[];
  /**
   * The preview item composer keys. Empty when preview is disabled.
   */
  previewCKeys: string[];
}

/**
 * App state ELF repository.
 */
@Injectable({ providedIn: 'root' })
export class AppRepository {
  private _store;

  public facets$: Observable<FacetDefinition[]>;
  public flags$: Observable<FlagDefinition[]>;
  public typeThesaurus$: Observable<Thesaurus | undefined>;
  public itemBrowserThesaurus$: Observable<Thesaurus | undefined>;
  public previewJKeys$: Observable<string[]>;
  public previewFKeys$: Observable<string[]>;
  public previewCKeys$: Observable<string[]>;

  constructor(
    private _facetService: FacetService,
    private _flagService: FlagService,
    private _thesaurusService: ThesaurusService,
    private _previewService: PreviewService
  ) {
    this._store = createStore(
      { name: 'app' },
      withProps<AppProps>({
        facets: [],
        flags: [],
        previewJKeys: [],
        previewFKeys: [],
        previewCKeys: [],
      }),
      withRequestsStatus()
    );
    this.facets$ = this._store.pipe(select((state) => state.facets));
    this.flags$ = this._store.pipe(select((state) => state.flags));
    this.typeThesaurus$ = this._store.pipe(
      select((state) => state.typeThesaurus)
    );
    this.itemBrowserThesaurus$ = this._store.pipe(
      select((state) => state.itemBrowserThesaurus)
    );
    this.previewJKeys$ = this._store.pipe(
      select((state) => state.previewJKeys)
    );
    this.previewFKeys$ = this._store.pipe(
      select((state) => state.previewFKeys)
    );
    this.previewCKeys$ = this._store.pipe(
      select((state) => state.previewCKeys)
    );
  }

  public getValue(): AppProps {
    return this._store.getValue();
  }

  public load(): void {
    this._store.update(updateRequestStatus('app', 'pending'));

    const facets$ = this._facetService.getFacets();
    const flags$ = this._flagService.getFlags();
    const thesauri$ = this._thesaurusService.getThesauriSet([
      'model-types@en',
      'item-browsers@en',
    ]);
    const jKeys$ = this._previewService.getKeys('J');
    const fKeys$ = this._previewService.getKeys('F');
    const cKeys$ = this._previewService.getKeys('C');

    forkJoin({
      facets: facets$,
      flags: flags$,
      thesauri: thesauri$,
      jKeys: jKeys$,
      fKeys: fKeys$,
      cKeys: cKeys$,
    }).subscribe({
      next: (result) => {
        this._store.update(updateRequestStatus('app', 'success'));

        this._store.update((state) => ({
          ...state,
          facets: result.facets,
          flags: result.flags,
          typeThesaurus: result.thesauri['model-types'],
          itemBrowserThesaurus: result.thesauri['item-browsers'],
          previewJKeys: result.jKeys,
          previewFKeys: result.fKeys,
          previewCKeys: result.cKeys,
        }));
      },
    });
  }
}
