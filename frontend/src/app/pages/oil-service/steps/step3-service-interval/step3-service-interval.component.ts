import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { SearchPipe } from '../../../../pipes/search.pipe';

@Component({
  selector: 'app-step3-service-interval',
  imports: [NgIf, NgFor, ReactiveFormsModule, FormFieldComponent, FormsModule, SearchPipe],
  templateUrl: './step3-service-interval.component.html',
  styleUrl: './step3-service-interval.component.scss',
})
export class Step3ServiceIntervalComponent {
  @Input() intervalForm!: FormGroup;
  @Input() serviceIntervals: any[] = [];

  searchTerm: string = '';
  searchKeys: string[] = ['label'];
  

  @Output() intervalChange = new EventEmitter<void>();

  onIntervalChange() {
    this.intervalChange.emit();
  }
}
