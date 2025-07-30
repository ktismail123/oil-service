import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step2ModelSelectionComponent } from './step2-model-selection.component';

describe('Step2ModelSelectionComponent', () => {
  let component: Step2ModelSelectionComponent;
  let fixture: ComponentFixture<Step2ModelSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step2ModelSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step2ModelSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
