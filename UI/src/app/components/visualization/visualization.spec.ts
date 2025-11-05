import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortVisualizationComponent } from './visualization';

describe('PortVisualizationComponent', () => {
  let component: PortVisualizationComponent;
  let fixture: ComponentFixture<PortVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PortVisualizationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PortVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
