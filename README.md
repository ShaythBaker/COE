# Travco COE Admin Portal – Developer Guide

This document explains how to:

- Run the frontend ( React + Vite) and Node.js/Express backend.
- Wire frontend pages to backend APIs (auth, profile, permissions, CRUD).
- Use the permission system to show/hide navbar items and protect pages.
- Add new pages/screens using existing components.
- Work with Git branches to avoid pushing directly to `main`.

---

## 1. Tech Stack Overview

### Frontend

- React (Vite-based build)
- React Admin Template
- Redux + Redux-Saga
- React Router v6
- Reactstrap, FullCalendar, Formik, Yup
- Axios (via `helpers/api_helper.jsx`)
- Permissions layer:
  - `/api/access/my-permissions`
  - `usePermissions` hook
  - `RequireModule` component

### Backend

- Node.js + Express
- JWT authentication (`/api/auth/login`)
- Protected routes using `Authorization: Bearer <token>`
- Permissions API:
  - `GET /api/access/my-permissions`
  - Response shape: { ... }

---

## 2. Running the Project

### 2.1 Backend

1. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Configure `.env`:

   ```
   PORT=3025
   JWT_SECRET=your-strong-secret
   JWT_EXPIRES_IN=1d
   ```

3. Start server:
   ```bash
   npm run dev
   ```

### 2.2 Frontend

1. Install:

   ```bash
   cd frontend
   npm install
   ```

2. `.env`:

   ```
   VITE_APP_DEFAULTAUTH=jwt
   VITE_API_URL=http://localhost:3025
   ```

3. Run:
   ```bash
   npm run dev
   ```

---

## 3. Authentication & Session Handling

- Login stores backend response inside `localStorage.authUser`.
- Axios global header updated with Bearer token.
- Logout clears session & Authorization header.

---

## 4. Permissions & Access Control

### Components:

- Redux store: `/src/store/permissions/`
- Hook: `usePermissions`
- Route guard: `RequireModule`
- Sidebar filtering with `hasModule("CODE")`

If unauthorized → Permissions 404 page.

---

## 5. Creating New Pages & Integrating with Backend (CRUD)

Steps:

1. Create backend endpoints.
2. Add helpers in `fakebackend_helper`.
3. Add Redux (actions/reducer/saga).
4. Build UI using Skote components.
5. Wrap page with:
   ```jsx
   <RequireModule moduleCode="MODULE_CODE">
   ```
6. Add route + sidebar item.

---

## 6. Navbar / Sidebar Permissions

Example:

```jsx
{
  hasModule("ACCESS_ROLES") && (
    <li>
      <Link to="/calendar">
        <i className="bx bx-calendar"></i>
        <span>Calendar</span>
      </Link>
    </li>
  );
}
```

---

## 7. 404 Handling

Two layers:

1. Router wildcard (`path="*"`).
2. `RequireModule` returns `<Pages404 />` when user lacks permission.

---

## 8. Git Workflow

1. Always pull before creating new branches.
2. Create branches:
   ```bash
   git checkout -b feature/<name>
   ```
3. Push:
   ```bash
   git push -u origin feature/<name>
   ```
4. Open PR into `main`.
5. Never push directly to main.

---

## 9. Summary

- JWT authentication fully integrated.
- Permission-based navigation + page access control.
- Fast CRUD page creation workflow.
- Safe Git branching model.
