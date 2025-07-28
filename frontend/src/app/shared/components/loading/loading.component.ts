import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center" [class]="containerClass">
      <div class="animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
           [class]="spinnerClass">
      </div>
      <span *ngIf="text" class="ml-3 text-gray-600">{{ text }}</span>
    </div>
  `
})
export class LoadingComponent {
  @Input() text = '';
  @Input() containerClass = 'p-8';
  @Input() spinnerClass = 'h-8 w-8';
}