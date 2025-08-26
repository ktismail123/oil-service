import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherServiceComponent } from './other-service.component';

describe('OtherServiceComponent', () => {
  let component: OtherServiceComponent;
  let fixture: ComponentFixture<OtherServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtherServiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtherServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
