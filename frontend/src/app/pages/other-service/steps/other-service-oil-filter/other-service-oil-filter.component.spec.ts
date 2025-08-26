import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherServiceOilFilterComponent } from './other-service-oil-filter.component';

describe('OtherServiceOilFilterComponent', () => {
  let component: OtherServiceOilFilterComponent;
  let fixture: ComponentFixture<OtherServiceOilFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtherServiceOilFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtherServiceOilFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
