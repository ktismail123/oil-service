import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatteryBrandStepComponent } from './battery-brand-step.component';

describe('BatteryBrandStepComponent', () => {
  let component: BatteryBrandStepComponent;
  let fixture: ComponentFixture<BatteryBrandStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatteryBrandStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatteryBrandStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
