# Local WordPress Setup

This document sets up a local WordPress instance for TrekYatra development without modifying the main infra stack.

## Why this exists
The main `docker-compose.yml` already owns local Postgres and Redis.
To avoid unnecessary blast radius, local WordPress is isolated into a separate compose file:
- `docker-compose.wordpress.yml`

## Services
- `trekyatra-wordpress-db` → MariaDB on host port `3307`
- `trekyatra-wordpress` → WordPress on host port `8080`