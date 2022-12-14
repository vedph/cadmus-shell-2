import { Component, Input, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { PaginationData } from '@ngneat/elf-pagination';
import { StatusState } from '@ngneat/elf-requests';

import { GraphService, NodeResult, NodeSourceType } from '@myrmidon/cadmus-api';
import { DialogService } from '@myrmidon/ng-mat-tools';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { NodeListRepository } from '../../state/graph-node-list.repository';

/**
 * List of graph nodes. This includes a graph node filter, a list, and a graph
 * editor.
 */
@Component({
  selector: 'cadmus-graph-node-list',
  templateUrl: './graph-node-list.component.html',
  styleUrls: ['./graph-node-list.component.css'],
})
export class GraphNodeListComponent implements OnInit {
  public editedNode?: NodeResult;
  public status$: Observable<StatusState>;
  public pagination$: Observable<PaginationData & { data: NodeResult[] }>;

  /**
   * The optional set of thesaurus entries for node's tags.
   */
  @Input()
  public tagEntries?: ThesaurusEntry[];

  constructor(
    private _repository: NodeListRepository,
    private _graphService: GraphService,
    private _dialogService: DialogService,
    private _snackbar: MatSnackBar
  ) {
    this.pagination$ = _repository.pagination$;
    this.status$ = _repository.status$;
  }

  ngOnInit(): void {}

  public pageChange(event: PageEvent): void {
    this._repository.loadPage(event.pageIndex + 1, event.pageSize);
  }

  public addNode(): void {
    this.editedNode = {
      uri: '',
      id: 0,
      sourceType: NodeSourceType.User,
      label: '',
    };
  }

  public editNode(node: NodeResult): void {
    this.editedNode = node;
  }

  public onNodeChange(node: NodeResult): void {
    this._graphService
      .addNode(node)
      .pipe(take(1))
      .subscribe({
        next: (n) => {
          this.editedNode = undefined;
          this._repository.clearCache();
          this._repository.loadPage(1);
          this._snackbar.open('Node saved', 'OK', {
            duration: 1500,
          });
        },
        error: (error) => {
          if (error) {
            console.error(JSON.stringify(error));
          }
          this._snackbar.open('Error saving node', 'OK');
        },
      });
  }

  public onEditorClose(): void {
    this.editedNode = undefined;
  }

  public deleteNode(node: NodeResult): void {
    this._dialogService
      .confirm('Delete Node', 'Delete node ' + node.label + '?')
      .pipe(take(1))
      .subscribe((yes) => {
        if (yes) {
          this._graphService
            .deleteNode(node.id)
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
                this._snackbar.open('Error deleting node', 'OK');
              },
            });
        }
      });
  }

  public clearCache(): void {
    this._repository.clearCache();
  }
}
