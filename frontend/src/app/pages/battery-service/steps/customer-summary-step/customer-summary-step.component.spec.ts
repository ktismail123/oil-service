import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerSummaryStepComponent } from './customer-summary-step.component';

describe('CustomerSummaryStepComponent', () => {
  let component: CustomerSummaryStepComponent;
  let fixture: ComponentFixture<CustomerSummaryStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerSummaryStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerSummaryStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
