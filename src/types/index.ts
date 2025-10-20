export interface User {
  id: string;
  email: string;
  role: 'admin' | 'tpo' | 'student';
  name: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Student extends User {
  role: 'student';
  branch: string;
  cgpa: number;
  backlogs: number;
  resume?: string;
  phone?: string;
  profileCompleted: boolean;
  isVerified: boolean;
}



export interface TPO extends User {
  role: 'tpo';
  department: string;
}

export interface Admin extends User {
  role: 'admin';
}

export interface JobDrive {
  id: string;
  company: string;
  companyId: string;
  description: string;
  requirements: string[];
  ctc: string;
  location: string;
  deadline: string;
  eligibility: {
    minCGPA: number;
    allowedBranches: string[];
    maxBacklogs: number;
  };
  status: 'active' | 'closed' | 'draft';
  applicants: string[];
  createdAt: string;
  postedBy: string;
  externalApplicationUrl?: string;
}

export interface Internship {
  id: string;
  company: string;
  description: string;
  duration: string;
  stipend: string;
  location: string;
  deadline: string;
  externalLink: string;
  notes?: string;
  createdAt: string;
  postedBy: string;
}

export interface Application {
  id: string;
  studentId: string;
  driveId: string;
  status: 'pending' | 'shortlisted' | 'rejected' | 'selected';
  appliedAt: string;
  notes?: string;
}

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  actionUrl?: string;
  relatedEntity?: {
    type: 'application' | 'drive' | 'user' | 'system';
    id: string;
  };
  metadata?: any;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}