# Gmail API Setup Guide for ScamDetect

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000`
5. Note down your Client ID and Client Secret

## Step 3: Update the Application

Replace the placeholder values in `client/src/components/GmailInbox.js`:

```javascript
const CLIENT_ID = 'YOUR_ACTUAL_CLIENT_ID';
const API_KEY = 'YOUR_ACTUAL_API_KEY';
```

## Step 4: Install Google API Client

```bash
cd client
npm install googleapis
```

## Step 5: Real Gmail Integration

The current implementation simulates Gmail access. To connect to real Gmail:

1. **Backend Setup** (Node.js/Express):
   ```javascript
   const { google } = require('googleapis');
   
   const oauth2Client = new google.auth.OAuth2(
     CLIENT_ID,
     CLIENT_SECRET,
     'http://localhost:3000/auth/callback'
   );
   
   app.get('/auth/gmail', (req, res) => {
     const authUrl = oauth2Client.generateAuthUrl({
       access_type: 'offline',
       scope: ['https://www.googleapis.com/auth/gmail.readonly']
     });
     res.redirect(authUrl);
   });
   
   app.get('/auth/callback', async (req, res) => {
     const { code } = req.query;
     const { tokens } = await oauth2Client.getToken(code);
     // Store tokens and redirect to app
   });
   ```

2. **Frontend Integration**:
   ```javascript
   const authenticateGmail = async () => {
     window.location.href = '/auth/gmail';
   };
   ```

## Current Implementation

The app currently shows:
- ✅ **Simulated Gmail Interface** with realistic emails
- ✅ **Scam Detection** on sample emails
- ✅ **Authentication Flow** (simulated)
- ✅ **Email Analysis** with risk scores

## Next Steps for Real Gmail

1. Set up Google Cloud Project
2. Get OAuth credentials
3. Implement backend authentication
4. Replace simulated emails with real Gmail API calls

## Security Notes

- Never expose API keys in frontend code
- Use environment variables for sensitive data
- Implement proper token storage and refresh
- Follow Google's OAuth 2.0 best practices

## Testing

The current version allows you to:
1. Click "Connect Gmail Account" (simulated)
2. View realistic email inbox
3. Analyze emails for scams
4. See detailed risk assessments

This gives you a complete preview of how the real Gmail integration will work! 