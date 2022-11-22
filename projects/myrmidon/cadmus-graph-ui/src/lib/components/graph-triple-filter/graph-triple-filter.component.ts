import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';

import { NodeResult, TripleFilter } from '@myrmidon/cadmus-api';

import { GraphTripleListRepository } from '../../state/graph-triple-list.repository';

/**
 * Graph triples filter used in graph triples list.
 * Its data are in the graph triples store, which gets updated when
 * users apply new filters.
 */
@Component({
  selector: 'cadmus-graph-triple-filter',
  templateUrl: './graph-triple-filter.component.html',
  styleUrls: ['./graph-triple-filter.component.css'],
})
export class GraphTripleFilterComponent implements OnInit {
  public filter$: Observable<TripleFilter>;
  public subject$: Observable<NodeResult | undefined>;
  public predicate$: Observable<NodeResult | undefined>;
  public object$: Observable<NodeResult | undefined>;
  public literal: FormControl<boolean>;
  public objectLit: FormControl<string | null>;
  public sid: FormControl<string | null>;
  public sidPrefix: FormControl<boolean>;
  public tag: FormControl<string | null>;
  public form: FormGroup;

  @Input()
  public disabled?: boolean;

  constructor(
    formBuilder: FormBuilder,
    private _repository: GraphTripleListRepository,
  ) {
    this.filter$ = _repository.filter$;
    this.subject$ = _repository.selectTerm('S');
    this.predicate$ = _repository.selectTerm('P');
    this.object$ = _repository.selectTerm('O');
    // form
    this.literal = formBuilder.control(false, { nonNullable: true });
    this.objectLit = formBuilder.control(null, Validators.maxLength(100));
    this.sid = formBuilder.control(null);
    this.sidPrefix = formBuilder.control(false, { nonNullable: true });
    this.tag = formBuilder.control(null);
    this.form = formBuilder.group({
      literal: this.literal,
      objectLit: this.objectLit,
      sid: this.sid,
      sidPrefix: this.sidPrefix,
      tag: this.tag,
    });
  }

  ngOnInit(): void {
    this.filter$.subscribe((f) => {
      this.updateForm(f);
    });
  }

  private updateForm(filter: TripleFilter): void {
    this._repository.setTermId(filter.subjectId, 'S');
    this._repository.setTermId(filter.predicateId, 'P');
    this._repository.setTermId(filter.objectId, 'O');
    this.literal.setValue(filter.objectLiteral ? true : false);
    this.objectLit.setValue(filter.objectLiteral || null);
    this.sid.setValue(filter.sid || null);
    this.tag.setValue(filter.tag || null);
    this.form.markAsPristine();
  }

  private getFilter(): TripleFilter {
    return {
      subjectId: this._repository.getTerm('S')?.id,
      predicateId: this._repository.getTerm('P')?.id,
      objectId: this.literal.value
        ? undefined
        : this._repository.getTerm('O')?.id,
      objectLiteral: this.literal.value
        ? this.objectLit.value?.trim()
        : undefined,
      sid: this.sid.value?.trim(),
      tag: this.tag.value?.trim(),
    };
  }

  public onSubjectNodeChange(node?: NodeResult | null): void {
    this._repository.setTerm(node, 'S');
  }

  public onPredicateNodeChange(node?: NodeResult | null): void {
    this._repository.setTerm(node, 'P');
  }

  public onObjectNodeChange(node?: NodeResult | null): void {
    this._repository.setTerm(node, 'O');
  }

  public reset(): void {
    this.form.reset();
    this.apply();
  }

  public apply(): void {
    if (this.form.invalid) {
      return;
    }
    const filter = this.getFilter();

    // update filter in state
    this._repository.setFilter(filter);
  }
}
