
export interface AssignedCraneModel {
  craneName?: string;
}

export interface AssignedStaffModel {
  staffName?: string;
}

export interface ScheduleEntryModel {
  vesselName?: string;
  arrivalTime?: Date;
  departureTime?: Date;
  assignedCrane?: AssignedCraneModel[];
  assignedStaff?: AssignedStaffModel[];
}

export interface ScheduleModel {
  id?: number;
  totalDelay?: number;
  scheduleEntries?: ScheduleEntryModel[];
  algorithm?: string;
  executionTime?: number;
  messages?: string[];
}
