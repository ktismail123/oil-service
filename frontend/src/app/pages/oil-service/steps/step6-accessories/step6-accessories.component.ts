import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Accessory } from '../../../../models';
import { NgFor, NgIf } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-step6-accessories',
  imports: [NgIf, NgFor, ReactiveFormsModule, ButtonComponent],
  templateUrl: './step6-accessories.component.html',
  styleUrl: './step6-accessories.component.scss',
})
export class Step6AccessoriesComponent {
  @Input() accessories: Accessory[] = [];
  @Input() selectedAccessories: Accessory[] = [];
  
  @Output() addAccessory = new EventEmitter<Accessory>();
  @Output() removeAccessory = new EventEmitter<number>();

  onAddAccessory(accessory: Accessory) {
    this.addAccessory.emit(accessory);
  }

  onRemoveAccessory(accessoryId: number) {
    this.removeAccessory.emit(accessoryId);
  }
}
