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
