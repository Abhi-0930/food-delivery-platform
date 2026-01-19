# Bite Buzz

Full‑stack food delivery app with a customer frontend, admin panel, and Node/Express backend.

## Tech
- Frontend: React + Vite
- Admin: React + Vite
- Backend: Node.js + Express + MongoDB

## Setup
1) Install dependencies:
```
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
```

2) Create backend env file: `backend/.env`
```
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Run
Open three terminals:
```
cd backend && npm run server
cd frontend && npm run dev
cd admin && npm run dev
```

Default URLs:
- Frontend: http://localhost:5173
- Admin: http://localhost:5174 (or the port shown in the terminal)
- Backend: http://localhost:4000

## Notes
- Stripe is set up for demo use; COD works out of the box.
