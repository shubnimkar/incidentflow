# Nginx Configuration for IncidentFlow

This directory contains Nginx configuration for IncidentFlow's microservices architecture.

## 🌟 Features

### **Reverse Proxy**
- Routes all traffic through a single entry point (port 80/443)
- Load balancing capabilities
- Centralized SSL termination

### **Performance**
- Gzip compression for all text-based content
- Static file caching with long expiration headers
- HTTP/2 support (when SSL is enabled)
- Connection keep-alive optimizations

### **Security**
- Rate limiting for API endpoints and login attempts
- Security headers (XSS, CSRF, Content-Type protection)
- SSL/TLS encryption support
- Request size limits

### **Monitoring**
- Access and error logging
- Health check endpoint (`/health`)
- Structured log format for analysis

## 🚀 Quick Start

### **1. Start with Nginx**
```bash
make nginx-start
```
Access your application at: **http://localhost**

### **2. Generate Development SSL Certificates**
```bash
make ssl-dev
```
Then access via: **https://localhost**

### **3. View Nginx Logs**
```bash
make nginx-logs
```

## 📁 Directory Structure

```
nginx/
├── nginx.conf          # Main Nginx configuration
├── ssl/                # SSL certificates directory
│   ├── cert.pem        # SSL certificate (create with make ssl-dev)
│   ├── key.pem         # Private key (create with make ssl-dev)
│   └── README.md       # SSL setup instructions
└── README.md           # This file
```

## 🔧 Configuration Details

### **Upstream Services**
- **Frontend**: React app on port 3000
- **Auth Service**: Authentication API on port 5000
- **Incident Service**: Incident management API on port 5001
- **User Service**: User management API on port 5002
- **OnCall Service**: On-call scheduling API on port 5003

### **URL Routing**
- `/` → Frontend (React app)
- `/api/auth/*` → Auth Service
- `/api/incidents/*` → Incident Service (includes Socket.IO)
- `/api/users/*` → User Service
- `/api/oncall/*` → OnCall Service
- `/socket.io/*` → Incident Service (WebSocket)
- `/health` → Nginx health check

### **Rate Limiting**
- **API endpoints**: 10 requests/second per IP
- **Login endpoints**: 5 requests/minute per IP
- **Burst capacity**: 20 requests for API, 5 for login

## 🔒 SSL Configuration

### **Development (Self-Signed)**
```bash
make ssl-dev
```

### **Production (Let's Encrypt)**
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

### **Production (Manual)**
1. Obtain SSL certificate from your provider
2. Copy certificate to `nginx/ssl/cert.pem`
3. Copy private key to `nginx/ssl/key.pem`
4. Uncomment HTTPS server block in `nginx.conf`

## 🔍 Monitoring & Debugging

### **Check Nginx Status**
```bash
docker compose ps nginx
```

### **View Configuration**
```bash
docker compose exec nginx nginx -t
```

### **Reload Configuration**
```bash
docker compose exec nginx nginx -s reload
```

### **Access Logs**
```bash
# Follow logs
make nginx-logs

# Check specific log files
docker compose exec nginx tail -f /var/log/nginx/access.log
docker compose exec nginx tail -f /var/log/nginx/error.log
```

## 🎯 Use Cases

### **1. Development**
- Single entry point for all services
- Simplified frontend development (no CORS issues)
- SSL testing with self-signed certificates

### **2. Production**
- Load balancing across multiple service instances
- SSL termination and HTTP to HTTPS redirects
- Rate limiting and DDoS protection
- Static file serving with caching

### **3. Staging/Testing**
- Environment parity with production
- Performance testing under realistic conditions
- SSL certificate testing

## ⚙️ Customization

### **Adding New Services**
1. Add upstream definition in `nginx.conf`:
```nginx
upstream new-service {
    server new-service:PORT;
}
```

2. Add location block:
```nginx
location /api/new {
    proxy_pass http://new-service;
    # ... proxy headers
}
```

### **Modifying Rate Limits**
```nginx
# Adjust rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Apply to location blocks
location /api/auth {
    limit_req zone=login burst=5 nodelay;
    # ...
}
```

### **Custom Security Headers**
```nginx
# Add custom headers
add_header X-Custom-Header "value" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## 🚨 Troubleshooting

### **Common Issues**

1. **502 Bad Gateway**
   - Check if backend services are running
   - Verify upstream server addresses
   - Check Docker network connectivity

2. **SSL Certificate Errors**
   - Ensure certificates exist in `nginx/ssl/`
   - Verify certificate permissions
   - Check certificate validity

3. **Rate Limiting Issues**
   - Adjust rate limit values
   - Check client IP addresses
   - Monitor access logs

4. **WebSocket Connection Failures**
   - Verify Socket.IO proxy configuration
   - Check Upgrade header handling
   - Ensure connection timeout settings

### **Health Checks**
```bash
# Nginx health
curl http://localhost/health

# Service health through Nginx
curl http://localhost/api/auth/health
curl http://localhost/api/incidents/health
curl http://localhost/api/users/health
curl http://localhost/api/oncall/health
```

## 📊 Performance Tips

1. **Enable HTTP/2** (requires SSL)
2. **Tune worker processes** based on CPU cores
3. **Optimize buffer sizes** for your use case
4. **Enable access log sampling** for high traffic
5. **Use upstream health checks** for better reliability

## 🔐 Security Best Practices

1. **Keep Nginx updated** to latest stable version
2. **Use strong SSL ciphers** and disable weak protocols
3. **Implement proper CORS policies**
4. **Monitor access logs** for suspicious activity
5. **Use fail2ban** for additional protection
6. **Regularly rotate SSL certificates**

## 📚 Additional Resources

- [Nginx Official Documentation](https://nginx.org/en/docs/)
- [Nginx Rate Limiting](https://www.nginx.com/blog/rate-limiting-nginx/)
- [SSL Best Practices](https://ssl-config.mozilla.org/)
- [Docker Nginx Best Practices](https://docs.docker.com/samples/nginx/)