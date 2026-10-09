# CSC220 Week 11 — Activity 19: Full-Stack Student Manager

React sends HTTP requests to Express; Express uses Mongoose to persist student records in MongoDB. GET is public. POST and DELETE require a JWT issued by login. Passwords are hashed with bcrypt, and tokens expire after one hour.

## Run locally

1. In `server`, run `npm install`. Copy `.env.example` to `.env` if no local `.env` exists. Set `MONGO_URI` to your MongoDB Atlas connection string (or local MongoDB) and `JWT_SECRET` to a random secret. Atlas must allow your current IP.
2. In `server`, run `npm run dev`. The API starts at http://localhost:3000 after MongoDB connects.
3. Register the test account once with Postman or the Register request in `requests.http`: `POST /api/auth/register` with `{"email":"student1@example.com","password":"password123"}`. Registration returns 201 without the password.
4. In a second terminal, open `client`, run `npm install`, then `npm run dev`.
5. Open http://localhost:5173. Login using the account above. Add a student with name, major, and score (0–100). Delete using its card. Logout disables protected actions. Refresh clears login but reloads persisted student data.

Each folder has its own package.json and dependencies. Existing lab projects are separate.

## Verification

- `cd client && npm run build` checks the production React build.
- `cd server && npm test` checks API authentication, CORS, registration/login, validation, GET/POST/DELETE contracts. These tests stub model calls; they do not prove a live MongoDB connection.
- Open React and check Loading students, followed by the student list or No students yet.
- Stop the API and refresh React: Could not load must appear. Restart the API and refresh.
- Add a student, refresh and confirm it persists. Login again, delete the student and refresh to confirm removal.
- Without a token, POST and DELETE must return 401. Invalid JWTs also return 401.
- CORS allows http://localhost:5173. To reproduce the lab CORS exercise, temporarily remove the CORS middleware, restart Express and refresh React; restore it after observing the browser CORS error.

`api.js` centralizes fetch calls, checks HTTP errors, attaches Bearer tokens, and does not parse the empty 204 DELETE response. App loads students with useEffect and updates state immediately after successful additions/deletions. Student cards use MongoDB `_id` keys and show Passed for scores >= 60.

## Submission

Push this folder, including both `server/` and `client/`, to your own GitHub repository. Submit that repository URL and one screenshot of http://localhost:5173 showing saved student data to LMS (Week 11, Activity 19). Never include `.env` or `node_modules`; `.gitignore` excludes both. Do not push coursework to the teacher's repository.
