import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OilFiltersComponent } from './oil-filters.component';

describe('OilFiltersComponent', () => {
  let component: OilFiltersComponent;
  let fixture: ComponentFixture<OilFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OilFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OilFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
