import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  Validators,
  FormGroup,
  UntypedFormGroup,
} from '@angular/forms';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

import { AuthJwtService } from '@myrmidon/auth-jwt-login';
import { EditedObject, ModelEditorComponentBase } from '@myrmidon/cadmus-ui';

import { WitnessesFragment, Witness } from '../witnesses-fragment';

@Component({
  selector: 'cadmus-witnesses-fragment',
  templateUrl: './witnesses-fragment.component.html',
  styleUrls: ['./witnesses-fragment.component.css'],
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
export class WitnessesFragmentComponent
  extends ModelEditorComponentBase<WitnessesFragment>
  implements OnInit
{
  public currentWitnessOpen?: boolean;
  public currentWitnessId?: string;
  public editorOptions = {
    theme: 'vs-light',
    language: 'markdown',
    wordWrap: 'on',
    // https://github.com/atularen/ngx-monaco-editor/issues/19
    automaticLayout: true,
  };

  public witnesses: FormControl;
  // single witness form
  public id: FormControl<string | null>;
  public citation: FormControl<string | null>;
  public text: FormControl<string | null>;
  public note: FormControl<string | null>;
  public witness: FormGroup;

  constructor(authService: AuthJwtService, formBuilder: FormBuilder) {
    super(authService, formBuilder);
    // form
    this.witnesses = formBuilder.control(null, Validators.required);

    // single witness form
    this.id = formBuilder.control(null, [
      Validators.required,
      Validators.maxLength(50),
    ]);
    this.citation = formBuilder.control(null, [
      Validators.required,
      Validators.maxLength(50),
    ]);
    this.text = formBuilder.control(null, Validators.required);
    this.note = formBuilder.control(null);
    this.witness = formBuilder.group({
      id: this.id,
      citation: this.citation,
      text: this.text,
      note: this.note,
    });
  }

  public override ngOnInit(): void {
    super.ngOnInit();
  }

  protected buildForm(formBuilder: FormBuilder): FormGroup | UntypedFormGroup {
    return formBuilder.group({
      witnesses: this.witnesses,
    });
  }

  public deleteWitness(index: number): void {
    const witnesses = [...(this.witnesses.value || [])];
    witnesses.splice(index, 1);
    this.witnesses.setValue(witnesses);
    this.witnesses.updateValueAndValidity();
    this.witnesses.markAsDirty();
  }

  public moveWitnessUp(index: number): void {
    const witnesses = [...(this.witnesses.value || [])];
    const w = witnesses[index];
    witnesses.splice(index, 1);
    witnesses.splice(index - 1, 0, w);
    this.witnesses.setValue(witnesses);
    this.witnesses.updateValueAndValidity();
    this.witnesses.markAsDirty();
  }

  public moveWitnessDown(index: number): void {
    const witnesses = [...(this.witnesses.value || [])];
    const w = witnesses[index];
    witnesses.splice(index, 1);
    witnesses.splice(index + 1, 0, w);
    this.witnesses.setValue(witnesses);
    this.witnesses.updateValueAndValidity();
    this.witnesses.markAsDirty();
  }

  public openCurrentWitness(witness?: Witness): void {
    if (!witness) {
      this.currentWitnessId = undefined;
      this.witness.reset();
    } else {
      this.currentWitnessId = witness.id;
      this.id.setValue(witness.id);
      this.citation.setValue(witness.citation);
      this.text.setValue(witness.text);
      this.note.setValue(witness.note || null);
      this.witness.markAsPristine();
    }
    this.currentWitnessOpen = true;
    this.witness.enable();
  }

  public closeCurrentWitness(): void {
    this.currentWitnessOpen = false;
    this.currentWitnessId = undefined;
    this.witness.disable();
  }

  public saveCurrentWitness(): void {
    if (!this.currentWitnessOpen || this.witness.invalid) {
      return;
    }
    const newWitness: Witness = {
      id: this.id.value?.trim() || '',
      citation: this.citation.value?.trim() || '',
      text: this.text.value?.trim() || '',
      note: this.note.value?.trim(),
    };
    const witnesses: Witness[] = [...(this.witnesses.value || [])];
    const i = witnesses.findIndex((w) => {
      return w.id === newWitness.id && w.citation === newWitness.citation;
    });
    if (i === -1) {
      witnesses.push(newWitness);
    } else {
      witnesses.splice(i, 1, newWitness);
    }
    this.witnesses.setValue(witnesses);
    this.witnesses.updateValueAndValidity();
    this.witnesses.markAsDirty();

    this.closeCurrentWitness();
  }

  private updateForm(fragment?: WitnessesFragment): void {
    if (!fragment) {
      this.form.reset();
      return;
    }
    this.witnesses.setValue(fragment.witnesses || []);
    this.witnesses.updateValueAndValidity();
    this.witnesses.markAsDirty();
    this.witness.reset();
    this.form.markAsPristine();
  }

  protected override onDataSet(data?: EditedObject<WitnessesFragment>): void {
    this.updateForm(data?.value);
  }

  protected getValue(): WitnessesFragment {
    const fr = this.getEditedFragment() as WitnessesFragment;
    fr.witnesses = this.witnesses.value;
    return fr;
  }
}
