# Docker Deployment Guide

## 🐳 Docker Setup for Video Editor

This guide will help you containerize and deploy the Video Editor application using Docker and deploy it to AWS with GitHub Actions CI/CD.

## 📋 Prerequisites

### Local Development
- Docker Desktop installed
- Git installed

### AWS Deployment
- AWS EC2 instance (Ubuntu 20.04+ recommended)
- Docker Hub account
- GitHub repository
- SSH access to AWS instance

## 🚀 Quick Start

### Local Development

1. **Build and run locally:**
   ```bash
   # Build the Docker image
   docker build -t video-editor .
   
   # Run with docker-compose
   docker-compose up -d
   
   # Or run standalone
   docker run -p 5555:5555 -v $(pwd)/uploads:/app/uploads video-editor
   ```

2. **Access the application:**
   - Main app: http://localhost:5555
   - With Nginx: http://localhost

### AWS Deployment

1. **Set up GitHub Secrets:**
   Go to your GitHub repository → Settings → Secrets and variables → Actions and add:
   
   ```
   DOCKER_USERNAME=your_dockerhub_username
   DOCKER_PASSWORD=your_dockerhub_password
   AWS_HOST=your_aws_public_ip
   AWS_USER=ubuntu  # or ec2-user
   AWS_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
               your_private_key_content
               -----END OPENSSH PRIVATE KEY-----
   AWS_PORT=22
   ```

2. **Initial AWS Setup:**
   SSH into your AWS instance and run:
   ```bash
   # Clone the repository
   git clone https://github.com/Hanlinkyaw/aivideo_editor.git
   cd aivideo_editor
   
   # Run the deployment script
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Automatic Deployment:**
   - Push to `main` branch → GitHub Actions will:
     - Build Docker image
     - Push to Docker Hub
     - Deploy to AWS instance
     - Restart containers

## 📁 File Structure

```
video_editor_web/
├── Dockerfile                    # Main container definition
├── docker-compose.yml           # Multi-container orchestration
├── nginx.conf                    # Nginx reverse proxy config
├── .dockerignore                 # Files to exclude from Docker build
├── deploy.sh                     # AWS deployment script
├── .github/workflows/deploy.yml  # GitHub Actions CI/CD pipeline
├── app.py                        # Flask application
├── requirements.txt              # Python dependencies
├── static/                       # Frontend assets
├── templates/                    # HTML templates
└── uploads/                      # User uploaded files
```

## 🔧 Configuration

### Dockerfile Features
- **Multi-stage build** for optimized image size
- **System dependencies** for video processing (FFmpeg, etc.)
- **Health checks** for monitoring
- **Production-ready** configuration

### Docker Compose Services
- **video-editor**: Main Flask application
- **nginx**: Reverse proxy with SSL termination
- **Persistent volumes** for uploads and outputs

### Nginx Configuration
- **Port forwarding**: 80 → 5555
- **File upload support**: 1GB max file size
- **Static file caching**: Better performance
- **Security headers**: XSS protection, CSP, etc.

## 🛠️ Management Commands

### Docker Commands
```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f video-editor-app

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update and rebuild
git pull && docker-compose up -d --build

# Clean up unused images
docker image prune -f
```

### AWS Instance Commands
```bash
# Check disk space
df -h

# Monitor resources
docker stats

# Backup data
docker run --rm -v video-editor_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restore data
docker run --rm -v video-editor_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## 🔍 Monitoring and Troubleshooting

### Health Checks
- Application health: `curl http://localhost:5555/`
- Nginx health: `curl http://localhost/health`
- Container status: `docker-compose ps`

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using port 80/5555
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :5555
   ```

2. **Permission issues:**
   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER uploads/
   ```

3. **Memory issues:**
   ```bash
   # Check memory usage
   free -h
   docker stats
   ```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow
1. **Trigger**: Push to `main` branch
2. **Build**: Create Docker image with caching
3. **Push**: Upload to Docker Hub
4. **Deploy**: SSH to AWS, pull image, restart services
5. **Cleanup**: Remove old Docker images

### Deployment Steps
```yaml
1. Checkout code
2. Set up Docker Buildx
3. Login to Docker Hub
4. Build and push image
5. SSH to AWS instance
6. Pull latest image
7. Restart containers
8. Clean up old images
```

## 🔒 Security Considerations

- **SSH keys**: Use GitHub Secrets, never commit private keys
- **Environment variables**: Store sensitive data in secrets
- **Network isolation**: Containers in separate network
- **File permissions**: Proper volume permissions
- **Updates**: Regular security updates for base images

## 📈 Scaling

### Horizontal Scaling
```yaml
# Add multiple app instances
services:
  video-editor:
    image: hanlinkyaw/video-editor:latest
    deploy:
      replicas: 3
```

### Load Balancing
- Use AWS Application Load Balancer
- Configure multiple EC2 instances
- Use Docker Swarm or Kubernetes

## 🔄 Backup Strategy

### Data Backup
```bash
# Backup all important data
docker run --rm \
  -v video-editor_uploads:/data/uploads \
  -v video-editor_outputs:/data/outputs \
  -v video-editor_users.db:/data/db \
  -v $(pwd):/backup \
  alpine tar czf /backup/video-editor-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Automated Backup
Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Test locally first
4. Check AWS security groups
5. Verify GitHub Secrets

## 🎯 Next Steps

- Add SSL certificates (Let's Encrypt)
- Set up monitoring (Prometheus/Grafana)
- Configure automated backups
- Add logging aggregation (ELK stack)
- Implement CI/CD for staging environment
