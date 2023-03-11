import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MonacoEditorModule } from 'ngx-monaco-editor';
import { MarkdownModule } from 'ngx-markdown';

import { NgToolsModule } from '@myrmidon/ng-tools';
import { NgMatToolsModule } from '@myrmidon/ng-mat-tools';
import { CadmusCoreModule } from '@myrmidon/cadmus-core';
import { CadmusUiModule } from '@myrmidon/cadmus-ui';

// bricks
import { CadmusRefsAssertedIdsModule } from '@myrmidon/cadmus-refs-asserted-ids';
import { CadmusRefsDocReferencesModule } from '@myrmidon/cadmus-refs-doc-references';
import { CadmusRefsHistoricalDateModule } from '@myrmidon/cadmus-refs-historical-date';
import { CadmusRefsAssertedChronotopeModule } from '@myrmidon/cadmus-refs-asserted-chronotope';
import { CadmusRefsAssertionModule } from '@myrmidon/cadmus-refs-assertion';
import { CadmusRefsProperNameModule } from '@myrmidon/cadmus-refs-proper-name';

import { TokenTextPartComponent } from './token-text-part/token-text-part.component';
import { BibAuthorsEditorComponent } from './bib-authors-editor/bib-authors-editor.component';
import { BibliographyEntryComponent } from './bibliography-entry/bibliography-entry.component';
import { BibliographyPartComponent } from './bibliography-part/bibliography-part.component';
import { CategoriesPartComponent } from './categories-part/categories-part.component';
import { ChronologyFragmentComponent } from './chronology-fragment/chronology-fragment.component';
import { ChronotopesPartComponent } from './chronotopes-part/chronotopes-part.component';
import { CommentEditorComponent } from './comment-editor/comment-editor.component';
import { DocReferencesPartComponent } from './doc-references-part/doc-references-part.component';
import { ExternalIdsPartComponent } from './external-ids-part/external-ids-part.component';
import { HistoricalDatePartComponent } from './historical-date-part/historical-date-part.component';
import { HistoricalEventEditorComponent } from './historical-event-editor/historical-event-editor.component';
import { HistoricalEventsPartComponent } from './historical-events-part/historical-events-part.component';
import { IndexKeywordComponent } from './index-keyword/index-keyword.component';
import { IndexKeywordsPartComponent } from './index-keywords-part/index-keywords-part.component';
import { KeywordsPartComponent } from './keywords-part/keywords-part.component';
import { MetadataPartComponent } from './metadata-part/metadata-part.component';
import { NamesPartComponent } from './names-part/names-part.component';
import { NotePartComponent } from './note-part/note-part.component';
import { PinLinksPartComponent } from './pin-links-part/pin-links-part.component';
import { PinLinksFragmentComponent } from './pin-links-fragment/pin-links-fragment.component';
import { TextTileComponent } from './text-tile/text-tile.component';
import { TiledDataComponent } from './tiled-data/tiled-data.component';
import { TiledTextPartComponent } from './tiled-text-part/tiled-text-part.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MonacoEditorModule,
    MarkdownModule,
    // material
    DragDropModule,
    MatBadgeModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
    // cadmus
    NgToolsModule,
    NgMatToolsModule,
    CadmusCoreModule,
    CadmusUiModule,
    CadmusRefsAssertedIdsModule,
    CadmusRefsDocReferencesModule,
    CadmusRefsHistoricalDateModule,
    CadmusRefsAssertionModule,
    CadmusRefsAssertedChronotopeModule,
    CadmusRefsProperNameModule
  ],
  declarations: [
    BibAuthorsEditorComponent,
    BibliographyEntryComponent,
    BibliographyPartComponent,
    CategoriesPartComponent,
    ChronologyFragmentComponent,
    ChronotopesPartComponent,
    CommentEditorComponent,
    DocReferencesPartComponent,
    ExternalIdsPartComponent,
    HistoricalDatePartComponent,
    HistoricalEventEditorComponent,
    HistoricalEventsPartComponent,
    IndexKeywordComponent,
    IndexKeywordsPartComponent,
    KeywordsPartComponent,
    MetadataPartComponent,
    NamesPartComponent,
    NotePartComponent,
    PinLinksFragmentComponent,
    PinLinksPartComponent,
    TextTileComponent,
    TiledTextPartComponent,
    TiledDataComponent,
    TokenTextPartComponent,
  ],
  exports: [
    BibliographyPartComponent,
    CategoriesPartComponent,
    ChronologyFragmentComponent,
    CommentEditorComponent,
    ChronotopesPartComponent,
    DocReferencesPartComponent,
    ExternalIdsPartComponent,
    HistoricalDatePartComponent,
    HistoricalEventEditorComponent,
    HistoricalEventsPartComponent,
    IndexKeywordComponent,
    IndexKeywordsPartComponent,
    KeywordsPartComponent,
    MetadataPartComponent,
    NamesPartComponent,
    NotePartComponent,
    PinLinksFragmentComponent,
    PinLinksPartComponent,
    TiledDataComponent,
    TextTileComponent,
    TiledTextPartComponent,
    TokenTextPartComponent,
  ],
})
export class CadmusPartGeneralUiModule {}
