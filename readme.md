# Custom URL Shortener

A full-stack URL shortener with analytics tracking, authentication, and a user-friendly dashboard.

## Link: [https://tao-url-shortner-ui.vercel.app/](https://tao-url-shortner-ui.vercel.app/)

## Features
- Shorten URLs with optional custom aliases.
- Track URL analytics (clicks, unique visitors, device type, location, etc.).
- Google authentication.
- Topic-based URL categorization.
- Real-time updates and caching for performance.

---

## Tech Stack
### Backend:
- Node.js, Express
- MongoDB, Redis
- JWT Authentication, Google Sign in
- Docker
- Render (Backend Deployment)

### Frontend:
- React, TypeScript
- Tailwind CSS
- React Router
- Docker
- Vercel (Frontend Deployment)

---

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Docker (optional, for containerized setup)

### Backend Setup
1. Clone the repository and navigate to the backend folder:
   ```sh
   git clone <repo-url>
   cd backend_js
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and add the following environment variables:
   ```env
   PORT=5000
   MONGO_URI=<your-mongodb-uri>
   JWT_SECRET=<your-secret>
   REDIS_HOST=<redis-host>
   REDIS_PORT=6379
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   CALLBACK_URL=<your-callback-url>
   SESSION_SECRET=<your-session-secret>
   ```
4. Start the backend server:
   ```sh
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend folder:
   ```sh
   cd ../UI_ts
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Update `vite.config.ts` to use the correct backend URL.
4. Start the frontend:
   ```sh
   npm run dev
   ```

---

## Deployment

### Backend Deployment (Render)
1. Push the backend code to GitHub.
2. Create a new Render Web Service and link it to the repository.
3. Set up environment variables in Render.
4. Deploy!

### Frontend Deployment (Vercel)
1. Push the frontend code to GitHub.
2. Connect the repository to Vercel.
3. Configure environment variables in Vercel.
4. Deploy!

---

## API Documentation
### Base URL: `https://tao-backend-js.onrender.com`
### UI URL: `https://tao-url-shortner-ui.vercel.app/`

## Authentication

### Google OAuth Authentication
- **Endpoint:** `GET /auth/google`
- **Description:** Redirects user to Google authentication page.

- **Endpoint:** `GET /auth/google/callback`
- **Description:** Handles Google authentication callback and generates a JWT token.

- **Endpoint:** `GET /auth/logout`
- **Description:** Logs out the user by clearing session cookies.

## URL Shortening

### Shorten a URL
- **Endpoint:** `POST /urls/shorten`
- **Description:** Creates a short URL with an optional custom alias and topic categorization.
- **Headers:**
  ```json
  { "Authorization": "Bearer <token>" }
  ```
- **Request Body:**
  ```json
  {
    "longUrl": "https://example.com",
    "customAlias": "optional_alias",
    "topic": "optional_topic"
  }
  ```
- **Response:**
  ```json
  {
    "shortUrl": "http://your-deployed-api.com/<shortId>",
    "longUrl": "https://example.com",
    "customAlias": "optional_alias",
    "topic": "optional_topic"
  }
  ```

### Redirect to Original URL
- **Endpoint:** `GET /:shortId`
- **Description:** Redirects to the original long URL and tracks analytics.

## URL Analytics

### Get analytics for a specific URL
- **Endpoint:** `GET /urls/analytics/:shortId`
- **Description:** Fetches analytics data for a specific short URL.
- **Headers:**
  ```json
  { "Authorization": "Bearer <token>" }
  ```
- **Response:**
  ```json
  {
    "totalClicks": 100,
    "uniqueUsers": 80,
    "clicksByDate": { "2024-02-15": 30 },
    "osType": { "Windows": 40, "Mac": 30 },
    "deviceType": { "Mobile": 50, "Desktop": 50 }
  }
  ```

### Get overall analytics
- **Endpoint:** `GET /urls/analytics`
- **Description:** Fetches overall analytics for all URLs of the authenticated user.
- **Headers:**
  ```json
  { "Authorization": "Bearer <token>" }
  ```

## Topic-Based Analytics

### Get analytics for a specific topic
- **Endpoint:** `GET /urls/analytics/topic/:topic`
- **Description:** Fetches analytics for URLs under a specific topic.
- **Headers:**
  ```json
  { "Authorization": "Bearer <token>" }
  ```

## URL Management

### Get all URLs for authenticated user
- **Endpoint:** `GET /urls`
- **Description:** Fetches all shortened URLs created by the authenticated user.
- **Headers:**
  ```json
  { "Authorization": "Bearer <token>" }
  ```

### Delete a Short URL
- **Endpoint:** `DELETE /urls/:shortId`
- **Description:** Deletes a specific short URL.
- **Headers:**
  ```json
  { "Authorization": "Bearer <token>" }
  ```

---
## Notes
- Authentication is required for most endpoints.
- Google OAuth is the only way for authentication.


## Contributors
- **Tennis Kumar C** - Developer

---

## License
This project is licensed under the MIT License.

