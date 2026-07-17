-- ===========================================================================
-- Phase 2a Timetable Module Schema
-- ===========================================================================

-- 1. timetable_slots
CREATE TABLE timetable_slots (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    room VARCHAR(50) NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT chk_timetable_times CHECK (end_time > start_time)
);

CREATE INDEX ix_timetable_slots_id ON timetable_slots(id);

-- 2. btree_gist Extension configuration
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 3. Immutable Range Construction helper function (Required for EXCLUDE constraint on index expressions)
CREATE OR REPLACE FUNCTION make_tsrange(start_time TIME, end_time TIME)
RETURNS tsrange AS $$
BEGIN
    RETURN tsrange(('2000-01-01 ' || start_time)::timestamp, ('2000-01-01 ' || end_time)::timestamp);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. EXCLUDE constraints for double booking prevention:
-- Exclude Constraint A: A faculty member cannot be double-booked on the same day during overlapping time slots
ALTER TABLE timetable_slots
ADD CONSTRAINT uq_faculty_schedule_overlap EXCLUDE USING gist (
    faculty_id WITH =,
    day_of_week WITH =,
    make_tsrange(start_time, end_time) WITH &&
);

-- Exclude Constraint B: A room cannot be double-booked on the same day during overlapping time slots
ALTER TABLE timetable_slots
ADD CONSTRAINT uq_room_schedule_overlap EXCLUDE USING gist (
    room WITH =,
    day_of_week WITH =,
    make_tsrange(start_time, end_time) WITH &&
);
