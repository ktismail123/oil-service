import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserManagementModalComponent } from './user-management-modal.component';

describe('UserManagementModalComponent', () => {
  let component: UserManagementModalComponent;
  let fixture: ComponentFixture<UserManagementModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserManagementModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserManagementModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
