import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CadmusUiModule } from '@myrmidon/cadmus-ui';

import { KeywordsPartFeatureComponent } from './keywords-part-feature.component';
import { CurrentItemBarComponent } from '@myrmidon/cadmus-ui-pg';
import {
  KeywordsPartComponent,
  KEYWORDS_PART_TYPEID,
} from '@myrmidon/cadmus-part-general-ui';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CadmusCoreModule } from '@myrmidon/cadmus-core';

describe('KeywordsPartFeatureComponent', () => {
  let component: KeywordsPartFeatureComponent;
  let fixture: ComponentFixture<KeywordsPartFeatureComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        CadmusCoreModule,
        CadmusUiModule,
      ],
      // https://github.com/angular/components/issues/14668
      providers: [
        {
          provide: 'partEditorKeys',
          useValue: {
            [KEYWORDS_PART_TYPEID]: {
              part: 'general',
            },
          },
        },
        {
          provide: MatDialog,
          useValue: {
            open: (_: any) => {},
            closeAll: (): void => undefined,
          },
        },
        {
          provide: MatDialogRef,
          useValue: {
            close: (dialogResult: any) => {},
            afterClosed: () => {},
          },
        },
      ],
      declarations: [
        CurrentItemBarComponent,
        KeywordsPartComponent,
        KeywordsPartFeatureComponent,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KeywordsPartFeatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
