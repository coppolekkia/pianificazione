import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Employee, WorkSite, Assignment, LeaveRequest, ScheduleEntry, WeeklyPlan } from '../types';

interface AppContextType {
  employees: Employee[];
  workSites: WorkSite[];
  assignments: Assignment[];
  leaveRequests: LeaveRequest[];
  scheduleEntries: ScheduleEntry[];
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addWorkSite: (ws: Omit<WorkSite, 'id'>) => Promise<void>;
  updateWorkSite: (id: string, updates: Partial<WorkSite>) => Promise<void>;
  deleteWorkSite: (id: string) => Promise<void>;
  toggleAssignment: (employeeId: string, workSiteId: string) => Promise<void>;
  addLeaveRequest: (req: Omit<LeaveRequest, 'id'>) => Promise<void>;
  deleteLeaveRequest: (id: string) => Promise<void>;
  addScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => Promise<void>;
  updateScheduleEntry: (id: string, entry: Partial<ScheduleEntry>) => Promise<void>;
  deleteScheduleEntry: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- mappers: snake_case DB row → camelCase app type ---

const mapEmployee = (row: any): Employee => ({
  id: row.id,
  name: row.name,
  type: row.type,
});

const mapWorkSite = (row: any): WorkSite => ({
  id: row.id,
  name: row.name,
  address: row.address,
  city: row.city,
  province: row.province,
  radius: row.radius,
  scanType: row.scan_type,
  printTag: row.print_tag,
  weeklyPlan: row.weekly_plan as WeeklyPlan | undefined,
});

const mapAssignment = (row: any): Assignment => ({
  id: row.id,
  employeeId: row.employee_id,
  workSiteId: row.work_site_id,
});

const mapLeaveRequest = (row: any): LeaveRequest => ({
  id: row.id,
  employeeId: row.employee_id,
  type: row.type,
  startDate: row.start_date,
  endDate: row.end_date,
});

const mapScheduleEntry = (row: any): ScheduleEntry => ({
  id: row.id,
  employeeId: row.employee_id,
  date: row.date,
  startTime: row.start_time,
  endTime: row.end_time,
  taskDescription: row.task_description,
  hours: parseFloat(row.hours),
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workSites, setWorkSites] = useState<WorkSite[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);

  // Initial load + realtime subscriptions
  useEffect(() => {
    // employees
    supabase.from('employees').select('*').then(({ data }) => {
      if (data) setEmployees(data.map(mapEmployee));
    });
    const empChannel = supabase
      .channel('employees-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        supabase.from('employees').select('*').then(({ data }) => {
          if (data) setEmployees(data.map(mapEmployee));
        });
      })
      .subscribe();

    // work_sites
    supabase.from('work_sites').select('*').then(({ data }) => {
      if (data) setWorkSites(data.map(mapWorkSite));
    });
    const wsChannel = supabase
      .channel('work_sites-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_sites' }, () => {
        supabase.from('work_sites').select('*').then(({ data }) => {
          if (data) setWorkSites(data.map(mapWorkSite));
        });
      })
      .subscribe();

    // assignments
    supabase.from('assignments').select('*').then(({ data }) => {
      if (data) setAssignments(data.map(mapAssignment));
    });
    const assignChannel = supabase
      .channel('assignments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        supabase.from('assignments').select('*').then(({ data }) => {
          if (data) setAssignments(data.map(mapAssignment));
        });
      })
      .subscribe();

    // leave_requests
    supabase.from('leave_requests').select('*').then(({ data }) => {
      if (data) setLeaveRequests(data.map(mapLeaveRequest));
    });
    const leaveChannel = supabase
      .channel('leave_requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
        supabase.from('leave_requests').select('*').then(({ data }) => {
          if (data) setLeaveRequests(data.map(mapLeaveRequest));
        });
      })
      .subscribe();

    // schedule_entries
    supabase.from('schedule_entries').select('*').then(({ data }) => {
      if (data) setScheduleEntries(data.map(mapScheduleEntry));
    });
    const schedChannel = supabase
      .channel('schedule_entries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_entries' }, () => {
        supabase.from('schedule_entries').select('*').then(({ data }) => {
          if (data) setScheduleEntries(data.map(mapScheduleEntry));
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(empChannel);
      supabase.removeChannel(wsChannel);
      supabase.removeChannel(assignChannel);
      supabase.removeChannel(leaveChannel);
      supabase.removeChannel(schedChannel);
    };
  }, []);

  const addEmployee = async (emp: Omit<Employee, 'id'>) => {
    const { error } = await supabase.from('employees').insert({ name: emp.name, type: emp.type || 'jolly' });
    if (error) throw error;
  };
  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    const row: Record<string, any> = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.type !== undefined) row.type = updates.type;
    const { error } = await supabase.from('employees').update(row).eq('id', id);
    if (error) throw error;
  };
  const deleteEmployee = async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
  };

  const addWorkSite = async (ws: Omit<WorkSite, 'id'>) => {
    const { error } = await supabase.from('work_sites').insert({
      name: ws.name,
      address: ws.address,
      city: ws.city,
      province: ws.province,
      radius: ws.radius,
      scan_type: ws.scanType,
      print_tag: ws.printTag,
      weekly_plan: ws.weeklyPlan,
    });
    if (error) throw error;
  };
  const updateWorkSite = async (id: string, updates: Partial<WorkSite>) => {
    const row: Record<string, any> = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.address !== undefined) row.address = updates.address;
    if (updates.city !== undefined) row.city = updates.city;
    if (updates.province !== undefined) row.province = updates.province;
    if (updates.radius !== undefined) row.radius = updates.radius;
    if (updates.scanType !== undefined) row.scan_type = updates.scanType;
    if (updates.printTag !== undefined) row.print_tag = updates.printTag;
    if (updates.weeklyPlan !== undefined) row.weekly_plan = updates.weeklyPlan;
    const { error } = await supabase.from('work_sites').update(row).eq('id', id);
    if (error) throw error;
  };
  const deleteWorkSite = async (id: string) => {
    const { error } = await supabase.from('work_sites').delete().eq('id', id);
    if (error) throw error;
  };

  const toggleAssignment = async (employeeId: string, workSiteId: string) => {
    const existing = assignments.find(a => a.employeeId === employeeId && a.workSiteId === workSiteId);
    if (existing && existing.id) {
      const { error } = await supabase.from('assignments').delete().eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('assignments').insert({ employee_id: employeeId, work_site_id: workSiteId });
      if (error) throw error;
    }
  };

  const addLeaveRequest = async (req: Omit<LeaveRequest, 'id'>) => {
    const { error } = await supabase.from('leave_requests').insert({
      employee_id: req.employeeId,
      type: req.type,
      start_date: req.startDate,
      end_date: req.endDate,
    });
    if (error) throw error;
  };
  const deleteLeaveRequest = async (id: string) => {
    const { error } = await supabase.from('leave_requests').delete().eq('id', id);
    if (error) throw error;
  };

  const addScheduleEntry = async (entry: Omit<ScheduleEntry, 'id'>) => {
    const { error } = await supabase.from('schedule_entries').insert({
      employee_id: entry.employeeId,
      date: entry.date,
      start_time: entry.startTime,
      end_time: entry.endTime,
      task_description: entry.taskDescription,
      hours: entry.hours,
    });
    if (error) throw error;
  };
  const updateScheduleEntry = async (id: string, updatedFields: Partial<ScheduleEntry>) => {
    const row: Record<string, any> = {};
    if (updatedFields.employeeId !== undefined) row.employee_id = updatedFields.employeeId;
    if (updatedFields.date !== undefined) row.date = updatedFields.date;
    if (updatedFields.startTime !== undefined) row.start_time = updatedFields.startTime;
    if (updatedFields.endTime !== undefined) row.end_time = updatedFields.endTime;
    if (updatedFields.taskDescription !== undefined) row.task_description = updatedFields.taskDescription;
    if (updatedFields.hours !== undefined) row.hours = updatedFields.hours;
    const { error } = await supabase.from('schedule_entries').update(row).eq('id', id);
    if (error) throw error;
  };
  const deleteScheduleEntry = async (id: string) => {
    const { error } = await supabase.from('schedule_entries').delete().eq('id', id);
    if (error) throw error;
  };

  return (
    <AppContext.Provider value={{
      employees, workSites, assignments, leaveRequests, scheduleEntries,
      addEmployee, updateEmployee, deleteEmployee, addWorkSite, updateWorkSite, deleteWorkSite, toggleAssignment,
      addLeaveRequest, deleteLeaveRequest, addScheduleEntry, updateScheduleEntry, deleteScheduleEntry
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
