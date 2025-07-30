import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step3ServiceIntervalComponent } from './step3-service-interval.component';

describe('Step3ServiceIntervalComponent', () => {
  let component: Step3ServiceIntervalComponent;
  let fixture: ComponentFixture<Step3ServiceIntervalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step3ServiceIntervalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step3ServiceIntervalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
