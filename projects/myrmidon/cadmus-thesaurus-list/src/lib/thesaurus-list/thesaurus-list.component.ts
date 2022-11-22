import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { DialogService } from '@myrmidon/ng-mat-tools';
import { AuthJwtService, User } from '@myrmidon/auth-jwt-login';
import { Thesaurus } from '@myrmidon/cadmus-core';
import { ThesaurusService, UserLevelService } from '@myrmidon/cadmus-api';

import { StatusState } from '@ngneat/elf-requests';
import { PaginationData } from '@ngneat/elf-pagination';

import { ThesaurusListRepository } from '../state/thesaurus-list.repository';

@Component({
  selector: 'cadmus-thesaurus-list',
  templateUrl: './thesaurus-list.component.html',
  styleUrls: ['./thesaurus-list.component.css'],
})
export class ThesaurusListComponent implements OnInit {
  public status$: Observable<StatusState>;
  public pagination$: Observable<PaginationData & { data: Thesaurus[] }>;
  public user?: User;
  public userLevel: number;

  constructor(
    private _repository: ThesaurusListRepository,
    private _thesaurusService: ThesaurusService,
    private _dialogService: DialogService,
    private _router: Router,
    private _authService: AuthJwtService,
    private _userLevelService: UserLevelService
  ) {
    this.userLevel = 0;
    this.status$ = _repository.status$;
    this.pagination$ = _repository.pagination$;
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

  public addThesaurus(): void {
    this._router.navigate(['/thesauri', 'new']);
  }

  public editThesaurus(thesaurus: Thesaurus): void {
    this._router.navigate(['/thesauri', thesaurus.id]);
  }

  public deleteThesaurus(thesaurus: Thesaurus): void {
    if (this.user?.roles.every((r) => r !== 'admin' && r !== 'editor')) {
      return;
    }

    this._dialogService
      .confirm('Confirm Deletion', `Delete thesaurus "${thesaurus.id}"?`)
      .pipe(take(1))
      .subscribe((yes: boolean) => {
        if (yes) {
          this._repository.deleteThesaurus(thesaurus.id);
        }
      });
  }
}
