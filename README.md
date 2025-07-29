# RouteWise - Travel Planning Application

A sophisticated travel planning web application that generates optimized Google Maps routes between cities, offering intelligent suggestions for points of interest and personalized travel experiences.

## Features

- **Smart Route Planning**: Plan routes between cities with Google Maps integration
- **Point of Interest Discovery**: Discover restaurants, attractions, parks, and scenic spots along your route
- **Category Filtering**: Filter places by type (restaurants, parks, attractions, scenic spots, markets, historic sites)
- **Real-time Data**: Integration with Google Places API for authentic business data, photos, and ratings
- **Route Saving**: Save complete routes with all discovered places
- **Personal Collections**: Add favorite places to your personal collection
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management
- **Tailwind CSS** with shadcn/ui component library
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express.js framework
- **TypeScript** with ES modules
- **PostgreSQL** with Drizzle ORM
- **Neon Database** (serverless PostgreSQL)
- **In-memory storage** for development/demo

## Quick Start

### Option 1: Docker (Recommended)

**Prerequisites**: Docker and Docker Compose installed

1. Clone the repository:
```bash
git clone https://github.com/YOUR-USERNAME/routewise-travel-planner.git
cd routewise-travel-planner
```

2. Start with Docker Compose (includes PostgreSQL database):
```bash
docker-compose up --build
```

3. Open your browser to `http://localhost:5000`

**Docker Commands:**
```bash
# Stop everything
docker-compose down

# View logs
docker-compose logs app

# Rebuild after changes
docker-compose up --build

# Remove everything (including database data)
docker-compose down -v
```

### Option 2: Local Development

**Prerequisites**: Node.js 18+ and optionally PostgreSQL

1. Clone and install dependencies:
```bash
git clone https://github.com/YOUR-USERNAME/routewise-travel-planner.git
cd routewise-travel-planner
npm install
```

2. Environment setup (optional - app works with in-memory storage):
```bash
# Create .env file for database connection (optional)
echo "DATABASE_URL=postgresql://username:password@localhost:5432/routewise" > .env
echo "NODE_ENV=development" >> .env
```

3. Database setup (optional):
```bash
# If using PostgreSQL
createdb routewise
npm run db:push
```

4. Start development server:
```bash
npm run dev
```

5. Open `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run check` - Type check TypeScript
- `npm run db:push` - Push database schema changes

## Project Structure

```
routewise/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   └── lib/            # Utilities and configuration
│   └── index.html
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage interface
│   └── google-places.ts   # Google Places API integration
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema and types
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Multi-container setup
└── package.json
```

## API Integration

### Google Places API
The application integrates with Google Places API for real place data. To use this feature:

1. Get a Google Places API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add it to your environment variables:
```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
```

## Database

### Development
- Uses in-memory storage by default (no setup required)
- Data doesn't persist between restarts
- Perfect for testing and development

### Production
- PostgreSQL with Drizzle ORM
- Supports Neon Database (serverless PostgreSQL)
- Session storage with connect-pg-simple

## Deployment

### Replit (Original Platform)
The project is configured for Replit Autoscale deployment:
- Automatic builds with `npm run build`
- Production startup with `npm run start`
- Port 5000 configuration

### Docker Deployment
Use the provided Dockerfile for containerized deployment:
```bash
docker build -t routewise .
docker run -p 5000:5000 routewise
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development/production)
- `GOOGLE_PLACES_API_KEY` - Google Places API key (optional)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run type checking: `npm run check`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed description
3. Include steps to reproduce any bugs

---

Built with ❤️ using modern web technologies