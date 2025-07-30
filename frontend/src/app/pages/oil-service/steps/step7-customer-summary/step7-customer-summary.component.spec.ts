import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step7CustomerSummaryComponent } from './step7-customer-summary.component';

describe('Step7CustomerSummaryComponent', () => {
  let component: Step7CustomerSummaryComponent;
  let fixture: ComponentFixture<Step7CustomerSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step7CustomerSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step7CustomerSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
