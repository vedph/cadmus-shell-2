import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GraphService, NodeResult, TripleResult } from '@myrmidon/cadmus-api';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { NgToolsValidators } from '@myrmidon/ng-tools';
import { take } from 'rxjs/operators';

@Component({
  selector: 'cadmus-graph-triple-editor',
  templateUrl: './graph-triple-editor.component.html',
  styleUrls: ['./graph-triple-editor.component.css'],
})
export class GraphTripleEditorComponent implements OnInit {
  private _triple: TripleResult | undefined;

  @Input()
  public get triple(): TripleResult | undefined | null {
    return this._triple;
  }
  public set triple(value: TripleResult | undefined | null) {
    if (this._triple === value) {
      return;
    }
    this._triple = value || undefined;
    this.updateForm(this._triple);
  }

  /**
   * The optional set of thesaurus entries for triple's tags.
   */
  @Input()
  public tagEntries?: ThesaurusEntry[] | undefined;

  /**
   * Emitted when triple has changed.
   */
  @Output()
  public tripleChange: EventEmitter<TripleResult>;

  /**
   * Emitted when the user requested to close the editor.
   */
  @Output()
  public editorClose: EventEmitter<any>;

  public isNew: boolean;

  public subjectNode: FormControl<NodeResult | null>;
  public predicateNode: FormControl<NodeResult | null>;
  public objectNode: FormControl<NodeResult | null>;
  public isLiteral: FormControl<boolean>;
  public literal: FormControl<string | null>;
  public tag: FormControl<string | null>;
  public form: FormGroup;

  constructor(
    formBuilder: FormBuilder,
    private _snackbar: MatSnackBar,
    private _graphService: GraphService
  ) {
    this.tripleChange = new EventEmitter<TripleResult>();
    this.editorClose = new EventEmitter<any>();
    this.isNew = true;
    // form
    this.subjectNode = formBuilder.control(null, Validators.required);
    this.predicateNode = formBuilder.control(null, Validators.required);
    this.objectNode = formBuilder.control(null, [
      NgToolsValidators.conditionalValidator(() => {
        return !this.isLiteral?.value;
      }, Validators.required),
      Validators.maxLength(15000),
    ]);
    this.isLiteral = formBuilder.control(true, { nonNullable: true });
    this.literal = formBuilder.control(
      null,
      NgToolsValidators.conditionalValidator(() => {
        return this.isLiteral?.value;
      }, Validators.required)
    );
    this.tag = formBuilder.control(null, Validators.maxLength(50));
    this.form = formBuilder.group({
      subjectNode: this.subjectNode,
      predicateNode: this.predicateNode,
      objectNode: this.objectNode,
      isLiteral: this.isLiteral,
      literal: this.literal,
      tag: this.tag,
    });
  }

  ngOnInit(): void {}

  public onSubjectChange(node?: NodeResult | null): void {
    this.subjectNode.setValue(node || null);
    this.subjectNode.updateValueAndValidity();
    this.subjectNode.markAsDirty();
  }

  public onPredicateChange(node?: NodeResult | null): void {
    this.predicateNode.setValue(node || null);
    this.predicateNode.updateValueAndValidity();
    this.predicateNode.markAsDirty();
  }

  public onObjectChange(node?: NodeResult | null): void {
    this.objectNode.setValue(node || null);
    this.objectNode.updateValueAndValidity();
    this.objectNode.markAsDirty();

    if (node) {
      this.isLiteral.setValue(false);
      this.isLiteral.updateValueAndValidity();
      this.isLiteral.markAsDirty();
    }
  }

  private getNode(id: number): Promise<NodeResult | undefined> {
    return new Promise((resolve, reject) => {
      this._graphService
        .getNode(id)
        .pipe(take(1))
        .subscribe({
          next: (node) => {
            resolve(node);
          },
          error: (error) => {
            if (error) {
              console.error(JSON.stringify(error));
            }
            this._snackbar.open('Error loading node ' + id, 'OK');
            reject();
          },
        });
    });
  }

  private updateForm(triple?: TripleResult): void {
    if (!triple) {
      this.form.reset();
      this.isLiteral.setValue(true);
      this.isNew = true;
      return;
    }

    if (triple.subjectId) {
      this.getNode(triple.subjectId).then((node) => {
        this.subjectNode.setValue(node || null);
        this.subjectNode.updateValueAndValidity();
        this.subjectNode.markAsDirty();
      });
    } else {
      this.subjectNode.reset();
    }
    if (triple.predicateId) {
      this.getNode(triple.predicateId).then((node) => {
        this.predicateNode.setValue(node || null);
        this.predicateNode.updateValueAndValidity();
        this.predicateNode.markAsDirty();
      });
    } else {
      this.predicateNode.reset();
    }
    if (triple.objectId) {
      this.isLiteral.setValue(false);
      this.getNode(triple.objectId).then((node) => {
        this.objectNode.setValue(node || null);
        this.objectNode.updateValueAndValidity();
        this.objectNode.markAsDirty();
      });
    } else {
      this.isLiteral.setValue(true);
      this.literal.setValue(triple.objectLiteral || null);
    }
    this.isNew = triple.id ? false : true;
    this.form.markAsPristine();
  }

  private getTriple(): TripleResult {
    return {
      id: this.triple?.id || 0,
      subjectId: this.subjectNode.value?.id || 0,
      predicateId: this.predicateNode.value?.id || 0,
      objectId: this.isLiteral.value
        ? undefined
        : this.objectNode.value?.id || 0,
      objectLiteral: this.isLiteral.value ? this.literal.value! : undefined,
      subjectUri: this.subjectNode.value?.uri || '',
      predicateUri: this.predicateNode.value?.uri || '',
      objectUri: this.isLiteral.value
        ? undefined
        : this.objectNode.value?.uri || '',
    };
  }

  public cancel(): void {
    this.editorClose.emit();
  }

  public save(): void {
    if (this.form.invalid) {
      return;
    }
    this._triple = this.getTriple();
    this.tripleChange.emit(this._triple);
  }
}
