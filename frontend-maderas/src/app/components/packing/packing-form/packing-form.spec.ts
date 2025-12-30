import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackingForm } from './packing-form';

describe('PackingForm', () => {
  let component: PackingForm;
  let fixture: ComponentFixture<PackingForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackingForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackingForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
