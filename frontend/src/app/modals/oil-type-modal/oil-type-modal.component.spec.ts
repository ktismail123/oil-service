import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OilTypeModalComponent } from './oil-type-modal.component';

describe('OilTypeModalComponent', () => {
  let component: OilTypeModalComponent;
  let fixture: ComponentFixture<OilTypeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OilTypeModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OilTypeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
