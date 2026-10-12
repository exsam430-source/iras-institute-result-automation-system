# IRAS API Reference - University of Swat
## Base URL: http://localhost:5000/api/v1

---

## 🔐 Authentication (/auth)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /auth/login | Public | Login |
| POST | /auth/logout | Auth | Logout current device |
| POST | /auth/logout-all | Auth | Logout all devices |
| POST | /auth/refresh-token | Public | Refresh access token |
| GET | /auth/me | Auth | Get current user |
| POST | /auth/forgot-password | Public | Send reset email |
| PATCH | /auth/reset-password/:token | Public | Reset password |
| PATCH | /auth/change-password | Auth | Change password |
| POST | /auth/send-verification | Auth | Send verification email |
| GET | /auth/verify-email/:token | Public | Verify email |
| PATCH | /auth/update-profile | Auth | Update own profile |
| PATCH | /auth/upload-avatar | Auth | Upload own avatar |

## 👥 Users (/users)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /users/stats | Admin | User statistics |
| GET | /users/import-template | Admin/HoD | Download Excel template |
| POST | /users/bulk-import | Admin/HoD | Bulk import from Excel |
| GET | /users | Admin/Director/HoD | List all users |
| POST | /users | Admin/HoD | Create user |
| GET | /users/:id | Admin/Director/HoD | Get single user |
| PATCH | /users/:id | Admin/HoD | Update user |
| DELETE | /users/:id | Admin | Delete (soft) user |
| PATCH | /users/:id/toggle-status | Admin | Toggle active status |
| PATCH | /users/:id/reset-password | Admin | Reset user password |
| PATCH | /users/:id/avatar | Admin | Upload user avatar |

## 👨‍🎓 Students (/students)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /students/my-profile | Student | Own profile |
| GET | /students/my-academic-record | Student | Own academic record |
| GET | /students/my-current-marks | Student | Current semester marks |
| GET | /students/by-semester | Staff | Students by semester |
| GET | /students/by-user/:userId | Admin/HoD | Student by user ID |
| GET | /students | Staff | List all students |
| POST | /students | Admin/HoD | Create student |
| GET | /students/:id | Staff | Get student profile |
| PATCH | /students/:id | Admin/HoD | Update student |
| GET | /students/:id/academic-record | Admin/HoD | Academic record |

## 🏛️ Institutes (/institutes)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /institutes | Auth | List all institutes |
| POST | /institutes | Admin | Create institute |
| GET | /institutes/:id | Auth | Get institute |
| PATCH | /institutes/:id | Admin | Update institute |
| DELETE | /institutes/:id | Admin | Delete (soft) |
| PATCH | /institutes/:id/assign-director | Admin | Assign director |
| GET | /institutes/:id/departments | Auth | Get departments |
| GET | /institutes/:id/statistics | Auth | Statistics |
| PATCH | /institutes/:id/logo | Admin | Upload logo |

## 🏢 Departments (/departments)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /departments | Auth | List all |
| POST | /departments | Admin | Create |
| GET | /departments/:id | Auth | Get single |
| PATCH | /departments/:id | Admin/Director | Update |
| DELETE | /departments/:id | Admin | Delete (soft) |
| PATCH | /departments/:id/assign-hod | Admin/Director | Assign HoD |
| GET | /departments/:id/teachers | Auth | Get teachers |
| GET | /departments/:id/students | Auth | Get students |
| GET | /departments/:id/statistics | Auth | Statistics |

## 📚 Programs (/programs)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /programs | Auth | List all |
| POST | /programs | Admin/Director | Create |
| GET | /programs/:id | Auth | Get single |
| PATCH | /programs/:id | Admin/Director | Update |
| DELETE | /programs/:id | Admin | Delete (soft) |
| GET | /programs/:id/courses | Auth | Get courses |

## 📅 Sessions (/sessions)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /sessions | Auth | List all |
| POST | /sessions | Admin | Create |
| GET | /sessions/:id | Auth | Get single |
| PATCH | /sessions/:id | Admin/HoD | Update |
| DELETE | /sessions/:id | Admin | Delete |
| GET | /sessions/:id/students | Auth | Get students |

## 📖 Courses (/courses)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /courses | Auth | List all |
| POST | /courses | Admin/HoD | Create |
| POST | /courses/bulk | Admin | Bulk create |
| GET | /courses/semester/:semester | Auth | By semester |
| GET | /courses/:id | Auth | Get single |
| PATCH | /courses/:id | Admin/HoD | Update |
| DELETE | /courses/:id | Admin/Director | Delete |

## 📋 Course Assignments (/course-assignments)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /course-assignments/teacher-dashboard | Teacher | Teacher dashboard |
| GET | /course-assignments/hod-pending | Admin/HoD | Pending results |
| GET | /course-assignments | Staff | List all |
| POST | /course-assignments | Admin/HoD | Assign course |
| GET | /course-assignments/:id | Staff | Get single |
| PATCH | /course-assignments/:id | Admin/HoD | Update |
| DELETE | /course-assignments/:id | Admin/HoD | Delete |
| GET | /course-assignments/:id/award-list | Admin/HoD/Teacher | Award list |
| POST | /course-assignments/:id/award-list/regenerate | Admin/HoD | Regenerate |
| GET | /course-assignments/:id/award-list/export | Admin/HoD/Teacher | Export Excel |
| GET | /course-assignments/:id/students | Staff | Enrolled students |
| POST | /course-assignments/:id/submit | Teacher | Submit to HoD |
| POST | /course-assignments/:id/approve | Admin/HoD | Approve result |
| POST | /course-assignments/:id/reject | Admin/HoD | Reject result |

## 📊 Marks (/marks)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /marks/student/current | Student | Own current marks |
| GET | /marks/student/:studentId/all | Staff/Student | All marks |
| GET | /marks/student/:studentId/semester/:sem | Staff/Student | Semester marks |
| GET | /marks/:id | Auth | Single mark record |
| PATCH | /marks/:marksId/update | Admin/Teacher | Update single |
| GET | /marks/assignment/:id | Staff | Assignment marks |
| PATCH | /marks/assignment/:id/save-midterm | Teacher | Save mid-term |
| PATCH | /marks/assignment/:id/save-finals | Teacher | Save finals |
| POST | /marks/assignment/:id/import | Teacher | Import from Excel |

## 🎓 Semester Results (/semester-results)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /semester-results/calculate | Admin/HoD | Calculate results |
| POST | /semester-results/publish | Admin/HoD | Publish results |
| GET | /semester-results/statistics | Admin/HoD | Statistics |
| GET | /semester-results/department | Admin/HoD | Department results |
| GET | /semester-results/my-results | Student | Own results |
| GET | /semester-results/student/:studentId | Staff | Student results |
| GET | /semester-results/student/:studentId/semester/:sem | Auth | Specific semester |

## 🚀 Promotion (/promotion)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /promotion/check-eligibility | Admin/HoD | Check eligibility |
| GET | /promotion/preview | Admin/HoD | Preview promotion |
| POST | /promotion/initiate | Admin/HoD | Execute promotion |
| GET | /promotion/history | Admin/HoD | History |

## 📜 Transcripts (/transcripts)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /transcripts/current | Student | Current semester |
| GET | /transcripts/complete | Student | Complete transcript |
| GET | /transcripts/download | Student | Download PDF |
| GET | /transcripts/student/:id/current | Admin/HoD | Student current |
| GET | /transcripts/student/:id/complete | Admin/HoD | Student complete |
| GET | /transcripts/student/:id/semester/:sem | Auth | Specific semester |
| GET | /transcripts/student/:id/download | Admin/HoD | Download PDF |

## 🔔 Notifications (/notifications)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /notifications | Auth | Get notifications |
| GET | /notifications/unread-count | Auth | Unread count |
| PATCH | /notifications/read-all | Auth | Mark all read |
| PATCH | /notifications/:id/read | Auth | Mark single read |
| DELETE | /notifications/:id | Auth | Delete |
| POST | /notifications/announcement | Admin/HoD | Send announcement |

## 📈 Analytics (/analytics)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /analytics/admin/overview | Admin | Admin dashboard |
| GET | /analytics/hod/overview | Admin/HoD | HoD dashboard |
| GET | /analytics/teacher/overview | Admin/HoD/Teacher | Teacher dashboard |
| GET | /analytics/student/overview | Admin/HoD/Student | Student dashboard |
| GET | /analytics/results/distribution | Staff | Grade distribution |
| GET | /analytics/results/gpa-trends | Admin/HoD | GPA trends |
| GET | /analytics/students/performance | Admin/HoD | Performance |
| GET | /analytics/institute/:id | Admin/Director | Institute analytics |

## ⚙️ Settings (/settings)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /settings | Auth | Get settings |
| PATCH | /settings | Admin | Update settings |
| PATCH | /settings/grading-scale | Admin | Update grading scale |
| PATCH | /settings/transcript | Admin | Transcript settings |
| PATCH | /settings/logo | Admin | Upload logo |

## 🔍 Audit Logs (/audit-logs)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /audit-logs | Admin | All logs |
| GET | /audit-logs/user/:userId | Admin | Logs by user |

---
## Total: 103 API Endpoints