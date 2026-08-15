# 🏬 RateStore - Full-Stack Store Rating Application

A modern, secure, and multi-role full-stack web application designed to allow normal users to search for registered stores and submit or edit ratings, store owners to monitor customer feedback, and system administrators to oversee the entire platform.

---

## Features

### 🛡️ Authentication & Session Management
- **User Registration**: Custom signup form with real-time password strength and criteria checklists.
- **User Login**: Secure password authentication with role-based dashboard redirection.
- **Stateful JWT Authentication**: Employs JSON Web Tokens (JWT) verified against active database sessions in the `user_sessions` table.
- **Single-Session Constraint**: Prevents concurrent logins on multiple devices; logging in automatically terminates previous active sessions for the user.
- **BCrypt Password Encryption**: All passwords securely hashed using `bcryptjs` with salt round 10.
- **Secure Password Updates**: Logged-in users can update their passwords through a change-password dialog in the navigation bar.
- **Protected Routes**: Middleware enforcement blocks unauthorized access based on both token presence and role authorization.
- **Logout**: Immediate session revocation by removing tokens from the database.

###  Role-Based Portals

#### 1. Normal User (Customer)
- **Store Directory**: Interactive catalog of all registered shops with real-time overall averages.
- **Store Search**: Live searching and filtering of stores by name or address.
- **Rating Widget**: Interactive 1-to-5 star rating component for submitting or modifying store ratings.

#### 2. Store Owner
- **Analytics Dashboard**: Overview cards showing the store name, average rating, and total rating logs.
- **Customer Feedbacks**: Detailed list of reviewers, showing reviewer names, email addresses, residential addresses, rating scores, and review timestamps.

#### 3. System Administrator
- **Platform Analytics**: Total counts of registered users, stores, and ratings at a glance.
- **User Oversight**: Filterable, searchable, and sortable table of all platform users.
- **User Creation**: Ability to register new users directly with any role (`SYSTEM_ADMIN`, `NORMAL_USER`, or `STORE_OWNER`).
- **Store Directory & Assignment**: View all registered stores and associate them with existing store owners.
- **Store Creation**: Register new shops with custom address, email, and owner validation.

---

##  Tech Stack

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7 (React Router DOM)
- **Styling**: Tailwind CSS v3 (Sleek dark/light layouts)
- **Build Tool**: Vite v8
- **Linter**: Oxlint v1.75

### Backend
- **Runtime**: Node.js (ES Modules, `type: "module"`)
- **Framework**: Express.js
- **Database Driver**: `mysql2/promise` (Connection pools and prepared statements)
- **Security**: `jsonwebtoken` (JWT), `bcryptjs` (Hashing)
- **Id Generation**: `uuid` (v4 UUIDs)

### Database
- **Engine**: MySQL 8.0+ (relational schema, foreign keys, cascade constraints, indexed lookups)

---

##  Project Directory Structure

```
RateStore/
├── backend/                  # Node/Express API Server (Default Port: 5000)
│   ├── lib/
│   │   ├── db.js             # Configures & exports pool connection to MySQL
│   │   ├── auth.js           # JWT signature creation and token verification helpers
│   │   ├── validations.js    # Data validation constraints
│   │   └── middleware.js     # JWT validation and role-based route restriction
│   ├── routes/
│   │   ├── auth.js           # Login, registration, token revocation, & change-password routes
│   │   ├── admin.js          # Platform oversight (metrics, user creation, stores creation)
│   │   ├── stores.js         # User browsing, searching, and rating submission
│   │   └── owner.js          # Store metrics card & reviewer logs
│   ├── scripts/
│   │   └── seed.js           # Wipes, recreates, and seeds database with realistic mock data
│   ├── .env.example          # Environment variable template (copy to .env)
│   ├── schema.sql            # MySQL database schema definition
│   ├── index.js              # Express server bootstrapper (configures CORS & routes)
│   └── package.json          # Backend dependencies and scripts
│
├── frontend/                 # React/Vite Client Application (Default Port: 3000)
│   ├── public/               # Static files served directly (favicon, icons)
│   ├── src/
│   │   ├── assets/           # Images and static assets used by React
│   │   ├── components/
│   │   │   └── Navbar.jsx    # Navigation header featuring change-password dialog
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Sign-in portal with password toggles & role redirection
│   │   │   ├── Signup.jsx           # Form featuring real-time password checklists
│   │   │   ├── AdminDashboard.jsx   # Metrics, sorting tables, and user/store creation
│   │   │   ├── UserDashboard.jsx    # Store directory with interactive rating widget
│   │   │   └── OwnerDashboard.jsx   # Review analytics card and feedback logs
│   │   ├── App.jsx           # React Router client page routing
│   │   ├── App.css           # App-level CSS
│   │   ├── index.css         # CSS styles and Tailwind utility classes
│   │   └── main.jsx          # Application entry point
│   ├── index.html            # HTML entry point for Vite
│   ├── vite.config.js        # Vite configurations (dev server port set to 3000)
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── postcss.config.js     # PostCSS configuration
│   └── package.json          # Frontend dependencies and scripts
│
├── .gitignore                # Git ignore rules (covers node_modules, dist, .env, etc.)
└── README.md                 # Project documentation
```

---

##  Database Schema

The complete database schema configuration is located in `backend/schema.sql`. It contains four main tables optimized with InnoDB engine, primary key indexing, and cascade delete relationships:

### 1. Users table (`users`)
Stores user profiles and roles:
- `id` (VARCHAR(36), PK): UUID.
- `name` (VARCHAR(60)): Min 10, Max 60 characters.
- `email` (VARCHAR(255), UNIQUE): Validated format.
- `password_hash` (VARCHAR(255)): Bcrypt-hashed password.
- `address` (VARCHAR(400)): Min 10, Max 400 characters.
- `role` (ENUM): `'SYSTEM_ADMIN'`, `'NORMAL_USER'`, `'STORE_OWNER'`.
- `created_at` (TIMESTAMP): Automatically sets current timestamp.

### 2. Stores table (`stores`)
Tracks registered shops and associations:
- `id` (VARCHAR(36), PK): UUID.
- `name` (VARCHAR(60)): Min 10, Max 60 characters.
- `email` (VARCHAR(255), UNIQUE).
- `address` (VARCHAR(400)): Min 10, Max 400 characters.
- `owner_id` (VARCHAR(36), FK): References `users(id)` with `ON DELETE CASCADE`.
- `created_at` (TIMESTAMP).

### 3. Ratings table (`ratings`)
Holds reviews submitted by customers for stores:
- `id` (VARCHAR(36), PK): UUID.
- `user_id` (VARCHAR(36), FK): References `users(id)` with `ON DELETE CASCADE`.
- `store_id` (VARCHAR(36), FK): References `stores(id)` with `ON DELETE CASCADE`.
- `rating` (INT): Range `1` to `5` enforced by database check constraint (`rating >= 1 AND rating <= 5`).
- `created_at` (TIMESTAMP).
- `updated_at` (TIMESTAMP): Auto-updates on rating changes.
- **Key Constraint**: `UNIQUE KEY unique_user_store (user_id, store_id)` ensures a user can submit exactly one rating per store. Subsequent ratings will overwrite the existing one.

### 4. Active Sessions table (`user_sessions`)
Enforces the single-device session restriction:
- `id` (VARCHAR(36), PK): UUID.
- `user_id` (VARCHAR(36), FK): References `users(id)` with `ON DELETE CASCADE`.
- `token` (VARCHAR(1000)): The signed JWT token string.
- `created_at` (TIMESTAMP).

---

##  Security & Input Validation

The system enforces strict validations in both backend (`backend/lib/validations.js`) and frontend page layers:

- **Name**: Must be between 10 and 60 characters.
- **Address**: Must be between 10 and 400 characters.
- **Email**: Must follow standard email format (e.g., `user@example.com`).
- **Password**: Must be between 8 and 16 characters, containing at least one uppercase letter and one special character.
- **Ratings**: Must be an integer between 1 and 5.

---

##  API Reference

All requests to protected routes require the JWT token in the headers:
```http
Authorization: Bearer <JWT_TOKEN>
```

### Authentication Endpoints
- `POST /api/auth/register` - Register a new customer (`NORMAL_USER`).
- `POST /api/auth/login` - Authenticate credentials. Deletes prior sessions for the user to enforce the single-session constraint, records the new active token, and returns the JWT.
- `POST /api/auth/logout` - Revokes session by deleting the token from `user_sessions`.
- `PATCH /api/auth/change-password` - Changes password of current logged-in user (requires old password verification and validates new password requirements).

### Admin Endpoints (Restricted to `SYSTEM_ADMIN` role)
- `GET /api/admin/dashboard` - Returns total count of users, stores, and ratings.
- `GET /api/admin/users?search=&role=&sortBy=&order=` - Returns a list of users, sorted, filtered by role, and searched.
- `POST /api/admin/users` - Create a new user with any role (`SYSTEM_ADMIN`, `NORMAL_USER`, or `STORE_OWNER`).
- `GET /api/admin/stores?search=&sortBy=&order=` - Retrieve all stores with owner information and average ratings.
- `POST /api/admin/stores` - Register a new store and assign it to a `STORE_OWNER`.

### Store Endpoints (Available to Authenticated Users)
- `GET /api/stores?search=` - Lists stores with their calculated average rating and the logged-in user's specific rating.
- `POST /api/stores/:storeId/rating` - Submits or edits a rating (1 to 5) for a store. (Restricted to `NORMAL_USER`).

### Owner Endpoints (Restricted to `STORE_OWNER` role)
- `GET /api/owner/dashboard` - Returns linked store details, overall rating average, and a chronological table of customer review logs.

---

##  Getting Started

Follow these steps to set up and run the RateStore application on your local machine:

### 1. Configure the Environment
Create a file named `.env` in the `backend/` folder (or check the root `.env` config file in the project root):

```env
DB_HOST=localhost
DB_PORT=3309
DB_USER=root
DB_PASSWORD=Your databse password
DB_NAME=store_rating_db
PORT=5000
JWT_SECRET=super_secret_jwt_token_123!
```

### 2. Seed the Database
Make sure your MySQL server is running on the configured port. To initialize the database, drop existing tables, create the schema, and seed realistic mock data:

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database schema installation and seeding script
npm run seed
```

### 3. Start the Backend API Server
Start the Express server on `http://localhost:5000`:

```bash
npm start
```

### 4. Setup and Run the Frontend Client
In a new terminal window, configure the Vite dev client:

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Run Vite development server (Port 3000)
npm run dev
```
Open **`http://localhost:3000`** in your browser to view the application.

---

## 👤 Seed Credentials for Testing

Use these seeded accounts to test different roles and capabilities after running the seeder (all accounts share the password: **`Password@123`**):

| Role | Email | Use Case |
|---|---|---|
| **System Administrator** | `admin@storerate.com` | Create users and stores, inspect platform stats |
| **Store Owner A** | `owner@storerate.com` | Manage "Super Premium Tech Store" reviews logs |
|
| **Normal User A** | `user@storerate.com` | Search stores, rate/edit rating on stores |
| **Normal User B** | `sarah.user@storerate.com` | Search stores, rate/edit rating on stores |

---

## 🗺️ Planned Roadmap

- **Review Content Details**: Allow customers to write text reviews in addition to giving star ratings.
- **Store Categories**: Filter stores by category (e.g., Electronics, Bakery, Clothes, Food).
- **Profile Picture Uploads**: Enable users to upload custom profiles.
- **Admin Soft-Deletes**: Allow admins to deactivate users and stores without deleting their records permanently.
- **Advanced Dashboard Analytics**: Graphs and trend lines for store ratings over time.

---

## 🤝 Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/feature-name`
3. Commit your changes: `git commit -m "Add feature name"`
4. Push to the branch: `git push origin feature/feature-name`
5. Open a Pull Request.

---

## ✍️ Author

*Anusha Mahantesh Harlapur**
