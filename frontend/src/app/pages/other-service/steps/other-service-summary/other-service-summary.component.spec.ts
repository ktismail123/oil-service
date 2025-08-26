import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherServiceSummaryComponent } from './other-service-summary.component';

describe('OtherServiceSummaryComponent', () => {
  let component: OtherServiceSummaryComponent;
  let fixture: ComponentFixture<OtherServiceSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtherServiceSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtherServiceSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
