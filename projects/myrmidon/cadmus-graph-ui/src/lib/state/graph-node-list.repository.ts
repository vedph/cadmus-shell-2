import { Injectable } from '@angular/core';
import {
  combineLatest,
  debounceTime,
  forkJoin,
  map,
  Observable,
  take,
} from 'rxjs';

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

import { NodeFilter, NodeResult } from '@myrmidon/cadmus-api';
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
const NAME = 'graph-node-list';

export interface NodeListProps {
  filter: NodeFilter;
  linkedNode?: NodeResult;
  classNodes?: NodeResult[];
}

/**
 * Graph nodes list ELF repository.
 */
@Injectable({ providedIn: 'root' })
export class NodeListRepository {
  private _store;
  private _lastPageSize: number;

  public activeItem$: Observable<NodeResult | undefined>;
  public filter$: Observable<NodeFilter>;
  public pagination$: Observable<PaginationData & { data: NodeResult[] }>;
  public status$: Observable<StatusState>;
  public linkedNode$: Observable<NodeResult | undefined>;
  public classNodes$: Observable<NodeResult[] | undefined>;

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
    this.linkedNode$ = this._store.pipe(select((state) => state.linkedNode));
    this.classNodes$ = this._store.pipe(select((state) => state.classNodes));

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
      withProps<NodeListProps>({
        filter: {},
      }),
      withEntities<NodeResult>(),
      withActiveId(),
      withRequestsCache<'graph-node-list'>(),
      withRequestsStatus(),
      withPagination()
    );

    return store;
  }

  public getLinkedNode(): NodeResult | undefined {
    return this._store.query((state) => state.linkedNode);
  }

  public getClassNodes(): NodeResult[] | undefined {
    return this._store.query((state) => state.classNodes);
  }

  private adaptPage(
    page: DataPage<NodeResult>
  ): PaginationData & { data: NodeResult[] } {
    return {
      currentPage: page.pageNumber,
      perPage: page.pageSize,
      lastPage: page.pageCount,
      total: page.total,
      data: page.items,
    };
  }

  private addPage(response: PaginationData & { data: NodeResult[] }): void {
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
      .getNodes(this._store.getValue().filter, pageNumber, pageSize)
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
   * Set the linked node used in filter.
   *
   * @param node The node or undefined.
   */
  public setLinkedNode(node?: NodeResult): void {
    this._store.update(setProp('linkedNode', node));
  }

  /**
   * Set the linked node used in filter by its ID.
   *
   * @param id The node ID.
   */
  public setLinkedNodeId(id?: number): void {
    if (!id) {
      this._store.update(setProp('linkedNode', undefined));
    } else {
      this._graphService
        .getNode(id)
        .pipe(take(1))
        .subscribe({
          next: (node) => {
            this.setLinkedNode(node);
          },
          error: (error) => {
            if (error) {
              console.error(JSON.stringify(error));
            }
            console.warn('Node ID not found: ' + id);
          },
        });
    }
  }

  /**
   * Add the specified node to the filter class nodes.
   * If the node already exists, nothing is done.
   *
   * @param node The node to add.
   */
  public addClassNode(node: NodeResult): void {
    const nodes = [...(this._store.query((state) => state.classNodes) || [])];
    if (nodes.some((n) => n.id === node.id)) {
      return;
    }
    nodes.push(node);
    this._store.update(setProp('classNodes', nodes));
  }

  /**
   * Set the class node IDs in the filter.
   *
   * @param ids The class nodes IDs or undefined.
   */
  public setClassNodeIds(ids?: number[]): void {
    if (!ids || !ids.length) {
      this._store.update(setProp('classNodes', undefined));
      return;
    }

    const requests: Observable<NodeResult>[] = [];
    ids.forEach((id) => {
      requests.push(this._graphService.getNode(id).pipe(take(1)));
    });
    forkJoin(requests)
      .pipe(take(1))
      .subscribe({
        next: (nodes: NodeResult[]) => {
          this._store.update(setProp('classNodes', nodes));
        },
        error: (error) => {
          if (error) {
            console.error(JSON.stringify(error));
          }
        },
      });
  }

  /**
   * Delete the specified node from the filter class nodes.
   * If the node does not exist, nothing is done.
   *
   * @param id The node's ID.
   */
  public deleteClassNode(id: number): void {
    const nodes = [...(this._store.query((state) => state.classNodes) || [])];
    const i = nodes.findIndex((n) => n.id === id);
    if (i > -1) {
      nodes.splice(i, 1);
      this._store.update(setProp('classNodes', nodes));
    }
  }
}
