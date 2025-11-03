import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Qualification } from './qualification';

describe('Qualification', () => {
  let component: Qualification;
  let fixture: ComponentFixture<Qualification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Qualification]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Qualification);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

