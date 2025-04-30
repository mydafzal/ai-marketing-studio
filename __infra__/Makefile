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

.PHONY: create-local-db
create-local-db:
	@echo "📦 This will create your local database using Drizzle."
	@echo "🚨 Make sure your PostgreSQL server (e.g., via Docker) is running before continuing."
	@echo "👉 Choose a package manager: [pnpm/npm]"
	@read pm; \
	if [ "$$pm" = "pnpm" ] || [ "$$pm" = "npm" ]; then \
		cd .. && $$pm drizzle-kit push; \
	else \
		echo "❌ Invalid package manager. Please type 'pnpm' or 'npm'."; \
	fi

