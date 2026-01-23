<<<<<<< Updated upstream
<<<<<<< Updated upstream
# Render Deployment Guide - render1 Branch

## Quick Start

This guide will help you deploy the Flatery Backend to Render using the `render1` branch.

## Prerequisites

- GitHub account with access to the repository
- Render account (free at https://render.com)
- MySQL database (PlanetScale, Aiven, or Railway recommended)
- Email service credentials (Gmail or similar SMTP)

## Step 1: Prepare Database

### Option A: PlanetScale (Recommended - Free Tier Available)

1. Sign up at https://planetscale.com
2. Create a new database
3. Get connection details:
   - Database URL format: `jdbc:mysql://[host]/[database]?sslMode=REQUIRED`
   - Username
   - Password

### Option B: Aiven MySQL

1. Sign up at https://aiven.io
2. Create MySQL service (free tier available)
3. Get connection string and credentials

### Option C: Railway

1. Sign up at https://railway.app
2. Create new MySQL database
3. Copy connection details

## Step 2: Deploy to Render

### A. Connect Repository

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select the repository: `Flatery_backend-dev`
5. Select branch: **render1**

### B. Configure Service

Render will auto-detect the Docker configuration from `render.yaml`, but verify:

- **Name**: `flatery-backend-render1`
- **Environment**: Docker
- **Region**: Singapore (or closest to your users)
- **Branch**: render1
- **Plan**: Free

### C. Set Environment Variables

Add these environment variables in Render dashboard:

#### Required Database Variables
```
DATABASE_URL=jdbc:mysql://[your-db-host]:3306/[database]?sslMode=REQUIRED&serverTimezone=UTC
DB_USERNAME=[your-db-username]
DB_PASSWORD=[your-db-password]
```

#### Required Application Variables
```
SPRING_PROFILES_ACTIVE=prod
PORT=8080
FRONTEND_URL=[your-frontend-url]
```

#### JWT Configuration
```
JWT_SECRET_KEY=[generate-using-command-below]
JWT_EXPIRATION_TIME=36000000
```

Generate JWT secret:
```bash
openssl rand -base64 64
```

#### Email Configuration (Optional but Recommended)
```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=[your-email@gmail.com]
MAIL_PASSWORD=[your-app-password]
```

**Note**: For Gmail, create an App Password:
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password for "Mail"

### D. Deploy

1. Click **Create Web Service**
2. Render will:
   - Clone the repository
   - Build Docker image using multi-stage Dockerfile
   - Deploy the container
3. First deployment takes 5-10 minutes

## Step 3: Update Frontend

Update your frontend API configuration to point to the Render URL:

```javascript
// In your frontend api-config.js or similar
const API_BASE_URL = 'https://flatery-backend-render1.onrender.com/api';
```

## Step 4: Verify Deployment

### Check Health
Visit: `https://your-app-name.onrender.com`

### Test Authentication
```bash
curl -X POST https://your-app-name.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

## Important Notes

### Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- 750 hours/month free

### Database Connection
- Ensure your database allows connections from Render IPs
- Use SSL/TLS for database connections
- Keep connection pool size reasonable (max 10 for free tier)

### File Uploads
- Files uploaded to `/app/uploads` are ephemeral on free tier
- Consider using AWS S3, Cloudinary, or similar for persistent storage

### Monitoring
- Check Render logs for errors: Dashboard → Service → Logs
- Enable Render's auto-deploy on git push to render1 branch

## Troubleshooting

### Database Connection Issues
```
Error: Communications link failure
```
**Solution**: 
- Verify DATABASE_URL format
- Check if database allows external connections
- Ensure SSL mode is configured correctly

### Application Won't Start
```
Error: Port already in use
```
**Solution**: 
- Don't set server.port in environment variables
- Let Render set PORT automatically

### Cold Starts Taking Too Long
**Solution**:
- Upgrade to paid plan for always-on service
- Or use a cron job to ping your service every 14 minutes

## Auto-Deploy Setup

Enable automatic deployment on push:

1. In Render dashboard → Service → Settings
2. Under "Auto-Deploy", select: **Yes**
3. Branch: **render1**

Now every push to render1 branch triggers automatic deployment.

## Updating the Application

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push origin render1

# Render will automatically detect and deploy
```

## Rolling Back

In Render dashboard:
1. Go to Service → Events
2. Find previous successful deployment
3. Click "Rollback to this version"

## Support

- Render Docs: https://render.com/docs
- Check logs: Dashboard → Your Service → Logs
- Database issues: Check database provider docs

## Security Checklist

- [ ] JWT_SECRET_KEY is strong and random
- [ ] Database credentials are secure
- [ ] FRONTEND_URL is set to production URL only
- [ ] Email credentials use app-specific passwords
- [ ] Database uses SSL connections
- [ ] Environment variables are not committed to git
=======
=======
>>>>>>> Stashed changes
# Render Deployment Guide

## Prerequisites
- GitHub repository with your code
- Render account (free at https://render.com)
- MySQL database service (PlanetScale, Railway, or Render PostgreSQL as alternative)

## Step 1: Push to GitHub
```bash
git add .
git commit -m "Configure for Render deployment"
git push origin render
```

## Step 2: Set up Database

### Option A: PlanetScale (MySQL - Free Tier)
1. Go to https://planetscale.com
2. Create account and new database
3. Get connection string (format: `jdbc:mysql://...`)

### Option B: Railway (MySQL)
1. Go to https://railway.app
2. Create MySQL database
3. Get connection string

### Option C: Render PostgreSQL (Alternative)
1. In Render dashboard: New → PostgreSQL
2. Get connection string
3. Update `application-prod.properties` to use PostgreSQL driver

## Step 3: Deploy on Render

1. **Sign in to Render**: https://dashboard.render.com

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `Flatery_backend-dev` repository
   - Select `render` branch

3. **Configure Service**:
   - **Name**: `flatery-backend` (or your choice)
   - **Environment**: `Java`
   - **Region**: Choose closest to your users
   - **Branch**: `render`
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -Dspring.profiles.active=prod -jar target/flatery.backenddd-0.0.1-SNAPSHOT.jar`

4. **Add Environment Variables**:

   Click "Environment" tab and add these variables:

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `SPRING_PROFILES_ACTIVE` | `prod` | Use production config |
   | `DATABASE_URL` | `jdbc:mysql://host:port/db?useSSL=true` | Your MySQL connection URL |
   | `DB_USERNAME` | `your_db_user` | Database username |
   | `DB_PASSWORD` | `your_db_password` | Database password |
   | `JWT_SECRET_KEY` | Generate below | JWT signing key |
   | `JWT_EXPIRATION_TIME` | `36000000` | 10 hours in milliseconds |
   | `FRONTEND_URL` | `https://yourusername.github.io/repo` | Your GitHub Pages URL |

   **Generate JWT_SECRET_KEY**:
   ```bash
   openssl rand -base64 64
   ```
   Copy the output and paste as JWT_SECRET_KEY value.

5. **Create Web Service**: Click "Create Web Service"

6. **Wait for Build**: First build takes 5-10 minutes

## Step 4: Update Frontend

1. **Update `api-config.js`**:
   ```javascript
   BASE_URL: 'https://your-app-name.onrender.com/api'
   ```
   Replace `your-app-name` with your actual Render app name.

2. **Deploy Frontend to GitHub Pages**:
   - Go to repo Settings → Pages
   - Source: Deploy from branch (main or frontend branch)
   - Save

3. **Update FRONTEND_URL in Render**:
   - Copy your GitHub Pages URL
   - Update `FRONTEND_URL` environment variable in Render
   - Render will automatically redeploy

## Step 5: Test Deployment

1. **Check Backend Health**:
   ```
   https://your-app-name.onrender.com
   ```

2. **Test Login Endpoint**:
   ```bash
   curl -X POST https://your-app-name.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"Superadmin","password":"admin123"}'
   ```

3. **Test Frontend**: Open your GitHub Pages URL

## Important Environment Variables Summary

```
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:mysql://aws.connect.psdb.cloud/flatery_db?sslMode=VERIFY_IDENTITY
DB_USERNAME=your_username
DB_PASSWORD=your_password
JWT_SECRET_KEY=<your-64-char-base64-key>
JWT_EXPIRATION_TIME=36000000
FRONTEND_URL=https://yourusername.github.io/your-repo
```

## Troubleshooting

### Build Fails
- Check Java version (should be 17)
- Check Maven wrapper permissions
- View logs in Render dashboard

### Database Connection Issues
- Verify DATABASE_URL format
- Check SSL settings
- Ensure database allows connections from Render IPs

### CORS Errors
- Verify FRONTEND_URL matches exactly (no trailing slash)
- Check browser console for error details
- Ensure FRONTEND_URL is set before backend starts

### Application Won't Start
- Check environment variables are set
- View logs in Render dashboard → Logs tab
- Ensure all required env vars are present

## Free Tier Limitations (Render)
- Service spins down after 15 min inactivity
- First request after idle: 30-60 sec startup time
- 750 hours/month free
- Good for development/testing

## Next Steps
1. ✅ Set up custom domain (optional)
2. ✅ Configure health checks
3. ✅ Set up monitoring alerts
4. ✅ Enable automatic deployments on push
5. ✅ Add database backups

## Support Links
- Render Docs: https://render.com/docs
- PlanetScale: https://planetscale.com/docs
- GitHub Pages: https://docs.github.com/pages
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
