# Unraid Setup Guide for Invoice Generator

This guide provides step-by-step instructions for setting up the Invoice Generator application on an Unraid server.

## Prerequisites

- Unraid server with Docker support enabled
- SSH access to your Unraid server
- Docker Hub account (for CI/CD)

## Manual Setup

### 1. Create a Directory for the Application

```bash
mkdir -p /mnt/user/appdata/invoice-generator
cd /mnt/user/appdata/invoice-generator
```

### 2. Create Environment Files

Create a `.env` file with your database credentials:

```bash
cat > .env << EOL
DB_USER=postgres
DB_NAME=timesheet_db
DB_PASSWORD=your_secure_password
EOL
```

### 3. Download the Docker Compose File

```bash
wget -O docker-compose.yml https://raw.githubusercontent.com/yourusername/invoice-generator/main/docker-compose.yml
```

### 4. Start the Application

```bash
docker-compose up -d
```

## Automated Deployment with CI/CD

### 1. Set Up SSH Access for GitHub Actions

1. Generate an SSH key pair (if you don't already have one):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions"
   ```

2. Add the public key to your Unraid server's authorized keys:
   ```bash
   cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
   ```

3. Add the private key to your GitHub repository secrets as `UNRAID_SSH_KEY`

### 2. Add Other Required Secrets to GitHub

In your GitHub repository, go to Settings > Secrets and add:

- `DOCKER_HUB_USERNAME`: Your Docker Hub username
- `DOCKER_HUB_TOKEN`: Your Docker Hub access token
- `UNRAID_HOST`: Your Unraid server hostname or IP
- `UNRAID_USERNAME`: SSH username for Unraid server

### 3. Configure Deployment Path

In the `.github/workflows/ci-cd.yml` file, update the deployment path:

```yaml
script: |
  cd /mnt/user/appdata/invoice-generator
  docker-compose pull
  docker-compose up -d
```

## Accessing the Application

After deployment, you can access the application at:

- Frontend: `http://your-unraid-ip`
- Backend API: `http://your-unraid-ip:3000/api`

## Persistent Storage

The PostgreSQL database data is stored in a Docker volume. To ensure data persistence across container restarts, the volume is mounted to:

```
/mnt/user/appdata/invoice-generator/postgres_data
```

## Troubleshooting

### Check Container Status

```bash
docker ps -a | grep invoice
```

### View Container Logs

```bash
docker logs invoice-frontend
docker logs timesheet-backend
docker logs postgres-db
```

### Restart Containers

```bash
cd /mnt/user/appdata/invoice-generator
docker-compose restart
```

### Rebuild and Restart

```bash
cd /mnt/user/appdata/invoice-generator
docker-compose down
docker-compose up -d
```
