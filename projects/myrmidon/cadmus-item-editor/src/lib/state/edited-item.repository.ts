import {
  FacetDefinition,
  Item,
  LayerPartInfo,
  Part,
  PartDefinition,
  PartGroup,
} from '@myrmidon/cadmus-core';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, take } from 'rxjs';

import { createStore, select, setProp, withProps } from '@ngneat/elf';

import { ItemService } from '@myrmidon/cadmus-api';
import { updateRequestStatus, withRequestsStatus } from '@ngneat/elf-requests';
import { AppRepository } from '@myrmidon/cadmus-state';

/**
 * Edited item store properties.
 */
export interface EditedItemProps {
  /**
   * The item being edited.
   */
  item?: Item;
  /**
   * The raw list of item's parts.
   */
  parts: Part[];
  /**
   * The item's parts, grouped.
   */
  partGroups: PartGroup[];
  /**
   * The set of all the possible layer parts for this item, either
   * present or absent.
   */
  layerPartInfos: LayerPartInfo[];
  /**
   * The facet definition assigned to the item.
   */
  facet?: FacetDefinition;
  /**
   * The part definitions for adding a new part, filtered by the selected
   * facet and the parts already present in the item.
   */
  newPartDefinitions: PartDefinition[];
}

/**
 * Edited item ELF repository.
 */
@Injectable({ providedIn: 'root' })
export class EditedItemRepository {
  private _store;

  public item$: Observable<Item | undefined>;
  public parts$: Observable<Part[]>;
  public partGroups$: Observable<PartGroup[]>;
  public layers$: Observable<LayerPartInfo[]>;
  public facet$: Observable<FacetDefinition | undefined>;
  public newPartDefinitions$: Observable<PartDefinition[]>;
  // public status$: Observable<StatusState>;

  constructor(
    private _appRepository: AppRepository,
    private _itemService: ItemService
  ) {
    this._store = createStore(
      { name: 'edited-item' },
      withProps<EditedItemProps>({
        parts: [],
        partGroups: [],
        layerPartInfos: [],
        newPartDefinitions: [],
      }),
      withRequestsStatus()
    );

    this.item$ = this._store.pipe(select((state) => state.item));
    this.parts$ = this._store.pipe(select((state) => state.parts));
    this.partGroups$ = this._store.pipe(select((state) => state.partGroups));
    this.layers$ = this._store.pipe(select((state) => state.layerPartInfos));
    this.facet$ = this._store.pipe(select((state) => state.facet));
    this.newPartDefinitions$ = this._store.pipe(
      select((state) => state.newPartDefinitions)
    );
    // this.status$ = this._store.pipe(selectRequestStatus('edited-item'));
  }

  public getValue(): EditedItemProps {
    return this._store.getValue();
  }

  public getItem(): Item | undefined {
    return this._store.query((state) => state.item);
  }

  public getFacet(): FacetDefinition | undefined {
    return this._store.query((state) => state.facet);
  }

  private getExistingPartTypeAndRoleIds(): {
    typeId: string;
    roleId?: string;
  }[] {
    const groups = this.getPartGroups();
    if (!groups) {
      return [];
    }
    const results = [];
    for (const group of groups) {
      for (const part of group.parts) {
        results.push({
          typeId: part.typeId,
          roleId: part.roleId,
        });
      }
    }

    return results;
  }

  private getNewPartDefinitions(): PartDefinition[] {
    const facet = this.getFacet();
    if (!facet) {
      return [];
    }

    const existingTypeRoleIds = this.getExistingPartTypeAndRoleIds();

    const defs: PartDefinition[] = [];
    for (const def of facet.partDefinitions) {
      // exclude layer parts, as these are in the layers tab
      if (def.roleId?.startsWith('fr.')) {
        continue;
      }
      // exclude parts present in the item
      if (
        existingTypeRoleIds.find((tr) => {
          return (
            tr.typeId === def.typeId &&
            ((!tr.roleId && !def.roleId) || tr.roleId === def.roleId)
          );
        })
      ) {
        continue;
      }
      defs.push(def);
    }
    // sort by sort key
    defs.sort((a, b) => {
      return a.sortKey.localeCompare(b.sortKey);
    });
    return defs;
  }

  public getPartGroups(): PartGroup[] {
    return this._store.query((state) => state.partGroups);
  }

  private pickDefaultFacet(
    facets: FacetDefinition[]
  ): FacetDefinition | undefined {
    if (!facets.length) {
      return undefined;
    }
    // if there is a facet with id="default", pick it
    const defaultFacet = facets.find((f) => f.id === 'default');
    if (defaultFacet) {
      return defaultFacet;
    }
    // else just pick the first in the list
    return facets[0];
  }

  /**
   * Load the specified item or a new item.
   *
   * @param itemId The item ID, or falsy for a new item.
   */
  public load(itemId?: string): void {
    const app = this._appRepository.getValue();

    this._store.update(updateRequestStatus('edited-item', 'pending'));
    if (!itemId) {
      // new item
      this._itemService
        .getItemLayerInfo('new', true)
        .pipe(take(1))
        .subscribe((layers) => {
          const facet = this.pickDefaultFacet(app.facets);
          this._store.update(updateRequestStatus('edited-item', 'success'));
          this._store.update((state) => ({
            ...state,
            item: {
              id: '',
              title: '',
              description: '',
              facetId: facet?.id || '',
              groupId: '',
              sortKey: '',
              flags: 0,
              timeCreated: new Date(),
              creatorId: '',
              timeModified: new Date(),
              userId: '',
            },
            parts: [],
            partGroups: [],
            layerPartInfos: layers,
            facet: facet,
          }));
          this._store.update(
            setProp('newPartDefinitions', this.getNewPartDefinitions())
          );
        });
    } else {
      // existing item
      forkJoin({
        item: this._itemService.getItem(itemId, true),
        layers: this._itemService.getItemLayerInfo(itemId, true),
      })
        .pipe(take(1))
        .subscribe({
          next: (result) => {
            this._store.update(updateRequestStatus('edited-item', 'success'));

            const itemFacet = app.facets.find((f) => {
              return f.id === result.item.facetId;
            });
            const facetParts = itemFacet ? itemFacet.partDefinitions : [];

            this._store.update((state) => ({
              ...state,
              item: result.item,
              parts: result.item.parts || [],
              partGroups: this._itemService.groupParts(
                result.item.parts || [],
                facetParts
              ),
              layerPartInfos: result.layers,
              facet: itemFacet,
            }));
            this._store.update(
              setProp('newPartDefinitions', this.getNewPartDefinitions())
            );
          },
        });
    }
  }

  /**
   * Ensure that the item with the specified ID is loaded.
   *
   * @param id The item ID.
   */
  public ensureItemLoaded(id: string): void {
    if (this.getItem()?.id === id) {
      return;
    }
    this.load(id);
  }

  /**
   * Save the specified item in the backend and update this store.
   *
   * @param item The item.
   * @returns Promise with saved item.
   */
  public save(item: Item): Promise<Item> {
    return new Promise((resolve, reject) => {
      this._itemService
        .addItem(item)
        .pipe(take(1))
        .subscribe({
          next: (saved) => {
            // update the item and the selected facet from it;
            // this is required when the item was new, and thus loaded
            // with the default facet before saving it
            const app = this._appRepository.getValue();
            const itemFacet = app.facets.find((f) => {
              return f.id === saved.facetId;
            });
            this._store.update((state) => ({
              ...state,
              item: saved,
              facet: itemFacet,
            }));
            // new-parts definitions
            this._store.update(
              setProp('newPartDefinitions', this.getNewPartDefinitions())
            );
            resolve(saved);
          },
          error: (error) => {
            if (error) {
              console.error(JSON.stringify(error));
            }
            reject({ message: 'Error saving item ' + item.id, error: error });
          },
        });
    });
  }

  /**
   * Delete the specified part from this edited item.
   *
   * @param id The part's ID.
   * @returns Promise with part ID.
   */
  public deletePart(id: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const itemId = this._store.getValue().item?.id;
      if (!itemId) {
        reject({
          message: 'Cannot delete part of unsaved item',
        });
      }
      this._itemService
        .deletePart(id)
        .pipe(take(1))
        .subscribe({
          next: (_) => {
            this.load(itemId);
            resolve(id);
          },
          error: (error) => {
            if (error) {
              console.error(JSON.stringify(error));
            }
            reject({
              message: "Error deleting item's part " + id,
              error: error,
            });
          },
        });
    });
  }

  /**
   * Add a new layer part to this item.
   *
   * @param typeId The part type ID.
   * @param roleId The part role ID.
   * @returns Promise with new part.
   */
  public addNewLayerPart(typeId: string, roleId?: string): Promise<Part> {
    return new Promise((resolve, reject) => {
      const itemId = this._store.getValue().item?.id;
      if (!itemId) {
        reject({
          message: 'Cannot add part to unsaved item',
        });
      }
      const part: Part = {
        itemId: itemId!,
        typeId,
        roleId,
        id: '',
        creatorId: '',
        userId: '',
        timeCreated: new Date(),
        timeModified: new Date(),
      };
      this._itemService
        .addPart(part)
        .pipe(take(1))
        .subscribe({
          next: (part) => {
            this.load(itemId);
            resolve(part);
          },
          error: (error) => {
            if (error) {
              console.error(JSON.stringify(error));
            }
            reject({
              message: 'Error adding new layer part for item ' + itemId,
              error: error,
            });
          },
        });
    });
  }

  /**
   * Set the scope for the specified parts in this item.
   *
   * @param ids The part IDs.
   * @param scope The scope to set.
   * @returns Promise.
   */
  public setPartThesaurusScope(ids: string[], scope: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const itemId = this._store.getValue().item?.id;
      if (!itemId) {
        reject({
          message: 'Cannot set scope for unsaved item',
        });
      }
      this._itemService
        .setPartThesaurusScope(ids, scope)
        .pipe(take(1))
        .subscribe({
          next: (_) => {
            this.load(itemId);
            resolve(true);
          },
          error: (error) => {
            if (error) {
              console.error(JSON.stringify(error));
            }
            reject({
              message: "Error setting item's part scope",
              error: error,
            });
          },
        });
    });
  }
}
