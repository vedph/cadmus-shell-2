import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { AssertedChronotope } from '@myrmidon/cadmus-refs-asserted-chronotope';
import { Assertion } from '@myrmidon/cadmus-refs-assertion';
import { renderLabelFromLastColon } from '@myrmidon/cadmus-ui';

import { HistoricalEvent, RelatedEntity } from '../historical-events-part';

const RELATION_SEP = ':';

@Component({
  selector: 'cadmus-historical-event-editor',
  templateUrl: './historical-event-editor.component.html',
  styleUrls: ['./historical-event-editor.component.css'],
})
export class HistoricalEventEditorComponent {
  private _model: HistoricalEvent | undefined;
  private _currentEntityIndex: number;

  @Input()
  public get model(): HistoricalEvent | undefined {
    return this._model;
  }
  public set model(value: HistoricalEvent | undefined) {
    if (this._model === value) {
      return;
    }
    this._model = value;
    this.updateForm(value);
  }

  /**
   * Thesaurus event-types (hierarchical).
   */
  @Input()
  public eventTypeEntries: ThesaurusEntry[] | undefined;
  /**
   * Thesaurus event-tags.
   */
  @Input()
  public eventTagEntries: ThesaurusEntry[] | undefined;
  /**
   * Thesaurus event-relations (pseudo-hierarchical; the
   * separator used is : rather than .).
   */
  @Input()
  public relationEntries: ThesaurusEntry[] | undefined;
  /**
   * Thesaurus chronotope-tags.
   */
  @Input()
  public ctTagEntries: ThesaurusEntry[] | undefined;
  /**
   * Thesaurus assertion-tags.
   */
  @Input()
  public assTagEntries: ThesaurusEntry[] | undefined;
  /**
   * Thesaurus doc-reference-tags.
   */
  @Input()
  public refTagEntries: ThesaurusEntry[] | undefined;
  /**
   * Thesaurus doc-reference-types.
   */
  @Input()
  public refTypeEntries: ThesaurusEntry[] | undefined;
  /**
   * The number of event type portions to cut from the event type ID when
   * building the prefix used to filter the corresponding relations IDs.
   * By default this is 0, i.e. the whole type ID (plus a final :) is
   * used as prefix. For instance, the ID "person.birth" generates prefix
   * "person:birth:". The portions of an ID are defined by splitting it at
   * each dot: so, should this property be 1, we would split the ID into
   * "person" and "birth", remove the last 1 tail(s), thus getting "person",
   * join back the portions and append a final colon, generating "person:".
   */
  @Input()
  public eventTypeTailCut: number;

  /**
   * True to disable ID lookup via scoped pin lookup.
   */
  @Input()
  public noLookup?: boolean;

  @Output()
  public modelChange: EventEmitter<HistoricalEvent>;
  @Output()
  public editorClose: EventEmitter<any>;

  // event
  public eid: FormControl<string | null>;
  public type: FormControl<string | null>;
  public tag: FormControl<string | null>;
  public description: FormControl<string | null>;
  public note: FormControl<string | null>;
  public relatedEntities: FormControl<RelatedEntity[]>;
  public chronotopes: FormControl<AssertedChronotope[]>;
  public hasAssertion: FormControl<boolean>;
  public assertion: FormControl<Assertion | null>;
  public form: FormGroup;

  // related entity
  public currentRelEntries: ThesaurusEntry[];
  public currentEntity?: RelatedEntity;
  public relation: FormControl<string | null>;
  public id: FormControl<string | null>;
  public reForm: FormGroup;

  constructor(formBuilder: FormBuilder) {
    this.modelChange = new EventEmitter<HistoricalEvent>();
    this.editorClose = new EventEmitter<any>();
    this._currentEntityIndex = -1;
    this.eventTypeTailCut = 0;
    // form
    this.eid = formBuilder.control(null, [
      Validators.required,
      Validators.maxLength(500),
    ]);
    this.type = formBuilder.control(null, [
      Validators.required,
      Validators.maxLength(500),
    ]);
    this.tag = formBuilder.control(null, Validators.maxLength(50));
    this.description = formBuilder.control(null, Validators.maxLength(1000));
    this.note = formBuilder.control(null, Validators.maxLength(1000));
    this.relatedEntities = formBuilder.control([], { nonNullable: true });
    this.chronotopes = formBuilder.control([], { nonNullable: true });
    this.hasAssertion = formBuilder.control(false, { nonNullable: true });
    this.assertion = formBuilder.control(null);
    this.form = formBuilder.group({
      eid: this.eid,
      type: this.type,
      tag: this.tag,
      description: this.description,
      note: this.note,
      relatedEntities: this.relatedEntities,
      chronotopes: this.chronotopes,
      hasAssertion: this.hasAssertion,
      assertion: this.assertion,
    });
    // related entity
    this.currentRelEntries = [];
    this.relation = formBuilder.control(null, [
      Validators.required,
      Validators.maxLength(500),
    ]);
    this.id = formBuilder.control(null, [
      Validators.required,
      Validators.maxLength(500),
    ]);
    this.reForm = formBuilder.group({
      relation: this.relation,
      id: this.id,
    });
  }

  public renderLabel(label: string): string {
    return renderLabelFromLastColon(label);
  }

  private updateRelEntries(prefix: string): void {
    if (!this.relationEntries?.length) {
      return;
    }
    if (!prefix) {
      this.currentRelEntries = this.relationEntries;
    } else {
      this.currentRelEntries = this.relationEntries.filter((e) =>
        e.id.startsWith(prefix)
      );
    }
  }

  private getTypeEntryPrefix(id: string): string {
    let p = id;

    // eventually remove tail: by convention, an entry ID ending with ".-"
    // is always treated as a tailed ID where the ending "-" should be removed.
    // This is because that's the convention for representing parent entries
    // like "person.job.-" with children like "person.job.bishop".
    const tailSize = p.endsWith('.-')
      ? 1 + this.eventTypeTailCut
      : this.eventTypeTailCut;

    if (tailSize > 0) {
      // split the event type ID (truly hierarchical, e.g. "person.birth")
      const tokens = p.split('.');
      if (tokens.length >= tailSize) {
        tokens.splice(tokens.length - tailSize);
      }
      p = tokens.join(RELATION_SEP);
      return p + RELATION_SEP;
    }
    return p.replace('.', RELATION_SEP) + RELATION_SEP;
  }

  public onTypeEntryChange(entry: ThesaurusEntry): void {
    setTimeout(() => {
      this.type.setValue(entry.id);
      // filter related entries according to type
      if (this.relationEntries?.length) {
        this.updateRelEntries(this.getTypeEntryPrefix(entry.id));
      }
    }, 0);
  }

  private updateForm(model: HistoricalEvent | undefined): void {
    if (!model) {
      this.form.reset();
      return;
    }

    this.eid.setValue(model.eid);
    this.type.setValue(model.type);
    this.tag.setValue(model.tag || null);
    this.description.setValue(model.description || null);
    this.note.setValue(model.note || null);
    this.chronotopes.setValue(model.chronotopes || []);
    this.hasAssertion.setValue(model.assertion ? true : false);
    this.assertion.setValue(model.assertion || null);
    this.relatedEntities.setValue(model.relatedEntities || []);

    if (this.relationEntries?.length) {
      this.updateRelEntries(this.getTypeEntryPrefix(model.type));
    }

    this.form.markAsPristine();
  }

  private getModel(): HistoricalEvent {
    return {
      eid: this.eid.value?.trim() || '',
      type: this.type.value?.trim() || '',
      tag: this.tag.value?.trim() || '',
      description: this.description.value?.trim() || undefined,
      note: this.note.value?.trim() || undefined,
      chronotopes: this.chronotopes.value.length
        ? this.chronotopes.value
        : undefined,
      assertion: this.hasAssertion.value
        ? this.assertion.value || undefined
        : undefined,
      relatedEntities: this.relatedEntities.value.length
        ? this.relatedEntities.value
        : undefined,
    };
  }

  public onChronotopesChange(chronotope: AssertedChronotope[]): void {
    this.chronotopes.setValue(chronotope);
    this.chronotopes.updateValueAndValidity();
    this.chronotopes.markAsDirty();
  }

  public onAssertionChange(assertion: Assertion | undefined): void {
    this.assertion.setValue(assertion || null);
    this.assertion.updateValueAndValidity();
    this.assertion.markAsDirty();
  }

  public newCurrentEntity(): void {
    this.setCurrentEntity({
      id: '',
      relation: this.relationEntries?.length ? this.relationEntries[0].id : '',
    });
  }

  public setCurrentEntity(entity: RelatedEntity | undefined): void {
    this.currentEntity = entity;
    if (!entity) {
      this._currentEntityIndex = -1;
      this.reForm.reset();
    } else {
      this._currentEntityIndex = this.relatedEntities.value.indexOf(entity);
      this.relation.setValue(entity.relation);
      this.id.setValue(entity.id);
      this.reForm.markAsPristine();
    }
  }

  public saveCurrentEntity(): void {
    if (!this.currentEntity || this.reForm.invalid) {
      return;
    }
    const entity: RelatedEntity = {
      id: this.id.value!.trim(),
      relation: this.relation.value!.trim(),
    };
    // nope if already present
    if (
      this.relatedEntities.value.find(
        (e) => e.id === entity.id && e.relation === entity.relation
      )
    ) {
      this.setCurrentEntity(undefined);
      return;
    }
    // replace
    if (this._currentEntityIndex > -1) {
      const entities = [...this.relatedEntities.value];
      entities.splice(this._currentEntityIndex, 1, entity);
      this.relatedEntities.setValue(entities);
    } else {
      this.relatedEntities.setValue([...this.relatedEntities.value, entity]);
    }
    this.relatedEntities.updateValueAndValidity();
    this.relatedEntities.markAsDirty();
    this.setCurrentEntity(undefined);
  }

  public deleteRelatedEntity(entity: RelatedEntity): void {
    if (this.currentEntity?.id === entity.id) {
      this.setCurrentEntity(undefined);
    }
    const i = this.relatedEntities.value.findIndex((e) => e.id === entity.id);
    if (i > -1) {
      const entities = [...this.relatedEntities.value];
      entities.splice(i, 1);
      this.relatedEntities.setValue(entities);
      this.relatedEntities.updateValueAndValidity();
      this.relatedEntities.markAsDirty();
    }
  }

  public onIdPick(id: string): void {
    this.setCurrentEntity({
      id: id,
      relation: this.relation.value || '',
    });
  }

  public cancel(): void {
    this.editorClose.emit();
  }

  public save(): void {
    if (this.form.invalid) {
      return;
    }
    this._model = this.getModel();
    this.modelChange.emit(this._model);
  }
}
