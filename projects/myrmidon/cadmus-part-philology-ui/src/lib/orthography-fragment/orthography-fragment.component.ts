import { Component, OnInit } from '@angular/core';
import { OrthographyFragment } from '../orthography-fragment';
import {
  FormControl,
  FormGroup,
  FormArray,
  FormBuilder,
  Validators,
  UntypedFormGroup,
} from '@angular/forms';
import { take } from 'rxjs/operators';

import { diff_match_patch } from 'diff-match-patch';

import { EditedObject, ModelEditorComponentBase } from '@myrmidon/cadmus-ui';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';
import { DialogService } from '@myrmidon/ng-mat-tools';

import { DifferResultToMspAdapter } from '../differ-result-to-msp-adapter';
import { MspOperation } from '../msp-operation';
import { MspValidators } from '../msp-validators';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';

@Component({
  selector: 'cadmus-orthography-fragment',
  templateUrl: './orthography-fragment.component.html',
  styleUrls: ['./orthography-fragment.component.css'],
  animations: [
    trigger('slideInOut', [
      state(
        'open',
        style({
          height: '100%',
        })
      ),
      state(
        'close',
        style({
          height: 0,
        })
      ),
      transition('open <=> closed', [animate('300ms ease-in')]),
    ]),
  ],
})
export class OrthographyFragmentComponent
  extends ModelEditorComponentBase<OrthographyFragment>
  implements OnInit
{
  private _currentOperationIndex: number;
  private _differ?: diff_match_patch;
  private _adapter?: DifferResultToMspAdapter;

  public standard: FormControl<string>;
  public operations: FormArray;
  public currentOperation?: MspOperation;

  constructor(
    authService: AuthJwtService,
    private _formBuilder: FormBuilder,
    private _dialogService: DialogService
  ) {
    super(authService, _formBuilder);
    this._currentOperationIndex = -1;

    // form
    this.standard = _formBuilder.control('', {
      validators: [Validators.required, Validators.maxLength(100)],
      nonNullable: true,
    });
    this.operations = _formBuilder.array([]);
  }

  public override ngOnInit(): void {
    super.ngOnInit();
  }

  protected buildForm(formBuilder: FormBuilder): FormGroup | UntypedFormGroup {
    return formBuilder.group({
      standard: this.standard,
      operations: this.operations,
    });
  }

  private updateForm(fragment?: OrthographyFragment | null): void {
    if (!fragment) {
      this.form.reset();
    } else {
      this.standard.setValue(fragment.standard);
      if (fragment.operations) {
        for (const op of fragment.operations) {
          this.addOperation(op);
        }
      }
      this.form.markAsPristine();
    }
  }

  protected override onDataSet(data?: EditedObject<OrthographyFragment>): void {
    this.updateForm(data?.value);
  }

  public addOperation(operation?: string): void {
    this.operations.push(
      this._formBuilder.group({
        text: this._formBuilder.control(operation, [
          Validators.required,
          MspValidators.msp,
        ]),
      })
    );
    this.operations.updateValueAndValidity();
    this.operations.markAsDirty();
  }

  public deleteOperation(index: number): void {
    this._dialogService
      .confirm('Warning', `Delete operation #${index + 1}?`)
      .pipe(take(1))
      .subscribe((ok: boolean) => {
        if (ok) {
          this.operations.removeAt(index);
          this.operations.updateValueAndValidity();
          this.operations.markAsDirty();
        }
      });
  }

  public clearOperations(): void {
    this._dialogService
      .confirm('Warning', 'Delete all the operations?')
      .pipe(take(1))
      .subscribe((ok: boolean) => {
        if (ok) {
          this.operations.clear();
          this.operations.updateValueAndValidity();
          this.operations.markAsDirty();
          this.currentOperationClosed();
        }
      });
  }

  public moveOperationUp(index: number): void {
    if (index < 1) {
      return;
    }
    const item = this.operations.controls[index];
    this.operations.removeAt(index);
    this.operations.insert(index - 1, item);
    this.operations.updateValueAndValidity();
    this.operations.markAsDirty();
  }

  public moveOperationDown(index: number): void {
    if (index + 1 >= this.operations.length) {
      return;
    }
    const item = this.operations.controls[index];
    this.operations.removeAt(index);
    this.operations.insert(index + 1, item);
    this.operations.updateValueAndValidity();
    this.operations.markAsDirty();
  }

  public editOperation(index: number): void {
    const form = this.operations.at(index) as FormGroup;
    this._currentOperationIndex = index;
    this.currentOperation =
      MspOperation.parse(form.controls['text'].value) || undefined;
  }

  public currentOperationSaved(operation: MspOperation): void {
    if (this._currentOperationIndex === -1) {
      return;
    }
    const form = this.operations.at(this._currentOperationIndex) as FormGroup;
    form.controls['text'].setValue(operation.toString());
    form.controls['text'].updateValueAndValidity();
    form.controls['text'].markAsDirty();
    this._currentOperationIndex = -1;
    this.currentOperation = undefined;
  }

  public currentOperationClosed(): void {
    this._currentOperationIndex = -1;
    this.currentOperation = undefined;
  }

  private getOperations(): string[] {
    const ops: string[] = [];

    for (let i = 0; i < this.operations.controls.length; i++) {
      const form = this.operations.at(i) as FormGroup;
      const op = MspOperation.parse(form.controls['text'].value);
      if (op) {
        ops.push(op.toString());
      }
    }

    return ops;
  }

  protected getValue(): OrthographyFragment {
    const fr = this.getEditedFragment() as OrthographyFragment;
    fr.standard = this.standard.value.trim();
    fr.operations = this.getOperations();
    return fr;
  }

  public autoAddOperations(): void {
    // we must have both A and B text
    if (!this.data?.baseText || !this.standard.value) {
      return;
    }

    // instantiate the diffing engine if required
    if (!this._differ) {
      this._differ = new diff_match_patch();
      this._adapter = new DifferResultToMspAdapter();
    }

    // set operations
    const result = this._differ.diff_main(
      this.data.baseText,
      this.standard.value
    );
    const ops = this._adapter!.adapt(result);

    this.operations.markAsDirty();
    this.operations.clear();
    for (const op of ops) {
      this.addOperation(op.toString());
    }
  }
}
