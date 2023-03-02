import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryImageAnnotationsPartFeatureComponent } from './gallery-image-annotations-part-feature.component';

describe('GalleryImageAnnotationsPartFeatureComponent', () => {
  let component: GalleryImageAnnotationsPartFeatureComponent;
  let fixture: ComponentFixture<GalleryImageAnnotationsPartFeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GalleryImageAnnotationsPartFeatureComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GalleryImageAnnotationsPartFeatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
