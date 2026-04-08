# SmartBooking

SmartBooking is a full-stack scheduling and booking application.

It helps manage venues, events, and time slots, and includes scheduling optimization features (such as greedy and hill-climbing approaches) to generate efficient schedules.

## What This Project Uses

### Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Shadcn Ui Library

### Backend

- Node.js
- Express
- TypeScript
- Drizzle ORM

### Database

- Relational database managed through Drizzle (configured via `backend/drizzle.config.ts`)

## Project Structure

- `frontend/` - Next.js client application
- `backend/` - API server and scheduling logic

## Setup

### 1. Prerequisites

Make sure you have installed:

- Node.js (LTS recommended)
- npm

### 2. Clone the repository

```bash
git clone <your-repo-url>
cd SmartBooking
```

### 3. Configure environment variables

Copy the example environment files and fill in your values:

- `backend/example.env` -> `backend/.env`
- `frontend/example.env` -> `frontend/.env`

### 4. Install dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

### 5. Run the project

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend (in a new terminal):

```bash
cd frontend
npm run dev
```

Frontend usually runs on `http://localhost:3000`.

## Build

Build backend:

```bash
cd backend
npm run build
```

Build frontend:

```bash
cd frontend
npm run build
```

## Live Link

https://smart-booking-five.vercel.app/

## Notes

- Ensure the backend is running before using frontend features that call the API.
- Update environment variables whenever deployment URLs or database credentials change.
