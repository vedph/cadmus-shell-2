import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { ComponentCanDeactivate, Part } from '@myrmidon/cadmus-core';
import { ItemService, ThesaurusService } from '@myrmidon/cadmus-api';
import { EditedObject, PartIdentity } from '@myrmidon/cadmus-ui';

import { PartEditorService } from './part-editor.service';

/**
 * Base class for part feature editors.
 * A part feature editor is a wrapper component around a model editor component,
 * used to separate the editor's logic from its host infrastructure.
 */
@Component({
  template: '',
})
export abstract class EditPartFeatureBase
  implements OnInit, OnDestroy, ComponentCanDeactivate
{
  private _loadingSub?: Subscription;
  private _savingSub?: Subscription;

  /**
   * The part being edited.
   */
  public data?: EditedObject<Part>;

  /**
   * The identity of the part being edited. This gets built from the current
   * route.
   */
  public identity: PartIdentity;

  /**
   * True when the wrapped editor component data is dirty.
   */
  public dirty?: boolean;

  /**
   * True when loading data.
   */
  public loading?: boolean;

  /**
   * True when saving data.
   */
  public saving?: boolean;

  constructor(
    protected router: Router,
    route: ActivatedRoute,
    protected snackbar: MatSnackBar,
    protected itemService: ItemService,
    protected thesaurusService: ThesaurusService,
    protected editorService: PartEditorService
  ) {
    // part route:
    // /items/<iid>/@partGroup/@partTypeId/<pid>?rid
    // item ID
    const itemId = route.snapshot.params['iid'];
    // type ID (from "@partTypeId/:pid")
    const typeId = route.snapshot.routeConfig!.path!.substring(
      0,
      route.snapshot.routeConfig!.path!.indexOf('/')
    );
    // part ID or null (if "new")
    let partId = route.snapshot.params['pid'];
    if (partId === 'new') {
      partId = null;
    }
    // role ID or null (if "default")
    let roleId = route.snapshot.queryParams['rid'];
    if (roleId === 'default') {
      roleId = null;
    }
    this.identity = {
      itemId: itemId,
      typeId: typeId,
      partId: partId,
      roleId: roleId,
    };

    // subscriptions
    this._loadingSub = this.editorService.loading$.subscribe(
      (loading) => (this.loading = loading)
    );
    this._savingSub = this.editorService.saving$.subscribe(
      (saving) => (this.saving = saving)
    );
  }

  /**
   * Override in derived classes to return the IDs of the thesauri requested
   * for this editor.
   *
   * @return Array with thesauri IDs, eventually empty.
   */
  protected getReqThesauriIds(): string[] {
    return [];
  }

  /**
   * Called once data has been loaded.
   */
  protected onDataLoaded(): void {}

  public ngOnInit(): void {
    // load data
    this.loading = true;
    const thesIds = this.getReqThesauriIds();
    this.editorService
      .load(this.identity, thesIds)
      .then((data) => {
        if (data) {
          this.data = data;
          this.onDataLoaded();
        }
      })
      .catch((reason) => {
        this.snackbar.open(reason.message, 'OK');
      });
  }

  public ngOnDestroy(): void {
    this._loadingSub?.unsubscribe();
    this._savingSub?.unsubscribe();
  }

  public canDeactivate(): boolean {
    return !this.dirty;
  }

  /**
   * Called when the wrapped editor dirty state changes.
   * In the HTML template, you MUST bind this handler to the dirtyChange event
   * emitted by your wrapped editor (i.e. (dirtyChange)="onDirtyChange($event)").
   *
   * @param value The value of the dirty state.
   */
  public onDirtyChange(value: boolean): void {
    console.log('part dirty change (from editor): ' + value);
    this.dirty = value;
  }

  /**
   * Save the part.
   *
   * @param part The part to be saved.
   */
  public save(part: Part): void {
    this.editorService.save(part).then(
      (saved: Part) => {
        // update the route-defined part ID if it was null (new part)
        if (!this.identity.partId) {
          this.identity = { ...this.identity, partId: saved.id };
        }
        console.log('Part saved: ' + saved.id);
        this.snackbar.open('Part saved', 'OK', {
          duration: 3000,
        });
      },
      (reason) => {
        this.snackbar.open(reason.message, 'OK');
      }
    );
  }

  /**
   * Close the editor by navigating back to the part's item.
   */
  public close(): void {
    this.router.navigate(['items', this.identity.itemId]);
  }
}
