export interface WorkDay {
  dayId: number;
  isActive: boolean;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
}

export interface Employee {
  id: string;
  name: string;
  skills: string[];
  priority: number;
  schedule: WorkDay[];
}

export interface Phase {
  start: number;
  end: number;
}

interface RequiredPhases {
  p1: Phase;
  p2: Phase | null;
  p3: Phase | null;
}

interface Service {
  category?: string;
  duration_min?: number;
  durationMin?: number;
  phase1_min?: number;
  phase1Min?: number;
  phase2_min?: number;
  phase2Min?: number;
  phase3_min?: number;
  phase3Min?: number;
}

interface Booking extends Service {
  employee_id?: string;
  status?: string;
  start_time?: string;
  end_time?: string;
  startTime?: string;
  endTime?: string;
  isAppointment?: boolean;
  isManual?: boolean;
  isTotalBlock?: boolean;
  type?: string;
}

const LEAD_TIME_MINUTES = 120;

export const timeToMinutes = (time: string): number => {
  if (!time || !time.includes(":")) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const normalizeCategory = (value: string): string =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const isOverlap = (first: Phase, second: Phase): boolean =>
  first.start < second.end && first.end > second.start;

const isWithinWorkingHours = (schedule: WorkDay, start: number, end: number): boolean => {
  if (!schedule?.isActive) return false;

  const periods = [
    [schedule.morningStart, schedule.morningEnd],
    [schedule.afternoonStart, schedule.afternoonEnd],
  ].filter(([periodStart, periodEnd]) => periodStart && periodEnd);

  return periods.some(([periodStart, periodEnd]) =>
    start >= timeToMinutes(periodStart) && end <= timeToMinutes(periodEnd),
  );
};

const bookingTime = (value?: string): number => {
  if (!value) return 0;
  const time = value.includes("T") ? value.split("T")[1]?.slice(0, 5) : value.slice(0, 5);
  return timeToMinutes(time ?? "");
};

const overlapsRequiredWork = (required: RequiredPhases, occupied: Phase): boolean =>
  isOverlap(required.p1, occupied) || Boolean(required.p3 && isOverlap(required.p3, occupied));

const isEmployeeFree = (
  employeeId: string,
  required: RequiredPhases,
  dayBookings: Booking[],
  schedule: WorkDay,
): boolean => {
  const serviceEnd = required.p3?.end ?? required.p2?.end ?? required.p1.end;
  if (!isWithinWorkingHours(schedule, required.p1.start, serviceEnd)) return false;

  const relevantBookings = dayBookings.filter((booking) =>
    booking.status !== "cancelled" &&
    (booking.employee_id === employeeId || !booking.employee_id || booking.isManual || booking.type === "block"),
  );

  return relevantBookings.every((booking) => {
    const start = bookingTime(booking.start_time ?? booking.startTime);
    const phase1 = Number(booking.phase1_min ?? booking.phase1Min ?? booking.duration_min ?? booking.durationMin ?? 0);
    const phase2 = Number(booking.phase2_min ?? booking.phase2Min ?? 0);
    const phase3 = Number(booking.phase3_min ?? booking.phase3Min ?? 0);
    const derivedEnd = start + phase1 + phase2 + phase3;
    const end = bookingTime(booking.end_time ?? booking.endTime) || derivedEnd;
    const isTotalBlock = booking.isTotalBlock || booking.isManual || booking.type === "block" || booking.isAppointment === false;

    if (isTotalBlock) {
      const block = { start, end };
      return !(
        isOverlap(required.p1, block) ||
        Boolean(required.p2 && isOverlap(required.p2, block)) ||
        Boolean(required.p3 && isOverlap(required.p3, block))
      );
    }

    const occupiedPhase1 = { start, end: start + phase1 };
    if (overlapsRequiredWork(required, occupiedPhase1)) return false;

    if (phase3 > 0) {
      const occupiedPhase3 = { start: end - phase3, end };
      if (overlapsRequiredWork(required, occupiedPhase3)) return false;
    }

    return true;
  });
};

export const calculateAvailability = (
  allSlots: string[],
  service: Service,
  dayBookings: Booking[],
  employees: Employee[],
  selectedDate: Date,
  isToday: boolean,
  currentMinutes: number,
) => {
  const occupied = new Set<string>();
  const assignments: Record<string, string> = {};

  if (!service || !selectedDate) return { occupied: new Set(allSlots), assignments };

  const dayOfWeek = selectedDate.getDay();
  const phase1 = Number(service.phase1_min ?? service.phase1Min ?? service.duration_min ?? service.durationMin ?? 0);
  const phase2 = Number(service.phase2_min ?? service.phase2Min ?? 0);
  const phase3 = Number(service.phase3_min ?? service.phase3Min ?? 0);
  const serviceCategory = normalizeCategory(service.category ?? "");

  const validStaff = employees
    .filter((employee) => {
      const skills = employee.skills.map(normalizeCategory);
      const todaySchedule = employee.schedule?.find((day) => day.dayId === dayOfWeek);
      return skills.includes(serviceCategory) && Boolean(todaySchedule?.isActive);
    })
    .sort((first, second) => first.priority - second.priority);

  for (const slot of allSlots) {
    const slotStart = timeToMinutes(slot);
    if (isToday && slotStart <= currentMinutes + LEAD_TIME_MINUTES) {
      occupied.add(slot);
      continue;
    }

    const required: RequiredPhases = {
      p1: { start: slotStart, end: slotStart + phase1 },
      p2: phase2 > 0 ? { start: slotStart + phase1, end: slotStart + phase1 + phase2 } : null,
      p3: phase3 > 0 ? { start: slotStart + phase1 + phase2, end: slotStart + phase1 + phase2 + phase3 } : null,
    };

    const employee = validStaff.find((candidate) => {
      const schedule = candidate.schedule.find((day) => day.dayId === dayOfWeek);
      return schedule && isEmployeeFree(candidate.id, required, dayBookings, schedule);
    });

    if (employee) assignments[slot] = employee.id;
    else occupied.add(slot);
  }

  return { occupied, assignments };
};
