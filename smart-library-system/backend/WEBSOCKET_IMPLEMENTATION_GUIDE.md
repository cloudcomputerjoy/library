# WebSocket Real-Time Events Implementation Guide

## 🎯 Overview

This guide shows how to emit real-time events from backend controllers when database operations occur. These events are automatically received by the admin dashboard and displayed in real-time.

---

## 📦 Quick Setup

### Step 1: Import Socket Event Emitter in Your Controller

```javascript
const { emitBookAdded, emitBookIssued, emitFineCreated } = require('../config/socketEvents');
```

### Step 2: Emit Event After Database Operation

```javascript
// When adding a book
const book = await supabase.from('books').insert({...}).select();
emitBookAdded(book);

// When issuing a book
const transaction = await createTransaction();
emitBookIssued(transaction);

// When creating a fine
const fine = await createFine();
emitFineCreated(fine);
```

### Step 3: Events Automatically Show in Admin Dashboard

✅ Done! The event is sent to all connected admin users in real-time.

---

## 📚 Available Socket Events

### Book Events

#### `emitBookAdded(bookData)`
Emit when a book is added to the library.

```javascript
const book = { id: 1, title: 'React Handbook', author: 'Kyle Simpson', isbn: '123-456' };
emitBookAdded(book);
// Result: Admin sees "New book added: React Handbook" in notifications
```

#### `emitBookUpdated(bookData)`
Emit when a book is updated.

```javascript
const book = { id: 1, title: 'React Guide (Updated)', ...rest };
emitBookUpdated(book);
// Result: Admin sees "Book updated: React Guide (Updated)"
```

#### `emitBookDeleted(bookId, bookTitle)`
Emit when a book is deleted.

```javascript
emitBookDeleted(bookId, 'React Handbook');
// Result: Admin sees "Book deleted: React Handbook"
```

#### `emitBookAvailabilityChanged(bookId, availableCopies, totalCopies)`
Emit when book availability changes.

```javascript
emitBookAvailabilityChanged(1, 5, 10);
// Result: Dashboard shows book availability updated
```

---

### Transaction Events

#### `emitBookIssued(transactionData)`
Emit when a book is issued to a user.

```javascript
const transaction = {
  id: 123,
  userId: 'user-001',
  userName: 'John Doe',
  bookTitle: 'React Handbook',
  dueDate: '2026-05-20',
};
emitBookIssued(transaction);
// Result: 
// - Admin sees "John Doe borrowed React Handbook" in activity
// - User sees "You have successfully borrowed React Handbook"
```

#### `emitBookReturned(transactionData)`
Emit when a book is returned by a user.

```javascript
const transaction = {
  id: 123,
  userId: 'user-001',
  userName: 'John Doe',
  bookTitle: 'React Handbook',
};
emitBookReturned(transaction);
// Result:
// - Admin sees "John Doe returned React Handbook" in activity
// - User sees "Thank you for returning React Handbook"
```

---

### Fine Events

#### `emitFineCreated(fineData)`
Emit when a fine is created for a user.

```javascript
const fine = {
  id: 'fine-001',
  userId: 'user-001',
  userName: 'Jane Smith',
  amount: 50,
  reason: 'Overdue book',
  dueDate: '2026-05-30',
};
emitFineCreated(fine);
// Result:
// - Admin sees "Fine created: ₹50 for Jane Smith"
// - User sees "You have a fine of ₹50"
```

#### `emitFinePaid(fineData)`
Emit when a fine is paid.

```javascript
const fine = { id: 'fine-001', userId: 'user-001', userName: 'Jane Smith', amount: 50 };
emitFinePaid(fine);
// Result:
// - Admin sees "Fine paid: ₹50 by Jane Smith"
// - User sees "Fine payment of ₹50 received successfully"
```

#### `emitFineWaived(fineData)`
Emit when a fine is waived/forgiven.

```javascript
emitFineWaived(fine);
// Result: User sees "Your fine of ₹50 has been waived"
```

---

### User Events

#### `emitUserCreated(userData)`
Emit when a new user is created/registered.

```javascript
const user = { id: 'user-123', email: 'john@example.com', role: 'student' };
emitUserCreated(user);
// Result: Admin sees "New user created: john@example.com"
```

#### `emitUserUpdated(userData)`
Emit when user profile is updated.

```javascript
emitUserUpdated(userData);
// Result: Admin sees "User updated: john@example.com"
```

#### `emitUserStatusChanged(userId, status)`
Emit when user status changes (active/inactive).

```javascript
emitUserStatusChanged('user-123', 'inactive');
// Result: Admin sees "User status changed to inactive"
```

---

### Notification Events

#### `emitNotification(userId, notificationData)`
Send notification to a specific user.

```javascript
const notification = {
  type: 'info',
  title: 'Book Due Tomorrow',
  message: 'Your book "React Guide" is due tomorrow',
};
emitNotification('user-001', notification);
// Result: Specific user receives notification in real-time
```

#### `emitBulkNotification(userIds, notificationData)`
Send notification to multiple users.

```javascript
const userIds = ['user-001', 'user-002', 'user-003'];
const notification = {
  type: 'announcement',
  title: 'Library Closed Tomorrow',
  message: 'Library will be closed for maintenance',
};
emitBulkNotification(userIds, notification);
// Result: All 3 users receive notification
```

#### `emitNotificationToRole(role, notificationData)`
Send notification to all users with specific role.

```javascript
const notification = {
  type: 'system',
  title: 'System Maintenance',
  message: 'System will be down for 1 hour tonight',
};
emitNotificationToRole('admin', notification);
// Result: All admin users receive notification
```

---

### Print Job Events

#### `emitPrintJobCreated(printJobData)`
Emit when a new print job is created.

```javascript
const printJob = {
  id: 'print-123',
  userId: 'user-001',
  pageCount: 15,
  status: 'pending',
};
emitPrintJobCreated(printJob);
// Result:
// - Admin sees "New print job: 15 pages"
// - User sees "Your print job has been queued"
```

#### `emitPrintJobStatusUpdated(printJobData)`
Emit when print job status changes.

```javascript
const printJob = { id: 'print-123', userId: 'user-001', status: 'completed' };
emitPrintJobStatusUpdated(printJob);
// Result: User sees "Your print job is completed"
```

---

### Support Ticket Events

#### `emitSupportTicketCreated(ticketData)`
Emit when a new support ticket is created.

```javascript
const ticket = {
  id: 'ticket-001',
  userId: 'user-001',
  subject: 'Cannot reset password',
};
emitSupportTicketCreated(ticket);
// Result: Admin sees "New support ticket: Cannot reset password"
```

#### `emitSupportTicketReplied(ticketData, replyData)`
Emit when support ticket is replied.

```javascript
const ticket = { id: 'ticket-001', userId: 'user-001' };
const reply = { message: 'Please check your email for reset link' };
emitSupportTicketReplied(ticket, reply);
// Result: User sees "New reply to your support ticket"
```

---

### Payment Events

#### `emitPaymentProcessed(paymentData)`
Emit when a payment is processed.

```javascript
const payment = {
  id: 'payment-001',
  userId: 'user-001',
  amount: 100,
  referenceId: 'TXN-123456',
};
emitPaymentProcessed(payment);
// Result:
// - Admin sees "Payment received: ₹100"
// - User sees "Payment of ₹100 received successfully"
```

---

### Attendance Events

#### `emitUserEntry(entryData)`
Emit when a user enters the library.

```javascript
const entry = {
  userId: 'user-001',
  userName: 'John Doe',
  entryTime: new Date(),
};
emitUserEntry(entry);
// Result: Admin sees "John Doe entered at 10:30 AM"
```

#### `emitUserExit(exitData)`
Emit when a user exits the library.

```javascript
const exit = {
  userId: 'user-001',
  userName: 'John Doe',
  exitTime: new Date(),
};
emitUserExit(exit);
// Result: Admin sees "John Doe left the library at 11:00 AM"
```

---

### Generic Events

#### `emitToUser(userId, eventName, data)`
Send custom event to specific user.

```javascript
emitToUser('user-001', 'custom:event', { message: 'Hello' });
```

#### `emitToRole(role, eventName, data)`
Send custom event to users with specific role.

```javascript
emitToRole('admin', 'custom:alert', { message: 'System alert' });
```

#### `broadcast(eventName, data)`
Broadcast event to all connected users.

```javascript
broadcast('system:update', { message: 'System updated' });
```

---

## 💡 Real-World Examples

### Example 1: Book Addition Workflow

**Controller: admin/books.js**

```javascript
const { emitBookAdded, emitBulkNotification } = require('../config/socketEvents');

exports.addBook = async (req, res) => {
  try {
    const { title, author, isbn } = req.body;

    // Add to database
    const { data: book, error } = await supabase
      .from('books')
      .insert([{ title, author, isbn }])
      .select()
      .single();

    if (error) throw error;

    // EMIT: Book added event (visible in admin dashboard)
    emitBookAdded(book);

    // EMIT: Notification to all students (new book available)
    emitBulkNotification(
      await getStudentIds(), // fetch list of student IDs
      {
        type: 'info',
        title: `New Book Available`,
        message: `"${title}" by ${author} is now available`,
      }
    );

    res.json({ success: true, book });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Result:**
- ✅ Admin sees "New book added: React Handbook" in notifications
- ✅ All students see notification "New Book Available"
- ✅ Dashboard activity shows the event

### Example 2: Fine Creation Workflow

**Controller: admin/fines.js**

```javascript
const { emitFineCreated, emitNotification } = require('../config/socketEvents');

exports.createFine = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    // Create fine in database
    const { data: fine, error } = await supabase
      .from('fines')
      .insert([{
        user_id: userId,
        amount,
        reason,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) throw error;

    // Get user info
    const user = await getUserById(userId);

    // EMIT: Fine created (admin sees it)
    emitFineCreated({
      id: fine.id,
      userId,
      userName: user.full_name,
      amount,
      reason,
    });

    // EMIT: Notification to user about fine
    emitNotification(userId, {
      type: 'warning',
      title: 'Fine Created',
      message: `A fine of ₹${amount} has been created for you`,
    });

    res.json({ success: true, fine });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Result:**
- ✅ Admin sees "Fine created: ₹500 for John Doe"
- ✅ User gets notification "A fine of ₹500 has been created for you"
- ✅ Fine appears in pending fines section

### Example 3: Book Issue Workflow

**Controller: issue.js**

```javascript
const { emitBookIssued, emitBookAvailabilityChanged } = require('../config/socketEvents');

exports.completeIssuance = async (req, res) => {
  try {
    const { transactionId, bookId } = req.body;

    // Update transaction status
    const { data: transaction, error: transError } = await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', transactionId)
      .select()
      .single();

    if (transError) throw transError;

    // Update book availability
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('available_copies, total_copies')
      .eq('id', bookId)
      .single();

    // EMIT: Book issued (admin sees activity)
    emitBookIssued({
      id: transaction.id,
      userId: transaction.user_id,
      userName: transaction.user_name,
      bookTitle: transaction.book_title,
      dueDate: transaction.due_date,
    });

    // EMIT: Availability changed
    emitBookAvailabilityChanged(
      bookId,
      book.available_copies - 1,
      book.total_copies
    );

    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Result:**
- ✅ Admin sees "John borrowed React Handbook" in activity
- ✅ Dashboard book availability updates in real-time
- ✅ User gets notification "You have successfully borrowed..."

---

## 🔌 Integration Checklist

For each controller that modifies data:

- [ ] Import socket event function at top of file
- [ ] After successful database operation, emit appropriate event
- [ ] Provide meaningful data for the event (IDs, names, amounts, etc.)
- [ ] Test in admin dashboard to see real-time updates
- [ ] Verify user notifications appear in real-time

---

## 📋 Socket Event Function Reference

| Function | Purpose | Who Receives | Use When |
|----------|---------|--------------|----------|
| `emitBookAdded` | Book added to system | Admins + Dashboard | After book insert |
| `emitBookIssued` | Book issued to user | Admin, User, Dashboard | After transaction created |
| `emitBookReturned` | Book returned | Admin, User, Dashboard | After return processed |
| `emitFineCreated` | Fine issued | Admin, User, Dashboard | After fine insert |
| `emitFinePaid` | Fine paid | Admin, User | After payment success |
| `emitUserCreated` | New user registered | Admin, Dashboard | After user insert |
| `emitNotification` | Direct user notification | Specific user | For immediate alerts |
| `emitBulkNotification` | Multiple user notification | Specific users | For bulk alerts |
| `emitNotificationToRole` | Role-based notification | Users by role | For role-wide announcements |
| `emitPrintJobCreated` | Print job queued | Admin, User, Dashboard | After print job insert |
| `emitUserEntry` | User entered library | Admin, Dashboard | After entry scan |
| `emitUserExit` | User left library | Admin, Dashboard | After exit scan |

---

## 🧪 Testing

### Test 1: Verify Event Emission

```javascript
// In your controller
const { emitBookAdded } = require('../config/socketEvents');

exports.testEmit = async (req, res) => {
  const testBook = { id: 1, title: 'Test Book', author: 'Test Author' };
  emitBookAdded(testBook);
  res.json({ message: 'Event emitted' });
};
```

Then in admin dashboard, you should see:
1. Notification appears in real-time
2. Activity log shows the event
3. Dashboard updates if applicable

### Test 2: User Receives Notification

```javascript
// Send notification to user
const { emitNotification } = require('../config/socketEvents');

emitNotification('user-123', {
  type: 'info',
  title: 'Test Notification',
  message: 'This is a test',
});
```

Check in frontend:
1. Notification bell shows unread count
2. Notification appears in dropdown
3. Click to expand shows full message

### Test 3: Verify WebSocket Connection

In browser console:

```javascript
// Check if WebSocket is connected
socket?.connected  // Should be true
socket?.id         // Should have a socket ID
```

Check Network tab for WebSocket handshake.

---

## ⚠️ Common Mistakes

❌ **Don't:** Emit without checking if operation succeeded
```javascript
// WRONG
emitBookAdded(book);
await supabase.from('books').insert(book);  // What if this fails?
```

✅ **Do:** Emit after successful database operation
```javascript
// RIGHT
const { data: book, error } = await supabase.from('books').insert(book).select();
if (!error) {
  emitBookAdded(book);
}
```

---

❌ **Don't:** Emit to all users for sensitive operations
```javascript
// WRONG - Everyone sees financial info
broadcast('payment:processed', sensitivePaymentData);
```

✅ **Do:** Emit to appropriate role/user only
```javascript
// RIGHT - Only admin and the user see it
emitToUser(userId, 'payment:processed', paymentData);
emitToRole('admin', 'payment:processed', paymentData);
```

---

## 📞 Troubleshooting

### Events Not Appearing in Dashboard

1. Check WebSocket connection in browser DevTools
2. Verify Socket.IO is initialized: `console.log(io)` in server logs
3. Check event is emitted after operation succeeds
4. Verify JWT token is valid for authentication
5. Check CORS_ORIGIN includes your frontend URL

### Notifications Not Reaching User

1. Verify user is connected to WebSocket
2. Check `emitNotification` is using correct `userId`
3. Ensure user has active connection (if page is refreshed, connection is reset)
4. Check browser notifications are enabled

### Real-Time Not Working

1. Restart backend server
2. Clear admin dashboard cache
3. Check Socket.IO package version matches frontend
4. Verify websocket transports are enabled in socket.js

---

## 🚀 Next Steps

1. ✅ Add socket event emissions to all controllers that modify data
2. ✅ Test with admin dashboard open
3. ✅ Verify notifications appear for users
4. ✅ Monitor server logs for event emissions
5. ✅ Deploy to production

**Status: WebSocket setup COMPLETE** ✅
