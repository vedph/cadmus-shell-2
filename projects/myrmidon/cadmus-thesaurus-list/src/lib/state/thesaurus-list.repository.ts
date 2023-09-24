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

import { Thesaurus, ThesaurusFilter } from '@myrmidon/cadmus-core';
import { ThesaurusService } from '@myrmidon/cadmus-api';
import {
  deleteAllEntities,
  deleteEntities,
  selectActiveEntity,
  upsertEntities,
  withActiveId,
  withEntities,
} from '@ngneat/elf-entities';
import { createStore, select, withProps } from '@ngneat/elf';
import { DataPage } from '@myrmidon/ng-tools';

const PAGE_SIZE = 20;
const NAME = 'thesaurus-list';

export interface ThesaurusListProps {
  filter: ThesaurusFilter;
}

/**
 * Thesauri list ELF repository.
 */
@Injectable({ providedIn: 'root' })
export class ThesaurusListRepository {
  private _store;
  private _lastPageSize: number;

  public activeThesaurus$: Observable<Thesaurus | undefined>;
  public filter$: Observable<ThesaurusFilter>;
  public pagination$: Observable<PaginationData & { data: Thesaurus[] }>;
  public status$: Observable<StatusState>;

  constructor(private _thesaurusService: ThesaurusService) {
    this._store = createStore(
      { name: NAME },
      withProps<ThesaurusListProps>({
        filter: {},
      }),
      withEntities<Thesaurus>(),
      withActiveId(),
      withRequestsCache<'thesaurus-list'>(),
      withRequestsStatus(),
      withPagination()
    );

    this._lastPageSize = PAGE_SIZE;

    this.pagination$ = combineLatest([
      this._store.pipe(selectPaginationData()),
      this._store.pipe(selectCurrentPageEntities()),
    ]).pipe(
      map(([pagination, data]) => ({ ...pagination, data })),
      debounceTime(0)
    );

    this.activeThesaurus$ = this._store.pipe(selectActiveEntity());
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

  private adaptPage(
    page: DataPage<Thesaurus>
  ): PaginationData & { data: Thesaurus[] } {
    return {
      currentPage: page.pageNumber,
      perPage: page.pageSize,
      lastPage: page.pageCount,
      total: page.total,
      data: page.items,
    };
  }

  private addPage(response: PaginationData & { data: Thesaurus[] }): void {
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

  public loadPage(pageNumber: number, pageSize?: number): void {
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
    this._thesaurusService
      .getThesauri(this._store.getValue().filter, pageNumber, pageSize)
      .pipe(take(1))
      .subscribe((page) => {
        this.addPage({ ...this.adaptPage(page), data: page.items });
        this._store.update(updateRequestStatus(NAME, 'success'));
      });
  }

  clearCache() {
    this._store.update(deleteAllEntities(), deleteAllPages());
  }

  public setFilter(filter: ThesaurusFilter): void {
    this._store.update((state) => ({ ...state, filter: filter }));
  }

  public deleteThesaurus(id: Thesaurus['id']) {
    this._thesaurusService
      .deleteThesaurus(id)
      .pipe(take(1))
      .subscribe((_) => {
        this._store.update(deleteEntities(id));
      });
  }
}
