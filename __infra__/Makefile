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

.PHONY: migrate-local-db
migrate-local-db:
	@echo "🔧 This will apply all pending Drizzle migrations to your local database."
	@echo "🚨 Ensure your PostgreSQL server (e.g., Docker) is running and .env is configured."
	@echo "👉 Choose a package manager: [pnpm/npm]"
	@read pm; \
	if [ "$$pm" = "pnpm" ] || [ "$$pm" = "npm" ]; then \
		cd .. && $$pm run drizzle-migrate; \
	else \
		echo "❌ Invalid package manager. Please type 'pnpm' or 'npm'."; \
	fi