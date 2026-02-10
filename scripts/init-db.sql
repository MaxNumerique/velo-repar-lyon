-- Script to enable PostGIS on your local PostgreSQL database
-- Run this in your database console (e.g., pgAdmin or psql)

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- (Optional) Create a spatial index example if you had a 'location' column
-- CREATE INDEX idx_technician_location ON "User" USING GIST (location);
