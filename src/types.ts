export type UserRole = 'client' | 'worker' | 'both';

export type TaskStatus =
  | 'OPEN'
  | 'APPLICATIONS_RECEIVED'
  | 'WORKER_SELECTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'Not Recorded'
  | 'Payment Agreed'
  | 'Payment Reported'
  | 'Payment Confirmed by Both Parties'
  | 'Disputed';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  skills: string[];
  portfolioUrl?: string;
  location?: string;
  role: UserRole;
  completedJobs: number;
  rating?: number;
  ratingCount?: number;
  isSuspended?: boolean;
  isAdmin?: boolean;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetNgn: number;
  deadline: string;
  requiredSkills: string[];
  attachmentUrls?: string[];
  clientId: string;
  clientName: string;
  clientPhoto?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  status: TaskStatus;
  paymentStatus: PaymentStatus;
  applicationsCount: number;
  isFlagged?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskApplication {
  id: string;
  taskId: string;
  taskTitle?: string;
  clientId: string;
  workerId: string;
  workerName: string;
  workerPhoto?: string;
  workerBio?: string;
  workerSkills: string[];
  workerCompletedJobs?: number;
  pitch: string;
  proposedDays: number;
  bidAmountNgn: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface JobSubmission {
  id: string;
  taskId: string;
  clientId: string;
  workerId: string;
  submissionNotes: string;
  deliverableUrl?: string;
  revisionFeedback?: string;
  status: 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED';
  createdAt: string;
  updatedAt: string;
}

export interface JobEvent {
  id: string;
  taskId: string;
  clientId?: string;
  workerId?: string;
  authorId: string;
  authorName: string;
  eventType: string;
  note: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  taskId: string;
  clientId: string;
  workerId: string;
  amountNgn: number;
  platformCommissionPercent: number; // default 10% informative
  status: PaymentStatus;
  clientNotes?: string;
  workerNotes?: string;
  updatedAt: string;
}

export interface SafetyReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'task' | 'user' | 'job';
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN';
  adminNotes?: string;
  createdAt: string;
}

export interface UserReview {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  targetUserId: string;
  roleReviewed: 'client' | 'worker';
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface PlatformSetting {
  commissionPercent: number;
  safetyNotice: string;
  updatedAt: string;
}

export const TASK_CATEGORIES = [
  'Graphic Design',
  'Video Editing',
  'Writing and Typing',
  'Social Media Content',
  'Data Entry',
  'Website and Technical Help',
] as const;

export const NIGERIAN_POPULAR_SKILLS = [
  'Canva & Adobe Photoshop',
  'Logo Design & Branding',
  'Shorts & Reels Video Editing',
  'CapCut & Premiere Pro',
  'Copywriting & Content Writing',
  'Virtual Assistant & Data Entry',
  'WordPress & Shopify',
  'React & Web Development',
  'Social Media Management',
  'Transcription & Typing',
  'SEO & Google Search Console',
  'Excel & Google Sheets',
];

export const NIGERIAN_CITIES = [
  'Lagos (Ikeja, Lekki, Yaba)',
  'Abuja (FCT)',
  'Port Harcourt (Rivers)',
  'Ibadan (Oyo)',
  'Enugu (Enugu)',
  'Benin City (Edo)',
  'Kaduna (Kaduna)',
  'Kano (Kano)',
  'Abeokuta (Ogun)',
  'Owerri (Imo)',
  'Remote / Anywhere in Nigeria',
];
