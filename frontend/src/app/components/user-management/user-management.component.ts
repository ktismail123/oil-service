import { Component, inject, OnInit, signal } from '@angular/core';
import {
  DataTableComponent,
  SearchData,
  TableEvent,
} from '../data-table/data-table.component';
import {
  ACTION_CONFIGS,
  ActionConfig,
  ButtonActions,
} from '../../models/action';
import { ApiService } from '../../services/api.service';
import { take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UserManagementModalComponent } from '../../modals/user-management-modal/user-management-modal.component';

@Component({
  selector: 'app-user-management',
  imports: [DataTableComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit {
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);

  users = signal<any[]>([]);
  filteredUsers = signal<any[]>(this.users());

  actionConfig: ActionConfig = ACTION_CONFIGS.EDIT_DELETE;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.apiService
      .getUsers()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.users.set(res.data);
          this.filteredUsers.set(res.data);
        },
      });
  }

  actionEvents(action: {
    event: ButtonActions;
    data?: any;
    customAction?: string;
  }) {

    if (action.event === 'add' || action.event === 'edit') {
      this.dialog
        .open(UserManagementModalComponent, {
          width: '500px',
          data: {
            mode: action.event,
            rowData: action?.data,
          },
        })
        .afterClosed()
        .subscribe({
          next: (res) => {
            this.loadUsers();
          },
        });
    }

    if (action.event === 'delete') {
      this.apiService.deleteUser(action.data?.id).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Successfully Deleetd');
            this.loadUsers();
          }
        },
      });
    }
  }

  onTableEvent(event: TableEvent) {
    switch (event.type) {
      case 'search':
        this.handleSearchEvent(event.data as SearchData);
        break;
    }
  }

  private handleSearchEvent(searchData: SearchData) {
    if (!searchData || !searchData.searchTerm?.trim()) {
      // empty search -> reset to original data
      this.filteredUsers.set(this.users());
      return;
    }

    const term = searchData.searchTerm.toLowerCase();
    this.filteredUsers.set(
      this.users().filter(
        (b) =>
          b.name.toLowerCase().includes(term) || 
          b.email.toLowerCase().includes(term) || 
          b.role.toLowerCase().includes(term) || 
          b.id.toString().includes(term)
      )
    );
  }
}
