import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthJwtService } from '@myrmidon/auth-jwt-login';
import { ItemService } from '@myrmidon/cadmus-api';
import {
  DataPinInfo,
  IndexLookupDefinitions,
  ThesauriSet,
  ThesaurusEntry,
} from '@myrmidon/cadmus-core';
import { EditedObject, ModelEditorComponentBase } from '@myrmidon/cadmus-ui';
import { DialogService } from '@myrmidon/ng-mat-tools';
import { NgToolsValidators } from '@myrmidon/ng-tools';
import { take } from 'rxjs';

import { PinLinksFragment } from '../pin-links-fragment';
import { PinLink } from '../pin-links-part';

/**
 * Pin-based links fragment editor component.
 * Thesauri: pin-link-tags (optional).
 */
@Component({
  selector: 'cadmus-pin-links-fragment',
  templateUrl: './pin-links-fragment.component.html',
  styleUrls: ['./pin-links-fragment.component.css'],
})
export class PinLinksFragmentComponent
  extends ModelEditorComponentBase<PinLinksFragment>
  implements OnInit
{
  public keys: string[];
  public links: FormControl<PinLink[]>;

  public key: FormControl<string | null>;
  public tag: FormControl<string | null>;
  public keyForm: FormGroup;

  public loading?: boolean;

  // pin-link-tags
  public tagEntries?: ThesaurusEntry[];

  // TODO: add tag entries if required, e.g.:
  // public tagEntries: ThesaurusEntry[] | undefined;

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
    // form
    this.keys = Object.keys(lookupDefs);
    // form
    this.links = formBuilder.control([], {
      // at least 1 entry
      validators: NgToolsValidators.strictMinLengthValidator(1),
      nonNullable: true,
    });
    // key form
    this.key = formBuilder.control(null, Validators.required);
    this.tag = formBuilder.control(null, Validators.maxLength(50));
    this.keyForm = formBuilder.group({
      key: this.key,
      tag: this.tag,
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

  private updateThesauri(thesauri: ThesauriSet): void {
    const key = 'pin-link-tags';
    if (this.hasThesaurus(key)) {
      this.tagEntries = thesauri[key].entries;
    } else {
      this.tagEntries = undefined;
    }
  }

  private updateForm(fr?: PinLinksFragment | null): void {
    if (!fr) {
      this.form.reset();
      return;
    }
    this.links.setValue(fr.links || []);
    this.form.markAsPristine();
  }

  protected override onDataSet(data?: EditedObject<PinLinksFragment>): void {
    // thesauri
    if (data?.thesauri) {
      this.updateThesauri(data.thesauri);
    }

    // form
    this.updateForm(data?.value);
  }

  protected getValue(): PinLinksFragment {
    const fr = this.getEditedFragment() as PinLinksFragment;
    fr.links = this.links.value || [];
    return fr;
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
          ((!l.roleId && !info.partId) || l.roleId === info.roleId) &&
          ((!l.tag && !info.tag) || l.tag === info.tag)
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
            tag: this.tag.value || undefined,
          });
          this.links.setValue(links);
          this.links.markAsDirty();
          this.links.updateValueAndValidity();
          this.tag.reset();
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
