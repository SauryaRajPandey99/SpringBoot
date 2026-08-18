# Consultant Management System

This project is a Java web application for managing consultant records. It contains a Spring Boot backend, a MySQL database script, and a React frontend.

## Features

- Dashboard with total, new-this-month, active, and inactive consultant counts
- Backend-powered dashboard analytics with today's date, today's additions, technology distribution, experience distribution, and recent additions
- Modern Talent Desk dashboard with a collapsible sidebar, workspace status ribbon, skill map, experience ladder, activity timeline, and action dock
- Dashboard table view with clickable technology and experience filters
- Add consultant form with validation
- Add/edit consultant view with a live record preview
- Responsive consultant table with contact details, filter chips, reset, refresh, sorting, and pagination
- Shortlist view for saving selected consultants and exporting that smaller list
- Onboarded view for consultants connected to Excel or PDF uploads, with source filtering, file names, and latest upload review
- Update and delete consultant workflows
- Excel and text-based PDF import with row-level duplicate and validation reporting
- CSV and PDF download options for consultant lists
- Search by ID, name, email, phone, or technology
- Server-side filtering, sorting, and pagination
- REST API integration from React to Spring Boot
- Spring Security login and account creation
- BCrypt password hashing and token-protected consultant APIs
- Clear frontend message when the backend is not running
- Duplicate checks for consultant name, email, and phone
- SQL script with an empty consultant table
- Spring Boot REST endpoints

## Project Structure

```text
ConsultantManagementSystem/
  backend/      Spring Boot REST API
  frontend/     React + Vite frontend
  database/     MySQL schema script
```

## Database Setup

1. Open MySQL Workbench, phpMyAdmin, or the MySQL command line.
2. Run `database/schema.sql`.
3. Set your MySQL credentials before starting the backend.

Default database name:

```text
consultant_management_system
```

The SQL script creates the database, consultant table, and user account table only. It does not insert consultant records, so you can add all data from the React app.

Passwords must be at least 8 characters and include at least one letter and one number.

## Backend Setup

Requirements:

- Java 17 or later
- Maven
- MySQL

Run the backend:

```bash
cd backend
export DB_USERNAME=root
export DB_PASSWORD=your_mysql_password
mvn spring-boot:run
```

If the backend log says `using password: NO`, the `DB_PASSWORD` value was not set in that terminal.

The API runs at:

```text
http://localhost:8080/api
```

## Frontend Setup

Requirements:

- Node.js 18 or later

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

The frontend uses `VITE_API_BASE_URL=http://localhost:8080/api` by default. You can copy `frontend/.env.example` to `frontend/.env` if you need to change it.

## API Endpoints

| Method | URL | Description |
| --- | --- | --- |
| GET | `/api/consultants` | List consultants with search, pagination, and sorting |
| GET | `/api/consultants/stats` | Dashboard totals |
| GET | `/api/consultants/onboarded` | List consultants imported from Excel or PDF files |
| GET | `/api/consultants/import-template` | Download Excel import template |
| GET | `/api/consultants/{id}` | Get one consultant |
| POST | `/api/consultants` | Add a consultant |
| POST | `/api/consultants/import` | Import consultants from an Excel or PDF file |
| PUT | `/api/consultants/{id}` | Update a consultant |
| DELETE | `/api/consultants/{id}` | Delete a consultant |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in and receive an auth token |

List query examples:

```text
/api/consultants?search=java&page=0&size=5&sortBy=name&direction=asc
```

Excel import accepts the required columns by header name, so files can use common labels such as `Name`, `Email` or `Email ID`, `Phone`, `Technology`, `Experience`, and `Status`. Extra columns are ignored. PDF import supports text-based PDFs where each consultant appears in name, email, phone, technology, experience, and status order. Duplicate rows are not inserted again, but matching consultants are still linked to the upload so they appear in the Onboarded view.

## Submission Checklist

- Source code: included in `backend/` and `frontend/`
- SQL script: `database/schema.sql`
- README: this file
- GitHub repository link: create a GitHub repo, push this folder, and submit the repo link
