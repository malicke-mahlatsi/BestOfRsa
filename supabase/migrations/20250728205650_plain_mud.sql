/*
  # Add INSERT policy for scraping_jobs table

  1. Security Changes
    - Add policy to allow public INSERT access on scraping_jobs table
    - This enables the queue system to create new jobs from the frontend

  2. Policy Details
    - Allows anonymous users to insert scraping jobs
    - Required for the web scraping interface to function properly
*/

-- Add policy to allow public INSERT access on scraping_jobs table
CREATE POLICY "Allow public insert access on scraping_jobs"
  ON scraping_jobs
  FOR INSERT
  TO public
  WITH CHECK (true);