# IncidentFlow Docker Management Makefile

.PHONY: help build up down logs clean restart status shell nginx-start nginx-stop nginx-logs ssl-dev

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
	@echo "Nginx commands:"
	@echo "  nginx-start  - Start with Nginx reverse proxy"
	@echo "  nginx-stop   - Stop Nginx service"
	@echo "  nginx-logs   - View Nginx logs"
	@echo "  ssl-dev      - Generate dev SSL certificates"

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