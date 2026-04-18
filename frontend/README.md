# ShowModel Frontend

A modern, minimalist Vue.js + TailwindCSS web application for the ShowModel AI-powered Adobe Stock metadata generation platform.

## Tech Stack

- **Vue 3** - Progressive JavaScript framework with Composition API
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Vue Router** - Client-side routing with role-based access control
- **Axios** - HTTP client with automatic token refresh
- **Heroicons** - Beautiful SVG icons

## Features

### User Dashboard
- Generate metadata from images (single & batch)
- View generation history
- Manage orders and upload payment proofs
- Track subscriptions and credit balance
- Bring Your Own Key (BYOK) management

### Operator Dashboard
- Dashboard with summary statistics
- Approve/reject orders
- View users and generations

### Admin Dashboard
- Full user management (CRUD)
- AI provider & model management
- Subscription package management
- Payment methods configuration
- System API keys management
- Application settings
- Order management

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (ShowModel backend)

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local to point to your backend
# VITE_API_URL=http://localhost:3000/api
```

### Development

```bash
# Start dev server with hot reload
npm run dev

# The app will be available at:
# http://localhost:5173
```

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Reusable components
│   ├── layouts/         # Layout components (User, Operator, Admin)
│   ├── router/          # Vue Router configuration
│   ├── services/        # API service layer
│   │   ├── api.js       # Axios instance with interceptors
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── adminService.js
│   │   └── publicService.js
│   ├── views/           # Page components
│   │   ├── auth/        # Login, Register
│   │   ├── user/        # User dashboard pages
│   │   ├── operator/    # Operator dashboard pages
│   │   └── admin/       # Admin dashboard pages
│   ├── App.vue          # Root component
│   ├── main.js          # App entry point
│   └── style.css        # Global styles with TailwindCSS
├── index.html           # HTML entry point
├── tailwind.config.js   # TailwindCSS configuration
├── postcss.config.js    # PostCSS configuration
└── vite.config.js       # Vite configuration
```

## API Integration

The frontend communicates with the ShowModel backend via REST API. All API calls are handled through service layers:

- **api.js**: Axios instance with JWT token management and automatic refresh
- **authService.js**: Authentication (login, register, logout, Google OAuth)
- **userService.js**: User-specific operations (orders, generations, BYOK)
- **adminService.js**: Admin operations (users, providers, packages, settings)
- **publicService.js**: Public endpoints and operator operations

### Authentication Flow

1. User logs in → tokens stored in localStorage
2. Access token automatically attached to all requests via Axios interceptor
3. If 401 received → automatically refresh token
4. If refresh fails → redirect to login

### Role-Based Access

The router guards protect routes based on user roles:
- **user**: Access to `/user/*` routes
- **operator**: Access to `/operator/*` routes
- **admin**: Access to `/admin/*` routes (also has access to other roles)

## Design System

### Colors
- Primary: Sky blue (#0ea5e9)
- Success: Green
- Warning: Yellow
- Danger: Red
- Info: Blue

### Components
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`: Button styles
- `.input`: Input field styles
- `.card`: Card container
- `.badge`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`: Status badges

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000/api` |

## Backend Setup

Make sure the ShowModel backend is running before starting the frontend. See the main project README for backend setup instructions.

## License

MIT
