import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { VesselVisitNotificationService } from '../../services/vesselVisitNotification.service';
import { HttpClient } from '@angular/common/http';
import {
  VesselVisitNotificationModel,
  CargoType,
  VisitStatus,
  CrewRank,
  ManifestType,
} from '../../models/vesselVisitNotification.model';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduleModel, ScheduleEntryModel } from '../../models/schedule.model';


@Component({
  selector: 'app-schedule',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
})
export class Schedule implements OnInit, OnDestroy {
  isLoading: boolean = false;
  isImproved: boolean = false;

  CargoType = CargoType;
  VisitStatus = VisitStatus;
  CrewRank = CrewRank;
  ManifestType = ManifestType;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;

  // Data
  vesselVisitNotifications: VesselVisitNotificationModel[] = [];
  filteredNotifications: VesselVisitNotificationModel[] = [];

  // Search
  searchTerm: string = '';
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private statusTimeout: any = null;

  // Target day control (bound to datetime-local as string)
  targetDayLocal: string = '';

  // UI state for schedule preview
  scheduleModel: ScheduleModel | null = null;
  showScheduleModal: boolean = false;

  constructor(
    private vesselVisitNotificationService: VesselVisitNotificationService,
    private http: HttpClient,
    private router: Router,
    private scheduleService: ScheduleService
  ) {}

  ngOnInit() {
    this.loadVesselVisitNotifications();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVesselVisitNotifications() {
    this.isLoading = true;
    this.vesselVisitNotificationService.getAllVesselVisitNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          this.vesselVisitNotifications = (notifications || []).filter(n => n.visitStatus === VisitStatus.Approved);
          this.filteredNotifications = [...this.vesselVisitNotifications];
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error loading vessel visit notifications. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading vessel visit notifications:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  setupSearch() {
    this.searchSubject$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => this.applyFilter(term));
  }

  applyFilter(term: string) {
    if (!term) {
      this.filteredNotifications = [...this.vesselVisitNotifications];
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
      return;
    }
    const t = term.toLowerCase();
    this.filteredNotifications = this.vesselVisitNotifications.filter(n =>
      (n.code || '').toLowerCase().includes(t) || (n.vesselIMO || '').toLowerCase().includes(t)
    );
    if ((!this.filteredNotifications || this.filteredNotifications.length === 0)) {
      this.statusMessageType = 'error';
      this.statusMessage = `No results found for "${term}"`;
      this.statusHiding = false;
      if (this.statusTimeout) { clearTimeout(this.statusTimeout); }
      this.statusTimeout = setTimeout(() => this.clearStatusMessage(), 3000);
    } else {
      // Found results, clear any previous error message
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
    }
  }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.applyFilter('');
  }

  formatDateForDisplay(d?: Date | string | null) {
    if (!d) return '';
    const dt = (d instanceof Date) ? d : new Date(d);
    return dt.toLocaleString();
  }

  clearStatusMessage() {
    if (!this.statusMessage) return;
    if (this.statusTimeout) { clearTimeout(this.statusTimeout); this.statusTimeout = null; }
    this.statusHiding = true;
    setTimeout(() => {
      this.statusMessage = '';
      this.statusMessageType = '';
      this.statusHiding = false;
    }, 220);
  }

  runSchedule() {
    if (!this.targetDayLocal) {
      this.statusMessageType = 'error';
      this.statusMessage = 'Please choose a target day before running the schedule.';
      this.statusHiding = false;
      if (this.statusTimeout) { clearTimeout(this.statusTimeout); }
      this.statusTimeout = setTimeout(() => this.clearStatusMessage(), 3000);
      return;
    }
    let targetIso: string;
    try {
      targetIso = new Date(this.targetDayLocal).toISOString();
    } catch (e) {
      this.statusMessageType = 'error';
      this.statusMessage = 'Invalid target day format';
      this.statusHiding = false;
      if (this.statusTimeout) { clearTimeout(this.statusTimeout); }
      this.statusTimeout = setTimeout(() => this.clearStatusMessage(), 3000);
      return;
    }

    this.isLoading = true;
    const algo = this.isImproved ? 'improved' : 'default';
    this.scheduleService.getScheduleByTargetDay(targetIso, algo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schedule) => {
          const normalized: any = schedule || { entries: [], totalDelay: 0 };

          const rawEntries = normalized.entries || normalized.scheduleEntries || normalized.schedule?.schedule || [];
          const entries = (rawEntries || []).map((e: any) => ({
            vesselName: e.vesselName || e.vessel || '',
            arrivalTime: e.startTime ? new Date(e.startTime) : (e.startTimeIso ? new Date(e.startTimeIso) : null),
            departureTime: e.endTime ? new Date(e.endTime) : (e.endTimeIso ? new Date(e.endTimeIso) : null),
            assignedCrane: e.assignedCranes || e.assignedCrane || [],
            assignedStaff: e.staffNames || e.assignedStaff || []
          }));

          const totalDelay = normalized.totalDelay ?? normalized.TotalDelay ?? normalized.schedule?.totalDelay ?? 0;
          const executionTime = normalized.executionTime ?? normalized.ExecutionTime ?? normalized.schedule?.executionTime ?? 0;
          const messages = normalized.messages ?? normalized.Messages ?? normalized.schedule?.messages ?? [];
          const algorithmLabel = this.isImproved ? 'Improved algorithm' : 'Default algorithm';

          if (!entries || entries.length === 0) {
            // No vessels for selected day -> show auto-hiding error similar to Qualifications page
            this.showScheduleModal = false;
            this.isLoading = false;
            this.statusMessageType = 'error';
            this.statusMessage = 'No vessels found for the selected day.';
            this.statusHiding = false;
            if (this.statusTimeout) { clearTimeout(this.statusTimeout); }
            this.statusTimeout = setTimeout(() => this.clearStatusMessage(), 3000);
            return;
          }

          this.scheduleModel = { scheduleEntries: entries, totalDelay: totalDelay, executionTime: executionTime, algorithm: algorithmLabel, messages: messages } as any;
          this.showScheduleModal = true;
          this.isLoading = false;
        },
        error: (err) => {
          // Try to extract a useful message from the controller/backend
          let msg = 'Error running schedule';
          try {
            if (err && err.error) {
              const be = err.error;
              if (typeof be === 'string') msg = be;
              else if (be.message) msg = be.message;
              else if (be.title) msg = be.title;
              else msg = JSON.stringify(be);
            } else if (err && err.message) {
              msg = err.message;
            }
          } catch (e) {
            console.error('Error extracting backend message', e);
          }

          this.statusMessageType = 'error';
          this.statusMessage = msg;
          this.statusHiding = false;
          console.error('Error fetching schedule:', err);
          this.isLoading = false;

          // Auto-hide after 3s
          if (this.statusTimeout) { clearTimeout(this.statusTimeout); }
          this.statusTimeout = setTimeout(() => this.clearStatusMessage(), 3000);
        }
      });
  }

  onToggle(value: boolean) {
    this.isImproved = !!value;
  }

  closeSchedule() {
    this.showScheduleModal = false;
    this.scheduleModel = null;
  }

  private getTimelineBounds(): { start: number; end: number } {
    if (!this.scheduleModel || !this.scheduleModel.scheduleEntries || this.scheduleModel.scheduleEntries.length === 0) {
      const now = Date.now();
      return { start: now, end: now + 3600 * 1000 };
    }
    let min = Number.POSITIVE_INFINITY;
    let max = 0;
    for (const e of this.scheduleModel.scheduleEntries!) {
      const s = e.arrivalTime ? new Date(e.arrivalTime).getTime() : Number.POSITIVE_INFINITY;
      const t = e.departureTime ? new Date(e.departureTime).getTime() : 0;
      if (s < min) min = s;
      if (t > max) max = t;
    }
    if (!isFinite(min) || max === 0) {
      const now = Date.now();
      return { start: now, end: now + 3600 * 1000 };
    }
    const padding = Math.max(5 * 60 * 1000, Math.round((max - min) * 0.03));
    return { start: min - padding, end: max + padding };
  }

  getEntryStyle(entry: ScheduleEntryModel) {
    const bounds = this.getTimelineBounds();
    const start = entry.arrivalTime ? new Date(entry.arrivalTime).getTime() : bounds.start;
    const end = entry.departureTime ? new Date(entry.departureTime).getTime() : bounds.end;
    const total = Math.max(1, bounds.end - bounds.start);
    const left = ((start - bounds.start) / total) * 100;
    const width = ((end - start) / total) * 100;
    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.max(0.5, width)}%`
    } as any;
  }

  formatTimeForDisplay(d?: Date | string | null) {
    if (!d) return '';
    const dt = (d instanceof Date) ? d : new Date(d);
    return dt.toLocaleString();
  }

  joinAssignedCranes(entry: ScheduleEntryModel): string {
    if (!entry || !entry.assignedCrane || entry.assignedCrane.length === 0) return '';
    return (entry.assignedCrane as any[])
      .map(c => {
        if (!c) return '';
        if (typeof c === 'string') return c;
        if (typeof c === 'object') return (c.craneName ?? c.name ?? '').toString();
        return '';
      })
      .filter((n: string) => !!n)
      .join(', ');
  }

  joinAssignedStaff(entry: ScheduleEntryModel): string {
    if (!entry || !entry.assignedStaff || entry.assignedStaff.length === 0) return '';
    return (entry.assignedStaff as any[])
      .map(s => {
        if (!s) return '';
        if (typeof s === 'string') return s;
        if (typeof s === 'object') return (s.staffName ?? s.name ?? '').toString();
        return '';
      })
      .filter((n: string) => !!n)
      .join(', ');
  }


}
