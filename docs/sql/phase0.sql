-- =============================================================================
-- AttendWise ERP — Phase 0 raw SQL migration
-- Source of truth: this file must match what Alembic actually creates in the DB.
-- =============================================================================

-- 1. roles
CREATE TABLE IF NOT EXISTS roles (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. users
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,           -- UNIQUE constraint
    hashed_password VARCHAR(255) NOT NULL,
    role_id         INTEGER      NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

-- 3. departments
CREATE TABLE IF NOT EXISTS departments (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20)  NOT NULL UNIQUE                       -- UNIQUE constraint
);

-- 4. courses
-- ON DELETE CASCADE: deleting a department removes its courses
CREATE TABLE IF NOT EXISTS courses (
    id            SERIAL PRIMARY KEY,
    department_id INTEGER      NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    code          VARCHAR(50)  NOT NULL
);

-- 5. subjects
-- Unique per (course_id, code) pair — not globally unique
-- ON DELETE CASCADE: deleting a course removes its subjects
CREATE TABLE IF NOT EXISTS subjects (
    id        SERIAL PRIMARY KEY,
    course_id INTEGER      NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name      VARCHAR(255) NOT NULL,
    code      VARCHAR(50)  NOT NULL,
    CONSTRAINT uq_subjects_course_code UNIQUE (course_id, code)
);

-- 6. students
-- user_id: ON DELETE CASCADE — deleting a user removes the student record
-- department_id: ON DELETE RESTRICT — cannot delete a dept that has students
CREATE TABLE IF NOT EXISTS students (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER     NOT NULL UNIQUE              -- one-to-one, UNIQUE
                              REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER     NOT NULL
                              REFERENCES departments(id) ON DELETE RESTRICT,  -- RESTRICT
    roll_number   VARCHAR(50) NOT NULL UNIQUE              -- UNIQUE constraint
);

-- 7. faculty
-- user_id: ON DELETE CASCADE
-- department_id: ON DELETE SET NULL — faculty record survives department deletion
CREATE TABLE IF NOT EXISTS faculty (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL UNIQUE
                          REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL
);

-- 8. parents
-- user_id: ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS parents (
    id      SERIAL  PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE
                    REFERENCES users(id) ON DELETE CASCADE
);

-- 9. student_parents (many-to-many join table)
-- Composite PK. Both FKs CASCADE: removing a student or parent clears the link.
CREATE TABLE IF NOT EXISTS student_parents (
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id  INTEGER NOT NULL REFERENCES parents(id)  ON DELETE CASCADE,
    CONSTRAINT pk_student_parents PRIMARY KEY (student_id, parent_id)
);

-- =============================================================================
-- Seed: base roles (idempotent via ON CONFLICT DO NOTHING)
-- =============================================================================
INSERT INTO roles (name) VALUES
    ('admin'),
    ('faculty'),
    ('student'),
    ('parent')
ON CONFLICT (name) DO NOTHING;
