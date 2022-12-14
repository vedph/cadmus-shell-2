import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { DialogService } from '@myrmidon/ng-mat-tools';
import { AuthJwtService, User } from '@myrmidon/auth-jwt-login';
import { ItemInfo } from '@myrmidon/cadmus-core';
import { UserLevelService } from '@myrmidon/cadmus-api';
import { AppProps, AppRepository } from '@myrmidon/cadmus-state';

import { PaginationData } from '@ngneat/elf-pagination';

import { ItemSearchRepository } from '../state/item-search.repository';

@Component({
  selector: 'cadmus-item-search',
  templateUrl: './item-search.component.html',
  styleUrls: ['./item-search.component.css'],
})
export class ItemSearchComponent implements OnInit {
  public query$: Observable<string | undefined>;
  public pagination$: Observable<PaginationData & { data: ItemInfo[] }>;
  public user?: User;
  public userLevel: number;
  public loading$: Observable<boolean>;
  public error$: Observable<string | undefined>;
  public lastQueries$: Observable<string[]>;
  public app: AppProps;

  constructor(
    private _repository: ItemSearchRepository,
    private _dialogService: DialogService,
    private _router: Router,
    private _authService: AuthJwtService,
    private _userLevelService: UserLevelService,
    appRepository: AppRepository
  ) {
    this.userLevel = 0;
    this.pagination$ = this._repository.pagination$;
    this.query$ = this._repository.query$;
    this.lastQueries$ = this._repository.lastQueries$;
    this.error$ = this._repository.error$;
    this.loading$ = this._repository.loading$;
    this.app = appRepository.getValue();
  }

  ngOnInit(): void {
    this._authService.currentUser$.subscribe((user: User | null) => {
      this.user = user ?? undefined;
      this.userLevel = this._userLevelService.getCurrentUserLevel();
    });
  }

  public pageChange(event: PageEvent): void {
    this._repository.loadPage(event.pageIndex + 1, event.pageSize);
  }

  public submitQuery(query: string): void {
    if (!query) {
      return;
    }
    this._repository.addQuery(query);
    this._repository.setQuery(query);
  }

  public editItem(item: ItemInfo): void {
    this._router.navigate(['/items', item.id]);
  }

  public deleteItem(item: ItemInfo): void {
    if (this.user?.roles.every((r) => r !== 'admin' && r !== 'editor')) {
      return;
    }

    this._dialogService
      .confirm('Confirm Deletion', `Delete item "${item.title}"?`)
      .pipe(take(1))
      .subscribe((yes: boolean) => {
        if (!yes) {
          return;
        }
        this._repository.deleteItem(item.id);
      });
  }

  public clearCache(): void {
    this._repository.clearCache();
  }
}
