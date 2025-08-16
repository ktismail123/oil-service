// Action Configuration Interface

export type ButtonActions = 'add' | 'edit' | 'view' | 'delete' | 'custom';

export interface ActionConfig {
  // View Action
  showView?: boolean;
  viewIcon?: string;
  viewTitle?: string;
  
  // Edit Action
  showEdit?: boolean;
  editIcon?: string;
  editTitle?: string;
  
  // Delete Action
  showDelete?: boolean;
  deleteIcon?: string;
  deleteTitle?: string;
  
  // Custom Actions
  customActions?: CustomAction[];
  
  // Conditional Logic
  disableConditions?: {
    [actionKey: string]: (element: any) => boolean;
  };
}

export interface CustomAction {
  key: string;
  icon: string;
  title: string;
  class: string; // CSS class for styling
}

// Example configurations
export const ACTION_CONFIGS = {
  // Full actions (default)
  FULL: {
    showView: true,
    showEdit: true,
    showDelete: true
  },
  
  // Read-only mode
  READ_ONLY: {
    showView: true,
    showEdit: false,
    showDelete: false
  },
  
  // View and Edit only
  VIEW_EDIT: {
    showView: true,
    showEdit: true,
    showDelete: false
  },

  EDIT_DELETE: {
    showView: false,
    showEdit: true,
    showDelete: true
  },
  
  // Custom service actions
  SERVICE_ACTIONS: {
    showView: true,
    showEdit: true,
    showDelete: false,
    customActions: [
      {
        key: 'print',
        icon: 'print',
        title: 'Print Invoice',
        class: 'print-action'
      },
      {
        key: 'duplicate',
        icon: 'content_copy',
        title: 'Duplicate Service',
        class: 'duplicate-action'
      }
    ]
  },
  
  // User management actions
  USER_ACTIONS: {
    showView: true,
    showEdit: true,
    showDelete: true,
    customActions: [
      {
        key: 'reset-password',
        icon: 'lock_reset',
        title: 'Reset Password',
        class: 'reset-action'
      },
      {
        key: 'send-email',
        icon: 'email',
        title: 'Send Email',
        class: 'email-action'
      }
    ],
    disableConditions: {
      'delete': (element: any) => element.role === 'admin',
      'reset-password': (element: any) => !element.email
    }
  }
};

// Usage Examples in Parent Component

// import { ActionConfig, ACTION_CONFIGS } from './action-config.interface';

// @Component({...})
// export class YourParentComponent {
  
//   // Example 1: Default full actions
//   actionConfig1: ActionConfig = ACTION_CONFIGS.FULL;
  
//   // Example 2: Read-only table
//   actionConfig2: ActionConfig = ACTION_CONFIGS.READ_ONLY;
  
//   // Example 3: Custom configuration
//   actionConfig3: ActionConfig = {
//     showView: true,
//     showEdit: true,
//     showDelete: false, // Hide delete button
//     viewIcon: 'info',  // Custom icon
//     editTitle: 'Modify Record', // Custom tooltip
//     customActions: [
//       {
//         key: 'print',
//         icon: 'print',
//         title: 'Print Document',
//         class: 'print-action'
//       }
//     ]
//   };
  
//   // Example 4: Conditional actions based on user role
//   getUserActionConfig(): ActionConfig {
//     const userRole = this.getCurrentUserRole();
    
//     return {
//       showView: true,
//       showEdit: userRole === 'admin' || userRole === 'editor',
//       showDelete: userRole === 'admin',
//       disableConditions: {
//         'edit': (element) => element.status === 'completed',
//         'delete': (element) => element.isSystem === true
//       }
//     };
//   }
  
//   // Handle table actions
//   onTableAction(event: any) {
//     switch(event.event) {
//       case 'view':
//         this.viewRecord(event.data);
//         break;
//       case 'edit':
//         this.editRecord(event.data);
//         break;
//       case 'delete':
//         this.deleteRecord(event.data);
//         break;
//       case 'custom':
//         this.handleCustomAction(event.customAction, event.data);
//         break;
//       case 'status-change':
//         this.updateStatus(event.data);
//         break;
//     }
//   }
  
//   handleCustomAction(actionKey: string, data: any) {
//     switch(actionKey) {
//       case 'print':
//         this.printDocument(data);
//         break;
//       case 'duplicate':
//         this.duplicateRecord(data);
//         break;
//       case 'send-email':
//         this.sendEmail(data);
//         break;
//       // Add more custom actions as needed
//     }
//   }
// }

// Template usage examples:

// Example 1: Full actions (default)
/*
<app-enhanced-data-table
  [rowDatas]="serviceData"
  [displayedColumns]="displayedColumns"
  [showAddButton]="true"
  [actionConfig]="ACTION_CONFIGS.FULL"
  (addNew)="onTableAction($event)">
</app-enhanced-data-table>
*/

// Example 2: Read-only table
/*
<app-enhanced-data-table
  [rowDatas]="readOnlyData"
  [displayedColumns]="displayedColumns"
  [showAddButton]="false"
  [actionConfig]="ACTION_CONFIGS.READ_ONLY"
  (addNew)="onTableAction($event)">
</app-enhanced-data-table>
*/

// Example 3: Custom actions
/*
<app-enhanced-data-table
  [rowDatas]="serviceData"
  [displayedColumns]="displayedColumns"
  [showAddButton]="true"
  [actionConfig]="customActionConfig"
  (addNew)="onTableAction($event)">
</app-enhanced-data-table>
*/

// Example 4: No actions column at all
/*
<app-enhanced-data-table
  [rowDatas]="displayOnlyData"
  [displayedColumns]="displayedColumns"
  [showAddButton]="false"
  [actionConfig]="{ showView: false, showEdit: false, showDelete: false }"
  (addNew)="onTableAction($event)">
</app-enhanced-data-table>
*/