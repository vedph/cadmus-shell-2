import { Component, Input, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { StatusState } from '@ngneat/elf-requests';
import { PaginationData } from '@ngneat/elf-pagination';

import {
  GraphService,
  ThesaurusService,
  TripleResult,
} from '@myrmidon/cadmus-api';
import { DialogService } from '@myrmidon/ng-mat-tools';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { GraphTripleListRepository } from '../../state/graph-triple-list.repository';

@Component({
  selector: 'cadmus-graph-triple-list',
  templateUrl: './graph-triple-list.component.html',
  styleUrls: ['./graph-triple-list.component.css'],
})
export class GraphTripleListComponent implements OnInit {
  public pagination$: Observable<PaginationData & { data: TripleResult[] }>;
  public status$: Observable<StatusState>;
  public editedTriple?: TripleResult;

  /**
   * The optional set of thesaurus entries for triple's tags.
   */
  @Input()
  public tagEntries: ThesaurusEntry[] | undefined;

  constructor(
    private _graphService: GraphService,
    private _dialogService: DialogService,
    private _snackbar: MatSnackBar,
    private _thesService: ThesaurusService,
    private _repository: GraphTripleListRepository
  ) {
    this.pagination$ = _repository.pagination$;
    this.status$ = _repository.status$;
  }

  ngOnInit(): void {
    this._thesService
      .getThesaurus('graph-triple-tags@en', true)
      .pipe(take(1))
      .subscribe((thesaurus) => {
        this.tagEntries = thesaurus?.entries || [];
      });
  }

  public pageChange(event: PageEvent): void {
    this._repository.loadPage(event.pageIndex + 1, event.pageSize);
  }

  public addTriple(): void {
    this.editedTriple = {
      id: 0,
      subjectId: 0,
      predicateId: 0,
      objectId: 0,
      subjectUri: '',
      predicateUri: '',
    };
  }

  public editTriple(triple: TripleResult): void {
    this.editedTriple = triple;
  }

  public onTripleChange(triple: TripleResult): void {
    this._graphService
      .addTriple(triple)
      .pipe(take(1))
      .subscribe({
        next: (n) => {
          this.editedTriple = undefined;
          this._repository.clearCache();
          this._repository.loadPage(1);
          this._snackbar.open('Triple saved', 'OK', {
            duration: 1500,
          });
        },
        error: (error) => {
          if (error) {
            console.error(JSON.stringify(error));
          }
          this._snackbar.open('Error saving triple', 'OK');
        },
      });
  }

  public onEditorClose(): void {
    this.editedTriple = undefined;
  }

  public deleteTriple(triple: TripleResult): void {
    this._dialogService
      .confirm('Delete Triple', 'Delete triple?')
      .pipe(take(1))
      .subscribe((yes) => {
        if (yes) {
          this._graphService
            .deleteTriple(triple.id)
            .pipe(take(1))
            .subscribe({
              next: (_) => {
                this._repository.clearCache();
                this._repository.loadPage(1);
              },
              error: (error) => {
                if (error) {
                  console.error(JSON.stringify(error));
                }
                this._snackbar.open('Error deleting triple', 'OK');
              },
            });
        }
      });
  }

  public clearCache(): void {
    this._repository.clearCache();
  }
}
