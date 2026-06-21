# Entity-Relationship Diagram

The canonical source of truth is [`prisma/schema.prisma`](../prisma/schema.prisma).
This diagram renders on GitHub (Mermaid) and mirrors that schema.

```mermaid
erDiagram
    USER ||--o| TUTOR : "is a"
    USER ||--o| STUDENT : "is a"
    USER ||--o| PARENT : "is a"
    USER ||--o{ NOTIFICATION : receives

    TUTOR ||--o{ STUDENT : manages
    TUTOR ||--o{ SCHEDULE : owns
    TUTOR ||--o{ HOMEWORK : assigns
    TUTOR ||--o{ NOTE : writes
    TUTOR ||--o{ PAYMENT : tracks
    TUTOR ||--o{ ANNOUNCEMENT : posts

    PARENT ||--o{ STUDENT : monitors

    STUDENT ||--o{ SCHEDULE : "attends"
    STUDENT ||--o{ ATTENDANCE : "has"
    STUDENT ||--o{ HOMEWORK : "receives"
    STUDENT ||--o{ NOTE : "about"
    STUDENT ||--o{ PAYMENT : "billed"

    SCHEDULE ||--o| ATTENDANCE : "marked by"
    HOMEWORK ||--o| HOMEWORK_SUBMISSION : "completed by"

    USER {
        string id PK
        string clerkId UK
        string email UK
        string firstName
        string lastName
        string imageUrl
        enum   role "TUTOR|STUDENT|PARENT"
    }

    TUTOR {
        string  id PK
        string  userId FK,UK
        string  headline
        string  bio
        string[] subjects
        string  timezone
        decimal hourlyRate
        string  inviteCode UK
    }

    STUDENT {
        string  id PK
        string  tutorId FK
        string  userId FK,UK "nullable until claimed"
        string  parentId FK "nullable"
        string  claimCode UK "nullable"
        string  name
        string  phone
        string  parentPhone
        string  gradeClass
        string  school
        string  subject
        decimal monthlyFee
        string  address
        string  notes
        enum    status "ACTIVE|ARCHIVED"
    }

    PARENT {
        string id PK
        string userId FK,UK "nullable"
        string name
        string phone
        string email
    }

    SCHEDULE {
        string   id PK
        string   tutorId FK
        string   studentId FK
        string   subject
        string   location
        datetime startTime
        datetime endTime
        enum     status "SCHEDULED|COMPLETED|CANCELLED|RESCHEDULED"
        string   seriesId "groups recurring occurrences"
    }

    ATTENDANCE {
        string   id PK
        string   scheduleId FK,UK
        string   studentId FK
        enum     status "PRESENT|ABSENT|RESCHEDULED|CANCELLED"
        string   note
        datetime markedAt
    }

    HOMEWORK {
        string   id PK
        string   tutorId FK
        string   studentId FK
        string   title
        string   description
        datetime dueDate
        enum     priority "LOW|MEDIUM|HIGH"
        enum     status "PENDING|SUBMITTED|COMPLETED|OVERDUE"
        string[] attachments
    }

    HOMEWORK_SUBMISSION {
        string   id PK
        string   homeworkId FK,UK
        string   studentId
        string   content
        string[] attachments
        string   grade
        string   feedback
        datetime submittedAt
    }

    NOTE {
        string id PK
        string tutorId FK
        string studentId FK
        string scheduleId "nullable"
        string content
        enum   visibility "PRIVATE|SHARED"
    }

    PAYMENT {
        string   id PK
        string   tutorId FK
        string   studentId FK
        decimal  amount
        enum     status "PAID|DUE|OVERDUE"
        int      periodMonth "1-12"
        int      periodYear
        datetime dueDate
        datetime paidAt
        string   method
    }

    ANNOUNCEMENT {
        string   id PK
        string   tutorId FK
        string   title
        string   body
        datetime createdAt
    }

    NOTIFICATION {
        string   id PK
        string   userId FK
        enum     type
        string   title
        string   body
        json     data
        boolean  read
    }
```

## Key relationships & constraints

- **`User` is the identity root** (mirrors a Clerk user). A user is _at most one_
  of Tutor / Student / Parent via optional 1:1 relations.
- **`Student.userId` is nullable** — a tutor can add a student before that
  student ever signs up. The student later "claims" the profile with a
  `claimCode`, which links their `userId`.
- **`Tutor.inviteCode`** lets students self-join a tutor during onboarding.
- **`Schedule` is one concrete session.** Recurring classes are expanded into
  many `Schedule` rows sharing a `seriesId` (so "delete series" is possible).
- **`Attendance` is 1:1 with `Schedule`** (`scheduleId` is unique).
- **`Payment` is unique per `(studentId, periodYear, periodMonth)`** — one
  invoice per student per month; "generate invoices" is therefore idempotent.
- **Cascade deletes**: deleting a Tutor or Student cascades to their dependent
  rows (schedules, attendance, homework, notes, payments). Deleting a `User`
  sets dependent `userId`s to null where the profile should survive.
