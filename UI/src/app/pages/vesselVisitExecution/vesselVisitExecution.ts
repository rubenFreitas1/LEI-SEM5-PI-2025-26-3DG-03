import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { VesselVisitExecutionService } from '../../services-oem/vesselVisitExecution.service';
import { VesselVisitExecutionModel } from '../../models/vesselVisitExecution.model';
import { VesselVisitNotificationService } from '../../services/vesselVisitNotification.service';
import { VesselVisitNotificationModel, VisitStatus } from '../../models/vesselVisitNotification.model';
import { IncidentService } from '../../services-oem/incident.service';
import { IncidentModel } from '../../models/incident.model';

@Component({
  selector: 'app-vessel-visit-execution',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './vesselVisitExecution.html',
  styleUrl: './vesselVisitExecution.css',
})
export class VesselVisitExecution implements OnInit, OnDestroy {
  items: VesselVisitExecutionModel[] = [];
  filteredItems: VesselVisitExecutionModel[] = [];
  selected: VesselVisitExecutionModel | null = null;
  // Filters
  filterFrom = '';
  filterTo = '';
  filterVesselIMO = '';
  filterStatus = '';

  // Edit modal
  showEditModal = false;
  isEditing = false;
  editItem: any = { status: '', arrivalDate: '', DockAssigned: '', operations: [] };
  editModalErrorMessage = '';
  editFieldErrors: { [key: string]: string } = {};

  approvedNotifications: VesselVisitNotificationModel[] = [];

  searchTerm = '';
  isLoading = false;

  statusMessage = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding = false;

  // Create modal
  showCreateModal = false;
  isCreating = false;
  newItem: VesselVisitExecutionModel = { vesselVisitNotificationCode: '', arrivalDate: '' };
  modalErrorMessage = '';
  fieldErrors: { [key: string]: string } = {};

  // Ongoing incidents for create modal
  ongoingIncidents: IncidentModel[] = [];
  selectedIncidentIds: string[] = [];

  // Date picker popover
  showDatePicker = false;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private vveService: VesselVisitExecutionService,
    private vvnService: VesselVisitNotificationService,
    private incidentService: IncidentService
  ) {}

  ngOnInit(): void {
    this.loadItems();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => this.performSearch(term));
  }

  loadItems() {
    this.isLoading = true;
    const hasFilters = this.filterFrom || this.filterTo || this.filterVesselIMO || this.filterStatus;
    const source$ = hasFilters ? this.vveService.search({ from: this.filterFrom, to: this.filterTo, vesselIMO: this.filterVesselIMO, status: this.filterStatus }) : this.vveService.getAll();
    source$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.items = items || [];
          this.filteredItems = [...this.items];
          this.isLoading = false;

          if (!this.items || this.items.length === 0) {
            if (this.filterStatus) {
              this.statusHiding = false;
              this.statusMessage = `No results for status "${this.filterStatus}"`;
              this.statusMessageType = 'error';
            } else if (this.filterVesselIMO) {
              this.statusHiding = false;
              this.statusMessage = `No results for IMO "${this.filterVesselIMO}"`;
              this.statusMessageType = 'error';
            } else if (this.filterFrom || this.filterTo) {
              this.statusHiding = false;
              this.statusMessage = 'No results for the selected date range.';
              this.statusMessageType = 'error';
            }
          } else if (this.statusMessage && this.statusMessageType === 'error') {
            this.clearStatusMessage();
          }
        },
        error: (error) => {
          const backendMsg = error?.originalError?.error || error?.message || '';
          if (typeof backendMsg === 'string' && backendMsg.includes('No Vessel Visit Executions found')) {
            this.items = [];
            this.filteredItems = [];
            this.isLoading = false;
            if (this.filterStatus) {
              this.statusHiding = false;
              this.statusMessage = `No results for status "${this.filterStatus}"`;
              this.statusMessageType = 'error';
            } else if (this.filterVesselIMO) {
              this.statusHiding = false;
              this.statusMessage = `No results for IMO "${this.filterVesselIMO}"`;
              this.statusMessageType = 'error';
            } else {
              this.statusHiding = false;
              this.statusMessage = 'No results found for the given filters.';
              this.statusMessageType = 'error';
            }
            return;
          }

          this.statusHiding = false;
          this.statusMessage = 'Error loading VVE list. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading VVE:', error);
          this.isLoading = false;
        },
      });
  }

  onFilterChange() {
    // reload items with filters
    this.loadItems();
  }

  clearFilters() {
    this.filterFrom = '';
    this.filterTo = '';
    this.filterVesselIMO = '';
    this.filterStatus = '';
    this.loadItems();
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  toggleDatePicker() {
    this.showDatePicker = !this.showDatePicker;
  }

  closeDatePicker() {
    this.showDatePicker = false;
  }

  applyDateRange() {
    this.showDatePicker = false;
    this.onFilterChange();
  }

  clearDateRange() {
    this.filterFrom = '';
    this.filterTo = '';
    this.showDatePicker = false;
    this.onFilterChange();
  }

  private performSearch(searchTerm: string) {
    const term = (searchTerm || '').trim();
    if (!term) {
      this.filteredItems = [...this.items];
      if (this.statusMessage && this.statusMessageType === 'error') this.clearStatusMessage();
      return;
    }

    // Detect IMO numeric search (commonly 7 digits) and use backend search by vesselIMO
    const imoMatch = /^\d{6,7}$/.test(term);
    if (imoMatch) {
      this.isLoading = true;
      this.vveService.search({ vesselIMO: term })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (items) => {
            this.filteredItems = items || [];
            if (!items || items.length === 0) {
              this.statusHiding = false;
              this.statusMessage = `No results found for IMO "${term}"`;
              this.statusMessageType = 'error';
            } else if (this.statusMessage && this.statusMessageType === 'error') {
              this.clearStatusMessage();
            }
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error searching by IMO:', err);
            this.statusHiding = false;
            this.statusMessage = 'Error searching VVE by IMO. Please try again.';
            this.statusMessageType = 'error';
            this.filteredItems = [];
            this.isLoading = false;
          }
        });
      return;
    }

    const localResults = this.items.filter(
      (i) =>
        i.name?.toLowerCase().includes(term.toLowerCase()) ||
        i.code?.toLowerCase().includes(term.toLowerCase()) ||
        i.description?.toLowerCase().includes(term.toLowerCase())
    );

    if (localResults.length > 0) {
      this.filteredItems = localResults;
      if (this.statusMessage && this.statusMessageType === 'error') this.clearStatusMessage();
    } else {
      this.searchByName(term);
    }
  }

  searchByName(name: string) {
    this.isLoading = true;
    this.vveService
      .getByName(name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.filteredItems = items;
          if (items && items.length > 0) {
            if (this.statusMessage && this.statusMessageType === 'error') this.clearStatusMessage();
          } else {
            this.statusHiding = false;
            this.statusMessage = `No results found for "${name}"`;
            this.statusMessageType = 'error';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error searching VVE. Please try again.';
          this.statusMessageType = 'error';
          console.error('Error searching VVE:', error);
          this.filteredItems = [];
          this.isLoading = false;
        },
      });
  }

  clearSearch() { this.clearSearchAndNotify(); }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.filteredItems = [...this.items];
    this.searchSubject$.next(this.searchTerm);
  }

  // Provide a friendly no-results message depending on current search/filters
  getNoResultsMessage(): string {
    if (this.searchTerm && this.searchTerm.trim()) return `No results for "${this.searchTerm.trim()}"`;
    if (this.filterStatus) return `No results for status "${this.filterStatus}"`;
    if (this.filterVesselIMO) return `No results for IMO "${this.filterVesselIMO}"`;
    if (this.filterFrom || this.filterTo) return 'No results for the selected date range.';
    return 'No results.';
  }

  select(item: VesselVisitExecutionModel) {
    this.selected = this.selected?.id === item.id ? null : item;
  }

  // Create modal handling (no edit per requirements)
  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewItem();
    this.selectedIncidentIds = [];
    this.ongoingIncidents = [];
    this.loadApprovedNotifications();
  }

  onUpdate() {
    if (this.selected) {
      // Deep copy operations and format dates for datetime-local inputs
      const operationsCopy = this.selected.operations
        ? JSON.parse(JSON.stringify(this.selected.operations)).map((op: any) => ({
            ...op,
            actualStart: this.formatDateForInput(op.actualStart),
            actualEnd: this.formatDateForInput(op.actualEnd)
          }))
        : [];

      this.editItem = {
        status: this.selected.status || '',
        arrivalDate: this.formatDateForInput(this.selected.arrivalDate),
        DockAssigned: this.selected.DockAssigned || '',
        operations: operationsCopy
      };
      this.showEditModal = true;
    } else {
      alert('Please select a vessel visit execution to update.');
    }
  }

  resetEditItem() {
    this.editItem = { status: '', arrivalDate: '', DockAssigned: '', operations: [] };
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
  }

  formatDateForInput(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    // Format to "YYYY-MM-DDTHH:mm" for datetime-local input
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  formatDateTime(date: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString();
  }

  getOperationBadgeClass(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'badge-success';
      case 'started':
      case 'in progress':
        return 'badge-warning';
      case 'delayed':
        return 'badge-danger';
      case 'pending':
      default:
        return 'badge-pending';
    }
  }

  canSetCompleted(operation: any): boolean {
    return !!(operation.actualStart && operation.actualEnd);
  }

  onOperationStatusChange(operation: any): void {
    // If status is set to Pending, clear actual times
    if (operation.status === 'Pending') {
      operation.actualStart = null;
      operation.actualEnd = null;
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.isEditing = false;
    this.resetEditItem();
  }

  onSaveEdit() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.editItem || !this.editItem.status || !this.editItem.status.toString().trim()) {
      this.editModalErrorMessage = 'Please select a valid status.';
      return;
    }

    if (!this.editItem.arrivalDate) {
      this.editModalErrorMessage = 'Arrival date is required.';
      return;
    }

    // Validate: VVE status can only be Completed if all operations are completed
    if (this.editItem.status === 'Completed') {
      if (this.editItem.operations && this.editItem.operations.length > 0) {
        const incompleteOps = this.editItem.operations.filter((op: any) => op.status !== 'Completed');
        if (incompleteOps.length > 0) {
          this.editModalErrorMessage = `Cannot set status to Completed: ${incompleteOps.length} operation(s) are not yet completed.`;
          return;
        }
      }
    }

    if (!this.selected) {
      this.editModalErrorMessage = 'No execution selected.';
      return;
    }

    this.isEditing = true;
    const payload: any = {
      status: this.editItem.status,
      arrivalDate: new Date(this.editItem.arrivalDate).toISOString()
    };

    // Add DockAssigned if provided
    if (this.editItem.DockAssigned && this.editItem.DockAssigned.trim()) {
      payload.DockAssigned = this.editItem.DockAssigned.trim();
    }

    // Add operations if provided
    if (this.editItem.operations && this.editItem.operations.length > 0) {
      // Validate operations before sending
      const arrivalDate = new Date(this.editItem.arrivalDate);
      for (let i = 0; i < this.editItem.operations.length; i++) {
        const op = this.editItem.operations[i];

        // Validate: Started status requires actualStart
        if (op.status === 'Started' && !op.actualStart) {
          this.editModalErrorMessage = `Operation ${i + 1}: Status 'Started' requires actual start time.`;
          this.isEditing = false;
          return;
        }

        // Check if actualStart is before arrivalDate
        if (op.actualStart) {
          const actualStart = new Date(op.actualStart);
          if (actualStart.getTime() < arrivalDate.getTime()) {
            this.editModalErrorMessage = `Operation ${i + 1}: Actual start time cannot be before vessel arrival date.`;
            this.isEditing = false;
            return;
          }
        }

        // Check if actualEnd is before actualStart
        if (op.actualStart && op.actualEnd) {
          const actualStart = new Date(op.actualStart);
          const actualEnd = new Date(op.actualEnd);
          if (actualEnd.getTime() <= actualStart.getTime()) {
            this.editModalErrorMessage = `Operation ${i + 1}: Actual end time must be after actual start time.`;
            this.isEditing = false;
            return;
          }
        }
      }

      // Validate crane overlap: operations with same crane cannot have overlapping times
      for (let i = 0; i < this.editItem.operations.length; i++) {
        const op1 = this.editItem.operations[i];
        if (!op1.actualStart || !op1.actualEnd || !op1.craneUsed) continue;

        const start1 = new Date(op1.actualStart).getTime();
        const end1 = new Date(op1.actualEnd).getTime();

        for (let j = i + 1; j < this.editItem.operations.length; j++) {
          const op2 = this.editItem.operations[j];
          if (!op2.actualStart || !op2.actualEnd || !op2.craneUsed) continue;

          // Check if same crane
          if (op1.craneUsed === op2.craneUsed) {
            const start2 = new Date(op2.actualStart).getTime();
            const end2 = new Date(op2.actualEnd).getTime();

            // Check for overlap: start1 < end2 AND start2 < end1
            if (start1 < end2 && start2 < end1) {
              this.editModalErrorMessage = `Operations ${i + 1} and ${j + 1} use the same crane (${op1.craneUsed}) and have overlapping time ranges.`;
              this.isEditing = false;
              return;
            }
          }
        }
      }

      // Convert operation dates to ISO format before sending
      payload.operations = this.editItem.operations.map((op: any) => ({
        ...op,
        actualStart: op.actualStart ? new Date(op.actualStart).toISOString() : null,
        actualEnd: op.actualEnd ? new Date(op.actualEnd).toISOString() : null
      }));
    }

    this.vveService.update(this.selected.code || this.selected.vesselVisitNotificationCode || '', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const selectedCode = this.selected?.code;
          this.closeEditModal();
          this.statusHiding = false;
          this.statusMessage = `Execution "${selectedCode}" updated successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);

          // Reload items and update selected item with fresh data
          this.loadItems();
          if (selectedCode) {
            // Re-select the updated item after data loads
            setTimeout(() => {
              const updatedItem = this.items.find(item => item.code === selectedCode);
              if (updatedItem) {
                this.selected = updatedItem;
              }
            }, 100);
          }
        },
        error: (err) => {
          console.error('Error updating VVE:', err);
          this.editModalErrorMessage = err?.message || 'Error updating execution.';
          this.isEditing = false;
        }
      });
  }

  resetNewItem() {
    this.newItem = { vesselVisitNotificationCode: '', arrivalDate: '' };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewItem();
    this.isCreating = false;
    this.selectedIncidentIds = [];
    this.ongoingIncidents = [];
  }

  /**
   * Load ongoing incidents that overlap with the arrival date to now
   */
  loadOngoingIncidents() {
    if (!this.newItem.arrivalDate) {
      this.ongoingIncidents = [];
      this.selectedIncidentIds = [];
      return;
    }

    let arrivalDate: Date;

    if (typeof this.newItem.arrivalDate === 'string') {
      // datetime-local format: "2025-12-19T10:30"
      arrivalDate = new Date(this.newItem.arrivalDate);
    } else {
      arrivalDate = new Date(this.newItem.arrivalDate as any);
    }

    if (isNaN(arrivalDate.getTime())) {
      this.ongoingIncidents = [];
      this.selectedIncidentIds = [];
      return;
    }

    console.log('Loading incidents for arrival date:', arrivalDate);

    this.incidentService
      .getOngoingIncidents(arrivalDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (incidents) => {
          console.log('Loaded incidents:', incidents);
          this.ongoingIncidents = incidents || [];
          this.selectedIncidentIds = [];
        },
        error: (err) => {
          console.error('Error loading ongoing incidents:', err);
          this.ongoingIncidents = [];
          this.selectedIncidentIds = [];
        },
      });
  }

  onToggleIncidentSelection(incidentId: string, checked: boolean) {
    if (!incidentId) return;
    if (checked) {
      if (!this.selectedIncidentIds.includes(incidentId)) {
        this.selectedIncidentIds.push(incidentId);
      }
    } else {
      this.selectedIncidentIds = this.selectedIncidentIds.filter(x => x !== incidentId);
    }
  }

  onSaveNew() {
    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidNew()) {
      this.modalErrorMessage = 'Please fill in both fields (Vessel Visit Notification and Arrival Date).';
      return;
    }

    this.isCreating = true;

    // Add selected incident IDs to the payload
    const payload: any = {
      ...this.newItem,
      incidentIDs: this.selectedIncidentIds.length > 0 ? this.selectedIncidentIds : null
    };

    this.vveService
      .create(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created) => {
          this.closeCreateModal();
          this.statusHiding = false;
          const createdCode = (created as any)?.vesselVisitNotificationCode ?? created.code ?? '';
          this.statusMessage = `Execution with code "${createdCode}" created successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
          this.loadItems();
        },
        error: (error) => {
          console.error('Error creating VVE:', error);
          this.handleCreateError(error);
          this.isCreating = false;
        },
      });
  }

  private isValidNew(): boolean {
    return !!(
      this.newItem.vesselVisitNotificationCode?.trim() &&
      this.newItem.arrivalDate?.trim()
    );
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  private handleCreateError(error: any) {
    this.fieldErrors = {};
    let errorMessage = '';

    if (error?.originalError?.error) {
      const backendError = error.originalError.error;
      if (Array.isArray(backendError)) {
        errorMessage = backendError.join('; ');
        this.modalErrorMessage = errorMessage;
        return;
      }
      if (backendError.errors && typeof backendError.errors === 'object') {
        for (const field in backendError.errors) {
          const fieldName = field.toLowerCase();
          this.fieldErrors[fieldName] = Array.isArray(backendError.errors[field])
            ? backendError.errors[field].join('; ')
            : backendError.errors[field];
        }
        this.modalErrorMessage = 'Please correct the validation errors below.';
        return;
      }
      if (backendError.message) errorMessage = backendError.message;
      else if (backendError.title) errorMessage = backendError.title;
      else if (backendError.detail) errorMessage = backendError.detail;
      else if (typeof backendError === 'string') errorMessage = backendError;
    }

    if (!errorMessage && error?.message) errorMessage = error.message;
    if (!errorMessage) errorMessage = 'Error creating VVE. Please try again.';
    this.modalErrorMessage = errorMessage;
  }

  clearStatusMessage() {
    if (!this.statusMessage) return;
    this.statusHiding = true;
    setTimeout(() => {
      this.statusMessage = '';
      this.statusMessageType = '';
      this.statusHiding = false;
    }, 220);
  }

  private loadApprovedNotifications() {
    this.vvnService
      .getAllVesselVisitNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.approvedNotifications = (list || []).filter(n => n.visitStatus === VisitStatus.Approved);
        },
        error: (err) => {
          console.error('Failed loading notifications:', err);
          this.approvedNotifications = [];
        }
      });
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    const lowerStatus = (status || '').toLowerCase();
    if (lowerStatus.includes('approved') || lowerStatus.includes('completed')) return 'status-approved';
    if (lowerStatus.includes('rejected') || lowerStatus.includes('unavailable')) return 'status-rejected';
    if (lowerStatus.includes('submitted')) return 'status-submitted';
    if (lowerStatus.includes('inprogress') || lowerStatus.includes('in-progress')) return 'status-inprogress';
    if (lowerStatus.includes('inmaintenance') || lowerStatus.includes('in-maintenance')) return 'status-inmaintenance';
    return '';
  }
}
