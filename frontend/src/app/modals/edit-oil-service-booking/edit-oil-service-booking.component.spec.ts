import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOilServiceBookingComponent } from './edit-oil-service-booking.component';

describe('EditOilServiceBookingComponent', () => {
  let component: EditOilServiceBookingComponent;
  let fixture: ComponentFixture<EditOilServiceBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditOilServiceBookingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditOilServiceBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
