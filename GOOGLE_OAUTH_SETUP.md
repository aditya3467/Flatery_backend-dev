# Google OAuth2 Sign-In Setup Guide

## Overview
Google OAuth2 integration is now configured in your application. Follow these steps to complete the setup.

## Steps to Enable Google Sign-In

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Google+ API" or "Google Identity Services"

### 2. Create OAuth 2.0 Credentials
1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in required fields:
     - App name: `Flatery`
     - User support email: Your email
     - Developer contact email: Your email
   - Add scopes: `email`, `profile`
   - Add test users (your email addresses for testing)

4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Flatery Backend`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:8080
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:8081/login/oauth2/code/google
     ```

5. Click **Create** and note down:
   - **Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abc123xyz`)

### 3. Update Application Configuration
1. Open `src/main/resources/application.properties`
2. Replace the placeholder values with your actual credentials:

```properties
# Replace YOUR_GOOGLE_CLIENT_ID with your actual Client ID
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID

# Replace YOUR_GOOGLE_CLIENT_SECRET with your actual Client Secret
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
```

### 4. Restart Application
1. Stop the running application (Ctrl+C in terminal)
2. Restart it:
```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home && ./mvnw spring-boot:run
```

### 5. Test Google Sign-In
1. Open http://localhost:8080 in your browser
2. Click **Login** button
3. Click **Sign in with Google** button
4. Sign in with your Google account
5. You should be redirected back and automatically logged in

## How It Works

### Backend Flow:
1. User clicks "Sign in with Google"
2. Frontend redirects to `/oauth2/authorization/google`
3. Spring Security redirects to Google's OAuth consent screen
4. User authorizes the application
5. Google redirects back to `/login/oauth2/code/google`
6. `OAuth2AuthenticationSuccessHandler` processes the response:
   - Extracts user email and name
   - Creates new user if doesn't exist
   - Generates JWT token
   - Redirects to frontend with token: `http://localhost:8080/index.html?token=JWT&username=USER&email=EMAIL`

### Frontend Flow:
1. `handleOAuth2Callback()` checks URL for token parameter
2. Stores token, username, and email in localStorage
3. Updates UI to show logged-in state
4. Cleans URL to remove query parameters

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in Google Cloud Console exactly matches: `http://localhost:8081/login/oauth2/code/google`
- No trailing slash, must be HTTP (not HTTPS) for localhost

### Error: "invalid_client"
- Check that client ID and secret are correct in application.properties
- Ensure no extra spaces or quotes

### User created but not assigned role
- Default role is "TENANT" (assigned in OAuth2AuthenticationSuccessHandler)
- You can modify this in `OAuth2AuthenticationSuccessHandler.java`

### OAuth works but can't access protected endpoints
- JWT token is generated and stored correctly
- Ensure API requests include the token in Authorization header: `Bearer {token}`
- Check that `api.js` is using the stored token

## Security Notes

- Client secret should be kept secure
- For production, use environment variables instead of hardcoding credentials
- Use HTTPS in production
- Configure proper OAuth consent screen with privacy policy and terms of service
- Review and limit OAuth scopes to only what's necessary (email and profile)

## Current Configuration

**Backend URL:** http://localhost:8081  
**Frontend URL:** http://localhost:8080  
**OAuth Redirect URI:** http://localhost:8081/login/oauth2/code/google  
**Frontend Redirect:** http://localhost:8080/index.html  
**OAuth Scopes:** profile, email  
**Default Role:** TENANT  
**Token Type:** JWT (10-hour expiration)
