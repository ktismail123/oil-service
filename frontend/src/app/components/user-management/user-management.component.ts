import { Component, inject, OnInit, signal } from '@angular/core';
import { DataTableComponent } from '../data-table/data-table.component';
import { ACTION_CONFIGS, ActionConfig, ButtonActions } from '../../models/action';
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

  actionConfig: ActionConfig = {
    showView: false,
    showEdit: true,
    showDelete: true, // Hide delete button
    viewIcon: 'info',  // Custom icon
    editTitle: 'Modify Record', // Custom tooltip
    customActions: [
      {
        key: 'reset',
        icon: 'settings',
        title: 'Reser Password',
        class: 'print-action'
      }
    ]
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.apiService
      .getUsers()
      .pipe(take(1))
      .subscribe({
        next: (res) => [this.users.set(res.data)],
      });
  }

  actionEvents(action: {
    event: ButtonActions
    data?: any;
    customAction?: string
  }) {
    console.log(action);
    
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
}
