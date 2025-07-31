import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OilTypesListComponent } from './oil-types-list.component';

describe('OilTypesListComponent', () => {
  let component: OilTypesListComponent;
  let fixture: ComponentFixture<OilTypesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OilTypesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OilTypesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
