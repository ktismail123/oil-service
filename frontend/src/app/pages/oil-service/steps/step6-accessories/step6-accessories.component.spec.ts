import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step6AccessoriesComponent } from './step6-accessories.component';

describe('Step6AccessoriesComponent', () => {
  let component: Step6AccessoriesComponent;
  let fixture: ComponentFixture<Step6AccessoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step6AccessoriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step6AccessoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
