import {
  Fragment,
  LayerHint,
  Part,
  TextLayerPart,
  TokenLocation,
} from '@myrmidon/cadmus-core';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';

import { createStore, select, setProp, withProps } from '@ngneat/elf';

import {
  FacetService,
  ItemService,
  ThesaurusService,
} from '@myrmidon/cadmus-api';
import { withRequestsStatus } from '@ngneat/elf-requests';
import { deepCopy } from '@myrmidon/ng-tools';

export interface EditedLayerState {
  /**
   * The layer part (=collection of fragments) being edited.
   */
  part?: TextLayerPart;
  /**
   * The base text rendered into a plain string, whatever its original model.
   * This is used for reference (e.g. show it to the user while editing),
   * even if in some cases it can be enough to work with the base text in the
   * layer part editor itself (this is the case of the token-based text,
   * but not e.g. for the tiles-based text).
   */
  baseText?: string;
  /**
   * The base text part.
   */
  baseTextPart?: Part;
  /**
   * The fragments locations, collected from all the fragments.
   */
  locations: TokenLocation[];
  /**
   * The estimated chance of broken fragments in this layer: 0=safe,
   * 1=potentially broken, 2=broken.
   */
  breakChance: number;
  /**
   * The layer fragments reconciliation hints. There is one hint for each
   * fragment in the layer.
   */
  layerHints: LayerHint[];
}

/**
 * Edited layer part ELF repository.
 */
@Injectable({ providedIn: 'root' })
export class EditedLayerRepository {
  private _store;
  private _loading$: BehaviorSubject<boolean>;
  private _saving$: BehaviorSubject<boolean>;

  public loading$: Observable<boolean>;
  public saving$: Observable<boolean>;

  public part$: Observable<TextLayerPart | undefined>;
  public baseText$: Observable<string | undefined>;
  public baseTextPart$: Observable<Part | undefined>;
  public locations$: Observable<TokenLocation[]>;
  public breakChance$: Observable<number>;
  public layerHints$: Observable<LayerHint[]>;

  constructor(
    private _itemService: ItemService,
    private _facetService: FacetService,
    private _thesaurusService: ThesaurusService
  ) {
    this._store = createStore(
      { name: 'edited-layer' },
      withProps<EditedLayerState>({
        locations: [],
        breakChance: 0,
        layerHints: [],
      }),
      withRequestsStatus()
    );
    this._loading$ = new BehaviorSubject<boolean>(false);
    this.loading$ = this._loading$.asObservable();
    this._saving$ = new BehaviorSubject<boolean>(false);
    this.saving$ = this._saving$.asObservable();

    this.part$ = this._store.pipe(select((state) => state.part));
    this.baseText$ = this._store.pipe(select((state) => state.baseText));
    this.baseTextPart$ = this._store.pipe(
      select((state) => state.baseTextPart)
    );
    this.locations$ = this._store.pipe(select((state) => state.locations));
    this.breakChance$ = this._store.pipe(select((state) => state.breakChance));
    this.layerHints$ = this._store.pipe(select((state) => state.layerHints));
  }

  public reset(): void {
    this._store.reset();
  }

  public getValue(): EditedLayerState {
    return this._store.getValue();
  }

  public getPart(): TextLayerPart | undefined {
    return this._store.query((state) => state.part);
  }

  public getBaseText(): string | undefined {
    return this._store.query((state => state.baseText));
  }

  public getLocations(): TokenLocation[] {
    return this._store.query((state) => state.locations);
  }

  private getPartLocations(part: TextLayerPart): TokenLocation[] {
    const locations: TokenLocation[] = [];

    if (part && part.fragments) {
      part.fragments.forEach((p) => {
        locations.push(TokenLocation.parse(p.location)!);
      });
    }
    return locations;
  }

  private loadWithThesauri(
    itemId: string,
    partId: string,
    thesauriIds: string[]
  ): void {
    // remove trailing ! from IDs if any
    const unscopedIds = thesauriIds.map((id) => {
      return this._thesaurusService.getScopedId(id);
    });

    this._loading$.next(true);
    forkJoin({
      // TODO: eventually optimize by adding method param to load only fragments locations
      layerPart: this._itemService.getPart(partId),
      baseText: this._itemService.getBaseTextPart(itemId),
      layers: this._facetService.getFacetParts(itemId, true),
      breakChance: this._itemService.getLayerPartBreakChance(partId),
      layerHints: this._itemService.getLayerPartHints(partId),
      thesauri: this._thesaurusService.getThesauriSet(unscopedIds),
    }).subscribe({
      next: (result) => {
        // if the loaded part has a thesaurus scope, reload the thesauri
        if (result.layerPart?.thesaurusScope) {
          const scopedIds: string[] = thesauriIds.map((id) => {
            return this._thesaurusService.getScopedId(
              id,
              result.layerPart!.thesaurusScope
            );
          });
          this._thesaurusService.getThesauriSet(scopedIds).subscribe({
            next: (thesauri) => {
              this._loading$.next(false);
              this._store.update((state) => ({
                ...state,
                part: result.layerPart as TextLayerPart,
                baseText: result.baseText.text,
                baseTextPart: result.baseText.part,
                locations: this.getPartLocations(
                  result.layerPart as TextLayerPart
                ),
                breakChance: result.breakChance.chance,
                layerHints: result.layerHints,
                thesauri: thesauri,
              }));
            },
            error: (error) => {
              this._loading$.next(false);
              console.error(
                'Error loading thesauri: ' + JSON.stringify(error || {})
              );
            },
          });
        } else {
          this._loading$.next(false);
          this._store.update((state) => ({
            ...state,
            part: result.layerPart as TextLayerPart,
            baseText: result.baseText.text,
            baseTextPart: result.baseText.part,
            locations: this.getPartLocations(result.layerPart as TextLayerPart),
            breakChance: result.breakChance.chance,
            layerHints: result.layerHints,
            thesauri: result.thesauri,
          }));
        }
      },
      error: (error) => {
        this._loading$.next(false);
        console.error(
          'Error loading text layer part: ' + JSON.stringify(error || {})
        );
      },
    });
  }

  private loadWithoutThesauri(itemId: string, partId: string): void {
    this._loading$.next(true);
    forkJoin({
      // TODO: eventually optimize by adding method param to load only fragments locations
      layerPart: this._itemService.getPart(partId),
      baseText: this._itemService.getBaseTextPart(itemId),
      layers: this._facetService.getFacetParts(itemId, true),
      breakChance: this._itemService.getLayerPartBreakChance(partId),
      layerHints: this._itemService.getLayerPartHints(partId),
    }).subscribe({
      next: (result) => {
        this._loading$.next(false);
        this._store.update((state) => ({
          ...state,
          part: result.layerPart as TextLayerPart,
          baseText: result.baseText.text,
          baseTextPart: result.baseText.part,
          locations: this.getPartLocations(result.layerPart as TextLayerPart),
          breakChance: result.breakChance.chance,
          layerHints: result.layerHints,
        }));
      },
      error: (error) => {
        this._loading$.next(false);
        console.error(
          'Error loading text layer part: ' + JSON.stringify(error || {})
        );
      },
    });
  }

  /**
   * Load the state for editing layer part(s).
   *
   * @param itemId The item ID the layer part belongs to.
   * @param partId The layer part ID.
   * @param thesauriIds The optional thesauri IDs to load.
   */
  public load(itemId: string, partId: string, thesauriIds?: string[]): void {
    if (thesauriIds?.length) {
      this.loadWithThesauri(itemId, partId, thesauriIds);
    } else {
      this.loadWithoutThesauri(itemId, partId);
    }
  }

  /**
   * Refresh the layer part break chance.
   */
  public refreshBreakChance(): void {
    const store = this._store.getValue();
    const part = store.part;
    if (!part) {
      return;
    }
    this._itemService.getLayerPartBreakChance(part.id).subscribe({
      next: (result) => {
        this._store.update(setProp('breakChance', result.chance));
      },
      error: (error) => {
        console.error(
          'Error calculating break chance: ' + JSON.stringify(error || {})
        );
        this._store.update(setProp('breakChance', -1));
      },
    });
  }

  public applyLayerPatches(partId: string, patches: string[]): void {
    this._saving$.next(true);
    this._itemService.applyLayerPatches(partId, patches).subscribe({
      next: (part) => {
        this._saving$.next(false);
        this.load(part.itemId, partId);
      },
      error: (error) => {
        this._saving$.next(false);
        console.error(
          'Error patching text layer part: ' + JSON.stringify(error || {})
        );
      },
    });
  }

  /**
   * Delete the fragment at the specified location.
   *
   * @param loc The fragment's location.
   */
  public deleteFragment(loc: TokenLocation): void {
    // find the fragment
    let part = this._store.getValue().part;
    if (!part) {
      return;
    }
    const i = part.fragments.findIndex((p) => {
      return TokenLocation.parse(p.location)?.overlaps(loc);
    });
    if (i === -1) {
      return;
    }

    this._saving$.next(true);
    // remove it from the part
    // work on a copy, as store objects are immutable
    part = deepCopy(part);
    part!.fragments.splice(i, 1);

    // update the part and reload state once done
    this._itemService.addPart(part!).subscribe({
      next: (_) => {
        this._saving$.next(false);
        this.load(part!.itemId, part!.id);
      },
      error: (error) => {
        this._saving$.next(false);
        console.error(error);
        console.error(
          `Error deleting fragment at ${loc} in part ${part!.id}: ` +
            JSON.stringify(error || {})
        );
      },
    });
  }

  /**
   * Save the specified fragment.
   *
   * @param fragment The fragment.
   */
  public saveFragment(fragment: Fragment): void {
    // find the fragment
    let part = this._store.getValue().part;
    if (!part) {
      return;
    }

    // add or replace it
    // work on a copy, as store objects are immutable
    this._saving$.next(true);
    part = deepCopy(part);

    // replace all the overlapping fragments with the new one
    const newLoc = TokenLocation.parse(fragment.location)!;
    let insertAt = 0;
    for (let i = part!.fragments.length - 1; i > -1; i--) {
      const frLoc = TokenLocation.parse(part!.fragments[i].location)!;
      if (newLoc.compareTo(frLoc) >= 0) {
        insertAt = i + 1;
      }
      if (newLoc.overlaps(frLoc)) {
        part!.fragments.splice(i, 1);
        if (insertAt > i && insertAt > 0) {
          insertAt--;
        }
      }
    }

    // add the new fragment
    part!.fragments.splice(insertAt, 0, fragment);

    // update the part and reload once done
    this._itemService.addPart(part!).subscribe({
      next: (_) => {
        this._saving$.next(false);
        this.load(part!.itemId, part!.id);
      },
      error: (error) => {
        this._saving$.next(false);
        console.error(
          `Error saving fragment at ${fragment.location} in part ${
            part!.id
          }: ` + JSON.stringify(error || {})
        );
      },
    });
  }
}
