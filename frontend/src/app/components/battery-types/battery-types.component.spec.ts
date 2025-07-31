import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatteryTypesComponent } from './battery-types.component';

describe('BatteryTypesComponent', () => {
  let component: BatteryTypesComponent;
  let fixture: ComponentFixture<BatteryTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatteryTypesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatteryTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
