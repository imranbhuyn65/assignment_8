# Daffodil International University (DIU) — Student & Teacher Portal

Full-stack academic ERP built with **Next.js (App Router, TSX)**, **Express.js (TypeScript)**, and **MongoDB (Mongoose)** — configured to run together with a single command.

## Key Features
- **Open account creation**: students and teachers create their own accounts (no fixed/demo accounts).
- **Course Catalog**: teachers add `course code + course name + credit` once; registration, routine and results all reference it.
- **Student menu**: Dashboard, Academic Calendar, Course Registration, Registration/Exam Clearance, Routine, Teaching Evaluation, Live Results, Improvement Apply, Academic Results (SGPA/CGPA), Certificates & Transcripts (printable), Convocation Application.
- **Teacher menu**: Course Catalog, Register Student Courses (one student or all), Mark Input (live result), Academic Calendar, Class Routine, Student Applications (approve/reject), Evaluation Reports (anonymous).
- **Modern login page** with student/teacher switch.
- **Same-origin proxy**: Next.js (3000) proxies `/api/*` to Express (4000) with httpOnly JWT cookies.

## Run in VS Code (easy)

1. Install **Node.js 18+**. (MongoDB install is NOT needed. A built-in database is used and saved in `backend/data`.)
2. VS Code: `File > Open Folder` > select `diu-academic-portal`.
3. Open the terminal (`Ctrl + ` `) and run:

```bash
npm run install:all
npm run dev
```

4. Open **http://localhost:3000**. Click **Create account** as Student or Teacher.

First run downloads the embedded MongoDB once (internet needed), later runs start offline.
Want your own MongoDB? Set `MONGO_URI` in `backend/.env`.
