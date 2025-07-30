import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step5OilFilterComponent } from './step5-oil-filter.component';

describe('Step5OilFilterComponent', () => {
  let component: Step5OilFilterComponent;
  let fixture: ComponentFixture<Step5OilFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step5OilFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step5OilFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
