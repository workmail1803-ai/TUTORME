import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  Wallet,
  BarChart3,
  Megaphone,
  Settings,
  Home,
  Bell,
  type LucideIcon,
} from "lucide-react";

export const APP_NAME = "TutorTrack";
export const APP_DESCRIPTION =
  "The all-in-one platform for private tutors to manage students, schedules, homework, attendance, and payments.";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Tutor portal navigation. */
export const TUTOR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Homework", href: "/homework", icon: BookOpen },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
  { label: "Payments", href: "/payments", icon: Wallet },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Settings", href: "/settings", icon: Settings },
];

/** Student portal navigation. */
export const STUDENT_NAV: NavItem[] = [
  { label: "Home", href: "/portal", icon: Home },
  { label: "Schedule", href: "/portal/schedule", icon: CalendarDays },
  { label: "Homework", href: "/portal/homework", icon: BookOpen },
  { label: "Attendance", href: "/portal/attendance", icon: ClipboardCheck },
  { label: "Notes", href: "/portal/notes", icon: Bell },
  { label: "Payments", href: "/portal/payments", icon: Wallet },
];

export const WEEKDAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
] as const;
