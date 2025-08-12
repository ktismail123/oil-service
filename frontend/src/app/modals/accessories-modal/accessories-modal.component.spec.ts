import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessoriesModalComponent } from './accessories-modal.component';

describe('AccessoriesModalComponent', () => {
  let component: AccessoriesModalComponent;
  let fixture: ComponentFixture<AccessoriesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessoriesModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccessoriesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
