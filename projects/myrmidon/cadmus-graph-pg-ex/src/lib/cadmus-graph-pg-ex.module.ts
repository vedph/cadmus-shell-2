import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { NgMatToolsModule } from '@myrmidon/ng-mat-tools';
import { NgToolsModule } from '@myrmidon/ng-tools';
import { CadmusApiModule } from '@myrmidon/cadmus-api';
import { CadmusGraphUiModule } from '@myrmidon/cadmus-graph-ui';
import { CadmusGraphUiExModule } from '@myrmidon/cadmus-graph-ui-ex';
import { NgxGraphModule } from '@swimlane/ngx-graph';

import { GraphEditorExFeatureComponent } from './graph-editor-ex-feature/graph-editor-ex-feature.component';

// https://github.com/ng-packagr/ng-packagr/issues/778
export const RouterModuleForChild = RouterModule.forChild([
  {
    path: '',
    pathMatch: 'full',
    component: GraphEditorExFeatureComponent,
  },
]);

@NgModule({
  declarations: [GraphEditorExFeatureComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RouterModuleForChild,
    ReactiveFormsModule,
    // material
    MatCardModule,
    MatTabsModule,
    // vendor
    NgxGraphModule,
    // cadmus
    NgToolsModule,
    NgMatToolsModule,
    CadmusApiModule,
    CadmusGraphUiModule,
    CadmusGraphUiExModule,
  ],
  exports: [GraphEditorExFeatureComponent],
})
export class CadmusGraphPgExModule {}
