import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { QualificationService } from '../../services/qualification.service';
import { QualificationModel } from '../../models/qualification.model';

@Component({
  selector: 'app-qualification',
  imports: [CommonModule, FormsModule],
  templateUrl: './qualification.html',
  styleUrl: './qualification.css',
})
export class Qualification implements OnInit, OnDestroy {
  qualifications: QualificationModel[] = [];
  filteredQualifications: QualificationModel[] = [];
  selectedQualification: QualificationModel | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newQualification: QualificationModel = {
    code: '',
    name: '',
    description: ''
  };
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private qualificationService: QualificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadQualifications();
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

  loadQualifications() {
    this.isLoading = true;
    this.errorMessage = '';
    this.qualificationService.getAllQualifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (qualifications) => {
          this.qualifications = qualifications;
          this.filteredQualifications = [...this.qualifications];
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Error loading qualifications. Please check your connection.';
          console.error('Error loading qualifications:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredQualifications = [...this.qualifications];
      return;
    }

    const localResults = this.qualifications.filter(q =>
      q.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (localResults.length > 0) {
      this.filteredQualifications = localResults;
    } else {
      this.searchByName(searchTerm);
    }
  }

  searchByName(name: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.qualificationService.getQualificationsByName(name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (qualifications) => {
          this.filteredQualifications = qualifications;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Error searching for qualifications. Please try again.';
          console.error('Error searching qualifications:', error);
          this.filteredQualifications = [];
          this.isLoading = false;
        }
      });
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredQualifications = [...this.qualifications];
  }

  selectQualification(qualification: QualificationModel) {
    if (this.selectedQualification?.id === qualification.id) {
      this.selectedQualification = null;
    } else {
      this.selectedQualification = qualification;
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewQualification();
    console.log('Opening create qualification modal');
  }

  onUpdate() {
    if (this.selectedQualification) {
      this.router.navigate(['/qualification/edit', this.selectedQualification.id]);
      console.log('Edit qualification:', this.selectedQualification);
    } else {
      alert('Please select a qualification to update.');
    }
  }

  refreshList() {
    this.loadQualifications();
    this.selectedQualification = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewQualification() {
    this.newQualification = {
      code: '',
      name: '',
      description: ''
    };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewQualification();
    this.isCreating = false;
  }

  onSaveNewQualification() {

    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidQualification()) {
      this.modalErrorMessage = 'Please fill in all required fields (code, name, description).';
      return;
    }

    this.isCreating = true;
    this.qualificationService.createQualification(this.newQualification)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdQualification) => {
          console.log('Qualification created successfully:', createdQualification);
          this.closeCreateModal();
          this.loadQualifications();
        },
        error: (error) => {
          console.error('Error creating qualification:', error);
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
      errorMessage = 'Error creating qualification. Please try again.';
    }

    this.modalErrorMessage = errorMessage;
  }

  private isValidQualification(): boolean {
    return !!(this.newQualification.code?.trim() &&
              this.newQualification.name?.trim() &&
              this.newQualification.description?.trim());
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }
}
