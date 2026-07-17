# Entity Relationship Diagram (ERD) — Phase 2a

The following Mermaid diagram represents the complete entity relationship structure for the AttendWise database as of Phase 2a (Timetable Module).

```mermaid
erDiagram
    roles {
        int id PK
        string name UNIQUE
    }

    users {
        int id PK
        string email UNIQUE
        string hashed_password
        int role_id FK
        timestamp created_at
    }

    departments {
        int id PK
        string name
        string code UNIQUE
    }

    courses {
        int id PK
        int department_id FK
        string name
        string code UNIQUE
    }

    subjects {
        int id PK
        int course_id FK
        string name
        string code UNIQUE
    }

    students {
        int id PK
        int user_id FK
        int department_id FK
        string roll_number UNIQUE
    }

    faculty {
        int id PK
        int user_id FK
        int department_id FK "nullable"
    }

    parents {
        int id PK
        int user_id FK
    }

    student_parents {
        int student_id PK, FK
        int parent_id PK, FK
    }

    semesters {
        int id PK
        string name
        int number "1-8"
    }

    faculty_subject_assignments {
        int faculty_id PK, FK
        int subject_id PK, FK
        int semester_id PK, FK
    }

    student_enrollments {
        int student_id PK, FK
        int subject_id PK, FK
        int semester_id PK, FK
    }

    audit_logs {
        int id PK
        string table_name
        string row_id
        string action
        jsonb old_data
        jsonb new_data
        int changed_by FK
        timestamp changed_at
    }

    timetable_slots {
        int id PK
        int faculty_id FK
        int subject_id FK
        int semester_id FK
        string room
        int day_of_week "0-6"
        time start_time
        time end_time
    }

    attendance_records {
        int id PK
        int student_id FK
        int timetable_slot_id FK
        date date
        string status
        int marked_by FK "nullable"
        timestamp created_at
        timestamp updated_at
    }

    users ||--o{ roles : "has"
    students ||--|| users : "is a"
    faculty ||--|| users : "is a"
    parents ||--|| users : "is a"
    students }o--|| departments : "belongs to"
    faculty }o--|| departments : "assigned to"
    courses }o--|| departments : "offered by"
    subjects }o--|| courses : "belongs to"
    student_parents }o--|| students : "links"
    student_parents }o--|| parents : "links"
    faculty_subject_assignments }o--|| faculty : "assigned to"
    faculty_subject_assignments }o--|| subjects : "covers"
    faculty_subject_assignments }o--|| semesters : "in"
    student_enrollments }o--|| students : "enrolls"
    student_enrollments }o--|| subjects : "for"
    student_enrollments }o--|| semesters : "in"
    timetable_slots }o--|| faculty : "scheduled for"
    timetable_slots }o--|| subjects : "teaches"
    timetable_slots }o--|| semesters : "during"
    attendance_records }o--|| students : "tracks (RESTRICT)"
    attendance_records }o--|| timetable_slots : "schedules (RESTRICT)"
    attendance_records }o--|| faculty : "marked by (SET NULL)"
    audit_logs }o--|| users : "modified by"
```

