import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OilServiceComponent } from './oil-service.component';

describe('OilServiceComponent', () => {
  let component: OilServiceComponent;
  let fixture: ComponentFixture<OilServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OilServiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OilServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
