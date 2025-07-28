import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: string;
  count?: number;
  active?: boolean;
}

@Component({
  selector: 'app-side-bar',
  imports: [CommonModule, RouterModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
})
export class SideBarComponent {
  @Input() title = 'Control Panel';
  @Input() menuItems: SidebarMenuItem[] = [];
  @Input() collapsed = false;

  @Output() onMenuClick = new EventEmitter<string>();
  @Output() onToggle = new EventEmitter<boolean>();

  activeItem = signal<string>('');

  selectMenuItem(itemId: string) {
    this.activeItem.set(itemId);
    this.onMenuClick.emit(itemId);

    // Update active state in menu items
    this.menuItems.forEach((item) => {
      item.active = item.id === itemId;
    });
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
    this.onToggle.emit(this.collapsed);
  }
}
