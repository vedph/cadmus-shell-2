import { Component, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  UntypedFormGroup,
} from '@angular/forms';

import { NgToolsValidators } from '@myrmidon/ng-tools';
import { AuthJwtService } from '@myrmidon/auth-jwt-login';
import { EditedObject, ModelEditorComponentBase } from '@myrmidon/cadmus-ui';
import { ThesauriSet, ThesaurusEntry } from '@myrmidon/cadmus-core';
import {
  GalleryImage,
  GalleryImageAnnotation,
  GalleryOptions,
  GalleryService,
  IMAGE_GALLERY_OPTIONS_KEY,
  IMAGE_GALLERY_SERVICE_KEY,
} from '@myrmidon/cadmus-img-gallery';

import {
  GalleryImageAnnotationsPart,
  GALLERY_IMAGE_ANNOTATIONS_PART_TYPEID,
} from '../gallery-image-annotations-part';
import { take } from 'rxjs';

/**
 * GalleryImageAnnotationsPart editor component.
 * Thesauri: gallery-image-annotation-filters.
 */
@Component({
  selector: 'cadmus-gallery-image-annotations-part',
  templateUrl: './gallery-image-annotations-part.component.html',
  styleUrls: ['./gallery-image-annotations-part.component.css'],
})
export class GalleryImageAnnotationsPartComponent
  extends ModelEditorComponentBase<GalleryImageAnnotationsPart>
  implements OnInit
{
  public tabIndex: number;

  // gallery-image-annotation-filters
  public filterEntries: ThesaurusEntry[] | undefined;

  public image?: GalleryImage;
  public annotations: FormControl<GalleryImageAnnotation[]>;

  constructor(
    authService: AuthJwtService,
    formBuilder: FormBuilder,
    @Inject(IMAGE_GALLERY_SERVICE_KEY)
    private _galleryService: GalleryService,
    @Inject(IMAGE_GALLERY_OPTIONS_KEY)
    private _options: GalleryOptions
  ) {
    super(authService, formBuilder);
    this.tabIndex = 0;
    // form
    this.annotations = formBuilder.control([], {
      // at least 1 entry
      validators: NgToolsValidators.strictMinLengthValidator(1),
      nonNullable: true,
    });
  }

  public override ngOnInit(): void {
    super.ngOnInit();
  }

  protected buildForm(formBuilder: FormBuilder): FormGroup | UntypedFormGroup {
    return formBuilder.group({
      annotations: this.annotations,
    });
  }

  private updateThesauri(thesauri: ThesauriSet): void {
    const key = 'gallery-image-annotation-filters';
    if (this.hasThesaurus(key)) {
      this.filterEntries = thesauri[key].entries;
    } else {
      this.filterEntries = undefined;
    }
  }

  private updateForm(part?: GalleryImageAnnotationsPart | null): void {
    if (!part) {
      this.form.reset();
      return;
    }
    this.image = part.annotations?.length
      ? part.annotations[0].target
      : undefined;
    this.annotations.setValue(part.annotations || []);
    this.form.markAsPristine();
  }

  protected override onDataSet(
    data?: EditedObject<GalleryImageAnnotationsPart>
  ): void {
    // thesauri
    if (data?.thesauri) {
      this.updateThesauri(data.thesauri);
    }

    // form
    this.updateForm(data?.value);
  }

  protected getValue(): GalleryImageAnnotationsPart {
    let part = this.getEditedPart(
      GALLERY_IMAGE_ANNOTATIONS_PART_TYPEID
    ) as GalleryImageAnnotationsPart;
    part.annotations = this.annotations.value || [];
    return part;
  }

  public onImagePick(image: GalleryImage): void {
    // get the single image as we need the "full" size
    const options = { ...this._options, width: 600, height: 800 };

    this._galleryService
      .getImage(image.id, options)
      .pipe(take(1))
      .subscribe((image) => {
        this.image = image!;
      });
    this.tabIndex = 0;
  }

  public onAnnotationsChange(annotations: GalleryImageAnnotation[]): void {
    this.annotations.setValue(annotations);
    this.annotations.updateValueAndValidity();
    this.annotations.markAsDirty();
  }
}
