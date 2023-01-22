import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  UntypedFormGroup,
} from '@angular/forms';
import { take } from 'rxjs/operators';

import { NgToolsValidators } from '@myrmidon/ng-tools';
import { DialogService } from '@myrmidon/ng-mat-tools';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';
import { EditedObject, ModelEditorComponentBase } from '@myrmidon/cadmus-ui';
import { ThesauriSet, ThesaurusEntry } from '@myrmidon/cadmus-core';

import {
  HistoricalEvent,
  HistoricalEventsPart,
  HISTORICAL_EVENTS_PART_TYPEID,
} from '../historical-events-part';

/**
 * Historical events part.
 * Thesauri (all optional): event-types, event-relations, chronotope-tags,
 * assertion-tags, doc-reference-tags, doc-reference-types.
 */
@Component({
  selector: 'cadmus-historical-events-part',
  templateUrl: './historical-events-part.component.html',
  styleUrls: ['./historical-events-part.component.css'],
})
export class HistoricalEventsPartComponent
  extends ModelEditorComponentBase<HistoricalEventsPart>
  implements OnInit
{
  private _editedIndex: number;

  public editedEvent: HistoricalEvent | undefined;

  /**
   * Thesaurus event-types.
   */
  public eventTypeEntries: ThesaurusEntry[] | undefined;
  /**
   * Thesaurus event-relations.
   */
  public relationEntries: ThesaurusEntry[] | undefined;
  /**
   * Thesaurus chronotope-tags.
   */
  public ctTagEntries: ThesaurusEntry[] | undefined;
  /**
   * Thesaurus assertion-tags.
   */
  public assTagEntries: ThesaurusEntry[] | undefined;
  /**
   * Thesaurus doc-reference-tags.
   */
  public refTagEntries: ThesaurusEntry[] | undefined;
  /**
   * Thesaurus doc-reference-types.
   */
  public refTypeEntries: ThesaurusEntry[] | undefined;

  public events: FormControl<HistoricalEvent[]>;

  constructor(
    authService: AuthJwtService,
    formBuilder: FormBuilder,
    private _dialogService: DialogService
  ) {
    super(authService, formBuilder);
    this._editedIndex = -1;
    // form
    this.events = formBuilder.control([], {
      validators: NgToolsValidators.strictMinLengthValidator(1),
      nonNullable: true,
    });
  }

  public override ngOnInit(): void {
    super.ngOnInit();
  }

  protected buildForm(formBuilder: FormBuilder): FormGroup | UntypedFormGroup {
    return formBuilder.group({
      events: this.events,
    });
  }

  private updateThesauri(thesauri: ThesauriSet): void {
    let key = 'event-types';
    if (this.hasThesaurus(key)) {
      this.eventTypeEntries = thesauri[key].entries;
    } else {
      this.eventTypeEntries = undefined;
    }
    key = 'event-relations';
    if (this.hasThesaurus(key)) {
      this.relationEntries = thesauri[key].entries;
    } else {
      this.relationEntries = undefined;
    }
    key = 'chronotope-tags';
    if (this.hasThesaurus(key)) {
      this.ctTagEntries = thesauri[key].entries;
    } else {
      this.ctTagEntries = undefined;
    }
    key = 'assertion-tags';
    if (this.hasThesaurus(key)) {
      this.assTagEntries = thesauri[key].entries;
    } else {
      this.assTagEntries = undefined;
    }
    key = 'doc-reference-tags';
    if (this.hasThesaurus(key)) {
      this.refTagEntries = thesauri[key].entries;
    } else {
      this.refTagEntries = undefined;
    }
    key = 'doc-reference-types';
    if (this.hasThesaurus(key)) {
      this.refTypeEntries = thesauri[key].entries;
    } else {
      this.refTypeEntries = undefined;
    }
  }

  private updateForm(part?: HistoricalEventsPart | null): void {
    if (!part) {
      this.form.reset();
      return;
    }
    this.events.setValue(part.events || []);
    this.form.markAsPristine();
  }

  protected override onDataSet(
    data?: EditedObject<HistoricalEventsPart>
  ): void {
    // thesauri
    if (data?.thesauri) {
      this.updateThesauri(data.thesauri);
    }

    // form
    this.updateForm(data?.value);
  }

  protected getValue(): HistoricalEventsPart {
    let part = this.getEditedPart(
      HISTORICAL_EVENTS_PART_TYPEID
    ) as HistoricalEventsPart;
    part.events = this.events.value || [];
    return part;
  }

  public addEvent(): void {
    const ev: HistoricalEvent = {
      eid: '',
      type: this.eventTypeEntries?.length ? this.eventTypeEntries[0].id : '',
    };
    this.events.setValue([...this.events.value, ev]);
    this.events.updateValueAndValidity();
    this.events.markAsDirty();
    this.editEvent(this.events.value.length - 1);
  }

  public editEvent(index: number): void {
    if (index < 0) {
      this._editedIndex = -1;
      this.editedEvent = undefined;
    } else {
      this._editedIndex = index;
      this.editedEvent = this.events.value[index];
    }
  }

  public onEventSave(entry: HistoricalEvent): void {
    this.events.setValue(
      this.events.value.map((e: HistoricalEvent, i: number) =>
        i === this._editedIndex ? entry : e
      )
    );
    this.events.updateValueAndValidity();
    this.events.markAsDirty();
    this.editEvent(-1);
  }

  public onEventClose(): void {
    this.editEvent(-1);
  }

  public deleteEvent(index: number): void {
    this._dialogService
      .confirm('Confirmation', 'Delete event?')
      .pipe(take(1))
      .subscribe((yes) => {
        if (yes) {
          const entries = [...this.events.value];
          entries.splice(index, 1);
          this.events.setValue(entries);
          this.events.updateValueAndValidity();
          this.events.markAsDirty();
        }
      });
  }

  public moveEventUp(index: number): void {
    if (index < 1) {
      return;
    }
    const entry = this.events.value[index];
    const entries = [...this.events.value];
    entries.splice(index, 1);
    entries.splice(index - 1, 0, entry);
    this.events.setValue(entries);
    this.events.updateValueAndValidity();
    this.events.markAsDirty();
  }

  public moveEventDown(index: number): void {
    if (index + 1 >= this.events.value.length) {
      return;
    }
    const entry = this.events.value[index];
    const entries = [...this.events.value];
    entries.splice(index, 1);
    entries.splice(index + 1, 0, entry);
    this.events.setValue(entries);
    this.events.updateValueAndValidity();
    this.events.markAsDirty();
  }
}
