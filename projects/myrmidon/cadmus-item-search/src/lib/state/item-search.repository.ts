import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  map,
  Observable,
  take,
} from 'rxjs';

import { createStore, select, setProp, withProps } from '@ngneat/elf';
import {
  selectActiveEntity,
  withEntities,
  withActiveId,
  upsertEntities,
  deleteAllEntities,
  deleteEntities,
} from '@ngneat/elf-entities';
import {
  deleteAllPages,
  hasPage,
  PaginationData,
  selectCurrentPageEntities,
  selectPaginationData,
  setCurrentPage,
  setPage,
  updatePaginationData,
  withPagination,
} from '@ngneat/elf-pagination';
import {
  selectRequestStatus,
  StatusState,
  updateRequestStatus,
  withRequestsCache,
  withRequestsStatus,
} from '@ngneat/elf-requests';

import { DataPage } from '@myrmidon/ng-tools';
import { ItemService } from '@myrmidon/cadmus-api';
import { ItemFilter, ItemInfo } from '@myrmidon/cadmus-core';

const PAGE_SIZE = 20;
const NAME = 'item-search';

export interface ItemSearchProps {
  query?: string;
  error?: string;
  lastQueries: string[];
}

@Injectable({ providedIn: 'root' })
export class ItemSearchRepository {
  private _store;
  private _loading$: BehaviorSubject<boolean>;
  private _lastPageSize: number;

  public activeItem$: Observable<ItemInfo | undefined>;
  public query$: Observable<string | undefined>;
  public loading$: Observable<boolean>;
  public error$: Observable<string | undefined>;
  public lastQueries$: Observable<string[]>;
  public pagination$: Observable<PaginationData & { data: ItemInfo[] }>;
  public status$: Observable<StatusState>;

  constructor(private _itemService: ItemService) {
    this._store = this.createStore();
    this._loading$ = new BehaviorSubject<boolean>(false);
    this.loading$ = this._loading$.asObservable();
    this._lastPageSize = PAGE_SIZE;

    this.pagination$ = combineLatest([
      this._store.pipe(selectPaginationData()),
      this._store.pipe(selectCurrentPageEntities()),
    ]).pipe(
      map(([pagination, data]) => ({ ...pagination, data })),
      debounceTime(0)
    );

    this.activeItem$ = this._store.pipe(selectActiveEntity());
    this.status$ = this._store.pipe(selectRequestStatus(NAME));

    this.query$ = this._store.pipe(select((state) => state.query));
    this.error$ = this._store.pipe(select((state) => state.error));
    this.lastQueries$ = this._store.pipe(select((state) => state.lastQueries));
    this.query$.subscribe((query) => {
      // when query changed, reset any existing page and move to page 1
      const paginationData = this._store.getValue().pagination;
      console.log('Deleting all pages');
      this._store.update(deleteAllPages());
      // load page 1
      this.loadPage(1, paginationData.perPage);
    });

    this.loadPage(1, PAGE_SIZE);
    this.pagination$.subscribe(console.log);
  }

  private createStore(): typeof store {
    const store = createStore(
      { name: NAME },
      withProps<ItemSearchProps>({ lastQueries: [] }),
      withEntities<ItemInfo>(),
      withActiveId(),
      withRequestsCache<'item-search'>(),
      withRequestsStatus(),
      withPagination()
    );

    return store;
  }

  private adaptPage(
    page: DataPage<ItemInfo>
  ): PaginationData & { data: ItemInfo[] } {
    return {
      currentPage: page.pageNumber,
      perPage: page.pageSize,
      lastPage: page.pageCount,
      total: page.total,
      data: page.items,
    };
  }

  private addPage(response: PaginationData & { data: ItemInfo[] }): void {
    const { data, ...paginationData } = response;
    this._store.update(
      upsertEntities(data),
      updatePaginationData(paginationData),
      setPage(
        paginationData.currentPage,
        data.map((c) => c.id)
      )
    );
  }

  public loadPage(pageNumber: number, pageSize: number): void {
    if (!pageSize) {
      pageSize = PAGE_SIZE;
    }
    if (
      this._store.query(hasPage(pageNumber)) &&
      pageSize === this._lastPageSize
    ) {
      this._store.update(setCurrentPage(pageNumber));
      return;
    }

    if (this._lastPageSize !== pageSize) {
      this._store.update(deleteAllPages());
      this._lastPageSize = pageSize;
    }

    this._store.update(updateRequestStatus(NAME, 'pending'));
    this._loading$.next(true);
    this._itemService
      .searchItems(this._store.getValue().query || '', pageNumber, pageSize)
      .pipe(take(1))
      .subscribe((wrapper) => {
        if (!wrapper.error) {
          this.addPage({
            ...this.adaptPage(wrapper.value!),
            data: wrapper.value!.items,
          });
          this._store.update(updateRequestStatus(NAME, 'success'));
          this._loading$.next(false);
          this._store.update(setProp('error', undefined));
        } else {
          this._store.update(setProp('error', wrapper.error));
          this._loading$.next(false);
        }
      });
  }

  clearCache() {
    this._store.update(deleteAllEntities(), deleteAllPages());
  }

  public setQuery(query: string): void {
    this._store.update((state) => ({ ...state, query: query }));
  }

  public deleteItem(id: ItemInfo['id']) {
    this._itemService
      .deleteItem(id)
      .pipe(take(1))
      .subscribe((_) => {
        this._store.update(deleteEntities(id));
      });
  }

  public addQuery(query: string): void {
    const queries = this._store.query((state) => state.lastQueries);
    if (queries.indexOf(query) > -1) {
      return;
    }
    queries.splice(0, 0, query);
    this._store.update(setProp('lastQueries', queries));
  }
}
