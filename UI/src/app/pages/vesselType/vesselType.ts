import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, timeout } from 'rxjs';
import { VesselTypeService } from '../../services/vesselType.service';
import { VesselTypeModel } from '../../models/vesselType.model';

@Component({
  selector: 'app-vessel-type',
  imports: [CommonModule, FormsModule],
  templateUrl: './vesselType.html',
  styleUrl: './vesselType.css',
})
export class VesselType implements OnInit, OnDestroy {
  vesselTypes: VesselTypeModel[] = [];
  filteredVesselTypes: VesselTypeModel[] = [];
  selectedVesselType: VesselTypeModel | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;

  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newVesselType: VesselTypeModel = {
    name: '',
    description: '',
    capacity: 0,
    maxRows: 0,
    maxBays: 0,
    maxTiers: 0
  };
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Edit Modal properties
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editVesselType: VesselTypeModel = {
    name: '',
    description: '',
    capacity: 0,
    maxRows: 0,
    maxBays: 0,
    maxTiers: 0
  };
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};
  originalEditVesselType: VesselTypeModel | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private vesselTypeService: VesselTypeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadVesselTypes();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm);
      });
  }

  loadVesselTypes() {
    this.isLoading = true;
    this.vesselTypeService.getAllVesselTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vesselTypes) => {
          this.vesselTypes = vesselTypes;
          this.filteredVesselTypes = [...this.vesselTypes];
          this.isLoading = false;
        },
        error: (error) => {
            this.statusHiding = false;
            this.statusMessage = 'Error loading vessel types. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading vessel types:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredVesselTypes = [...this.vesselTypes];
      return;
    }

    const localResults = this.vesselTypes.filter(v =>
      v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.capacity?.toString().includes(searchTerm) ||
      v.maxRows?.toString().includes(searchTerm) ||
      v.maxBays?.toString().includes(searchTerm) ||
      v.maxTiers?.toString().includes(searchTerm)
    );

    if (localResults.length > 0) {
      this.filteredVesselTypes = localResults;
    } else {
      this.searchByName(searchTerm);
    }
  }

  searchByName(name: string) {
    this.isLoading = true;
    this.vesselTypeService.getVesselTypeByName(name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vesselTypes) => {
          this.filteredVesselTypes = vesselTypes;
          this.isLoading = false;
        },
        error: (error) => {
            this.statusHiding = false;
            this.statusMessage = 'Error searching for vessel types. Please try again.';
          this.statusMessageType = 'error';
          console.error('Error searching vessel types:', error);
          this.filteredVesselTypes = [];
          this.isLoading = false;
        }
      });
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

  clearSearch() {
    this.searchTerm = '';
    this.filteredVesselTypes = [...this.vesselTypes];
  }

  selectVesselType(vesselType: VesselTypeModel) {
    if (this.selectedVesselType?.id === vesselType.id) {
      this.selectedVesselType = null;
    } else {
      this.selectedVesselType = vesselType;
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewVesselType();
    console.log('Opening create vessel type modal');
  }

  onUpdate() {
    if (this.selectedVesselType) {
      this.showEditModal = true;
      this.resetEditVesselType();
      this.editVesselType = { ...this.selectedVesselType };

      this.originalEditVesselType = { ...this.editVesselType };
      console.log('Opening edit vessel type modal for:', this.selectedVesselType);
    } else {
      alert('Please select a vessel type to update.');
    }
  }

  refreshList() {
    this.loadVesselTypes();
    this.selectedVesselType = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewVesselType() {
    this.newVesselType = {
      name: '',
      description: '',
      capacity: 0,
      maxRows: 0,
      maxBays: 0,
      maxTiers: 0
    };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewVesselType();
    this.isCreating = false;
  }

  onSaveNewVesselType() {

    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidVesselType()) {
      this.modalErrorMessage = 'Please fill in all required fields (name, description, capacity, maxRows, maxBays, maxTiers).';
      return;
    }

    this.isCreating = true;
    this.vesselTypeService.createVesselType(this.newVesselType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdVesselType) => {
          console.log('Vessel type created successfully:', createdVesselType);
          this.closeCreateModal();
          this.statusHiding = false;
          this.statusMessage = `Vessel type "${createdVesselType.name}" created successfully!`;
          this.statusMessageType = 'success';
          console.debug('Status message set (create):', this.statusMessage);
          setTimeout(() => this.clearStatusMessage(), 3000);
          this.loadVesselTypes();
        },
        error: (error) => {
          console.error('Error creating vessel type:', error);
          this.handleCreateError(error);
          this.isCreating = false;
        }
      });
  }

  private handleCreateError(error: any) {

    this.fieldErrors = {};

    console.error('Full error in component:', error);


    let errorMessage = '';

    if (error.originalError && error.originalError.error) {
      const backendError = error.originalError.error;
      console.error('Backend error object:', backendError);


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


      if (backendError.message) {
        errorMessage = backendError.message;
      } else if (backendError.title) {
        errorMessage = backendError.title;
      } else if (backendError.detail) {
        errorMessage = backendError.detail;
      } else if (typeof backendError === 'string') {
        errorMessage = backendError;
      }
    }


    if (!errorMessage && error.message) {
      errorMessage = error.message;
    }


    if (!errorMessage) {
      errorMessage = 'Error creating vessel type. Please try again.';
    }

    this.modalErrorMessage = errorMessage;
  }

  private isValidVesselType(): boolean {
    return !!(this.newVesselType.name?.trim() &&
              this.newVesselType.description?.trim() &&
              this.newVesselType.capacity !== undefined && this.newVesselType.capacity > 0 &&
              this.newVesselType.maxRows !== undefined && this.newVesselType.maxRows > 0 &&
              this.newVesselType.maxBays !== undefined && this.newVesselType.maxBays > 0 &&
              this.newVesselType.maxTiers !== undefined && this.newVesselType.maxTiers > 0);
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  // Edit Modal methods
  resetEditVesselType() {
    this.editVesselType = {
      name: '',
      description: '',
      capacity: 0,
      maxRows: 0,
      maxBays: 0,
      maxTiers: 0
    };
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.originalEditVesselType = null;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.resetEditVesselType();
    this.isEditing = false;
  }

  onSaveEditVesselType() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.isValidEditVesselType()) {
      this.editModalErrorMessage = 'Please fill in all required fields (name, description, capacity, maxRows, maxBays, maxTiers).';
      return;
    }

    if (!this.selectedVesselType?.id) {
      this.editModalErrorMessage = 'No vessel type selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    this.isEditing = true;
    this.vesselTypeService.updateVesselType(this.selectedVesselType.id, this.editVesselType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedVesselType) => {
          console.log('Vessel type updated successfully:', updatedVesselType);
          this.closeEditModal();
          this.loadVesselTypes();
          this.statusHiding = false;
          this.statusMessage = `Vessel type "${this.selectedVesselType?.name}" updated successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
        },
        error: (error) => {
          console.error('Error updating vessel type:', error);
          this.handleEditError(error);
          this.isEditing = false;
        }
      });
  }

  isEditDirty(): boolean {
    if (!this.originalEditVesselType) return false;
    const orig = this.originalEditVesselType;
    const curr = this.editVesselType;
    const nameChanged = (orig.name || '').trim() !== (curr.name || '').trim();
    const descChanged = (orig.description || '').trim() !== (curr.description || '').trim();
    const capacityChanged = (orig.capacity || 0) !== (curr.capacity || 0);
    const maxRowsChanged = (orig.maxRows || 0) !== (curr.maxRows || 0);
    const maxBaysChanged = (orig.maxBays || 0) !== (curr.maxBays || 0);
    const maxTiersChanged = (orig.maxTiers || 0) !== (curr.maxTiers || 0);
    return nameChanged || descChanged || capacityChanged || maxRowsChanged || maxBaysChanged || maxTiersChanged;
  }

  private handleEditError(error: any) {
    this.editFieldErrors = {};

    console.error('Full error in component:', error);

    let errorMessage = '';

    if (error.originalError && error.originalError.error) {
      const backendError = error.originalError.error;
      console.error('Backend error object:', backendError);

      if (Array.isArray(backendError)) {
        errorMessage = backendError.join('; ');
        this.editModalErrorMessage = errorMessage;
        return;
      }

      if (backendError.errors && typeof backendError.errors === 'object') {
        for (const field in backendError.errors) {
          const fieldName = field.toLowerCase();
          this.editFieldErrors[fieldName] = Array.isArray(backendError.errors[field])
            ? backendError.errors[field].join('; ')
            : backendError.errors[field];
        }
        this.editModalErrorMessage = 'Please correct the validation errors below.';
        return;
      }

      if (backendError.message) {
        errorMessage = backendError.message;
      } else if (backendError.title) {
        errorMessage = backendError.title;
      } else if (backendError.detail) {
        errorMessage = backendError.detail;
      } else if (typeof backendError === 'string') {
        errorMessage = backendError;
      }
    }

    if (!errorMessage && error.message) {
      errorMessage = error.message;
    }

    if (!errorMessage) {
      errorMessage = 'Error updating vessel type. Please try again.';
    }

    this.editModalErrorMessage = errorMessage;
  }

  private isValidEditVesselType(): boolean {
    return !!(this.editVesselType.name?.trim() &&
              this.editVesselType.description?.trim() &&
              this.editVesselType.capacity !== undefined && this.editVesselType.capacity > 0 &&
              this.editVesselType.maxRows !== undefined && this.editVesselType.maxRows > 0 &&
              this.editVesselType.maxBays !== undefined && this.editVesselType.maxBays > 0 &&
              this.editVesselType.maxTiers !== undefined && this.editVesselType.maxTiers > 0);
  }

  hasEditFieldError(fieldName: string): boolean {
    return !!this.editFieldErrors[fieldName.toLowerCase()];
  }

  getEditFieldError(fieldName: string): string {
    return this.editFieldErrors[fieldName.toLowerCase()] || '';
  }
}
