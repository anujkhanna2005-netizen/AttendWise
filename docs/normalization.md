# Database Normalization Analysis — Phase 1

This document demonstrates the step-by-step normalization process for the enrollment and subject assignment relationships introduced in Phase 1.

## Unnormalized Form (UNF)

Let's assume a single flat relation representing both student course enrollment and instructor teaching load details:

`StudentFacultySubjectSemesterInfo(student_id, student_name, student_email, student_roll_number, student_dept_id, student_dept_name, faculty_id, faculty_name, faculty_email, subject_id, subject_name, subject_code, course_id, course_name, semester_id, semester_name, semester_number)`

---

## First Normal Form (1NF)

A relation is in **1NF** if it contains only atomic values and there are no repeating groups. All attributes in our table contain atomic values. 

Relation schema:
- `StudentFacultySubjectSemesterInfo` (columns as defined above).

---

## Second Normal Form (2NF)

A relation is in **2NF** if it is in 1NF and contains no **partial dependencies** (no non-key attribute is dependent on a proper subset of any candidate key).

We identify separate primary entities and their attributes:
1. **Student** attributes depend on `student_id`: `student_name`, `student_email`, `student_roll_number`, `student_dept_id`, `student_dept_name`
2. **Faculty** attributes depend on `faculty_id`: `faculty_name`, `faculty_email`
3. **Subject** attributes depend on `subject_id`: `subject_name`, `subject_code`, `course_id`, `course_name`
4. **Semester** attributes depend on `semester_id`: `semester_name`, `semester_number`

To eliminate partial dependencies, we decompose the UNF relation into distinct entity schemas:
- `students(id, name, email, roll_number, department_id, department_name)`
- `faculty(id, name, email)`
- `subjects(id, name, code, course_id, course_name)`
- `semesters(id, name, number)`
- `student_enrollments(student_id, subject_id, semester_id)` (composite PK: `(student_id, subject_id, semester_id)`)
- `faculty_subject_assignments(faculty_id, subject_id, semester_id)` (composite PK: `(faculty_id, subject_id, semester_id)`)

---

## Third Normal Form (3NF)

A relation is in **3NF** if it is in 2NF and has no **transitive dependencies** (no non-key attribute is functionally determined by another non-key attribute).

In the 2NF decomposed tables, transitive dependencies exist:
- In `students`, `department_name` depends on `department_id`, which depends on student `id` (`id -> department_id -> department_name`).
- In `subjects`, `course_name` depends on `course_id`, which depends on subject `id` (`id -> course_id -> course_name`).

To eliminate transitive dependencies, we extract departments and courses into separate relations:
- `departments(id, name, code)`
- `courses(id, name, code, department_id)`
- `students(id, user_id, department_id, roll_number)`
- `subjects(id, name, code, course_id)`

Now, all non-key attributes are directly dependent on the primary keys.

---

## Boyce-Codd Normal Form (BCNF)

A relation is in **BCNF** if for every non-trivial functional dependency `X -> Y`, `X` is a superkey.

Let's inspect our many-to-many academic join tables:
- `student_enrollments(student_id, subject_id, semester_id)`
- `faculty_subject_assignments(faculty_id, subject_id, semester_id)`

For both tables, the only functional dependencies are:
- `(student_id, subject_id, semester_id) ->` (all candidate keys)
- `(faculty_id, subject_id, semester_id) ->` (all candidate keys)

Since there are no non-trivial functional dependencies where the determinant is not a superkey, the relations are fully in **BCNF**.
