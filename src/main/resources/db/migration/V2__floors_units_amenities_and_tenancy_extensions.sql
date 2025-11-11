-- V2: Introduce floors/units/amenities and extend existing tenancy for unit assignments
-- This migration is designed to be additive and safe for an existing database.

-- Floors
CREATE TABLE IF NOT EXISTS floors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  property_id BIGINT NOT NULL,
  number INT NOT NULL,
  name VARCHAR(50),
  sort_index INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_property_floor (property_id, number),
  INDEX ix_floors_property (property_id),
  CONSTRAINT fk_floors_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Units
CREATE TABLE IF NOT EXISTS units (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  property_id BIGINT NOT NULL,
  floor_id BIGINT NOT NULL,
  parent_unit_id BIGINT NULL,
  code VARCHAR(50) NOT NULL,
  type ENUM('ROOM','DORM','APARTMENT','FLAT') DEFAULT 'ROOM',
  sharing_type ENUM('PRIVATE','DOUBLE','TRIPLE','QUAD','CUSTOM') DEFAULT 'PRIVATE',
  capacity SMALLINT NOT NULL DEFAULT 1,
  gender_policy ENUM('ANY','MALE','FEMALE') DEFAULT 'ANY',
  rent_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  status ENUM('AVAILABLE','PARTIAL','OCCUPIED','RESERVED','MAINTENANCE') DEFAULT 'AVAILABLE',
  furnished_level ENUM('FURNISHED','SEMI_FURNISHED','UNFURNISHED'),
  attributes JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_floor_code (floor_id, code),
  INDEX ix_units_property (property_id),
  INDEX ix_units_floor (floor_id),
  INDEX ix_units_status (status),
  INDEX ix_units_parent (parent_unit_id),
  CONSTRAINT fk_units_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_units_floor FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE,
  CONSTRAINT fk_units_parent FOREIGN KEY (parent_unit_id) REFERENCES units(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Amenities (master)
CREATE TABLE IF NOT EXISTS amenities (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Unit amenities (join)
CREATE TABLE IF NOT EXISTS unit_amenities (
  unit_id BIGINT NOT NULL,
  amenity_id BIGINT NOT NULL,
  value VARCHAR(100),
  included BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (unit_id, amenity_id),
  CONSTRAINT fk_unitamenities_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
  CONSTRAINT fk_unitamenities_amenity FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Extend existing tenancy table for unit assignments (align with current columns)
-- Only add columns that do not exist yet in your current schema
ALTER TABLE tenancy
  ADD COLUMN unit_id BIGINT NULL,
  ADD COLUMN bed_index SMALLINT NULL;

ALTER TABLE tenancy
  ADD CONSTRAINT fk_tenancy_unit FOREIGN KEY (unit_id) REFERENCES units(id);

CREATE INDEX ix_tenancy_unit ON tenancy (unit_id);

-- Prevent double booking of active tenancies per bed using lease_end_date
-- active_flag = 1 when lease_end_date IS NULL (still active)
ALTER TABLE tenancy
  ADD COLUMN active_flag TINYINT AS (
    CASE WHEN lease_end_date IS NULL THEN 1 ELSE 0 END
  ) STORED;

CREATE UNIQUE INDEX uq_tenancy_unit_bed_active
  ON tenancy (unit_id, bed_index, active_flag);
