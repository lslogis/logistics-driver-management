-- Migration: Add Centers table and update Requests table
-- Description: Create centers table and add centerId foreign key to requests
-- Date: 2024-12-19

BEGIN;

-- Step 1: Create centers table
CREATE TABLE centers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  location VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for centers table
CREATE INDEX idx_centers_name ON centers(name);
CREATE INDEX idx_centers_is_active ON centers(is_active);

-- Step 2: Insert default centers for existing data
INSERT INTO centers (name, location) VALUES 
  ('기본센터', '미지정'),
  ('서울센터', '서울특별시'),
  ('경기센터', '경기도'),
  ('인천센터', '인천광역시'),
  ('부산센터', '부산광역시'),
  ('대구센터', '대구광역시'),
  ('대전센터', '대전광역시'),
  ('광주센터', '광주광역시'),
  ('울산센터', '울산광역시'),
  ('세종센터', '세종특별자치시');

-- Step 3: Add centerId column to requests table
ALTER TABLE requests 
ADD COLUMN center_id INTEGER;

-- Step 4: Set default center for existing requests
UPDATE requests 
SET center_id = (SELECT id FROM centers WHERE name = '기본센터');

-- Step 5: Add foreign key constraint
ALTER TABLE requests
ADD CONSTRAINT fk_request_center
FOREIGN KEY (center_id) REFERENCES centers(id);

-- Step 6: Make centerId required
ALTER TABLE requests
ALTER COLUMN center_id SET NOT NULL;

-- Step 7: Create index for performance
CREATE INDEX idx_requests_center_id ON requests(center_id);

COMMIT;