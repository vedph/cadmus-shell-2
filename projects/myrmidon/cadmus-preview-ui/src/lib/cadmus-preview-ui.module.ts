import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CadmusTextBlockViewModule } from '@myrmidon/cadmus-text-block-view';
import { CadmusApiModule } from '@myrmidon/cadmus-api';
import { NgMatToolsModule } from '@myrmidon/ng-mat-tools';
import { NgToolsModule } from '@myrmidon/ng-tools';

import { PartPreviewComponent } from './components/part-preview/part-preview.component';
import { TextPreviewComponent } from './components/text-preview/text-preview.component';

@NgModule({
  declarations: [PartPreviewComponent, TextPreviewComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    // material
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule,
    // Cadmus
    CadmusTextBlockViewModule,
    CadmusApiModule,
    NgToolsModule,
    NgMatToolsModule,
  ],
  exports: [PartPreviewComponent, TextPreviewComponent],
})
export class CadmusPreviewUiModule {}
