import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OilFilterModalComponent } from './oil-filter-modal.component';

describe('OilFilterModalComponent', () => {
  let component: OilFilterModalComponent;
  let fixture: ComponentFixture<OilFilterModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OilFilterModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OilFilterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
