import { Component, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { take } from 'rxjs/operators';

import { NgToolsValidators } from '@myrmidon/ng-tools';
import { DialogService } from '@myrmidon/ng-mat-tools';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';
import { EditedObject, ModelEditorComponentBase } from '@myrmidon/cadmus-ui';

import {
  PinLink,
  PinLinksPart,
  PIN_LINKS_PART_TYPEID,
} from '../pin-links-part';
import { DataPinInfo, IndexLookupDefinitions } from '@myrmidon/cadmus-core';
import { ItemService } from '@myrmidon/cadmus-api';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * PinLinksPart editor component.
 * Thesauri: none.
 */
@Component({
  selector: 'cadmus-pin-links-part',
  templateUrl: './pin-links-part.component.html',
  styleUrls: ['./pin-links-part.component.css'],
})
export class PinLinksPartComponent
  extends ModelEditorComponentBase<PinLinksPart>
  implements OnInit
{
  public keys: string[];
  public links: FormControl<PinLink[]>;

  public key: FormControl<string | null>;
  public keyForm: FormGroup;

  public loading?: boolean;

  constructor(
    authService: AuthJwtService,
    formBuilder: FormBuilder,
    @Inject('indexLookupDefinitions')
    lookupDefs: IndexLookupDefinitions,
    private _dialogService: DialogService,
    private _itemService: ItemService,
    private _snackbar: MatSnackBar
  ) {
    super(authService, formBuilder);
    this.keys = Object.keys(lookupDefs);
    // form
    this.links = formBuilder.control([], {
      // at least 1 entry
      validators: NgToolsValidators.strictMinLengthValidator(1),
      nonNullable: true,
    });
    // key form
    this.key = formBuilder.control(null, Validators.required);
    this.keyForm = formBuilder.group({
      key: this.key,
    });
  }

  public override ngOnInit(): void {
    super.ngOnInit();
  }

  protected buildForm(formBuilder: FormBuilder): FormGroup | UntypedFormGroup {
    return formBuilder.group({
      links: this.links,
    });
  }

  private updateForm(part?: PinLinksPart | null): void {
    if (!part) {
      this.form.reset();
      return;
    }
    this.links.setValue(part.links || []);
    this.form.markAsPristine();
  }

  protected override onDataSet(data?: EditedObject<PinLinksPart>): void {
    // form
    this.updateForm(data?.value);
  }

  protected getValue(): PinLinksPart {
    let part = this.getEditedPart(PIN_LINKS_PART_TYPEID) as PinLinksPart;
    part.links = this.links.value || [];
    return part;
  }

  public deleteLink(index: number): void {
    this._dialogService
      .confirm('Confirmation', 'Delete link?')
      .pipe(take(1))
      .subscribe((yes) => {
        if (yes) {
          const links = [...this.links.value];
          links.splice(index, 1);
          this.links.setValue(links);
        }
      });
  }

  private hasLink(info: DataPinInfo): boolean {
    return (
      this.links.value.findIndex((l) => {
        return (
          l.itemId === info.itemId &&
          l.partId === info.partId &&
          ((!l.roleId && !info.partId) || l.roleId === info.roleId)
        );
      }) > -1
    );
  }

  public onEntryChange(info: DataPinInfo | null): void {
    if (this.loading || !info || this.hasLink(info)) {
      return;
    }

    this.loading = true;
    this._itemService
      .getItem(info.itemId, false)
      .pipe(take(1))
      .subscribe({
        next: (item) => {
          this.loading = false;
          const links = [...this.links.value];
          links.push({
            label: item.title,
            itemId: info.itemId,
            partId: info.partId,
            roleId: info.roleId || undefined,
            partTypeId: info.partTypeId,
            name: info.name,
            value: info.value,
          });
          this.links.setValue(links);
          this.links.markAsDirty();
          this.links.updateValueAndValidity();
        },
        error: (error) => {
          this.loading = false;
          console.error(
            'Error loading item ' +
              info.itemId +
              ': ' +
              (error ? JSON.stringify(error) : '')
          );
          this._snackbar.open('Error loading item', 'OK');
        },
      });
  }
}
