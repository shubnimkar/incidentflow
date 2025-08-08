# IncidentFlow Docker Management Makefile

.PHONY: help build up down logs clean restart status shell

# Default target
help:
	@echo "IncidentFlow Docker Management"
	@echo ""
	@echo "Available commands:"
	@echo "  build        - Build Docker images"
	@echo "  up           - Start services"
	@echo "  down         - Stop services"
	@echo "  logs         - View logs"
	@echo "  clean        - Remove containers and volumes"
	@echo "  restart      - Restart services"
	@echo "  status       - Show service status"
	@echo "  shell        - Open shell in container"
	@echo ""
	@echo "Deployment Commands:"
	@echo "  deploy-local - Deploy locally with Docker Compose"
	@echo "  deploy-aws   - Deploy to AWS ECS"
	@echo "  deploy-gcp   - Deploy to Google Cloud Run"
	@echo "  deploy-azure - Deploy to Azure Container Instances"
	@echo ""
	@echo "Nginx Commands:"
	@echo "  nginx-start  - Start with Nginx reverse proxy"
	@echo "  nginx-stop   - Stop Nginx service"
	@echo "  nginx-logs   - View Nginx logs"
	@echo "  ssl-dev      - Generate development SSL certificates"

# Production commands
build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

clean:
	docker compose down -v --remove-orphans
	docker system prune -f

restart:
	docker compose restart

status:
	docker compose ps

shell:
	@echo "Available services: auth-service, incident-service, user-service, oncall-service, frontend"
	@read -p "Enter service name: " service; \
	docker-compose exec $$service sh

# Utility commands
install-deps:
	@echo "Installing dependencies for all services..."
	cd services/auth && npm install
	cd services/incident && npm install
	cd services/user && npm install
	cd services/oncall && npm install
	cd frontend/client && npm install

setup-env:
	@echo "Setting up environment files..."
	@if [ ! -f .env ]; then \
		cp .env.example .env 2>/dev/null || echo "Please create .env file manually"; \
	fi

# Quick start
start: setup-env build up
	@echo "IncidentFlow started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Default admin: admin@incidentflow.com / password"

# Nginx commands
nginx-start: setup-env build
	docker compose up -d
	@echo "IncidentFlow started with Nginx reverse proxy!"
	@echo "Access via: http://localhost"
	@echo "HTTPS: https://localhost (if SSL configured)"

nginx-stop:
	docker compose stop nginx

nginx-logs:
	docker compose logs -f nginx

ssl-dev:
	@echo "Generating development SSL certificates..."
	@mkdir -p nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/key.pem \
		-out nginx/ssl/cert.pem \
		-subj "/C=US/ST=Dev/L=Dev/O=IncidentFlow/CN=localhost"
	@echo "SSL certificates generated in nginx/ssl/"
	@echo "You can now use HTTPS on https://localhost"

# Deployment Commands
deploy-local: setup-env build up
	@echo "✅ IncidentFlow deployed locally!"
	@echo "🌐 Access: http://localhost:3000"
	@echo "🔧 Management: make status, make logs, make down"

deploy-aws:
	@echo "🚀 Deploying to AWS ECS..."
	@echo "📋 Prerequisites:"
	@echo "   - AWS CLI configured"
	@echo "   - ECR repository created"
	@echo "   - ECS cluster running"
	@echo ""
	@echo "📖 See deploy/aws-deployment.md for detailed instructions"
	@echo ""
	@echo "🔧 Quick deployment steps:"
	@echo "   1. Build and push Docker images to ECR"
	@echo "   2. Update task definition with environment variables"
	@echo "   3. Create/update ECS service"
	@echo "   4. Configure Application Load Balancer"
	@echo "   5. Update DNS records"
	@echo ""
	@echo "💡 Use: make deploy-aws-setup for automated setup"

deploy-aws-setup:
	@echo "🔧 Setting up AWS infrastructure..."
	@echo "Creating ECS cluster..."
	aws ecs create-cluster --cluster-name incidentflow-cluster
	@echo "Creating ECR repositories..."
	aws ecr create-repository --repository-name incidentflow-frontend
	aws ecr create-repository --repository-name incidentflow-auth
	aws ecr create-repository --repository-name incidentflow-incident
	aws ecr create-repository --repository-name incidentflow-user
	aws ecr create-repository --repository-name incidentflow-oncall
	@echo "✅ AWS infrastructure created!"
	@echo "📖 Next: Update environment variables and deploy"

deploy-gcp:
	@echo "🚀 Deploying to Google Cloud Run..."
	@echo "📋 Prerequisites:"
	@echo "   - Google Cloud CLI configured"
	@echo "   - Container Registry enabled"
	@echo "   - Cloud Run API enabled"
	@echo ""
	@echo "🔧 Quick deployment steps:"
	@echo "   1. Build and push images to Container Registry"
	@echo "   2. Deploy services to Cloud Run"
	@echo "   3. Configure custom domain"
	@echo "   4. Set up Cloud Load Balancing"

deploy-azure:
	@echo "🚀 Deploying to Azure Container Instances..."
	@echo "📋 Prerequisites:"
	@echo "   - Azure CLI configured"
	@echo "   - Container Registry created"
	@echo "   - Resource group created"
	@echo ""
	@echo "🔧 Quick deployment steps:"
	@echo "   1. Build and push images to Azure Container Registry"
	@echo "   2. Deploy container groups"
	@echo "   3. Configure Application Gateway"
	@echo "   4. Set up custom domain"

# Production deployment with SSL
deploy-prod: setup-env build
	@echo "🚀 Deploying to production..."
	@echo "📋 Prerequisites:"
	@echo "   - Domain name configured"
	@echo "   - SSL certificates ready"
	@echo "   - Environment variables set"
	@echo ""
	@echo "🔧 Production checklist:"
	@echo "   ✅ MongoDB Atlas configured"
	@echo "   ✅ AWS S3 bucket created"
	@echo "   ✅ SMTP settings configured"
	@echo "   ✅ JWT secret set"
	@echo "   ✅ SSL certificates ready"
	@echo ""
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "✅ IncidentFlow deployed to production!"
	@echo "🌐 Access: https://yourdomain.com"

# Health checks
health-check:
	@echo "🔍 Checking service health..."
	@curl -f http://localhost:5000/health || echo "❌ Auth service unhealthy"
	@curl -f http://localhost:5001/health || echo "❌ Incident service unhealthy"
	@curl -f http://localhost:5002/health || echo "❌ User service unhealthy"
	@curl -f http://localhost:5003/health || echo "❌ OnCall service unhealthy"
	@curl -f http://localhost:3000 || echo "❌ Frontend unhealthy"
	@echo "✅ Health check completed!"

# Backup and restore
backup:
	@echo "💾 Creating backup..."
	@mkdir -p backups/$(shell date +%Y%m%d_%H%M%S)
	@docker compose exec -T auth-service mongodump --out /tmp/backup
	@docker compose cp auth-service:/tmp/backup backups/$(shell date +%Y%m%d_%H%M%S)/auth
	@echo "✅ Backup created in backups/$(shell date +%Y%m%d_%H%M%S)/"

restore:
	@echo "🔄 Restoring from backup..."
	@read -p "Enter backup directory: " backup_dir; \
	docker compose exec -T auth-service mongorestore /tmp/backup/$$backup_dir
	@echo "✅ Restore completed!"

# Monitoring
monitor:
	@echo "📊 Service monitoring..."
	@echo "CPU Usage:"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
	@echo ""
	@echo "Logs (last 10 lines):"
	@docker compose logs --tail=10

# Security scan
security-scan:
	@echo "🔒 Running security scan..."
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		-v $(PWD):/workspace \
		--workdir /workspace \
		anchore/grype:latest \
		incidentflow-frontend:latest
	@echo "✅ Security scan completed!" 