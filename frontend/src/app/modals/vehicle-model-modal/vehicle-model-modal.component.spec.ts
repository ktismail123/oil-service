import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleModelModalComponent } from './vehicle-model-modal.component';

describe('VehicleModelModalComponent', () => {
  let component: VehicleModelModalComponent;
  let fixture: ComponentFixture<VehicleModelModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleModelModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleModelModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
