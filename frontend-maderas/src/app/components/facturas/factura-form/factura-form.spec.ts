import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturaForm } from './factura-form';

describe('FacturaForm', () => {
  let component: FacturaForm;
  let fixture: ComponentFixture<FacturaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturaForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturaForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
