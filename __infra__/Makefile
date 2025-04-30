.PHONY: db-up
db-up:
	docker compose -f db-docker-compose.yml up -d


.PHONY: db-down
db-down:
	docker compose -f db-docker-compose.yml down

.PHONY: adminer-help
adminer-help:
	@echo "Go to:         http://localhost:8080/"
	@echo "Choose system: ai_marketing_manager_postgres_db"
	@echo "Username:      postgres"
	@echo "Password:      password"
	@echo "Database name: ai_marketing_manager_db"