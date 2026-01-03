import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { OperationPlanService } from '../../services-oem/operationPlan.service';
import { AuthService } from '../../auth/auth.service';

interface ChangeLogEntryModel {
  date: Date;
  author: string;
  reason: string;
  changes: string;
}

interface OperationPlanModel {
  id: string;
  vvn: string;
  targetDay: Date;
  arrivalTime: Date;
  departureTime: Date;
  operations: OperationEntryModel[];
  author: string;
  algorithm: string;
  createdAt: Date;
  changeLog?: ChangeLogEntryModel[];
}

interface OperationEntryModel {
  id: string;
  operationType: string;
  container: string;
  operationStart: Date;
  operationEnd: Date;
  craneUsed: string;
}

interface VvnWithoutPlanModel {
  id: number;
  code: string;
  vesselIMO?: string;
  vesselName?: string;
  vesselImo?: string;
  eta?: string;
  etd?: string;
  visitStatus?: string;
  status?: string;
  vessel?: {
    vesselName?: string;
    imoNumber?: string;
  };
}

@Component({
  selector: 'app-operation-plan',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './operationPlan.html',
  styleUrl: './operationPlan.css',
})
export class OperationPlan implements OnInit, OnDestroy {
  isLoading: boolean = false;
  operationPlans: OperationPlanModel[] = [];
  filteredPlans: OperationPlanModel[] = [];

  // Missing plans tab
  activeTab: 'plans' | 'missing' = 'plans';
  vvnsWithoutPlans: VvnWithoutPlanModel[] = [];
  filteredMissingVvns: VvnWithoutPlanModel[] = [];
  groupedMissingVvns: Map<string, VvnWithoutPlanModel[]> = new Map();

  // For template iteration
  get groupedVvns(): Array<{date: string, vvns: VvnWithoutPlanModel[]}> {
    return Array.from(this.groupedMissingVvns.entries()).map(([date, vvns]) => ({
      date,
      vvns
    }));
  }

  // Search
  searchTerm: string = '';
  private destroy$ = new Subject<void>();

  // Selected plan for details modal
  selectedPlan: OperationPlanModel | null = null;
  showDetailsModal: boolean = false;

  // Edit modal
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editPlan: any = null;
  originalEditPlan: any = null;
  editErrorMessage: string = '';
  editSuccessMessage: string = '';
  timeExceedsWarning: boolean = false;

  // Regeneration modal
  showRegenerateModal: boolean = false;
  regenerateDate: Date = new Date();
  regenerateAuthor: string = '';
  regenerateAlgorithm: string = 'automatic';
  isRegenerating: boolean = false;
  regenerateMessage: string = '';

  get regenerateDateString(): string {
    const year = this.regenerateDate.getFullYear();
    const month = String(this.regenerateDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.regenerateDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  set regenerateDateString(value: string) {
    this.regenerateDate = new Date(value);
  }

  constructor(
    private operationPlanService: OperationPlanService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadOperationPlans();
    this.loadVvnsWithoutPlans();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  switchTab(tab: 'plans' | 'missing') {
    this.activeTab = tab;
    this.searchTerm = '';
    if (tab === 'missing') {
      this.loadVvnsWithoutPlans();
    }
  }

  loadOperationPlans() {
    this.isLoading = true;
    this.operationPlanService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (plans) => {
          this.operationPlans = plans || [];
          this.filteredPlans = [...this.operationPlans];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading operation plans:', error);
          this.isLoading = false;
        }
      });
  }

  loadVvnsWithoutPlans() {
    this.isLoading = true;
    this.operationPlanService.getVvnsWithoutOperationPlan()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vvns) => {
          this.vvnsWithoutPlans = vvns || [];
          this.filteredMissingVvns = [...this.vvnsWithoutPlans];
          this.groupVvnsByDate();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading VVNs without plans:', error);
          this.isLoading = false;
        }
      });
  }

  groupVvnsByDate() {
    this.groupedMissingVvns.clear();

    // Sort VVNs by ETA
    const sortedVvns = [...this.filteredMissingVvns].sort((a, b) => {
      const dateA = a.eta ? new Date(a.eta).getTime() : 0;
      const dateB = b.eta ? new Date(b.eta).getTime() : 0;
      return dateA - dateB;
    });

    // Group by date (day only, ignoring time)
    sortedVvns.forEach(vvn => {
      if (vvn.eta) {
        const dateKey = this.formatDateOnly(vvn.eta);
        if (!this.groupedMissingVvns.has(dateKey)) {
          this.groupedMissingVvns.set(dateKey, []);
        }
        this.groupedMissingVvns.get(dateKey)?.push(vvn);
      } else {
        // VVNs without ETA go to "Unknown Date"
        const unknownKey = 'Unknown Date';
        if (!this.groupedMissingVvns.has(unknownKey)) {
          this.groupedMissingVvns.set(unknownKey, []);
        }
        this.groupedMissingVvns.get(unknownKey)?.push(vvn);
      }
    });
  }

  getGroupedDates(): string[] {
    return Array.from(this.groupedMissingVvns.keys());
  }

  getVvnsForDate(date: string): VvnWithoutPlanModel[] {
    return this.groupedMissingVvns.get(date) || [];
  }

  regenerateForDate(date: string) {
    const vvnsForDate = this.getVvnsForDate(date);
    if (vvnsForDate.length > 0 && vvnsForDate[0].eta) {
      const etaDate = new Date(vvnsForDate[0].eta);
      // Set time to start of day to match the target day
      etaDate.setHours(0, 0, 0, 0);
      this.regenerateDate = etaDate;
      this.openRegenerateModal();
    } else if (date !== 'Unknown Date') {
      // Try to parse the date from the formatted string (dd/mm/yyyy)
      const parts = date.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        this.regenerateDate = new Date(year, month, day);
        this.openRegenerateModal();
      }
    }
  }

  onSearchChange() {
    const term = this.searchTerm.toLowerCase().trim();

    if (this.activeTab === 'plans') {
      if (!term) {
        this.filteredPlans = [...this.operationPlans];
        return;
      }

      this.filteredPlans = this.operationPlans.filter(plan =>
        plan.vvn.toLowerCase().includes(term) ||
        plan.author.toLowerCase().includes(term) ||
        plan.algorithm.toLowerCase().includes(term) ||
        plan.id.toLowerCase().includes(term)
      );
    } else {
      if (!term) {
        this.filteredMissingVvns = [...this.vvnsWithoutPlans];
      } else {
        this.filteredMissingVvns = this.vvnsWithoutPlans.filter(vvn =>
          vvn.code.toLowerCase().includes(term) ||
          vvn.vesselIMO?.toLowerCase().includes(term) ||
          vvn.vessel?.vesselName?.toLowerCase().includes(term)
        );
      }
      this.groupVvnsByDate();
    }
  }

  viewDetails(plan: OperationPlanModel) {
    this.selectedPlan = plan;
    this.showDetailsModal = true;
  }

  selectPlan(plan: OperationPlanModel) {
    if (this.selectedPlan?.id === plan.id) {
      this.selectedPlan = null;
    } else {
      this.selectedPlan = plan;
    }
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedPlan = null;
  }

  async openRegenerateModal(vvn?: VvnWithoutPlanModel) {
    console.log('openRegenerateModal called', vvn);

    // Get current user name
    this.regenerateAuthor = await this.authService.getUserName();

    this.showRegenerateModal = true;
    this.regenerateMessage = '';

    if (vvn && vvn.eta) {
      this.regenerateDate = new Date(vvn.eta);
    }
    console.log('showRegenerateModal set to:', this.showRegenerateModal);
  }

  openRegenerateDayModal(dateString: string) {
    console.log('openRegenerateDayModal called with date:', dateString);
    // Parse the date from dd/mm/yyyy format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      this.regenerateDate = new Date(year, month, day);
    }
    this.openRegenerateModal();
  }

  closeRegenerateModal() {
    this.showRegenerateModal = false;
    this.regenerateDate = new Date();
    this.regenerateAuthor = '';
    this.regenerateAlgorithm = 'automatic';
    this.regenerateMessage = '';
  }

  confirmRegenerate() {
    if (!this.regenerateAuthor.trim()) {
      this.regenerateMessage = 'Please enter an author name';
      return;
    }

    if (!confirm('⚠️ WARNING: This will overwrite ALL existing operation plans for the selected day. Are you sure you want to continue?')) {
      return;
    }

    this.isRegenerating = true;
    this.regenerateMessage = '';

    this.operationPlanService.regenerateOperationPlansForDay(
      this.regenerateDate,
      this.regenerateAuthor,
      this.regenerateAlgorithm
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.regenerateMessage = response.message || 'Operation plans regenerated successfully!';
        this.isRegenerating = false;

        // Reload data after a short delay
        setTimeout(() => {
          this.loadOperationPlans();
          this.loadVvnsWithoutPlans();
          this.closeRegenerateModal();
        }, 2000);
      },
      error: (error) => {
        console.error('Error regenerating plans:', error);
        this.regenerateMessage = error.message || 'Error regenerating operation plans';
        this.isRegenerating = false;
      }
    });
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateOnly(date: Date | string | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  // Edit operations
  onUpdate() {
    if (!this.selectedPlan) return;

    // Deep clone to avoid modifying the original
    this.editPlan = {
      ...this.selectedPlan,
      targetDay: this.formatDateForInput(this.selectedPlan.targetDay),
      arrivalTime: this.formatDateTimeForInput(this.selectedPlan.arrivalTime),
      departureTime: this.formatDateTimeForInput(this.selectedPlan.departureTime),
      changeReason: '',  // Initialize empty change reason
      operations: this.selectedPlan.operations.map(op => ({
        ...op,
        operationStart: this.formatDateTimeForInput(op.operationStart),
        operationEnd: this.formatDateTimeForInput(op.operationEnd)
      }))
    };
    this.originalEditPlan = JSON.parse(JSON.stringify(this.editPlan));
    this.showEditModal = true;
    this.editErrorMessage = '';
    this.editSuccessMessage = '';
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editPlan = null;
    this.originalEditPlan = null;
    this.isEditing = false;
    this.editErrorMessage = '';
    this.editSuccessMessage = '';
    this.timeExceedsWarning = false;
  }



  checkTimeExceedsDeparture() {
    if (!this.editPlan || !this.editPlan.operations || this.editPlan.operations.length === 0) {
      this.timeExceedsWarning = false;
      return;
    }

    const lastOperation = this.editPlan.operations[this.editPlan.operations.length - 1];
    const departureDate = new Date(this.editPlan.departureTime);
    const operationEndDate = new Date(lastOperation.operationEnd);

    // Compare if operation end is after departure time
    this.timeExceedsWarning = operationEndDate > departureDate;
  }

  validateOperationTimes(): string | null {
    if (!this.editPlan || !this.editPlan.operations) {
      return null;
    }

    for (let i = 0; i < this.editPlan.operations.length; i++) {
      const op = this.editPlan.operations[i];
      const startTime = new Date(op.operationStart);
      const endTime = new Date(op.operationEnd);

      if (startTime >= endTime) {
        return `Operation ${i + 1}: Start time must be before end time.`;
      }
    }

    return null;
  }



  onSaveEdit() {
    this.editErrorMessage = '';
    this.editSuccessMessage = '';

    if (!this.selectedPlan) {
      this.editErrorMessage = 'No operation plan selected.';
      return;
    }

    // Validate operation times
    const validationError = this.validateOperationTimes();
    if (validationError) {
      this.editErrorMessage = validationError;
      return;
    }

    // Prepare the payload with proper date formatting
    const payload: any = {
      id: this.editPlan.id,
      vvn: this.editPlan.vvn,
      targetDay: new Date(this.editPlan.targetDay),
      arrivalTime: new Date(this.editPlan.arrivalTime),
      departureTime: new Date(this.editPlan.departureTime),
      author: this.editPlan.author,
      algorithm: this.editPlan.algorithm,
      createdAt: this.selectedPlan.createdAt,
      changeReason: this.editPlan.changeReason,  // Include change reason
      operations: this.editPlan.operations.map((op: any) => ({
        id: op.id,
        operationType: op.operationType,
        container: op.container,
        operationStart: new Date(op.operationStart),
        operationEnd: new Date(op.operationEnd),
        craneUsed: op.craneUsed
      }))
    };

    this.isEditing = true;
    this.operationPlanService.update(this.editPlan.vvn, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.isEditing = false;
          this.editSuccessMessage = 'Operation plan updated successfully!';

          // Update the local arrays
          const idx = this.operationPlans.findIndex(p => p.id === this.selectedPlan!.id);
          if (idx !== -1) {
            this.operationPlans[idx] = updated;
          }
          const filteredIdx = this.filteredPlans.findIndex(p => p.id === this.selectedPlan!.id);
          if (filteredIdx !== -1) {
            this.filteredPlans[filteredIdx] = updated;
          }
          this.selectedPlan = updated;

          setTimeout(() => {
            this.closeEditModal();
          }, 1500);
        },
        error: (error) => {
          this.isEditing = false;
          this.editErrorMessage = error?.error?.error || error?.error?.message || 'Error updating operation plan.';
          console.error('Error updating operation plan:', error);
        }
      });
  }

  // Helper methods for date/time formatting
  formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  formatDateTimeForInput(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  formatTimeForInput(date: Date | string): string {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
