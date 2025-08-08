# 🚀 IncidentFlow Deployment Guide

## 📋 **Quick Start Options**

### **1. 🐳 Local Docker Deployment (Recommended for Testing)**
```bash
# Clone and setup
git clone https://github.com/shubnimkar/incidentflow.git
cd incidentflow

# Configure environment variables
cp services/auth/env.example services/auth/.env
cp services/incident/env.example services/incident/.env
cp services/user/env.example services/user/.env
cp services/oncall/env.example services/oncall/.env
cp frontend/client/env.example frontend/client/.env

# Edit .env files with your values, then:
make deploy-local
```

### **2. 🌐 Production with Nginx (Recommended for Production)**
```bash
# Setup with Nginx reverse proxy
make nginx-start

# Add SSL certificates
make ssl-dev

# Access via: https://localhost
```

### **3. ☁️ Cloud Deployment**

#### **AWS ECS:**
```bash
make deploy-aws-setup
make deploy-aws
```

#### **Google Cloud Run:**
```bash
make deploy-gcp
```

#### **Azure Container Instances:**
```bash
make deploy-azure
```

## 🔧 **Environment Configuration**

### **Required Environment Variables:**

#### **All Services:**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/incidentflow
JWT_SECRET=your-super-secure-jwt-secret
NODE_ENV=production
```

#### **File Upload Services (User & Incident):**
```env
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=your-s3-bucket-name
```

#### **Email Notifications:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

#### **SMS Notifications (User Service):**
```env
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_FROM_NUMBER=+1234567890
```

## 🏗️ **Infrastructure Requirements**

### **Minimum Requirements:**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB
- **Network**: 100 Mbps

### **Recommended Production:**
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: 1 Gbps

## 🔒 **Security Checklist**

### **Pre-Deployment:**
- [ ] Strong JWT secret configured
- [ ] MongoDB Atlas with proper authentication
- [ ] AWS S3 bucket with proper permissions
- [ ] SMTP credentials configured
- [ ] SSL certificates ready
- [ ] Firewall rules configured
- [ ] Rate limiting enabled

### **Post-Deployment:**
- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Log rotation configured
- [ ] Security scans completed

## 📊 **Monitoring & Health Checks**

### **Service Health:**
```bash
# Check all services
make health-check

# Monitor resources
make monitor

# View logs
make logs
```

### **Health Endpoints:**
- **Auth**: `http://localhost:5000/health`
- **Incident**: `http://localhost:5001/health`
- **User**: `http://localhost:5002/health`
- **OnCall**: `http://localhost:5003/health`
- **Frontend**: `http://localhost:3000`

## 🔄 **Backup & Recovery**

### **Create Backup:**
```bash
make backup
```

### **Restore from Backup:**
```bash
make restore
```

### **Automated Backups:**
```bash
# Add to crontab for daily backups
0 2 * * * cd /path/to/incidentflow && make backup
```

## 🚀 **Deployment Commands**

### **Local Development:**
```bash
make up          # Start all services
make down        # Stop all services
make restart     # Restart services
make status      # Check service status
make logs        # View logs
```

### **Production:**
```bash
make deploy-prod     # Deploy with production settings
make nginx-start     # Start with Nginx reverse proxy
make ssl-dev         # Generate SSL certificates
make health-check    # Verify all services
```

### **Cloud Deployment:**
```bash
make deploy-aws      # Deploy to AWS ECS
make deploy-gcp      # Deploy to Google Cloud Run
make deploy-azure    # Deploy to Azure Container Instances
```

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **1. Services Won't Start:**
```bash
# Check logs
make logs

# Check status
make status

# Restart services
make restart
```

#### **2. Database Connection Issues:**
```bash
# Test MongoDB connection
docker compose exec auth-service node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected'))
  .catch(err => console.error(err));
"
```

#### **3. File Upload Issues:**
```bash
# Check S3 permissions
aws s3 ls s3://your-bucket-name

# Test S3 upload
docker compose exec user-service node -e "
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
s3.listBuckets((err, data) => {
  if (err) console.error(err);
  else console.log('S3 access OK');
});
"
```

#### **4. Email Notifications:**
```bash
# Test SMTP connection
docker compose exec user-service node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify((err, success) => {
  if (err) console.error(err);
  else console.log('SMTP OK');
});
"
```

## 📈 **Scaling**

### **Horizontal Scaling:**
```bash
# Scale services
docker compose up -d --scale auth-service=3
docker compose up -d --scale incident-service=3
docker compose up -d --scale user-service=2
```

### **Load Balancing:**
- Use Nginx for load balancing
- Configure multiple instances
- Set up health checks
- Monitor performance

## 🔧 **Maintenance**

### **Regular Tasks:**
```bash
# Update dependencies
make install-deps

# Security scan
make security-scan

# Clean up
make clean

# Monitor performance
make monitor
```

### **Updates:**
```bash
# Pull latest changes
git pull origin master

# Rebuild and restart
make build
make restart
```

## 📞 **Support**

### **Getting Help:**
- **Documentation**: Check README.md
- **Issues**: GitHub Issues
- **Logs**: `make logs`
- **Status**: `make status`

### **Emergency Contacts:**
- **GitHub**: [Issues](https://github.com/shubnimkar/incidentflow/issues)
- **Documentation**: [Wiki](https://github.com/shubnimkar/incidentflow/wiki)

---

**Happy Deploying! 🚀** 