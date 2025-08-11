import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessoriesStepComponent } from './accessories-step.component';

describe('AccessoriesStepComponent', () => {
  let component: AccessoriesStepComponent;
  let fixture: ComponentFixture<AccessoriesStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessoriesStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccessoriesStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
