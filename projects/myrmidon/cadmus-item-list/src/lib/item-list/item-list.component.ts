import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Observable } from 'rxjs';

import { PaginationData } from '@ngneat/elf-pagination';
import { StatusState } from '@ngneat/elf-requests';

import { ItemInfo } from '@myrmidon/cadmus-core';

import { DialogService } from '@myrmidon/ng-mat-tools';
import { AuthJwtService, User } from '@myrmidon/auth-jwt-login';
import { UserLevelService } from '@myrmidon/cadmus-api';
import { AppProps, AppRepository } from '@myrmidon/cadmus-state';

import { ItemListRepository } from '../state/item-list.repository';

@Component({
  selector: 'cadmus-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.css'],
})
export class ItemListComponent implements OnInit {
  public status$: Observable<StatusState>;
  public pagination$: Observable<PaginationData & { data: ItemInfo[] }>;
  public app: AppProps;

  public user?: User;
  public userLevel: number;

  constructor(
    private _repository: ItemListRepository,
    private _dialogService: DialogService,
    private _router: Router,
    private _authService: AuthJwtService,
    private _userLevelService: UserLevelService,
    appRepository: AppRepository
  ) {
    this.userLevel = 0;
    this.status$ = _repository.status$;
    this.pagination$ = _repository.pagination$;
    this.app = appRepository.getValue();
  }

  public ngOnInit(): void {
    this._authService.currentUser$.subscribe((user: User | null) => {
      this.user = user ?? undefined;
      this.userLevel = this._userLevelService.getCurrentUserLevel();
    });
  }

  public pageChange(event: PageEvent): void {
    this._repository.loadPage(event.pageIndex + 1, event.pageSize);
  }

  public addItem(): void {
    this._router.navigate(['/items', 'new']);
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
      .subscribe((yes: boolean) => {
        if (yes) {
          this._repository.deleteItem(item.id);
        }
      });
  }

  public clearCache(): void {
    this._repository.clearCache();
    this._repository.loadPage(1);
  }
}
