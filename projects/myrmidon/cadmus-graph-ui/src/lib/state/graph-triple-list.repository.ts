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

import {
  NodeFilter,
  NodeResult,
  TripleFilter,
  TripleResult,
} from '@myrmidon/cadmus-api';
import {
  deleteAllEntities,
  selectActiveEntity,
  upsertEntities,
  withActiveId,
  withEntities,
} from '@ngneat/elf-entities';
import { createStore, select, setProp, withProps } from '@ngneat/elf';
import { DataPage } from '@myrmidon/ng-tools';
import { GraphService } from '@myrmidon/cadmus-api';

const PAGE_SIZE = 20;
const NAME = 'graph-triple-list';

export interface TripleListProps {
  filter: TripleFilter;
  subjectNode?: NodeResult;
  predicateNode?: NodeResult;
  objectNode?: NodeResult;
}

/**
 * Graph nodes list ELF repository.
 */
@Injectable({ providedIn: 'root' })
export class GraphTripleListRepository {
  private _store;
  private _lastPageSize: number;

  public activeItem$: Observable<TripleResult | undefined>;
  public filter$: Observable<TripleFilter>;
  public pagination$: Observable<PaginationData & { data: TripleResult[] }>;
  public status$: Observable<StatusState>;
  public subjectNode$: Observable<NodeResult | undefined>;
  public predicateNode$: Observable<NodeResult | undefined>;
  public objectNode$: Observable<NodeResult | undefined>;

  constructor(private _graphService: GraphService) {
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
    this.subjectNode$ = this._store.pipe(select((state) => state.subjectNode));
    this.predicateNode$ = this._store.pipe(
      select((state) => state.predicateNode)
    );
    this.objectNode$ = this._store.pipe(select((state) => state.objectNode));

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
      withProps<TripleListProps>({
        filter: {},
      }),
      withEntities<TripleResult>(),
      withActiveId(),
      withRequestsCache<'graph-triple-list'>(),
      withRequestsStatus(),
      withPagination()
    );

    return store;
  }

  private adaptPage(
    page: DataPage<TripleResult>
  ): PaginationData & { data: TripleResult[] } {
    return {
      currentPage: page.pageNumber,
      perPage: page.pageSize,
      lastPage: page.pageCount,
      total: page.total,
      data: page.items,
    };
  }

  private addPage(response: PaginationData & { data: TripleResult[] }): void {
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
    this._graphService
      .getTriples(this._store.getValue().filter, pageNumber, pageSize)
      .pipe(take(1))
      .subscribe((page) => {
        this.addPage({ ...this.adaptPage(page), data: page.items });
        this._store.update(updateRequestStatus(NAME, 'success'));
      });
  }

  public clearCache() {
    this._store.update(deleteAllEntities(), deleteAllPages());
  }

  public setFilter(filter: NodeFilter): void {
    this._store.update((state) => ({ ...state, filter: filter }));
  }

  /**
   * Set the node term used in filter.
   *
   * @param node The node or null/undefined.
   * @param type The type: subject, predicate, object.
   */
  public setTerm(
    node: NodeResult | null | undefined,
    type: 'S' | 'P' | 'O'
  ): void {
    switch (type) {
      case 'S':
        this._store.update(setProp('subjectNode', node ? node : undefined));
        break;
      case 'P':
        this._store.update(setProp('predicateNode', node ? node : undefined));
        break;
      case 'O':
        this._store.update(setProp('objectNode', node ? node : undefined));
        break;
    }
  }

  /**
   * Set the node term used in filter by its ID.
   *
   * @param id The node ID or null/undefined.
   * @param type The type: subject, predicate, object.
   */
  public setTermId(id: number | null | undefined, type: 'S' | 'P' | 'O'): void {
    if (!id) {
      this.setTerm(null, type);
      return;
    }
    this._graphService
      .getNode(id)
      .pipe(take(1))
      .subscribe({
        next: (node) => {
          this.setTerm(node, type);
        },
        error: (error) => {
          if (error) {
            console.error(JSON.stringify(error));
          }
          console.warn('Node ID not found: ' + id);
        },
      });
  }

  public selectTerm(type: 'S' | 'P' | 'O'): Observable<NodeResult | undefined> {
    switch (type) {
      case 'S':
        return this.subjectNode$;
      case 'P':
        return this.predicateNode$;
      case 'O':
        return this.objectNode$;
    }
  }

  public getTerm(type: 'S' | 'P' | 'O'): NodeResult | undefined {
    switch (type) {
      case 'S':
        return this._store.query(state => state.subjectNode);
      case 'P':
        return this._store.query(state => state.predicateNode);
      case 'O':
        return this._store.query(state => state.objectNode);
    }
  }
}
