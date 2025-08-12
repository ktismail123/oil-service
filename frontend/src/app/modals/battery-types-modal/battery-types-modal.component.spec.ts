import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatteryTypesModalComponent } from './battery-types-modal.component';

describe('BatteryTypesModalComponent', () => {
  let component: BatteryTypesModalComponent;
  let fixture: ComponentFixture<BatteryTypesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatteryTypesModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatteryTypesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
