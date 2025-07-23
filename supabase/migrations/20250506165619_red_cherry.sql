/*
  # BestOfRSA Database Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)
    
    - `services`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `rating` (numeric)
      - `phone` (text)
      - `website` (text)
      - `address` (text)
      - `email` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
*/

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  rating numeric CHECK (rating >= 0 AND rating <= 5),
  phone text,
  website text,
  address text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on services"
  ON services
  FOR SELECT
  TO public
  USING (true);