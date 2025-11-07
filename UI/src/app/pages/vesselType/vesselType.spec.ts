import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VesselType } from './vesselType';

describe('VesselType', () => {
  let component: VesselType;
  let fixture: ComponentFixture<VesselType>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VesselType]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VesselType);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
