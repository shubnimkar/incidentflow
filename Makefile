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