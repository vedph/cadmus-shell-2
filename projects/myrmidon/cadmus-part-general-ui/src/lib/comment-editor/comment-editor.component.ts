import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  Validators,
  FormArray,
  FormGroup,
  UntypedFormGroup,
} from '@angular/forms';

import {
  EditedObject,
  ModelEditorComponentBase,
  renderLabelFromLastColon,
} from '@myrmidon/cadmus-ui';
import { ThesauriSet, ThesaurusEntry } from '@myrmidon/cadmus-core';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';
import { DocReference } from '@myrmidon/cadmus-refs-doc-references';
import { AssertedId } from '@myrmidon/cadmus-refs-asserted-ids';

import { Comment, CommentPart, COMMENT_PART_TYPEID } from '../comment-part';
import { IndexKeyword } from '../index-keywords-part';
import { CommentFragment } from '../comment-fragment';

/**
 * Comment part/fragment editor component.
 * Thesauri: comment-tags, doc-reference-tags, doc-reference-types, comment-categories,
 * languages, keyword-indexes, keyword-tags, comment-id-scopes, comment-id-tags
 * (all optional).
 */
@Component({
  selector: 'cadmus-comment-editor',
  templateUrl: './comment-editor.component.html',
  styleUrls: ['./comment-editor.component.css'],
})
export class CommentEditorComponent
  extends ModelEditorComponentBase<CommentPart | CommentFragment>
  implements OnInit
{
  public tag: FormControl<string | null>;
  public text: FormControl<string | null>;
  public references: FormControl<DocReference[]>;
  public ids: FormControl<AssertedId[]>;
  public categories: FormControl<ThesaurusEntry[]>;
  public keywords: FormArray;

  // comment-tags
  public comTagEntries: ThesaurusEntry[] | undefined;
  // doc-reference-tags
  public docTagEntries: ThesaurusEntry[] | undefined;
  // doc-reference-types
  public docTypeEntries: ThesaurusEntry[] | undefined;
  // comment-categories
  public catEntries: ThesaurusEntry[] | undefined;
  // languages
  public langEntries: ThesaurusEntry[] | undefined;
  // keyword-indexes
  public idxEntries: ThesaurusEntry[] | undefined;
  // keyword-tags
  public keyTagEntries: ThesaurusEntry[] | undefined;
  // comment-id-scopes
  public idScopeEntries: ThesaurusEntry[] | undefined;
  // comment-id-tags
  public idTagEntries: ThesaurusEntry[] | undefined;
  // assertion-tags
  public assTagEntries: ThesaurusEntry[] | undefined;

  public editorOptions = {
    theme: 'vs-light',
    language: 'markdown',
    wordWrap: 'on',
    // https://github.com/atularen/ngx-monaco-editor/issues/19
    automaticLayout: true,
  };

  constructor(authService: AuthJwtService, formBuilder: FormBuilder) {
    super(authService, formBuilder);
    // form
    this.tag = formBuilder.control(null, Validators.maxLength(50));
    this.text = formBuilder.control(null, [
      Validators.required,
      Validators.maxLength(50000),
    ]);
    this.references = formBuilder.control([], { nonNullable: true });
    this.ids = formBuilder.control([], { nonNullable: true });
    this.categories = formBuilder.control([], { nonNullable: true });
    this.keywords = formBuilder.array([]);
  }

  public override ngOnInit(): void {
    super.ngOnInit();
  }

  protected buildForm(formBuilder: FormBuilder): FormGroup | UntypedFormGroup {
    return formBuilder.group({
      tag: this.tag,
      text: this.text,
      references: this.references,
      ids: this.ids,
      categories: this.categories,
      keywords: this.keywords,
    });
  }

  private updateThesauri(thesauri: ThesauriSet): void {
    let key = 'comment-tags';
    if (this.hasThesaurus(key)) {
      this.comTagEntries = thesauri[key].entries;
    } else {
      this.comTagEntries = undefined;
    }

    key = 'doc-reference-tags';
    if (this.hasThesaurus(key)) {
      this.docTagEntries = thesauri[key].entries;
    } else {
      this.docTagEntries = undefined;
    }

    key = 'doc-reference-types';
    if (this.hasThesaurus(key)) {
      this.docTypeEntries = thesauri[key].entries;
    } else {
      this.docTypeEntries = undefined;
    }

    key = 'comment-categories';
    if (this.hasThesaurus(key)) {
      this.catEntries = thesauri[key].entries;
    } else {
      this.catEntries = undefined;
    }

    key = 'languages';
    if (this.hasThesaurus(key)) {
      this.langEntries = thesauri[key].entries;
    } else {
      this.langEntries = undefined;
    }

    key = 'keyword-indexes';
    if (this.hasThesaurus(key)) {
      this.idxEntries = thesauri[key].entries;
    } else {
      this.idxEntries = undefined;
    }

    key = 'keyword-tags';
    if (this.hasThesaurus(key)) {
      this.keyTagEntries = thesauri[key].entries;
    } else {
      this.keyTagEntries = undefined;
    }

    key = 'comment-id-scopes';
    if (this.hasThesaurus(key)) {
      this.idScopeEntries = thesauri[key].entries;
    } else {
      this.idScopeEntries = undefined;
    }

    key = 'comment-id-tags';
    if (this.hasThesaurus(key)) {
      this.idTagEntries = thesauri[key].entries;
    } else {
      this.idTagEntries = undefined;
    }
  }

  private updateForm(comment?: CommentPart | CommentFragment | null): void {
    if (!comment) {
      this.form!.reset();
      return;
    }
    this.tag.setValue(comment.tag || null);
    this.text.setValue(comment.text);
    this.references.setValue(comment.references || []);
    this.ids.setValue(comment.externalIds || []);
    // keywords
    this.keywords.clear();
    if (comment.keywords?.length) {
      for (let keyword of comment.keywords) {
        this.keywords.controls.push(this.getKeywordGroup(keyword));
      }
    }
    // categories
    if (comment.categories?.length) {
      // map the category IDs to the corresponding thesaurus
      // entries, if any -- else just use the IDs
      const entries: ThesaurusEntry[] = comment.categories.map((id) => {
        const entry = this.catEntries?.find((e) => e.id === id);
        return entry
          ? entry
          : {
              id,
              value: id,
            };
      });
      // sort the entries by their display value
      entries.sort((a: ThesaurusEntry, b: ThesaurusEntry) => {
        return a.value.localeCompare(b.value);
      });
      // assign them to the control
      this.categories.setValue(entries || []);
    } else {
      this.categories.setValue([]);
    }

    this.form.markAsPristine();
  }

  protected override onDataSet(
    data?: EditedObject<CommentPart | CommentFragment>
  ): void {
    // thesauri
    if (data?.thesauri) {
      this.updateThesauri(data.thesauri);
    }

    // form
    this.updateForm(data?.value);
  }

  private updateComment(comment: Comment): void {
    comment.tag = this.tag.value?.trim();
    comment.text = this.text.value?.trim() || '';
    comment.references = this.references.value?.length
      ? this.references.value
      : undefined;
    comment.externalIds = this.ids.value?.length ? this.ids.value : undefined;
    comment.categories = this.categories.value?.length
      ? this.categories.value.map((entry: ThesaurusEntry) => {
          return entry.id;
        })
      : undefined;
    comment.keywords = this.getKeywords();
  }

  protected getValue(): CommentPart | CommentFragment {
    if ((this.data!.value as CommentFragment)?.location) {
      let fr = this.getEditedFragment() as CommentFragment;
      this.updateComment(fr);
      return fr;
    } else {
      let part = this.getEditedPart(COMMENT_PART_TYPEID) as CommentPart;
      this.updateComment(part);
      return part;
    }
  }

  public onReferencesChange(references: DocReference[]): void {
    this.references.setValue(references || []);
    this.references.updateValueAndValidity();
    this.references.markAsDirty();
    this.form!.markAsDirty();
  }

  public onIdsChange(ids: AssertedId[]): void {
    this.ids.setValue(ids || []);
    this.ids.updateValueAndValidity();
    this.ids.markAsDirty();
    this.form!.markAsDirty();
  }

  //#region Categories
  public onCategoryChange(entry: ThesaurusEntry): void {
    // add the new entry unless already present
    if (this.categories.value?.some((e: ThesaurusEntry) => e.id === entry.id)) {
      return;
    }
    const entries: ThesaurusEntry[] = Object.assign(
      [],
      this.categories.value || []
    );
    entries.push(entry);

    // sort the entries by their display value
    entries.sort((a: ThesaurusEntry, b: ThesaurusEntry) => {
      return a.value.localeCompare(b.value);
    });

    // assign to the categories control
    this.categories.setValue(entries);
    this.categories.updateValueAndValidity();
    this.categories.markAsDirty();
  }

  public removeCategory(index: number): void {
    const entries = Object.assign([], this.categories.value);
    entries.splice(index, 1);
    this.categories.setValue(entries);
    this.categories.updateValueAndValidity();
    this.categories.markAsDirty();
  }

  public renderLabel(label: string): string {
    return renderLabelFromLastColon(label);
  }
  //#endregion

  //#region Keywords
  private getKeywordGroup(keyword?: IndexKeyword): FormGroup {
    return this.formBuilder.group({
      indexId: this.formBuilder.control(
        keyword?.indexId,
        Validators.maxLength(50)
      ),
      tag: this.formBuilder.control(keyword?.tag, Validators.maxLength(50)),
      language: this.formBuilder.control(keyword?.language, [
        Validators.required,
        Validators.maxLength(50),
      ]),
      value: this.formBuilder.control(keyword?.value, [
        Validators.required,
        Validators.maxLength(50),
      ]),
      note: this.formBuilder.control(keyword?.note, Validators.maxLength(500)),
    });
  }

  public addKeyword(keyword?: IndexKeyword): void {
    this.keywords.push(this.getKeywordGroup(keyword));
    this.keywords.markAsDirty();
  }

  public removeKeyword(index: number): void {
    this.keywords.removeAt(index);
    this.keywords.markAsDirty();
  }

  public moveKeywordUp(index: number): void {
    if (index < 1) {
      return;
    }
    const keyword = this.keywords.controls[index];
    this.keywords.removeAt(index);
    this.keywords.insert(index - 1, keyword);
    this.keywords.markAsDirty();
  }

  public moveKeywordDown(index: number): void {
    if (index + 1 >= this.keywords.length) {
      return;
    }
    const keyword = this.keywords.controls[index];
    this.keywords.removeAt(index);
    this.keywords.insert(index + 1, keyword);
    this.keywords.markAsDirty();
  }

  private getKeywords(): IndexKeyword[] | undefined {
    const entries: IndexKeyword[] = [];
    for (let i = 0; i < this.keywords.length; i++) {
      const g = this.keywords.at(i) as FormGroup;
      entries.push({
        indexId: g.controls['indexId'].value?.trim(),
        tag: g.controls['tag'].value?.trim(),
        language: g.controls['language'].value?.trim(),
        value: g.controls['value'].value?.trim(),
        note: g.controls['note'].value?.trim(),
      });
    }
    return entries.length ? entries : undefined;
  }
  //#endregion
}
