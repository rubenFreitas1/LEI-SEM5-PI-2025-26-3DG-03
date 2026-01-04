import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PickableObject } from '../threejs/object-picker';
import { PermissionService } from './permission.service';
import { DocksService } from './docks.service';
import { StorageAreaService } from './storageArea.service';
import { PhysicalResourcesService } from './physicalResources.service';
import { PhysicalResourceKind } from '../models/physicalResources.model';
import { firstValueFrom } from 'rxjs';
import { VesselService } from './vessel.service';
import { VesselVisitExecutionService } from '../services-oem/vesselVisitExecution.service';
import { VesselVisitNotificationService } from './vesselVisitNotification.service';

export interface ElementInfo {
  name: string;
  type: string;
  description?: string;
  // Restricted info (only for PortAuthority or LogisticOperator)
  status?: string;
  eta?: string;
  etd?: string;
  ongoingOperations?: string[];
  currentCapacity?: number;
  maxCapacity?: number;
  // Dock specific
  location?: string;
  length?: number;
  depth?: number;
  maxDraft?: number;
  vesselTypesAllowed?: string;
  // Storage Area specific
  code?: string;
  storageType?: string;
  utilization?: string;
  // Dock specific (id)
  dockId?: number;
  // Storage Area specific (id)
  storageAreaId?: number;
  // Crane specific
  craneId?: number;
  craneCode?: string;
  craneKind?: string;
  operationalCapacity?: number;
  setupTimeMinutes?: number;
  assignedDockName?: string;
  assignedStorageAreaCode?: string;
  qualifications?: string;
  // Crane list navigation
  cranesList?: any[];
  currentCraneIndex?: number;
  // Vessel specific
  imoNumber?: string;
  vesselRecordId?: number;
  vesselType?: string;
  vesselTypeId?: number;
  vesselTypeDescription?: string;
  operator?: string;
  vesselRecordLastModified?: string;
  maxRows?: number;
  maxBays?: number;
  maxTiers?: number;
  vesselTypeLastModified?: string;
  // VVE specific
  vveCode?: string;
  vveStatus?: string;
  arrivalDate?: string;
  departureDate?: string;
  // VVN specific (approved notifications)
  expectedArrivalDate?: string;
  expectedDepartureDate?: string;
  // Vessel list navigation
  vesselsList?: any[];
  currentVesselIndex?: number;
  // Warnings
  craneWarning?: string;
  vesselVisitWarning?: string;
  // Common
  lastModified?: string;
  // Vessel operational status
  operationalStatus?: string;
  operationalStatusDescription?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ElementInfoService {
  private currentElement$ = new BehaviorSubject<PickableObject | null>(null);
  private elementInfo$ = new BehaviorSubject<ElementInfo | null>(null);
  private overlayVisible$ = new BehaviorSubject<boolean>(false);
  private loadingCounter = 0; // Track loading operations

  constructor(
    private permissionService: PermissionService,
    private docksService: DocksService,
    private storageAreaService: StorageAreaService,
    private physicalResourcesService: PhysicalResourcesService,
    private vesselService: VesselService,
    private vesselVisitExecutionService: VesselVisitExecutionService,
    private vesselVisitNotificationService: VesselVisitNotificationService
  ) {}

  setCurrentElement(element: PickableObject | null) {
    console.log('[setCurrentElement] Called with:', element?.type, element?.name);
    this.currentElement$.next(element);
    if (element) {
      // Don't clear elementInfo to prevent overlay flicker
      // Just load new info - it will replace the old one
      this.loadElementInfo(element);
    } else {
      this.elementInfo$.next(null);
    }
  }

  toggleOverlay() {
    const current = this.overlayVisible$.value;
    const newState = !current;
    this.overlayVisible$.next(newState);

    // Reload element info when opening overlay to get fresh data
    if (newState && this.currentElement$.value) {
      this.loadElementInfo(this.currentElement$.value);
    }
  }

  isOverlayVisible(): Observable<boolean> {
    return this.overlayVisible$.asObservable();
  }

  getElementInfo(): Observable<ElementInfo | null> {
    return this.elementInfo$.asObservable();
  }

  private async loadElementInfo(element: PickableObject) {
    // Increment counter to track this loading operation
    const currentLoadId = ++this.loadingCounter;
    console.log('[loadElementInfo] Starting load #', currentLoadId, 'for', element.type, element.name);

    const userRole = this.permissionService.getRole();
    const canSeeRestrictedInfo =
      userRole === 'PortAuthorityOfficer' ||
      userRole === 'LogisticOperator' ||
      userRole === 'Admin';

    console.log('[ElementInfo Debug]', {
      loadId: currentLoadId,
      userRole,
      canSeeRestrictedInfo,
      elementType: element.type,
      elementName: element.name,
      elementUserData: (element as any).userData
    });

    let info: ElementInfo = {
      name: element.name,
      type: this.getTypeLabel(element.type),
      description: `${this.getTypeLabel(element.type)} element`
    };

    try {
      switch (element.type) {
        case 'dock':
          info = await this.loadDockInfo(element, canSeeRestrictedInfo);
          break;
        case 'storage-area':
          info = await this.loadStorageAreaInfo(element, canSeeRestrictedInfo);
          break;
        case 'vessel':
          info = await this.loadVesselInfo(element, canSeeRestrictedInfo);
          break;
        case 'crane':
          info = await this.loadCraneInfo(element, canSeeRestrictedInfo);
          break;
        default:
          console.warn('[Loading] Unknown element type:', element.type);
      }
    } catch (error) {
      console.error('Error loading element info:', error);
    }

    // Only update if this is still the latest loading operation
    if (currentLoadId === this.loadingCounter) {
      console.log('[loadElementInfo] Applying load #', currentLoadId, 'info:', info);
      this.elementInfo$.next(info);
    } else {
      console.log('[loadElementInfo] Discarding load #', currentLoadId, 'because newer load exists:', this.loadingCounter);
    }
  }

  private async loadDockInfo(element: PickableObject, canSeeRestricted: boolean): Promise<ElementInfo> {
    try {
      const docks = await firstValueFrom(this.docksService.getAllDocks());

      // Prefer an explicit identifier from userData
      const dockNameFromUserData = (element as any).userData?.dockName;
      const rawMeshName = element.name?.replace(/_/g, ' ').replace(/^Dock\s*/i, '').replace(/\s*Mesh$/i, '').trim();

      let dock = null as any;
      if (dockNameFromUserData) {
        dock = (docks as any[]).find(d => d.name === dockNameFromUserData || d.location === dockNameFromUserData);
      }
      if (!dock) {
        dock = (docks as any[]).find(d => rawMeshName && (rawMeshName.includes(d.name) || (d.location && rawMeshName.includes(d.location))));
      }

      const info: ElementInfo = {
        name: dock?.name || element.name,
        type: 'Dock',
        description: dock?.location ? `Dock located at ${dock.location}` : 'Port docking facility'
      };

      // Load info visible to all users
      if (dock) {
        info.location = dock.location;
        info.length = dock.length;
        info.depth = dock.depth;
        info.maxDraft = dock.maxDraft;
        info.vesselTypesAllowed = dock.vesselTypesAllowed?.map((vt: any) => vt.name || vt).join(', ') || 'N/A';
      }

      // Load restricted info only for authorized users
      if (canSeeRestricted && dock) {
        info.dockId = dock.id;
        info.lastModified = dock.lastModifiedAt ? new Date(dock.lastModifiedAt).toLocaleDateString() : undefined;
      }

      console.log('[Dock Debug]', { elementName: element.name, dockNameFromUserData, rawMeshName, matched: dock?.name });
      return info;
    } catch (error) {
      console.error('Error loading dock info:', error);
      return {
        name: element.name,
        type: 'Dock',
        description: 'Port docking facility'
      };
    }
  }

  private async loadStorageAreaInfo(element: PickableObject, canSeeRestricted: boolean): Promise<ElementInfo> {
    try {
      // Get all storage areas from backend
      const areas = await firstValueFrom(this.storageAreaService.getAllStorageAreas());

      // Find by code (unique identifier)
      let area = null;
      const searchCode = element.userData?.storageAreaCode;

      console.log('[StorageArea Debug] Search criteria', {
        searchCode,
        userData: element.userData,
        allAreas: areas.map((a: any) => ({ code: a.code, location: a.location }))
      });

      if (searchCode) {
        area = areas.find((a: any) => a.code === searchCode);
      }

      console.log('[StorageArea Debug] Result', {
        canSeeRestricted,
        elementName: element.name,
        foundArea: area ? { code: area.code, location: area.location } : null
      });

      const displayName = area?.location ? area.location : (area?.code || element.name);
      const info: ElementInfo = {
        name: displayName,
        type: 'Storage Area',
        description: area?.code ? `Storage area ${area.code} - ${area.storageAreaType}` : 'Port storage facility'
      };

      // Load info visible to all users
      if (area) {
        info.code = area.code;
        info.location = area.location;
        info.storageType = area.storageAreaType;
        info.currentCapacity = area.currentCapacity;
        info.maxCapacity = area.maxCapacity;
        const utilizationPercent = (area.maxCapacity && area.maxCapacity > 0 && area.currentCapacity)
          ? ((area.currentCapacity / area.maxCapacity) * 100).toFixed(1)
          : '0';
        info.utilization = `${utilizationPercent}%`;
      }

      // Load restricted info only for authorized users
      if (canSeeRestricted && area) {
        info.storageAreaId = area.id;
        info.lastModified = area.lastModifiedAt ? new Date(area.lastModifiedAt).toLocaleDateString() : undefined;
        console.log('[StorageArea Info Loaded]', info);
      }

      return info;
    } catch {
      return {
        name: element.name,
        type: 'Storage Area',
        description: 'Port storage facility'
      };
    }
  }

  private async loadVesselInfo(element: PickableObject, canSeeRestricted: boolean): Promise<ElementInfo> {
    try {
      console.log('[loadVesselInfo] Starting...');

      // Fetch all vessels
      const vessels = await firstValueFrom(this.vesselService.getAllVesselRecords());
      console.log('[loadVesselInfo] Fetched vessels:', vessels.length);

      // Try to fetch VVEs, but don't fail if OEM is not available
      let activeVVEs: any[] = [];
      try {
        const vves = await firstValueFrom(this.vesselVisitExecutionService.getAll());
        console.log('[loadVesselInfo] Fetched VVEs:', vves.length);

        // Filter VVEs to show only active ones (arrival date <= today <= departure date or no departure date)
        const now = new Date();
        activeVVEs = (vves as any[]).filter(vve => {
          const arrival = vve.arrivalDate ? new Date(vve.arrivalDate) : null;
          const departure = vve.departureDate ? new Date(vve.departureDate) : null;

          if (!arrival) return false;

          // If no departure date, consider current time as max
          if (!departure) {
            return arrival.getTime() <= now.getTime();
          }

          // Check if today is between arrival and departure
          return arrival.getTime() <= now.getTime() && now.getTime() <= departure.getTime();
        });

        console.log('[loadVesselInfo] Active VVEs:', activeVVEs.length);
      } catch (vveError) {
        console.warn('[loadVesselInfo] Could not fetch VVEs (OEM may not be running):', vveError);
      }

      // Fetch all VVNs to get approved ones
      let approvedVVNs: any[] = [];
      try {
        const vvns = await firstValueFrom(this.vesselVisitNotificationService.getAllVesselVisitNotifications());
        console.log('[loadVesselInfo] Fetched VVNs:', vvns.length);

        // Filter only approved VVNs
        approvedVVNs = (vvns as any[]).filter(vvn => vvn.visitStatus === 'Approved');
        console.log('[loadVesselInfo] Approved VVNs:', approvedVVNs.length);
      } catch (vvnError) {
        console.warn('[loadVesselInfo] Could not fetch VVNs:', vvnError);
      }

      // Show all vessels, or prioritize those with active VVE if available
      let vesselsToShow = vessels;
      if (activeVVEs.length > 0) {
        const activeVesselIMOs = new Set(
          activeVVEs.map((vve: any) => vve.vesselIMO || vve.name)
            .filter((imo: string) => imo)
        );
        const vesselsWithActiveVVE = (vessels as any[]).filter(v => activeVesselIMOs.has(v.imoNumber));

        if (vesselsWithActiveVVE.length > 0) {
          vesselsToShow = vesselsWithActiveVVE;
          console.log('[loadVesselInfo] Showing only vessels with active VVE:', vesselsWithActiveVVE.length);
        }
      }

      console.log('[loadVesselInfo] Vessels to show:', vesselsToShow.length);

      if (vesselsToShow.length === 0) {
        return {
          name: 'No Vessels',
          type: 'Vessel',
          description: 'No vessels available'
        };
      }

      const currentVessel = vesselsToShow[0];
      console.log('[loadVesselInfo] Current vessel:', currentVessel);

      // Find active VVE for this vessel (check both name and vesselIMO fields)
      const vesselVVE = activeVVEs.find((vve: any) =>
        vve.name === currentVessel.imoNumber || vve.vesselIMO === currentVessel.imoNumber
      );

      // Find approved VVN for this vessel
      const vesselVVN = approvedVVNs.find((vvn: any) =>
        vvn.vessel?.imoNumber === currentVessel.imoNumber || vvn.vesselId === currentVessel.id
      );

      console.log('[loadVesselInfo] Vessel VVE:', vesselVVE);
      console.log('[loadVesselInfo] Vessel VVN (Approved):', vesselVVN);

      const vesselLastModified = currentVessel.lastModifiedAt
        ? new Date(currentVessel.lastModifiedAt).toLocaleString()
        : undefined;

      const info: ElementInfo = {
        name: currentVessel.vesselName || 'Vessel',
        type: 'Vessel',
        description: `Vessel ${currentVessel.vesselName || 'Unknown'}`,
        vesselsList: vesselsToShow,
        currentVesselIndex: 0,
        vesselRecordId: currentVessel.id,
        imoNumber: currentVessel.imoNumber,
        vesselType: currentVessel.vesselType?.name || currentVessel.vesselTypeName || 'N/A',
        operator: currentVessel.operator || 'N/A',
        lastModified: vesselLastModified,
        vesselRecordLastModified: vesselLastModified
      };

      // Add VesselType details if available
      if (currentVessel.vesselType) {
        info.vesselTypeId = currentVessel.vesselType.id;
        info.vesselTypeDescription = currentVessel.vesselType.description;
        info.currentCapacity = currentVessel.vesselType.capacity;
        info.maxRows = currentVessel.vesselType.maxRows;
        info.maxBays = currentVessel.vesselType.maxBays;
        info.maxTiers = currentVessel.vesselType.maxTiers;
        info.vesselTypeLastModified = currentVessel.vesselType.lastModifiedAt
          ? new Date(currentVessel.vesselType.lastModifiedAt).toLocaleDateString()
          : undefined;
      }

      // Add VVE information if available
      if (vesselVVE) {
        info.vveCode = vesselVVE.code;
        info.vveStatus = vesselVVE.status || vesselVVE.description;
        info.arrivalDate = vesselVVE.arrivalDate ? new Date(vesselVVE.arrivalDate).toLocaleString() : undefined;
        info.departureDate = vesselVVE.departureDate ? new Date(vesselVVE.departureDate).toLocaleString() : 'In progress';
        info.vesselVisitWarning = undefined;

        // Add operational status information
        const status = vesselVVE.status;
        info.operationalStatus = status;
        info.operationalStatusDescription = this.getStatusDescription(status);
      } else {
        info.vesselVisitWarning = 'No vessel has arrived or there is no active visit currently in port.';
      }

      // Add VVN information if available (approved notifications only)
      if (vesselVVN) {
        info.expectedArrivalDate = vesselVVN.eta ? new Date(vesselVVN.eta).toLocaleString() : undefined;
        info.expectedDepartureDate = vesselVVN.etd ? new Date(vesselVVN.etd).toLocaleString() : undefined;
      }

      console.log('[loadVesselInfo] Final info:', info);
      return info;
    } catch (error) {
      console.error('Error loading vessel info:', error);
      return {
        name: element.name,
        type: 'Vessel',
        description: 'Maritime vessel (error loading details)'
      };
    }
  }

  private async loadCraneInfo(element: PickableObject, canSeeRestricted: boolean): Promise<ElementInfo> {
    try {
      console.log('[loadCraneInfo] Starting...', { element: element.name, userData: (element as any).userData });

      // Fetch all STS cranes and docks from backend
      const stsCranes = await firstValueFrom(this.physicalResourcesService.getPhysicalResourcesByKind(PhysicalResourceKind.STSCrane));
      const docks = await firstValueFrom(this.docksService.getAllDocks());
      console.log('[loadCraneInfo] Fetched STS cranes:', stsCranes.length);

      // Determine which dock/element was selected to get dock name
      let dockName = null;

      // If selected from a dock, get the dock name
      if (element.type === 'dock') {
        dockName = element.name;
      } else if (element.type === 'crane') {
        // If selected from crane directly, get from userData (dockName is stored when crane is created)
        dockName = (element as any).userData?.dockName;
        console.log('[loadCraneInfo] Crane selected from dock:', dockName);
      }

      console.log('[loadCraneInfo] Dock name detected:', dockName);

      // Find dock info to get description
      const dockInfo = docks.find((d: any) => d.name === dockName);
      const dockDescription = dockInfo?.location ? `Dock located at ${dockInfo.location}` : 'Port docking facility';

      // Filter cranes by assigned dock (try both assignedArea and assignedDockName fields)
      const cranesForDock = dockName
        ? (stsCranes as any[]).filter(c =>
            (c.assignedArea === dockName || c.assignedArea?.includes(dockName)) ||
            (c.assignedDockName === dockName || c.assignedDockName?.includes(dockName))
          )
        : stsCranes as any[];

      console.log('[loadCraneInfo] Cranes for dock:', cranesForDock.length, 'All cranes:', stsCranes.map((c: any) => ({ code: c.code, area: c.assignedArea })));

      // Store crane list and get first crane
      const cranesToShow = cranesForDock.length > 0 ? cranesForDock : stsCranes;

      let info: ElementInfo = {
        name: cranesToShow.length > 0 ? cranesToShow[0].name : 'STS Crane',
        type: 'Crane',
        description: cranesToShow.length > 0 ? cranesToShow[0].description : 'STS crane equipment',
        cranesList: cranesToShow,
        currentCraneIndex: 0
      };

      if (dockName && cranesForDock.length === 0) {
        info.craneWarning = `No STS cranes are associated with dock ${dockName}.`;
      }

      // Load first crane info
      if (canSeeRestricted && cranesToShow.length > 0) {
        const currentCrane = cranesToShow[0];
        info.craneId = currentCrane.id;
        info.craneCode = currentCrane.code;
        info.craneKind = currentCrane.kind ? currentCrane.kind.toString() : '';
        info.status = currentCrane.status;
        info.operationalCapacity = currentCrane.operationalCapacity;
        info.setupTimeMinutes = currentCrane.setupTimeMinutes;
        info.assignedDockName = currentCrane.assignedArea || currentCrane.assignedDockName;
        info.assignedStorageAreaCode = currentCrane.assignedStorageAreaCode;
        info.qualifications =
          currentCrane.qualificationCode ||
          (Array.isArray(currentCrane.qualification)
            ? currentCrane.qualification.map((q: any) => q.name || q).join(', ')
            : undefined);
        const lm = (currentCrane.lastModifiedAt || currentCrane.lastModified);
        info.lastModified = lm ? new Date(lm).toLocaleDateString() : undefined;
      }

      return info;
    } catch (error) {
      console.error('Error loading crane info:', error);
      return {
        name: 'STS Cranes',
        type: 'Crane',
        description: 'STS crane equipment'
      };
    }
  }

  nextCrane() {
    const current = this.elementInfo$.value;
    if (!current || !current.cranesList || current.cranesList.length === 0) return;

    let nextIndex = (current.currentCraneIndex || 0) + 1;
    if (nextIndex >= current.cranesList.length) nextIndex = 0;

    this.updateCraneIndex(nextIndex);
  }

  previousCrane() {
    const current = this.elementInfo$.value;
    if (!current || !current.cranesList || current.cranesList.length === 0) return;

    let prevIndex = (current.currentCraneIndex || 0) - 1;
    if (prevIndex < 0) prevIndex = current.cranesList.length - 1;

    this.updateCraneIndex(prevIndex);
  }

  private updateCraneIndex(index: number) {
    const current = this.elementInfo$.value;
    if (!current || !current.cranesList) return;

    const crane = current.cranesList[index];
    const updated: ElementInfo = {
      ...current,
      currentCraneIndex: index,
      name: crane.name,
      description: crane.description,
      craneId: crane.id,
      craneCode: crane.code,
      craneKind: crane.kind ? crane.kind.toString() : '',
      status: crane.status,
      operationalCapacity: crane.operationalCapacity,
      setupTimeMinutes: crane.setupTimeMinutes,
      assignedDockName: crane.assignedArea || crane.assignedDockName,
      assignedStorageAreaCode: crane.assignedStorageAreaCode,
      qualifications:
        crane.qualificationCode ||
        (Array.isArray(crane.qualification)
          ? crane.qualification.map((q: any) => q.name || q).join(', ')
          : undefined),
      lastModified: (crane.lastModifiedAt || crane.lastModified) ? new Date(crane.lastModifiedAt || crane.lastModified).toLocaleDateString() : undefined
    };

    this.elementInfo$.next(updated);
  }

  nextVessel() {
    const current = this.elementInfo$.value;
    if (!current || !current.vesselsList || current.vesselsList.length === 0) return;

    let nextIndex = (current.currentVesselIndex || 0) + 1;
    if (nextIndex >= current.vesselsList.length) nextIndex = 0;

    this.updateVesselIndex(nextIndex);
  }

  previousVessel() {
    const current = this.elementInfo$.value;
    if (!current || !current.vesselsList || current.vesselsList.length === 0) return;

    let prevIndex = (current.currentVesselIndex || 0) - 1;
    if (prevIndex < 0) prevIndex = current.vesselsList.length - 1;

    this.updateVesselIndex(prevIndex);
  }

  private async updateVesselIndex(index: number) {
    const current = this.elementInfo$.value;
    if (!current || !current.vesselsList) return;

    try {
      const vessel = current.vesselsList[index];

      // Fetch active VVEs again for this vessel
      let activeVVEs: any[] = [];
      try {
        const vves = await firstValueFrom(this.vesselVisitExecutionService.getAll());
        const now = new Date();
        activeVVEs = (vves as any[]).filter(vve => {
          const arrival = vve.arrivalDate ? new Date(vve.arrivalDate) : null;
          const departure = vve.departureDate ? new Date(vve.departureDate) : null;

          if (!arrival) return false;
          if (!departure) return arrival.getTime() <= now.getTime();
          return arrival.getTime() <= now.getTime() && now.getTime() <= departure.getTime();
        });
      } catch (error) {
        console.warn('[updateVesselIndex] Could not fetch VVEs:', error);
      }

      // Fetch approved VVNs again for this vessel
      let approvedVVNs: any[] = [];
      try {
        const vvns = await firstValueFrom(this.vesselVisitNotificationService.getAllVesselVisitNotifications());
        approvedVVNs = (vvns as any[]).filter(vvn => vvn.visitStatus === 'Approved');
      } catch (error) {
        console.warn('[updateVesselIndex] Could not fetch VVNs:', error);
      }

      const vesselVVE = activeVVEs.find((vve: any) =>
        vve.name === vessel.imoNumber || vve.vesselIMO === vessel.imoNumber
      );

      const vesselVVN = approvedVVNs.find((vvn: any) =>
        vvn.vessel?.imoNumber === vessel.imoNumber || vvn.vesselId === vessel.id
      );

      const vesselLastModified = vessel.lastModifiedAt
        ? new Date(vessel.lastModifiedAt).toLocaleString()
        : undefined;

      const updated: ElementInfo = {
        ...current,
        currentVesselIndex: index,
        name: vessel.vesselName,
        description: `Vessel ${vessel.vesselName}`,
        imoNumber: vessel.imoNumber,
        vesselType: vessel.vesselType?.name || vessel.vesselTypeName || 'N/A',
        operator: vessel.operator || 'N/A',
        vesselRecordId: vessel.id,
        lastModified: vesselLastModified,
        vesselRecordLastModified: vesselLastModified
      };

      // Add VesselType details
      if (vessel.vesselType) {
        updated.vesselTypeId = vessel.vesselType.id;
        updated.vesselTypeDescription = vessel.vesselType.description;
        updated.currentCapacity = vessel.vesselType.capacity;
        updated.maxRows = vessel.vesselType.maxRows;
        updated.maxBays = vessel.vesselType.maxBays;
        updated.maxTiers = vessel.vesselType.maxTiers;
        updated.vesselTypeLastModified = vessel.vesselType.lastModifiedAt
          ? new Date(vessel.vesselType.lastModifiedAt).toLocaleDateString()
          : undefined;
      }

      // Add VVE info
      if (vesselVVE) {
        updated.vveCode = vesselVVE.code;
        updated.vveStatus = vesselVVE.status || vesselVVE.description;
        updated.arrivalDate = vesselVVE.arrivalDate ? new Date(vesselVVE.arrivalDate).toLocaleString() : undefined;
        updated.departureDate = vesselVVE.departureDate ? new Date(vesselVVE.departureDate).toLocaleString() : 'In progress';
        updated.vesselVisitWarning = undefined;
      } else {
        updated.vesselVisitWarning = 'No vessel has arrived or there is no active visit currently in port.';
      }

      // Add VVN info
      if (vesselVVN) {
        updated.expectedArrivalDate = vesselVVN.eta ? new Date(vesselVVN.eta).toLocaleString() : undefined;
        updated.expectedDepartureDate = vesselVVN.etd ? new Date(vesselVVN.etd).toLocaleString() : undefined;
      }

      this.elementInfo$.next(updated);
    } catch (error) {
      console.error('Error updating vessel index:', error);
    }
  }

  private getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'dock': 'Dock',
      'storage-area': 'Storage Area',
      'vessel': 'Vessel',
      'crane': 'Crane'
    };
    return labels[type] || type;
  }

  private getStatusDescription(status: string): string {
    const descriptions: { [key: string]: string } = {
      'Waiting': 'Vessel is waiting for dock assignment',
      'Loading': 'Vessel is currently loading cargo',
      'Unloading': 'Vessel is currently unloading cargo',
      'InProgress': 'Operations are in progress',
      'Completed': 'All operations have been completed'
    };
    return descriptions[status] || 'Status information unavailable';
  }
}
