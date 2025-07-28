import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-step-indicator',
  imports: [CommonModule],
  templateUrl: './step-indicator.component.html',
  styleUrl: './step-indicator.component.css',
})
export class StepIndicatorComponent {
  @Input() currentStep = 1;
  @Input() totalSteps = 1;
  @Input() title = '';
  @Input() steps: string[] = [];

  onStepClick(step: number) {
    // Emit event to parent component
  }
}
