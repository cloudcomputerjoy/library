// Constants for the admin panel
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  LIBRARIAN: 'librarian',
  STAFF: 'staff',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BLOCKED: 'blocked',
};

export const BOOK_STATUS = {
  AVAILABLE: 'available',
  ISSUED: 'issued',
  DAMAGED: 'damaged',
  LOST: 'lost',
};

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
};

export const FINE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  WAIVED: 'waived',
};

export const PRINT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PRINTING: 'printing',
  READY: 'ready',
  COLLECTED: 'collected',
  REJECTED: 'rejected',
};

// Pages
export const PAGES = {
  DASHBOARD: '/',
  USERS: '/users',
  BOOKS: '/books',
  TRANSACTIONS: '/transactions',
  QR_LOGS: '/qr-logs',
  ATTENDANCE: '/attendance',
  PRINT_SERVICES: '/print-services',
  PAYMENTS: '/payments',
  REPORTS: '/reports',
  AI_INSIGHTS: '/ai-insights',
  SUPPORT: '/support',
  SETTINGS: '/settings',
  SYSTEM_LOGS: '/system-logs',
};
