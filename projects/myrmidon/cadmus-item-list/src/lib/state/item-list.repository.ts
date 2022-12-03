import { Injectable } from '@angular/core';
import { combineLatest, debounceTime, map, Observable, take } from 'rxjs';

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

import { ItemFilter, ItemInfo } from '@myrmidon/cadmus-core';
import { ItemService } from '@myrmidon/cadmus-api';
import {
  deleteAllEntities,
  deleteEntities,
  selectActiveEntity,
  updateEntities,
  upsertEntities,
  withActiveId,
  withEntities,
} from '@ngneat/elf-entities';
import { createStore, select, withProps } from '@ngneat/elf';
import { DataPage } from '@myrmidon/ng-tools';

const PAGE_SIZE = 20;
const NAME = 'item-list';

export interface ItemListProps {
  filter: ItemFilter;
}

/**
 * Item list ELF repository.
 */
@Injectable({ providedIn: 'root' })
export class ItemListRepository {
  private _store;
  private _lastPageSize: number;

  public activeItem$: Observable<ItemInfo | undefined>;
  public filter$: Observable<ItemFilter>;
  public pagination$: Observable<PaginationData & { data: ItemInfo[] }>;
  public status$: Observable<StatusState>;

  constructor(private _itemService: ItemService) {
    this._store = this.createStore();
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

    this.filter$ = this._store.pipe(select((state) => state.filter));
    this.filter$.subscribe((filter) => {
      // when filter changed, reset any existing page and move to page 1
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
      withProps<ItemListProps>({
        filter: {},
      }),
      withEntities<ItemInfo>(),
      withActiveId(),
      withRequestsCache<'item-list'>(),
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
    this._itemService
      .getItems(this._store.getValue().filter, pageNumber, pageSize)
      .pipe(take(1))
      .subscribe((page) => {
        this.addPage({ ...this.adaptPage(page), data: page.items });
        this._store.update(updateRequestStatus(NAME, 'success'));
      });
  }

  clearCache() {
    this._store.update(deleteAllEntities(), deleteAllPages());
  }

  public updateEntity(entity: ItemInfo): void {
    this._store.update(updateEntities(entity.id, entity));
  }

  public setFilter(filter: ItemFilter): void {
    this._store.update((state) => ({ ...state, filter: filter }));
  }

  public deleteItem(id: ItemInfo['id']) {
    this._itemService
      .deleteItem(id)
      .pipe(take(1))
      .subscribe((_) => {
        this._store.update(deleteEntities(id));
      });
  }
}
