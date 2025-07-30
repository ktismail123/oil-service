import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step4OilTypeComponent } from './step4-oil-type.component';

describe('Step4OilTypeComponent', () => {
  let component: Step4OilTypeComponent;
  let fixture: ComponentFixture<Step4OilTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step4OilTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step4OilTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
