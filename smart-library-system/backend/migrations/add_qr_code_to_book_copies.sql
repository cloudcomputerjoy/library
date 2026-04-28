-- Migration: Add QR Code support to book_copies table
-- Created: 2026-04-16
-- Description: Adds qr_code column for tracking individual book copies with unique QR identifiers

-- Add qr_code column to book_copies table
ALTER TABLE book_copies
ADD COLUMN qr_code VARCHAR(100) UNIQUE;

-- Create index on qr_code for faster lookups
CREATE INDEX idx_book_copies_qr_code ON book_copies(qr_code);

-- Add comment to column
COMMENT ON COLUMN book_copies.qr_code IS 'Unique QR code identifier for individual book copy (format: BK-{timestamp}-{random})';
