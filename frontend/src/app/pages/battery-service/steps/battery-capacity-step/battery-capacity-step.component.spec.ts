import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatteryCapacityStepComponent } from './battery-capacity-step.component';

describe('BatteryCapacityStepComponent', () => {
  let component: BatteryCapacityStepComponent;
  let fixture: ComponentFixture<BatteryCapacityStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatteryCapacityStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatteryCapacityStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
