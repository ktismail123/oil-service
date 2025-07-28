import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBrandModalComponent } from './add-brand-modal.component';

describe('AddBrandModalComponent', () => {
  let component: AddBrandModalComponent;
  let fixture: ComponentFixture<AddBrandModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBrandModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddBrandModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
