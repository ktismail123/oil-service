import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatteryServiceComponent } from './battery-service.component';

describe('BatteryServiceComponent', () => {
  let component: BatteryServiceComponent;
  let fixture: ComponentFixture<BatteryServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatteryServiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatteryServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
