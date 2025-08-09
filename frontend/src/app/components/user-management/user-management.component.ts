import { Component, inject, OnInit, signal } from '@angular/core';
import { DataTableComponent } from '../data-table/data-table.component';
import { ACTION_CONFIGS, ActionConfig } from '../../models/action';
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

  actionConfig: ActionConfig = ACTION_CONFIGS.FULL;

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.apiService
      .getUsers()
      .pipe(take(1))
      .subscribe({
        next: (res) => [this.users.set(res.data)],
      });
  }

  actionEvents(action: {
    event: 'add' | 'edit' | 'view' | 'delete';
    data?: any;
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
                this.loadBrands();
              },
            });
        }
  }
}
