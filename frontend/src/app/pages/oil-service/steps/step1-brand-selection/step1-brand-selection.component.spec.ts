import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step1BrandSelectionComponent } from './step1-brand-selection.component';

describe('Step1BrandSelectionComponent', () => {
  let component: Step1BrandSelectionComponent;
  let fixture: ComponentFixture<Step1BrandSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step1BrandSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step1BrandSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
