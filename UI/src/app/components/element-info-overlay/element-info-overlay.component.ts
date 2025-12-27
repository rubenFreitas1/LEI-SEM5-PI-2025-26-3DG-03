import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ElementInfoService, ElementInfo } from '../../services/element-info.service';

@Component({
  selector: 'app-element-info-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isVisible && elementInfo"
      class="info-overlay"
      [class.fade-in]="isVisible">
      <div class="info-header">
        <h3>{{ elementInfo.name }}</h3>
        <span class="info-type">{{ elementInfo.type }}</span>
      </div>
      
      <div class="info-body" (wheel)="onWheel($event)" (pointerdown)="$event.stopPropagation()" (touchmove)="$event.stopPropagation()">
        <div class="info-section">
          <h4>General Information</h4>
          <div class="info-item">
            <span class="label">Name:</span>
            <span class="value">{{ elementInfo.name }}</span>
          </div>
          <div class="info-item" *ngIf="elementInfo.description">
            <span class="label">Description:</span>
            <span class="value">{{ elementInfo.description }}</span>
          </div>
        </div>

        <!-- Vessel Section -->
        <div class="info-section" *ngIf="hasVesselInfo()">
          <h4>Vessel Information</h4>

          <!-- Vessel list navigation counter -->
          <div class="info-item" *ngIf="elementInfo.vesselsList && elementInfo.vesselsList.length > 0">
            <span class="label">Vessels:</span>
            <span class="value">{{ (elementInfo.currentVesselIndex || 0) + 1 }} / {{ elementInfo.vesselsList.length }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.imoNumber">
            <span class="label">IMO Number:</span>
            <span class="value">{{ elementInfo.imoNumber }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.operator">
            <span class="label">Operator:</span>
            <span class="value">{{ elementInfo.operator }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.vesselRecordId !== undefined">
            <span class="label">Vessel Record ID:</span>
            <span class="value">{{ elementInfo.vesselRecordId }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.vesselRecordLastModified">
            <span class="label">Last Modified (Vessel):</span>
            <span class="value">{{ elementInfo.vesselRecordLastModified }}</span>
          </div>

          <!-- VVN Information (Expected dates from approved notification) -->
          <h4 *ngIf="elementInfo.expectedArrivalDate || elementInfo.expectedDepartureDate" style="margin-top: 16px; font-size: 0.95em; color: rgba(255, 255, 255, 0.9);">Expected Schedule</h4>

          <div class="info-item" *ngIf="elementInfo.expectedArrivalDate">
            <span class="label">Expected Arrival:</span>
            <span class="value">{{ elementInfo.expectedArrivalDate }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.expectedDepartureDate">
            <span class="label">Expected Departure:</span>
            <span class="value">{{ elementInfo.expectedDepartureDate }}</span>
          </div>

          <!-- VVE Information -->
          <h4 *ngIf="elementInfo.vveCode" style="margin-top: 16px; font-size: 0.95em; color: rgba(255, 255, 255, 0.9);">Current Visit</h4>

          <div class="info-item" *ngIf="elementInfo.vveCode">
            <span class="label">VVE Code:</span>
            <span class="value">{{ elementInfo.vveCode }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.vveStatus">
            <span class="label">Visit Status:</span>
            <span class="value status" [class]="'status-' + (elementInfo.vveStatus ? elementInfo.vveStatus.toLowerCase() : '')">
              {{ elementInfo.vveStatus }}
            </span>
          </div>

          <div class="info-item" *ngIf="elementInfo.arrivalDate">
            <span class="label">Arrival Date:</span>
            <span class="value">{{ elementInfo.arrivalDate }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.departureDate">
            <span class="label">Departure Date:</span>
            <span class="value">{{ elementInfo.departureDate }}</span>
          </div>
        </div>

        <div class="info-section" *ngIf="hasTechnicalInfo()">
          <h4>Technical Details</h4>

          <!-- Vessel type technical details -->
          <div class="info-item" *ngIf="elementInfo.type === 'Vessel' && elementInfo.vesselType">
            <span class="label">Type:</span>
            <span class="value">{{ elementInfo.vesselType }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.type === 'Vessel' && elementInfo.vesselTypeId">
            <span class="label">Type ID:</span>
            <span class="value">{{ elementInfo.vesselTypeId }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.type === 'Vessel' && elementInfo.vesselTypeDescription">
            <span class="label">Type Description:</span>
            <span class="value">{{ elementInfo.vesselTypeDescription }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.type === 'Vessel' && elementInfo.currentCapacity !== undefined">
            <span class="label">Capacity:</span>
            <span class="value">{{ elementInfo.currentCapacity }} TEU</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.type === 'Vessel' && elementInfo.maxRows !== undefined">
            <span class="label">Max Rows:</span>
            <span class="value">{{ elementInfo.maxRows }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.type === 'Vessel' && elementInfo.maxBays !== undefined">
            <span class="label">Max Bays:</span>
            <span class="value">{{ elementInfo.maxBays }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.type === 'Vessel' && elementInfo.maxTiers !== undefined">
            <span class="label">Max Tiers:</span>
            <span class="value">{{ elementInfo.maxTiers }}</span>
          </div>

          <!-- Crane ID first when available -->
          <div class="info-item" *ngIf="elementInfo.craneId">
            <span class="label">ID:</span>
            <span class="value">{{ elementInfo.craneId }}</span>
          </div>

          <!-- Crane Code immediately after Crane ID -->
          <div class="info-item" *ngIf="elementInfo.craneId && elementInfo.craneCode">
            <span class="label">Crane Code:</span>
            <span class="value">{{ elementInfo.craneCode }}</span>
          </div>

          <!-- Dock ID when available -->
          <div class="info-item" *ngIf="elementInfo.dockId">
            <span class="label">ID:</span>
            <span class="value">{{ elementInfo.dockId }}</span>
          </div>

          <!-- Storage Area ID and Code first when available -->
          <div class="info-item" *ngIf="elementInfo.storageAreaId">
            <span class="label">ID:</span>
            <span class="value">{{ elementInfo.storageAreaId }}</span>
          </div>
          <div class="info-item" *ngIf="elementInfo.storageAreaId && elementInfo.code">
            <span class="label">Code:</span>
            <span class="value">{{ elementInfo.code }}</span>
          </div>
          
          <!-- Dock specific fields -->
          <div class="info-item" *ngIf="elementInfo.location">
            <span class="label">Location:</span>
            <span class="value">{{ elementInfo.location }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.length">
            <span class="label">Length:</span>
            <span class="value">{{ elementInfo.length }}m</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.depth">
            <span class="label">Depth:</span>
            <span class="value">{{ elementInfo.depth }}m</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.maxDraft">
            <span class="label">Max Draft:</span>
            <span class="value">{{ elementInfo.maxDraft }}m</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.vesselTypesAllowed">
            <span class="label">Vessel Types:</span>
            <span class="value">{{ elementInfo.vesselTypesAllowed }}</span>
          </div>

          <!-- Storage Area specific fields -->

          <div class="info-item" *ngIf="elementInfo.storageType">
            <span class="label">Type:</span>
            <span class="value">{{ elementInfo.storageType }}</span>
          </div>

          <!-- Crane specific fields -->
          <div class="info-item" *ngIf="elementInfo.cranesList && elementInfo.cranesList.length > 0">
            <span class="label">Cranes:</span>
            <span class="value">{{ (elementInfo.currentCraneIndex || 0) + 1 }} / {{ elementInfo.cranesList.length }}</span>
          </div>

          

          <div class="info-item" *ngIf="elementInfo.craneKind">
            <span class="label">Crane Type:</span>
            <span class="value">{{ elementInfo.craneKind }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.operationalCapacity !== undefined">
            <span class="label">Operational Capacity:</span>
            <span class="value">{{ elementInfo.operationalCapacity }} tons</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.setupTimeMinutes">
            <span class="label">Setup Time:</span>
            <span class="value">{{ elementInfo.setupTimeMinutes }} min</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.assignedDockName">
            <span class="label">Assigned Dock:</span>
            <span class="value">{{ elementInfo.assignedDockName }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.assignedStorageAreaCode">
            <span class="label">Assigned Storage Area:</span>
            <span class="value">{{ elementInfo.assignedStorageAreaCode }}</span>
          </div>

          <!-- Qualifications and last modified inline with technical details -->
          <div class="info-item" *ngIf="elementInfo.qualifications">
            <span class="label">Qualifications:</span>
            <span class="value">{{ elementInfo.qualifications }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.status">
            <span class="label">Status:</span>
            <span class="value status" [class]="'status-' + (elementInfo.status ? elementInfo.status.toLowerCase() : '')">
              {{ elementInfo.status }}
            </span>
          </div>

          <div class="info-item" *ngIf="elementInfo.lastModified">
            <span class="label">Last Modified:</span>
            <span class="value">{{ elementInfo.lastModified }}</span>
          </div>

          <!-- Crane navigation -->
          <div class="crane-navigation" *ngIf="elementInfo.cranesList && elementInfo.cranesList.length > 1">
            <button class="nav-button" (click)="previousCrane()" title="Previous crane">← Previous</button>
            <button class="nav-button" (click)="nextCrane()" title="Next crane">Next →</button>
          </div>
        </div>

        <!-- Vessel navigation placed after technical details, only for vessels -->
        <div class="crane-navigation" *ngIf="hasVesselInfo() && elementInfo.vesselsList && elementInfo.vesselsList.length > 1">
          <button class="nav-button" (click)="previousVessel()" title="Previous vessel">← Previous</button>
          <button class="nav-button" (click)="nextVessel()" title="Next vessel">Next →</button>
        </div>

        <div class="info-section" *ngIf="hasCapacityInfo()">
          <h4>Capacity</h4>

          <div class="info-item" *ngIf="elementInfo.currentCapacity !== undefined && !hasVesselInfo()">
            <span class="label">Current Capacity:</span>
            <span class="value">{{ elementInfo.currentCapacity }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.maxCapacity !== undefined">
            <span class="label">Max Capacity:</span>
            <span class="value">{{ elementInfo.maxCapacity }}</span>
          </div>

          <div class="info-item" *ngIf="elementInfo.utilization">
            <span class="label">Utilization:</span>
            <span class="value">{{ elementInfo.utilization }}</span>
          </div>
        </div>
      </div>

      <div class="info-footer">
        <small>Press 'i' to toggle this overlay</small>
      </div>
    </div>
  `,
  styles: [`
    .info-overlay {
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 20px;
      border-radius: 8px;
      min-width: 300px;
      max-width: 500px;
      width: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      z-index: 1000;
      pointer-events: none;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .info-header {
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-header h3 {
      margin: 0;
      font-size: 1.2em;
      font-weight: 600;
      color: #ffffff;
      word-break: break-word;
      max-width: 100%;
    }

    .info-type {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-body {
      max-height: 400px;
      overflow-y: auto;
      /* Create space between content and scrollbar */
      padding-right: 14px;
      /* Keep a consistent gutter so layout doesn't jump */
      scrollbar-gutter: stable;
      /* Allow interactions inside even if parent ignores pointer events */
      pointer-events: auto;
    }

    .info-body::-webkit-scrollbar {
      width: 8px;
    }

    .info-body::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    .info-body::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }

    .info-section {
      margin-bottom: 20px;
    }

    .info-section h4 {
      font-size: 1em;
      margin: 0 0 12px 0;
      color: #00bcd4;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
      line-height: 1.6;
    }

    .info-item .label {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
      margin-right: 12px;
      min-width: 130px;
      flex-shrink: 0;
    }

    .info-item .value {
      flex: 1;
      text-align: right;
      color: #ffffff;
      word-break: break-word;
    }

    .status {
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 0.9em;
    }

    /* Make status badge fit content and not stretch full width */
    .info-item .value.status {
      flex: 0 0 auto;
      display: inline-block;
      white-space: nowrap;
      align-self: center;
    }

    .status-operational,
    .status-available,
    .status-docked {
      background: rgba(76, 175, 80, 0.3);
      color: #4caf50;
    }

    .status-busy,
    .status-loading {
      background: rgba(255, 152, 0, 0.3);
      color: #ff9800;
    }

    .status-offline,
    .status-unavailable {
      background: rgba(244, 67, 54, 0.3);
      color: #f44336;
    }

    .restricted-section {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid rgba(0, 188, 212, 0.3);
    }

    .operations-list {
      list-style: none;
      padding: 0;
      margin: 4px 0 0 0;
      text-align: right;
    }

    .operations-list li {
      padding: 4px 0;
      color: rgba(255, 255, 255, 0.9);
    }

    .operations-list li:before {
      content: "• ";
      color: #00bcd4;
      font-weight: bold;
      margin-right: 6px;
    }

    .info-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
    }

    .info-footer small {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.8em;
    }

    .crane-navigation {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      justify-content: center;
    }

    .nav-button {
      padding: 6px 12px;
      background: rgba(0, 188, 212, 0.7);
      color: white;
      border: 1px solid rgba(0, 188, 212, 1);
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.2s ease;
      pointer-events: auto;
    }

    .nav-button:hover {
      background: rgba(0, 188, 212, 1);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 188, 212, 0.4);
    }

    .nav-button:active {
      transform: translateY(0);
    }
  `]
})
export class ElementInfoOverlayComponent implements OnInit, OnDestroy {
  isVisible = false;
  elementInfo: ElementInfo | null = null;

  private subscriptions: Subscription[] = [];

  constructor(private elementInfoService: ElementInfoService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.elementInfoService.isOverlayVisible().subscribe(visible => {
        this.isVisible = visible;
      }),
      this.elementInfoService.getElementInfo().subscribe(info => {
        this.elementInfo = info;
        if (info && info.type === 'Vessel') {
          console.log('[ElementInfoOverlay] Vessel info updated:', {
            vesselType: info.vesselType,
            vesselTypeId: info.vesselTypeId,
            capacity: info.currentCapacity,
            maxRows: info.maxRows,
            maxBays: info.maxBays,
            maxTiers: info.maxTiers,
            vesselTypeLastModified: info.vesselTypeLastModified,
            expectedArrivalDate: info.expectedArrivalDate,
            expectedDepartureDate: info.expectedDepartureDate,
            fullInfo: info
          });
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('document:keydown.i')
  handleKeyboardEvent() {
    this.elementInfoService.toggleOverlay();
  }

  hasTechnicalInfo(): boolean {
    if (!this.elementInfo) return false;
    // Show technical details when there is anything meaningful for the element type
    if (this.elementInfo.type === 'Vessel') {
      return !!(
        this.elementInfo.vesselType ||
        this.elementInfo.vesselTypeId ||
        this.elementInfo.vesselTypeDescription ||
        this.elementInfo.currentCapacity !== undefined ||
        this.elementInfo.maxRows !== undefined ||
        this.elementInfo.maxBays !== undefined ||
        this.elementInfo.maxTiers !== undefined ||
        this.elementInfo.vesselTypeLastModified
      );
    }

    // Docks, storage areas, cranes
    return !!(
      this.elementInfo.dockId !== undefined ||
      this.elementInfo.storageAreaId !== undefined ||
      this.elementInfo.code ||
      this.elementInfo.location ||
      this.elementInfo.length !== undefined ||
      this.elementInfo.depth !== undefined ||
      this.elementInfo.maxDraft !== undefined ||
      this.elementInfo.vesselTypesAllowed ||
      this.elementInfo.storageType ||
      this.elementInfo.craneId !== undefined ||
      this.elementInfo.craneCode ||
      this.elementInfo.craneKind ||
      this.elementInfo.operationalCapacity !== undefined ||
      this.elementInfo.setupTimeMinutes !== undefined ||
      this.elementInfo.assignedDockName ||
      this.elementInfo.assignedStorageAreaCode ||
      this.elementInfo.qualifications ||
      this.elementInfo.status ||
      this.elementInfo.lastModified
    );
  }

  hasRestrictedInfo(): boolean {
    if (!this.elementInfo) return false;
    return !!(
      this.elementInfo.status ||
      this.elementInfo.eta ||
      this.elementInfo.etd ||
      this.elementInfo.ongoingOperations ||
      this.elementInfo.currentCapacity !== undefined ||
      this.elementInfo.storageType ||
      this.elementInfo.location ||
      this.elementInfo.length ||
      this.elementInfo.depth ||
      this.elementInfo.maxDraft ||
      this.elementInfo.vesselTypesAllowed ||
      this.elementInfo.code ||
      this.elementInfo.utilization ||
      this.elementInfo.lastModified
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onWheel(event: WheelEvent) {
    // Allow scrolling within the overlay but prevent the 3D view from zooming
    event.stopPropagation();
  }

  hasVesselInfo(): boolean {
    if (!this.elementInfo) return false;
    // Only show vessel info if element type is Vessel AND has vessel-specific fields
    return this.elementInfo.type === 'Vessel' && !!(
      this.elementInfo.vesselsList ||
      this.elementInfo.imoNumber ||
      this.elementInfo.vesselType ||
      this.elementInfo.operator ||
      this.elementInfo.maxRows !== undefined ||
      this.elementInfo.maxBays !== undefined ||
      this.elementInfo.maxTiers !== undefined ||
      this.elementInfo.vveCode ||
      this.elementInfo.vveStatus ||
      this.elementInfo.arrivalDate ||
      this.elementInfo.departureDate
    );
  }

  hasCapacityInfo(): boolean {
    if (!this.elementInfo) return false;
    // Show capacity section only for storage areas (not vessels, not cranes)
    return this.elementInfo.type !== 'Vessel' && this.elementInfo.type !== 'Crane' && !!(
      this.elementInfo.currentCapacity !== undefined ||
      this.elementInfo.maxCapacity !== undefined ||
      this.elementInfo.utilization
    );
  }

  nextCrane() {
    this.elementInfoService.nextCrane();
  }

  previousCrane() {
    this.elementInfoService.previousCrane();
  }

  nextVessel() {
    this.elementInfoService.nextVessel();
  }

  previousVessel() {
    this.elementInfoService.previousVessel();
  }
}
