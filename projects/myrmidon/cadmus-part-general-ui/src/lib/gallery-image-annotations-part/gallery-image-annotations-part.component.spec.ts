import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryImageAnnotationsPartComponent } from './gallery-image-annotations-part.component';

describe('GalleryImageAnnotationsPartComponent', () => {
  let component: GalleryImageAnnotationsPartComponent;
  let fixture: ComponentFixture<GalleryImageAnnotationsPartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GalleryImageAnnotationsPartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GalleryImageAnnotationsPartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
