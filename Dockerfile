# ──────────────────────────────────────────
# Stage 1: Build React Frontend
# ──────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ──────────────────────────────────────────
# Stage 2: Python Backend + Serve Static
# ──────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/
COPY policies/ ./policies/

# Copy React build from Stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Environment defaults
ENV POLICIES_PATH=./policies
ENV FLASK_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["python", "backend/app.py"]
