PYTHON ?= python3
VENV ?= .venv
PIP := $(VENV)/bin/pip
PYTEST := $(VENV)/bin/pytest
UVICORN := $(VENV)/bin/uvicorn

.PHONY: help venv install api dev test infra-up infra-down gitnexus gitnexus-force

help:
	@echo "Available commands:"
	@echo "  make venv            Create virtual environment"
	@echo "  make install         Install backend dependencies"
	@echo "  make infra-up        Start Postgres and Redis"
	@echo "  make infra-down      Stop Postgres and Redis"
	@echo "  make api             Run FastAPI app"
	@echo "  make test            Run backend tests"
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

gitnexus:
	bash ./scripts/refresh_gitnexus.sh

gitnexus-force:
	npx gitnexus analyze --force