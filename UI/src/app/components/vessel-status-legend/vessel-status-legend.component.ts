import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vessel-status-legend',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="legend-container" [class.collapsed]="isCollapsed">
      <div class="legend-header" (click)="toggleCollapse()">
        <span>Vessel Status Legend</span>
        <span class="toggle-icon">{{ isCollapsed ? '▲' : '▼' }}</span>
      </div>
      <div class="legend-content" *ngIf="!isCollapsed">
        <div class="legend-item" *ngFor="let status of statuses">
          <div class="status-indicator" [style.background-color]="status.color"></div>
          <div class="status-info">
            <div class="status-name">{{ status.name }}</div>
            <div class="status-description">{{ status.description }}</div>
          </div>
        </div>
        <div class="legend-footer">
          <small>Updates every 10 seconds</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .legend-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      border-radius: 8px;
      padding: 12px;
      min-width: 280px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      font-family: Arial, sans-serif;
      transition: all 0.3s ease;
    }

    .legend-container.collapsed {
      min-width: auto;
    }

    .legend-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      font-weight: bold;
      padding: 4px 0;
    }

    .legend-header:hover {
      color: #4CAF50;
    }

    .toggle-icon {
      font-size: 12px;
    }

    .legend-content {
      margin-top: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      gap: 10px;
    }

    .status-indicator {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      flex-shrink: 0;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
    }

    .status-info {
      flex: 1;
    }

    .status-name {
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 2px;
    }

    .status-description {
      font-size: 11px;
      color: #ccc;
      line-height: 1.3;
    }

    .legend-footer {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      text-align: center;
      color: #999;
    }

    .legend-footer small {
      font-size: 10px;
    }
  `]
})
export class VesselStatusLegendComponent {
  isCollapsed = false;

  statuses = [
    {
      name: 'Waiting',
      color: '#FFFF00',
      description: 'Awaiting dock assignment'
    },
    {
      name: 'Loading',
      color: '#00FF00',
      description: 'Currently loading cargo'
    },
    {
      name: 'Unloading',
      color: '#FF6600',
      description: 'Currently unloading cargo'
    },
    {
      name: 'In Progress',
      color: '#0099FF',
      description: 'Operations in progress'
    },
    {
      name: 'Completed',
      color: '#808080',
      description: 'Operations completed'
    }
  ];

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
