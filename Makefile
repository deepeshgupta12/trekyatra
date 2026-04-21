PYTHON ?= python3
VENV ?= .venv
PIP := $(VENV)/bin/pip
PYTEST := $(VENV)/bin/pytest
UVICORN := $(VENV)/bin/uvicorn
ALEMBIC := $(VENV)/bin/alembic

.PHONY: help venv install api dev test infra-up infra-down gitnexus gitnexus-force db-upgrade db-current db-history

help:
	@echo "Available commands:"
	@echo "  make venv            Create virtual environment"
	@echo "  make install         Install backend dependencies"
	@echo "  make infra-up        Start Postgres and Redis"
	@echo "  make infra-down      Stop Postgres and Redis"
	@echo "  make api             Run FastAPI app"
	@echo "  make test            Run backend tests"
	@echo "  make db-upgrade      Run Alembic upgrade head"
	@echo "  make db-current      Show current Alembic revision"
	@echo "  make db-history      Show Alembic history"
	@echo "  make gitnexus        Build/refresh GitNexus graph"
	@echo "  make gitnexus-force  Force rebuild GitNexus graph"

venv:
	$(PYTHON) -m venv $(VENV)

install:
	$(PIP) install --upgrade pip
	$(PIP) install -e ./services/api
	$(PIP) install pytest httpx

infra-up:
	docker compose up -d

infra-down:
	docker compose down

api:
	cd services/api && ../../$(UVICORN) app.main:app --reload --host 0.0.0.0 --port 8000

test:
	cd services/api && ../../$(PYTEST) -q

db-upgrade:
	cd services/api && ../../$(ALEMBIC) upgrade head

db-current:
	cd services/api && ../../$(ALEMBIC) current

db-history:
	cd services/api && ../../$(ALEMBIC) history

gitnexus:
	bash ./scripts/refresh_gitnexus.sh

gitnexus-force:
	npx gitnexus analyze --force