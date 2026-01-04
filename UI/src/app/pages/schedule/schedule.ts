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
import { OperationPlanService } from '../../services-oem/operationPlan.service';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-schedule',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
})
export class Schedule implements OnInit, OnDestroy {
  isLoading: boolean = false;
  selectedAlgorithm: string = 'automatic';
  showGeneticParams: boolean = false;
  geneticParamsHiding: boolean = false;
  calculatedTimeLimit: number | null = null;

  // Genetic algorithm parameters
  populationSize: number = 10;
  generations: number = 100;
  crossoverRate: number = 0.8;
  mutationRate: number = 0.1;
  desiredTime: number = -1;
  stableGenerations: number = 0;
  enableMultiCrane: boolean = false;

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

  // UI state for operation plans generation
  showOperationPlansModal: boolean = false;
  generatedPlansMessage: string = '';
  isGeneratingPlans: boolean = false;
  scheduleErrorMessage: string = '';

  constructor(
    private vesselVisitNotificationService: VesselVisitNotificationService,
    private http: HttpClient,
    private router: Router,
    private scheduleService: ScheduleService,
    private operationPlanService: OperationPlanService,
    private auth0: Auth0Service
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
    let targetDate: Date;
    try {
      targetDate = new Date(this.targetDayLocal);
      targetIso = targetDate.toISOString();
    } catch (e) {
      this.statusMessageType = 'error';
      this.statusMessage = 'Invalid target day format';
      this.statusHiding = false;
      if (this.statusTimeout) { clearTimeout(this.statusTimeout); }
      this.statusTimeout = setTimeout(() => this.clearStatusMessage(), 3000);
      return;
    }

    this.isLoading = true;
    const algo = this.selectedAlgorithm;

    let scheduleObservable: any;
    if (algo === 'genetic') {
      scheduleObservable = this.scheduleService.getScheduleWithGeneticAlgorithm(
        targetIso,
        this.populationSize,
        this.generations,
        this.crossoverRate,
        this.mutationRate,
        this.desiredTime,
        this.stableGenerations,
        this.enableMultiCrane
      );
    } else if (algo === 'automatic') {
      // Calculate time limit: hours between now and target day
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      const timeLimit = Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
      this.calculatedTimeLimit = Math.round(timeLimit * 100) / 100; // Round to 2 decimals

      scheduleObservable = this.scheduleService.getScheduleByTargetDay(targetIso, algo, timeLimit);
    } else {
      scheduleObservable = this.scheduleService.getScheduleByTargetDay(targetIso, algo);
    }

    scheduleObservable.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schedule: any) => {
          const normalized: any = schedule || { entries: [], totalDelay: 0 };

          const rawEntries = normalized.entries || normalized.scheduleEntries || normalized.schedule?.schedule || [];
          const entries = (rawEntries || []).map((e: any) => {
            // Process crane assignments - handle both craneNames array and assignedCranes
            let cranes: any[] = [];
            if (e.craneNames && Array.isArray(e.craneNames)) {
              cranes = e.craneNames;
            } else if (e.assignedCranes && Array.isArray(e.assignedCranes)) {
              cranes = e.assignedCranes;
            } else if (e.assignedCrane && Array.isArray(e.assignedCrane)) {
              cranes = e.assignedCrane;
            }

            return {
              vesselName: e.vesselName || e.vessel || '',
              arrivalTime: e.startTime ? new Date(e.startTime) : (e.startTimeIso ? new Date(e.startTimeIso) : null),
              departureTime: e.endTime ? new Date(e.endTime) : (e.endTimeIso ? new Date(e.endTimeIso) : null),
              assignedCrane: cranes,
              assignedStaff: e.staffNames || e.assignedStaff || []
            };
          });

          const totalDelay = normalized.totalDelay ?? normalized.TotalDelay ?? normalized.schedule?.totalDelay ?? 0;
          const executionTime = normalized.executionTime ?? normalized.ExecutionTime ?? normalized.schedule?.executionTime ?? 0;
          const messages = normalized.messages ?? normalized.Messages ?? normalized.schedule?.messages ?? [];

          // Determine algorithm label based on selection and response
          let algorithmLabel = this.selectedAlgorithm === 'improved' ? 'Heuristic algorithm' :
                               this.selectedAlgorithm === 'genetic' ? 'Genetic algorithm' :
                               this.selectedAlgorithm === 'automatic' ? 'Automatic Selection' : 'Default algorithm';

          // If automatic mode, try to get the actual algorithm used from response
          if (this.selectedAlgorithm === 'automatic' && normalized.schedule?.selectedAlgorithm) {
            const selectedAlgo = normalized.schedule.selectedAlgorithm;
            algorithmLabel = `Automatic Selection → ${selectedAlgo.charAt(0).toUpperCase() + selectedAlgo.slice(1)}`;
          }

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
        error: (err: any) => {
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

  onAlgorithmChange(value: string) {
    if (value === 'genetic' && !this.showGeneticParams) {
      // Mostrar parâmetros genéticos
      this.showGeneticParams = true;
      this.geneticParamsHiding = false;
    } else if (value !== 'genetic' && this.showGeneticParams) {
      // Esconder com animação
      this.geneticParamsHiding = true;
      setTimeout(() => {
        this.showGeneticParams = false;
        this.geneticParamsHiding = false;
      }, 300); // Tempo da animação
    }

    // Calculate time limit for automatic mode
    if (value === 'automatic' && this.targetDayLocal) {
      this.calculateTimeLimit();
    } else {
      this.calculatedTimeLimit = null;
    }

    this.selectedAlgorithm = value;
  }

  onTargetDayChange() {
    // Recalculate time limit if in automatic mode
    if (this.selectedAlgorithm === 'automatic' && this.targetDayLocal) {
      this.calculateTimeLimit();
    }
  }

  private calculateTimeLimit() {
    try {
      const targetDate = new Date(this.targetDayLocal);
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      const timeLimit = Math.max(0, diffMs / (1000 * 60 * 60));
      this.calculatedTimeLimit = Math.round(timeLimit * 100) / 100;
    } catch (e) {
      this.calculatedTimeLimit = null;
    }
  }

  closeSchedule() {
    this.showScheduleModal = false;
    this.scheduleModel = null;
    this.scheduleErrorMessage = '';
  }

  getTimelineBounds(): { start: number; end: number } {
    if (!this.scheduleModel || !this.scheduleModel.scheduleEntries) {
      const now = Date.now();
      return { start: now, end: now + 3600 * 1000 };
    }
    let min = Infinity;
    let max = 0;
    for (const e of this.scheduleModel.scheduleEntries) {
      const s = e.arrivalTime ? new Date(e.arrivalTime).getTime() : 0;
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

  getDuration(entry: ScheduleEntryModel): string {
    if (!entry.arrivalTime || !entry.departureTime) return '';
    const start = new Date(entry.arrivalTime).getTime();
    const end = new Date(entry.departureTime).getTime();
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  }

  async generateOperationPlans() {
    if (!this.scheduleModel || !this.scheduleModel.scheduleEntries || this.scheduleModel.scheduleEntries.length === 0) {
      return;
    }

    this.isGeneratingPlans = true;

    // Obter email do utilizador logado
    let userEmail = 'unknown-user@system.com';
    try {
      const user = await firstValueFrom(this.auth0.user$);
      if (user && (user as any).email) {
        userEmail = (user as any).email;
      }
    } catch (error) {
      console.error('Error getting user email:', error);
    }

    // Extrair dados do schedule para enviar ao backend
    const vvns: string[] = [];
    const assignedCranes: string[][] = [];
    const staffs: string[][] = [];
    const operationTypes: string[][] = [];
    const containers: string[][] = [];
    const arrivalTimes: string[] = [];
    const departureTimes: string[] = [];
    const targetDays: string[] = [];

    for (const entry of this.scheduleModel.scheduleEntries) {
      // Usar vesselName como VVN (ajustar se necessário)
      vvns.push(entry.vesselName || 'UNKNOWN');

      // Cranes
      const cranes = Array.isArray(entry.assignedCrane) ? entry.assignedCrane.map((c: any) =>
        typeof c === 'string' ? c : (c.craneName || c.name || '')
      ).filter((n: string) => !!n) : [];
      assignedCranes.push(cranes);

      // Staff
      const staff = Array.isArray(entry.assignedStaff) ? entry.assignedStaff.map((s: any) =>
        typeof s === 'string' ? s : (s.staffName || s.name || '')
      ).filter((n: string) => !!n) : [];
      staffs.push(staff);

      // Operation types (default para LOADING)
      const opTypes = cranes.map(() => 'LOADING');
      operationTypes.push(opTypes);

      // Containers (gerar IDs baseados no vessel)
      const conts = cranes.map((_, idx) => `CONT-${entry.vesselName}-${idx + 1}`);
      containers.push(conts);

      // Times
      arrivalTimes.push(entry.arrivalTime ? new Date(entry.arrivalTime).toISOString() : new Date().toISOString());
      departureTimes.push(entry.departureTime ? new Date(entry.departureTime).toISOString() : new Date().toISOString());

      // Target day (usar arrival time como referência)
      const targetDay = entry.arrivalTime ? new Date(entry.arrivalTime) : new Date();
      targetDay.setHours(0, 0, 0, 0);
      targetDays.push(targetDay.toISOString().split('T')[0]);
    }

    const payload = {
      vvns,
      assignedCranes,
      staffs,
      operationTypes,
      containers,
      arrivalTimes,
      departureTimes,
      targetDays,
      author: userEmail,
      algorithm: this.selectedAlgorithm
    };

    // Chamar o backend para criar operation plans
    this.operationPlanService.createBatch(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isGeneratingPlans = false;
          this.showScheduleModal = false;

          // Extrair VVN codes dos operation plans criados
          const vvnCodes = response.map((plan: any) => plan.vvn).join(', ');
          const targetDay = targetDays[0] || 'Unknown';

          this.generatedPlansMessage = `Operation plans for VVNs ${vvnCodes} on ${targetDay} were generated.`;
          this.showOperationPlansModal = true;
        },
        error: (err) => {
          this.isGeneratingPlans = false;
          console.error('Error generating operation plans:', err);
          console.error('Error type:', typeof err);
          console.error('Error.message:', err?.message);
          console.error('Error.error:', err?.error);
          console.error('Error.originalError:', err?.originalError);
          console.error('Error.originalError.error:', err?.originalError?.error);

          let msg = 'Error generating operation plans';
          try {
            // Tentar extrair a mensagem de erro de várias fontes possíveis
            if (err?.message) {
              msg = err.message;
            } else if (err?.originalError?.error?.error) {
              msg = err.originalError.error.error;
            } else if (err?.error?.error) {
              msg = err.error.error;
            } else if (err?.error) {
              const be = err.error;
              if (typeof be === 'string') msg = be;
              else if (be.message) msg = be.message;
            }

            console.log('Final error message:', msg);
          } catch (e) {
            console.error('Error extracting error message', e);
          }

          // Mostrar erro dentro da modal do schedule
          this.scheduleErrorMessage = msg;

          // Auto-hide depois de 5 segundos
          setTimeout(() => {
            this.scheduleErrorMessage = '';
          }, 5000);
        }
      });
  }

  closeOperationPlansModal() {
    this.showOperationPlansModal = false;
    this.generatedPlansMessage = '';
  }


}
