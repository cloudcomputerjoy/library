/**
 * Services Index
 * Central export point for all API services
 * Makes it easy to import any service: import { booksService, issuesService } from '../services'
 */

export { default as apiClient, apiClient as api } from './api';

// Services
export { default as booksService } from './booksService';
export { default as issuesService } from './issuesService';
export { default as paymentsService } from './paymentsService';
export { default as userService } from './userService';
export { default as notificationsService } from './notificationsService';
export { default as supabaseAuthService } from './supabaseAuthService';

// Named exports for convenience
export * as Books from './booksService';
export * as Issues from './issuesService';
export * as Payments from './paymentsService';
export * as User from './userService';
export * as Notifications from './notificationsService';

/**
 * Quick reference for all available API services:
 *
 * BOOKS SERVICE (booksService)
 * - searchBooks(query, category, page, limit)
 * - getBookDetail(bookId)
 * - getFeaturedBooks(limit)
 * - getBooksByCategory(category, limit)
 * - getCategories()
 * - bookmarkBook(bookId)
 * - removeBookmark(bookId)
 * - getBookmarkedBooks()
 * - checkBookAvailability(bookId)
 * - reserveBook(bookId)
 * - getReservations()
 * - cancelReservation(reservationId)
 *
 * ISSUES SERVICE (issuesService)
 * - issueBook(bookId, copyId)
 * - renewBook(issueId)
 * - returnBook(issueId, condition)
 * - reportBookDamage(issueId, condition, description)
 * - getBorrowedBooks()
 * - getBorrowingHistory(page, limit)
 * - getTransactionHistory(type, page, limit)
 * - getOverdueBooks()
 * - getIssueDetail(issueId)
 * - returnMultipleBooks(returns)
 * - issueBulkBooks(books)
 * - getIssuingStats()
 *
 * PAYMENTS SERVICE (paymentsService)
 * - getUserFines()
 * - getFinDetail(issueId)
 * - waiveFine(fineId, reason)
 * - initiatePayment(fineIds, method)
 * - verifyPayment(transactionId, provider, providerTransactionId)
 * - getPaymentHistory(page, limit)
 * - getReceipt(paymentId)
 * - downloadReceiptPDF(paymentId)
 * - getSubscriptionStatus()
 * - upgradeToPremium(plan)
 * - cancelSubscription()
 * - getPaymentMethods()
 * - addPaymentMethod(methodData)
 * - removePaymentMethod(methodId)
 * - getPaymentStats()
 *
 * USER SERVICE (userService)
 * - getUserProfile()
 * - updateUserProfile(profileData)
 * - uploadProfilePicture(imageUri)
 * - getUserStats()
 * - getUserPreferences()
 * - updateUserPreferences(preferences)
 * - getNotificationSettings()
 * - updateNotificationSettings(settings)
 * - getContacts()
 * - addEmergencyContact(contactData)
 * - submitSupportTicket(ticketData)
 * - getSupportTickets(page, limit)
 * - getAchievements()
 * - getTrustScore()
 * - registerDeviceForNotifications(deviceToken, platform)
 * - getActiveSessions()
 * - logoutSession(sessionId)
 * - logoutAllSessions()
 * - requestAccountDeletion(reason)
 * - downloadUserData()
 *
 * NOTIFICATIONS SERVICE (notificationsService)
 * - getNotifications(page, limit, unreadOnly)
 * - getUrgentNotifications()
 * - getNotificationDetail(notificationId)
 * - markAsRead(notificationId)
 * - markAllAsRead()
 * - markAsUnread(notificationId)
 * - deleteNotification(notificationId)
 * - deleteAllNotifications()
 * - clearOldNotifications(days)
 * - getNotificationsByType(type, page, limit)
 * - getNotificationStats()
 * - performNotificationAction(notificationId, action)
 * - archiveNotification(notificationId)
 * - snoozeNotification(notificationId, hours)
 * - subscribeToNotifications()
 * - sendTestNotification(notificationData)
 *
 * USAGE EXAMPLES:
 *
 * // Option 1: Import entire service
 * import { booksService } from '../services';
 * const books = await booksService.searchBooks('Harry Potter');
 *
 * // Option 2: Import specific functions
 * import { searchBooks } from '../services';
 * const books = await searchBooks('Harry Potter');
 *
 * // Option 3: Import as namespace
 * import * as Books from '../services';
 * const books = await Books.searchBooks('Harry Potter');
 */
