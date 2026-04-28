# Categories & Shelves Integration Setup Guide

## Overview
This guide provides complete instructions for setting up the Categories and Shelves management system for the Smart Library. The system allows organizing books into different categories and locations (shelves) for better inventory management.

## What's Been Done

### 1. **Database Tables Created**
- `categories` - Stores book categories with names, descriptions, and colors
- `shelves` - Stores shelf/rack information with locations and capacities
- `books.shelves` - Array column to link books to multiple shelves
- `books.category_id` - Foreign key to link books to categories

### 2. **Backend API Endpoints**

#### Categories Endpoints
- `GET /api/admin/categories` - List all categories
- `POST /api/admin/categories` - Create new category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

#### Shelves Endpoints
- `GET /api/admin/shelves` - List all shelves
- `GET /api/admin/shelves?section=Fiction&floor=1` - Filter by section/floor
- `POST /api/admin/shelves` - Create new shelf
- `PUT /api/admin/shelves/:id` - Update shelf
- `DELETE /api/admin/shelves/:id` - Delete shelf
- `GET /api/admin/shelves/capacity/overview` - Get shelf utilization stats

### 3. **Admin Panel Updates**
- Updated `Books.js` to fetch and display categories and shelves
- Added category dropdown with dynamic data loading
- Added multi-select shelves field
- Form now saves `category_id` and `shelves` array

### 4. **Migration Files**
- Created `/backend/src/migrations/create_categories_shelves.sql.js` with:
  - SQL migration scripts
  - 10 default categories
  - 10 default shelves
  - Indexes for performance

---

## Setup Instructions

### Step 1: Apply Database Migration

Run the migration to create tables and insert default data:

```bash
cd backend
node src/migrations/create_categories_shelves.sql.js
```

Or execute the SQL directly in your Supabase console:

```sql
-- Execute the migration SQL from create_categories_shelves.sql.js
```

### Step 2: Verify Database Connection

Make sure your `.env` file has Supabase credentials:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Restart Backend Server

```bash
npm restart
# or
npm run dev
```

### Step 4: Test API Endpoints

Test categories endpoint:
```bash
curl http://localhost:5000/api/admin/categories
```

Test shelves endpoint:
```bash
curl http://localhost:5000/api/admin/shelves
```

### Step 5: Verify Admin Panel

1. Open the Admin Dashboard
2. Navigate to Books Management
3. Click "Add Book"
4. Verify that:
   - Category dropdown is populated with categories from the database
   - Shelves multi-select is populated with shelves from the database

---

## Default Categories

The system comes with 10 pre-configured categories:

| Category | Color | Description |
|----------|-------|-------------|
| Fiction | #FF6B6B | Novels, stories and other fictional works |
| Non-Fiction | #4ECDC4 | Educational and informational books |
| Science | #45B7D1 | Science and technology books |
| History | #96CEB4 | Historical books and records |
| Technology | #FFEAA7 | Programming and tech books |
| Business | #DFE6E9 | Business and management books |
| Art & Design | #A29BFE | Art, design and creativity books |
| Self-Help | #FD79A8 | Self-improvement and wellness books |
| Reference | #FDCB6E | Reference materials and encyclopedias |
| Children | #74B9FF | Books for children and young readers |

---

## Default Shelves

The system comes with 10 pre-configured shelves:

| Shelf | Rack # | Floor | Section | Capacity |
|-------|--------|-------|---------|----------|
| Main Fiction Shelf | A1 | 1 | Fiction | 50 |
| Reference Shelf | A2 | 1 | Reference | 30 |
| Science Section | B1 | 2 | Science | 40 |
| History Section | B2 | 2 | History | 35 |
| Tech & Programming | C1 | 3 | Technology | 45 |
| Business & Management | C2 | 3 | Business | 40 |
| Art & Design | D1 | 4 | Arts | 30 |
| Children & Young | E1 | 1 | Children | 60 |
| Self-Help & Wellness | E2 | 2 | Self-Help | 25 |
| Featured Display | F1 | 1 | Featured | 20 |

---

## Usage Guide

### Creating a New Category

1. Go to Admin Dashboard → Books Management
2. Click "Add Book"
3. If you don't see your category, click "Create New Category" or use:

```bash
curl -X POST http://localhost:5000/api/admin/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Fantasy",
    "description": "Fantasy novels and fiction",
    "color": "#FF00FF",
    "icon": "fantasy"
  }'
```

### Creating a New Shelf

1. Use the API endpoint:

```bash
curl -X POST http://localhost:5000/api/admin/shelves \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Science Fiction",
    "rack_number": "F2",
    "floor_number": 2,
    "section": "Sci-Fi",
    "capacity": 40,
    "description": "Science fiction books collection"
  }'
```

### Assigning Books to Categories and Shelves

When adding or editing a book:

1. Select a category from the dropdown
2. Select one or more shelves from the multi-select field
3. Save the book

The book will now be linked to the category and displayed on those shelves.

---

## API Response Examples

### Get Categories
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Fiction",
      "description": "Novels and stories",
      "color": "#FF6B6B",
      "icon": null,
      "created_at": "2024-04-22T10:00:00Z",
      "updated_at": "2024-04-22T10:00:00Z"
    }
  ]
}
```

### Get Shelves
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Main Fiction Shelf",
      "rack_number": "A1",
      "floor_number": 1,
      "section": "Fiction",
      "capacity": 50,
      "description": "Primary fiction collection",
      "created_at": "2024-04-22T10:00:00Z",
      "updated_at": "2024-04-22T10:00:00Z"
    }
  ]
}
```

### Get Shelf Capacity Overview
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Main Fiction Shelf",
      "rack_number": "A1",
      "booksCount": 25,
      "capacity": 50,
      "availableCapacity": 25,
      "utilizationPercent": 50
    }
  ]
}
```

---

## Troubleshooting

### Issue: Categories/Shelves dropdown is empty

**Solution:**
1. Check that the migration has been applied
2. Verify Supabase connection is working
3. Check browser console for API errors
4. Ensure backend is running and routes are registered

### Issue: Getting 401/403 error when creating categories/shelves

**Solution:**
1. Make sure you have a valid auth token
2. Verify your user has admin/librarian role
3. Check that `authenticateToken` and `requireLibrarian` middleware are working

### Issue: Cannot delete category/shelf

**Solution:**
1. Categories can't be deleted if they have books - reassign books first
2. Shelves can't be deleted if they have books - move books to other shelves first
3. Verify you have delete permissions

---

## Migration Rollback

If you need to rollback the migration:

```sql
-- Drop tables
DROP TABLE IF EXISTS shelves CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Remove columns from books table
ALTER TABLE books DROP COLUMN IF EXISTS category_id;
ALTER TABLE books DROP COLUMN IF EXISTS shelves;

-- Drop indexes
DROP INDEX IF EXISTS idx_categories_name;
DROP INDEX IF EXISTS idx_shelves_rack_number;
DROP INDEX IF EXISTS idx_books_category_id;
```

---

## Files Modified/Created

### New Files:
- `/backend/src/migrations/create_categories_shelves.sql.js` - Migration script
- `/backend/src/routes/shelves.js` - Shelves API routes
- `/admin/src/pages/Books_Updated.js` - Updated Books component (optional backup)

### Modified Files:
- `/backend/src/routes/admin.js` - Added categories and shelves endpoints
- `/admin/src/pages/Books.js` - Integrated category and shelf selection

---

## Next Steps

1. ✅ Apply database migration
2. ✅ Restart backend
3. ✅ Test API endpoints
4. ✅ Verify admin panel
5. ⚠️ Create/manage your own categories and shelves as needed
6. ⚠️ Assign books to categories and shelves

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API response examples
3. Verify database connection
4. Check backend logs for errors

---

## Version Info

- Created: April 22, 2026
- Status: Production Ready
- Database: Supabase/PostgreSQL
- API: Express.js
- Frontend: React + Material-UI
