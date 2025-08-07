# 🐳 IncidentFlow Docker Setup

This document provides comprehensive instructions for running IncidentFlow using Docker containers.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available
- 10GB free disk space
- MongoDB Atlas account and cluster

## 🚀 Quick Start

```bash
# Start IncidentFlow
make start

# Or manually:
docker-compose up -d
```

## 📁 Docker Files Structure

```
incidentflow/
├── docker-compose.yml          # Production configuration
├── .dockerignore              # Files to exclude from builds
├── Makefile                   # Docker management commands
├── services/
│   ├── auth/
│   │   ├── Dockerfile        # Auth service
│   │   └── env.example       # Auth service environment template
│   ├── incident/
│   │   ├── Dockerfile        # Incident service
│   │   └── env.example       # Incident service environment template
│   ├── user/
│   │   ├── Dockerfile        # User service
│   │   └── env.example       # User service environment template
│   └── oncall/
│       ├── Dockerfile        # OnCall service
│       └── env.example       # OnCall service environment template
└── frontend/client/
    ├── Dockerfile            # Frontend
    ├── env.example          # Frontend environment template
    └── nginx.conf           # Nginx configuration
```

## 🔧 Services Overview

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **Frontend** | 3000 | React application | `http://localhost:3000` |
| **Auth Service** | 5000 | Authentication & SSO | `http://localhost:5000/api/auth/test` |
| **Incident Service** | 5001 | Incident management | `http://localhost:5001/api/incidents` |
| **User Service** | 5002 | User management | `http://localhost:5002/api/users` |
| **OnCall Service** | 5003 | On-call scheduling | `http://localhost:5003/health` |

## 🛠️ Makefile Commands

```bash
make help         # Show all available commands
make build        # Build Docker images
make up           # Start services
make down         # Stop services
make logs         # View logs
make clean        # Remove containers and volumes
make restart      # Restart services
make status       # Show service status
make shell        # Open shell in container
```

## 🔐 Environment Configuration

Each service has its own `.env` file for better security and organization. Copy the example files and configure them:

### Auth Service (`services/auth/.env`)
```bash
# Copy the example file
cp services/auth/env.example services/auth/.env

# Configure your settings
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/incidentflow?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000
SMTP_HOST=live.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=api
SMTP_PASS=your-mailtrap-api-token
EMAIL_FROM=noreply@incidentflow.com
```

### Incident Service (`services/incident/.env`)
```bash
# Copy the example file
cp services/incident/env.example services/incident/.env

# Configure your settings
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/incidentflow?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=incidentflow-uploads
```

### User Service (`services/user/.env`)
```bash
# Copy the example file
cp services/user/env.example services/user/.env

# Configure your settings
NODE_ENV=production
PORT=5002
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/incidentflow?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5002
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=incidentflow-uploads
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=your-twilio-phone-number
```

### OnCall Service (`services/oncall/.env`)
```bash
# Copy the example file
cp services/oncall/env.example services/oncall/.env

# Configure your settings
NODE_ENV=production
PORT=5003
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/incidentflow?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Frontend (`frontend/client/.env`)
```bash
# Copy the example file
cp frontend/client/env.example frontend/client/.env

# Configure your settings
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FRONTEND_URL=http://localhost:3000
```

## 🗄️ Database Setup

This setup uses **MongoDB Atlas** as the database. You'll need to:

1. **Create a MongoDB Atlas account** at [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create a new cluster** (M0 Free tier is sufficient for development)
3. **Create a database user** with read/write permissions
4. **Get your connection string** from the Atlas dashboard
5. **Update the MONGO_URI** in each service's `.env` file

### MongoDB Atlas Connection String Format:
```
mongodb+srv://username:password@cluster.mongodb.net/incidentflow?retryWrites=true&w=majority
```

### Database Collections
The application will automatically create these collections when it starts:
- `users` - User accounts and profiles
- `incidents` - Incident records
- `teams` - Team information
- `auditlogs` - System audit logs
- `userauditlogs` - User action logs
- `settings` - Application settings

## 📊 Monitoring & Logs

### View All Logs
```bash
make logs
```

### View Specific Service Logs
```bash
docker-compose logs -f auth-service
```

### Health Checks
All services include health checks that run every 30 seconds:
- **Frontend**: HTTP 200 response on port 3000
- **Services**: HTTP 200 response on their respective API endpoints

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :5000
lsof -i :5001
lsof -i :5002
lsof -i :5003

# Stop conflicting services
sudo systemctl stop nginx  # if using port 80
```

#### 2. Memory Issues
```bash
# Check Docker memory usage
docker system df

# Clean up unused resources
make clean
docker system prune -a
```

#### 3. Database Connection Issues
```bash
# Check if MongoDB Atlas is accessible
curl -I https://cluster.mongodb.net

# Verify connection string format
# Should be: mongodb+srv://username:password@cluster.mongodb.net/incidentflow?retryWrites=true&w=majority
```

#### 4. Build Failures
```bash
# Clean build cache
docker builder prune

# Rebuild without cache
docker-compose build --no-cache
```

#### 5. Environment File Issues
```bash
# Check if .env files exist
ls -la services/*/.env
ls -la frontend/client/.env

# Copy example files if missing
cp services/auth/env.example services/auth/.env
cp services/incident/env.example services/incident/.env
cp services/user/env.example services/user/.env
cp services/oncall/env.example services/oncall/.env
cp frontend/client/env.example frontend/client/.env
```

### Debug Commands

#### Check Service Status
```bash
make status
# or
docker-compose ps
```

#### Access Service Shell
```bash
make shell
# Then enter service name when prompted
```

#### View Service Logs
```bash
docker-compose logs auth-service
```

## 🔧 Customization

### Adding New Services
1. Create service directory in `services/`
2. Add Dockerfile
3. Create `env.example` file
4. Update docker-compose.yml
5. Add service to Makefile commands

### Modifying Service Configuration
Edit the respective `.env` file for each service:
- `services/auth/.env` for auth service
- `services/incident/.env` for incident service
- `services/user/.env` for user service
- `services/oncall/.env` for oncall service
- `frontend/client/.env` for frontend

### Custom Nginx Configuration
Edit `frontend/client/nginx.conf` for frontend proxy settings.

## 📈 Performance Optimization

### Production Optimizations
- **Multi-stage builds** for smaller images
- **Alpine Linux** base images
- **Non-root users** for security
- **Health checks** for reliability
- **Volume mounts** for persistent data
- **Nginx reverse proxy** with SSL support

## 🔒 Security Considerations

### Production Security
- Non-root users in containers
- Environment variables for secrets (separate .env files)
- Health checks for monitoring
- Network isolation with Docker networks
- SSL/TLS termination at nginx

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Node.js Docker Image](https://hub.docker.com/_/node)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)

## 🤝 Support

For issues related to Docker setup:
1. Check the troubleshooting section above
2. Review service logs: `make logs`
3. Verify environment variables are set correctly in each service's `.env` file
4. Ensure Docker and Docker Compose are up to date
5. Verify MongoDB Atlas connection string is correct 