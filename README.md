# 🚨 IncidentFlow - Production-Ready Incident Management Platform

A modern, microservices-based incident management platform built with React, Node.js, and MongoDB. Designed for DevOps teams, SREs, and IT operations to handle incidents efficiently with real-time collaboration.

![IncidentFlow](https://img.shields.io/badge/IncidentFlow-Production%20Ready-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue)
![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-orange)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-18-green)

## 🌟 **Production Features**

### **🏗️ Architecture**
- **Microservices**: Auth, Incident, User, OnCall services
- **Reverse Proxy**: Nginx with load balancing and SSL termination
- **Containerized**: Full Docker support with health checks
- **Real-time**: Socket.IO for live incident updates
- **Dark Mode**: Complete UI with smooth transitions

### **🔒 Security & Performance**
- **Rate Limiting**: API protection against DDoS
- **Security Headers**: XSS, CSRF, and content type protection
- **SSL/TLS**: HTTPS support with certificate management
- **Gzip Compression**: Optimized content delivery
- **Static Caching**: Long-term asset caching

### **📊 Monitoring & Reliability**
- **Health Checks**: All services monitored
- **Logging**: Structured logs for debugging
- **Error Handling**: Graceful failure recovery
- **Scalability**: Ready for horizontal scaling

## 🚀 **Quick Start (Production)**

### **Prerequisites**
- Docker & Docker Compose
- MongoDB Atlas account (or local MongoDB)
- AWS S3 bucket (for file uploads)
- SMTP provider (for email notifications)

### **1. Clone & Setup**
```bash
git clone https://github.com/shubnimkar/incidentflow.git
cd incidentflow
```

### **2. Configure Environment**
```bash
# Copy environment templates
cp services/auth/env.example services/auth/.env
cp services/incident/env.example services/incident/.env
cp services/user/env.example services/user/.env
cp services/oncall/env.example services/oncall/.env
cp frontend/client/env.example frontend/client/.env
```

### **3. Update Environment Variables**
Edit each `.env` file with your production values:

**Required for all services:**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/incidentflow
JWT_SECRET=your-super-secure-jwt-secret
```

**For file uploads (User & Incident services):**
```env
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=your-s3-bucket-name
```

**For email notifications:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**For SMS notifications (User service):**
```env
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_FROM_NUMBER=+1234567890
```

### **4. Start with Nginx (Recommended)**
```bash
# Start all services with Nginx reverse proxy
make nginx-start

# Access via: http://localhost
```

### **5. Add SSL (Production)**
```bash
# Generate development SSL certificates
make ssl-dev

# Or use Let's Encrypt for production
# Follow nginx/ssl/README.md for instructions
```

## 🏃‍♂️ **Alternative Start Methods**

### **Direct Access (Development)**
```bash
make up
# Access: http://localhost:3000
```

### **Individual Services**
```bash
# Build all images
make build

# Start specific service
docker compose up -d auth-service
docker compose up -d incident-service
docker compose up -d user-service
docker compose up -d oncall-service
docker compose up -d frontend
```

## 📋 **Service Architecture**

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| **Nginx** | 80/443 | Reverse Proxy | `/health` |
| **Frontend** | 3000 | React App | `http://localhost:3000` |
| **Auth** | 5000 | Authentication | `http://localhost:5000/health` |
| **Incident** | 5001 | Incident Management | `http://localhost:5001/health` |
| **User** | 5002 | User Management | `http://localhost:5002/health` |
| **OnCall** | 5003 | On-Call Scheduling | `http://localhost:5003/health` |

## 🔧 **Management Commands**

### **Basic Operations**
```bash
make help          # Show all available commands
make status        # Check service status
make logs          # View all logs
make restart       # Restart all services
make down          # Stop all services
make clean         # Remove containers and volumes
```

### **Nginx Operations**
```bash
make nginx-start   # Start with Nginx reverse proxy
make nginx-stop    # Stop Nginx service
make nginx-logs    # View Nginx logs
make ssl-dev       # Generate development SSL certificates
```

### **Development**
```bash
make shell         # Open shell in any service
make install-deps  # Install all dependencies
```

## 🌐 **Access Points**

### **With Nginx (Production)**
- **Main App**: `http://localhost/` or `https://localhost/`
- **API Gateway**: All APIs through port 80/443
- **Health Check**: `http://localhost/health`

### **Direct Access (Development)**
- **Frontend**: `http://localhost:3000`
- **Auth API**: `http://localhost:5000/api/auth`
- **Incident API**: `http://localhost:5001/api/incidents`
- **User API**: `http://localhost:5002/api/users`
- **OnCall API**: `http://localhost:5003/api/oncall`

## 🔒 **Security Features**

### **Nginx Security**
- **Rate Limiting**: 10 req/s for APIs, 5 req/min for login
- **Security Headers**: XSS, CSRF, content type protection
- **SSL/TLS**: Full HTTPS support
- **DDoS Protection**: Request limiting and filtering

### **Application Security**
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt
- **Input Validation**: All user inputs sanitized
- **CORS Protection**: Configured for production domains

## 📊 **Monitoring & Logs**

### **Service Health**
```bash
# Check all services
make status

# Individual service health
curl http://localhost/api/auth/test
curl http://localhost/api/incidents/health
curl http://localhost/api/users/health
curl http://localhost/api/oncall/health
```

### **Logs**
```bash
# All services
make logs

# Specific service
docker compose logs -f auth-service
docker compose logs -f nginx

# Nginx logs
make nginx-logs
```

## 🚀 **Production Deployment**

### **1. Environment Setup**
```bash
# Set production environment variables
export NODE_ENV=production
export MONGO_URI=your-production-mongodb-uri
export JWT_SECRET=your-production-jwt-secret
```

### **2. SSL Certificate (Let's Encrypt)**
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy to Nginx
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

### **3. Start Production Services**
```bash
# Start with Nginx and SSL
make nginx-start

# Verify SSL
curl -I https://yourdomain.com
```

### **4. Auto-renewal (SSL)**
```bash
# Add to crontab
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 **Customization**

### **Nginx Configuration**
Edit `nginx/nginx.conf` for:
- Custom rate limiting
- Additional security headers
- Load balancing configuration
- SSL certificate paths

### **Service Configuration**
Each service has its own `.env` file:
- `services/auth/.env` - Authentication settings
- `services/incident/.env` - Incident management
- `services/user/.env` - User management
- `services/oncall/.env` - On-call scheduling

### **Frontend Configuration**
- `frontend/client/.env` - React app settings
- API endpoints
- Feature flags
- Analytics configuration

## 🐛 **Troubleshooting**

### **Common Issues**

**1. Service Won't Start**
```bash
# Check logs
docker compose logs service-name

# Check health
make status

# Restart service
docker compose restart service-name
```

**2. Nginx 502 Errors**
```bash
# Check if backend services are running
make status

# Check Nginx logs
make nginx-logs

# Test backend directly
curl http://localhost:5000/health
```

**3. SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Test SSL connection
curl -I https://localhost
```

**4. Database Connection Issues**
```bash
# Test MongoDB connection
docker compose exec auth-service node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected'))
  .catch(err => console.error(err));
"
```

### **Performance Issues**
```bash
# Check resource usage
docker stats

# Monitor Nginx performance
docker compose exec nginx nginx -V

# Check service response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost/api/auth/test
```

## 📚 **API Documentation**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### **Incidents**
- `GET /api/incidents` - List incidents
- `POST /api/incidents` - Create incident
- `PUT /api/incidents/:id` - Update incident
- `DELETE /api/incidents/:id` - Delete incident

### **Users**
- `GET /api/users` - List users
- `PUT /api/users/me` - Update profile
- `POST /api/users/me/avatar` - Upload avatar

### **OnCall**
- `GET /api/oncall/schedules` - Get schedules
- `POST /api/oncall/schedules` - Create schedule

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Issues**: [GitHub Issues](https://github.com/shubnimkar/incidentflow/issues)
- **Documentation**: [Wiki](https://github.com/shubnimkar/incidentflow/wiki)
- **Security**: Report to [security@incidentflow.com](mailto:security@incidentflow.com)

---

**Built with ❤️ for modern incident management**

