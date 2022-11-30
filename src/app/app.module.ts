import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// material
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';

// vendor
import { devTools } from '@ngneat/elf-devtools';
import { Actions } from '@ngneat/effects-ng';

import { MonacoEditorModule } from 'ngx-monaco-editor';
import { MarkdownModule } from 'ngx-markdown';

// myrmidon
import { EnvServiceProvider, NgToolsModule } from '@myrmidon/ng-tools';
import { NgMatToolsModule } from '@myrmidon/ng-mat-tools';
import {
  AuthJwtInterceptor,
  AuthJwtLoginModule,
} from '@myrmidon/auth-jwt-login';
import { AuthJwtAdminModule } from '@myrmidon/auth-jwt-admin';

// cadmus bricks
import { CadmusRefsDocReferencesModule } from '@myrmidon/cadmus-refs-doc-references';
import { CadmusRefsHistoricalDateModule } from '@myrmidon/cadmus-refs-historical-date';
import { CadmusRefsAssertedIdsModule } from '@myrmidon/cadmus-refs-asserted-ids';
import { CadmusRefsLookupModule } from '@myrmidon/cadmus-refs-lookup';

// libraries in this workspace
// notice that when you import the libraries into another workspace, you must change
// these imports with @myrmidon/... rather than projects/myrmidon/... .
import { CadmusApiModule } from 'projects/myrmidon/cadmus-api/src/public-api';
import { CadmusCoreModule } from 'projects/myrmidon/cadmus-core/src/public-api';
import { CadmusProfileCoreModule } from 'projects/myrmidon/cadmus-profile-core/src/public-api';
import { CadmusStateModule } from 'projects/myrmidon/cadmus-state/src/public-api';
import { CadmusUiModule } from 'projects/myrmidon/cadmus-ui/src/public-api';
import { CadmusUiPgModule } from 'projects/myrmidon/cadmus-ui-pg/src/public-api';
// import { CadmusGraphPgModule } from 'projects/myrmidon/cadmus-graph-pg/src/public-api';
// import { CadmusGraphUiModule } from 'projects/myrmidon/cadmus-graph-ui/src/public-api';
// import { CadmusItemEditorModule } from 'projects/myrmidon/cadmus-item-editor/src/public-api';
// import { CadmusItemListModule } from 'projects/myrmidon/cadmus-item-list/src/public-api';
// import { CadmusItemSearchModule } from 'projects/myrmidon/cadmus-item-search/src/public-api';
// import { CadmusLayerDemoModule } from 'projects/myrmidon/cadmus-layer-demo/src/public-api';
// import { CadmusPartGeneralPgModule } from 'projects/myrmidon/cadmus-part-general-pg/src/public-api';
// import { CadmusPartGeneralUiModule } from 'projects/myrmidon/cadmus-part-general-ui/src/public-api';
// import { CadmusPartPhilologyUiModule } from 'projects/myrmidon/cadmus-part-philology-ui/src/public-api';
// import { CadmusPartPhilologyPgModule } from 'projects/myrmidon/cadmus-part-philology-pg/src/public-api';
// import { CadmusThesaurusEditorModule } from 'projects/myrmidon/cadmus-thesaurus-editor/src/public-api';
// import { CadmusThesaurusListModule } from 'projects/myrmidon/cadmus-thesaurus-list/src/public-api';
// import { CadmusThesaurusUiModule } from 'projects/myrmidon/cadmus-thesaurus-ui/src/public-api';

// locals
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { ManageUsersPageComponent } from './manage-users-page/manage-users-page.component';
import { RegisterUserPageComponent } from './register-user-page/register-user-page.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { PART_EDITOR_KEYS } from './part-editor-keys';
import { INDEX_LOOKUP_DEFINITIONS } from './index-lookup-definitions';
import { ITEM_BROWSER_KEYS } from './item-browser-keys';
import { CadmusTextBlockViewModule } from '@myrmidon/cadmus-text-block-view';

// https://ngneat.github.io/elf/docs/dev-tools/
export function initElfDevTools(actions: Actions) {
  return () => {
    devTools({
      name: 'Sample Application',
      actionsDispatcher: actions,
    });
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginPageComponent,
    ManageUsersPageComponent,
    RegisterUserPageComponent,
    ResetPasswordComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    // routing
    AppRoutingModule,
    // material
    DragDropModule,
    MatAutocompleteModule,
    MatBadgeModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    MatToolbarModule,
    MatTreeModule,
    // vendor
    MonacoEditorModule.forRoot(),
    MarkdownModule.forRoot(),
    // myrmidon
    NgToolsModule,
    NgMatToolsModule,
    AuthJwtLoginModule,
    AuthJwtAdminModule,
    // cadmus bricks
    CadmusRefsDocReferencesModule,
    CadmusRefsHistoricalDateModule,
    CadmusRefsLookupModule,
    CadmusRefsAssertedIdsModule,
    // - for preview:
    CadmusTextBlockViewModule,
    // cadmus
    CadmusApiModule,
    CadmusCoreModule,
    CadmusProfileCoreModule,
    CadmusStateModule,
    CadmusUiModule,
    CadmusUiPgModule,
    // CadmusGraphPgModule,
    // CadmusGraphUiModule,
    // CadmusItemEditorModule,
    // CadmusItemListModule,
    // CadmusItemSearchModule,
    // CadmusLayerDemoModule,
    // CadmusPartGeneralUiModule,
    // CadmusPartGeneralPgModule,
    // CadmusPartPhilologyUiModule,
    // CadmusPartPhilologyPgModule,
    // CadmusThesaurusEditorModule,
    // CadmusThesaurusListModule,
    // CadmusThesaurusUiModule,
  ],
  providers: [
    // environment service
    EnvServiceProvider,
    // parts and fragments type IDs to editor group keys mappings
    // https://github.com/nrwl/nx/issues/208#issuecomment-384102058
    // inject like: @Inject('partEditorKeys') partEditorKeys: PartEditorKeys
    {
      provide: 'partEditorKeys',
      useValue: PART_EDITOR_KEYS,
    },
    // index lookup definitions
    {
      provide: 'indexLookupDefinitions',
      useValue: INDEX_LOOKUP_DEFINITIONS,
    },
    // item browsers IDs to editor keys mappings
    // inject like: @Inject('itemBrowserKeys') itemBrowserKeys: { [key: string]: string }
    {
      provide: 'itemBrowserKeys',
      useValue: ITEM_BROWSER_KEYS,
    },
    // HTTP interceptor
    // https://medium.com/@ryanchenkie_40935/angular-authentication-using-the-http-client-and-http-interceptors-2f9d1540eb8
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthJwtInterceptor,
      multi: true,
    },
    // ELF dev tools
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initElfDevTools,
      deps: [Actions],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
