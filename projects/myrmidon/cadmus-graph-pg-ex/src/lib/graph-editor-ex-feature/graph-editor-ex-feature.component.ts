import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';

import { UriNode, ThesaurusService } from '@myrmidon/cadmus-api';
import { ThesauriSet, ThesaurusEntry } from '@myrmidon/cadmus-core';
import { Node as GraphNode } from '@swimlane/ngx-graph';
import { WalkerNodeData } from '@myrmidon/cadmus-graph-ui-ex';

const TAB_NODES = 0;
const TAB_WALKER = 2;

@Component({
  selector: 'cadmus-graph-editor-ex-feature',
  templateUrl: './graph-editor-ex-feature.component.html',
  styleUrls: ['./graph-editor-ex-feature.component.css'],
})
export class GraphEditorExFeatureComponent implements OnInit {
  public nodeTagEntries?: ThesaurusEntry[];
  public tripleTagEntries?: ThesaurusEntry[];

  public tabIndex: number;
  public editedNode?: UriNode;
  public walkerNodeId: number;

  constructor(private _thesService: ThesaurusService) {
    this.tabIndex = 0;
    this.walkerNodeId = 0;
  }

  ngOnInit(): void {
    this._thesService
      .getThesauriSet(['graph-node-tags', 'graph-triple-tags'])
      .pipe(take(1))
      .subscribe({
        next: (set: ThesauriSet) => {
          this.nodeTagEntries = set['graph-node-tags']?.entries;
          this.tripleTagEntries = set['graph-triple-tags']?.entries;
        },
        error: (error) => {
          if (error) {
            console.error(JSON.stringify(error));
          }
        },
      });
  }

  public onNodeWalk(node: UriNode): void {
    this.walkerNodeId = node.id;
    this.tabIndex = TAB_WALKER;
  }

  private getNodeNumericId(id: string): number {
    const i = id.indexOf('N');
    return i === -1 ? 0 : +id.substring(i + 1);
  }

  public onWalkerNodePick(node: GraphNode) {
    const data = node.data as WalkerNodeData;
    if (!data) {
      return;
    }
    this.tabIndex = TAB_NODES;
    this.editedNode = {
      id: this.getNodeNumericId(node.id),
      isClass: data.isClass,
      label: node.label || node.id,
      sourceType: data.sourceType,
      tag: data.tag,
      sid: data.sid,
      uri: data.uri
    }
  }
}
