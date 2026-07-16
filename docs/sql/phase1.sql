-- ===========================================================================
-- Phase 1 Academic Structure & Audit Log Schema
-- ===========================================================================

-- 1. semesters
CREATE TABLE semesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    number INTEGER NOT NULL,
    CONSTRAINT chk_semester_number CHECK (number BETWEEN 1 AND 8)
);

CREATE INDEX ix_semesters_id ON semesters(id);

-- 2. faculty_subject_assignments
CREATE TABLE faculty_subject_assignments (
    faculty_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    CONSTRAINT pk_faculty_subject_assignments PRIMARY KEY (faculty_id, subject_id, semester_id),
    CONSTRAINT fk_assignment_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE RESTRICT,
    CONSTRAINT fk_assignment_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
    CONSTRAINT fk_assignment_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
);

-- Index on faculty_id to optimize faculty dashboard listings of assigned subjects
CREATE INDEX ix_faculty_subject_assignments_faculty_id ON faculty_subject_assignments(faculty_id);

-- 3. student_enrollments
CREATE TABLE student_enrollments (
    student_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    CONSTRAINT pk_student_enrollments PRIMARY KEY (student_id, subject_id, semester_id),
    CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
);

-- Index on student_id to optimize student profile querying for current enrollments
CREATE INDEX ix_student_enrollments_student_id ON student_enrollments(student_id);

-- 4. audit_logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    row_id VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX ix_audit_logs_id ON audit_logs(id);

-- ===========================================================================
-- Trigger Function and Trigger Definition for student_enrollments audit trail
-- ===========================================================================

CREATE OR REPLACE FUNCTION audit_student_enrollments_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INTEGER;
    v_old JSONB;
    v_new JSONB;
BEGIN
    BEGIN
        v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::integer;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        v_old := to_jsonb(OLD);
        v_new := NULL;
        INSERT INTO audit_logs(table_name, row_id, action, old_data, new_data, changed_by, changed_at)
        VALUES ('student_enrollments', OLD.student_id || '-' || OLD.subject_id || '-' || OLD.semester_id, 'delete', v_old, v_new, v_user_id, NOW());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        INSERT INTO audit_logs(table_name, row_id, action, old_data, new_data, changed_by, changed_at)
        VALUES ('student_enrollments', NEW.student_id || '-' || NEW.subject_id || '-' || NEW.semester_id, 'update', v_old, v_new, v_user_id, NOW());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        v_old := NULL;
        v_new := to_jsonb(NEW);
        INSERT INTO audit_logs(table_name, row_id, action, old_data, new_data, changed_by, changed_at)
        VALUES ('student_enrollments', NEW.student_id || '-' || NEW.subject_id || '-' || NEW.semester_id, 'insert', v_old, v_new, v_user_id, NOW());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_student_enrollments
AFTER INSERT OR UPDATE OR DELETE ON student_enrollments
FOR EACH ROW EXECUTE FUNCTION audit_student_enrollments_trigger();
