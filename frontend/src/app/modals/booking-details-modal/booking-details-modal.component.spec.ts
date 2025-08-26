import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingDetailsModalComponent } from './booking-details-modal.component';

describe('BookingDetailsModalComponent', () => {
  let component: BookingDetailsModalComponent;
  let fixture: ComponentFixture<BookingDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingDetailsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
