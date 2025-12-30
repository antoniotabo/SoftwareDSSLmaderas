import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturaList } from './factura-list';

describe('FacturaList', () => {
  let component: FacturaList;
  let fixture: ComponentFixture<FacturaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturaList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturaList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
