# Generic OAuth 2.0 Authentication Setup

Connect Matterspark to any OAuth 2.0 provider for single sign-on (SSO). This is a plain OAuth 2.0 flow — no OpenID Connect or discovery endpoint required.

## Prerequisites

- A running Matterspark instance with admin access
- An OAuth 2.0 provider that supports the Authorization Code flow
- Your provider must have a **User Info API** that returns JSON with at least:
  - An identifier: `id`, `sub`, or `uid`
  - An `email` field

## Step 1: Register an Application with Your OAuth Provider

In your OAuth provider's dashboard, create a new OAuth application with these settings:

| Field | Value |
|---|---|
| **Redirect URI** | `https://your-matterspark-url/signup/oauth2/complete` |
| **Grant Type** | Authorization Code |

After registering, note down:
- **Client ID**
- **Client Secret**
- **Authorization URL** (where users are redirected to log in)
- **Token URL** (where the auth code is exchanged for a token)
- **User Info URL** (where user profile data is fetched)

## Step 2: Configure Matterspark

1. Go to **System Console → Authentication → OAuth 2.0 (Generic)**
2. Set **Enable OAuth 2.0 Authentication** to `true`
3. Fill in the fields:

| Setting | Description | Example |
|---|---|---|
| **Client ID** | From your OAuth provider | `9a78520c-9188-4e9f-...` |
| **Client Secret** | From your OAuth provider | `your-secret-here` |
| **Authorization Endpoint** | URL users are redirected to for login | `https://provider.com/oauth/authorize` |
| **Token Endpoint** | URL to exchange auth code for access token | `https://provider.com/oauth/token` |
| **User API Endpoint** | URL to fetch user info with the access token | `https://provider.com/api/userinfo` |
| **Scope** | OAuth scopes to request (optional) | `profile email` |
| **Button Name** | Text on the login button | `Sign In With MyProvider` |
| **Button Color** | Hex color for the login button background | `#ff9210` |

4. Click **Save**

## Step 3: Test

1. Log out of Matterspark
2. On the login page, you should see a button with your custom name and color
3. Click it — you'll be redirected to your OAuth provider
4. After authenticating, you'll be redirected back and logged in

## User Info API Response

The User Info endpoint must return JSON. The provider supports many common field names:

```json
{
  "id": "12345",
  "email": "user@example.com",
  "username": "jdoe",
  "name": "Jane Doe"
}
```

### Supported Fields

| Purpose | Accepted Field Names (in priority order) |
|---|---|
| **User ID** | `sub`, `id`, `uid`, or falls back to `email` |
| **Email** | `email` (required) |
| **Username** | `username`, `login`, `preferred_username`, or derived from email |
| **First Name** | `first_name`, `given_name`, or first word of `name` |
| **Last Name** | `last_name`, `family_name`, or remaining words of `name` |

## Common Providers — Quick Reference

### Replit Auth

| Setting | Value |
|---|---|
| Authorization Endpoint | `https://replit.com/oauth/authorize` |
| Token Endpoint | `https://replit.com/oauth/token` |
| User API Endpoint | `https://replit.com/api/v0/user` |
| Scope | `profile email` |

### GitHub

| Setting | Value |
|---|---|
| Authorization Endpoint | `https://github.com/login/oauth/authorize` |
| Token Endpoint | `https://github.com/login/oauth/access_token` |
| User API Endpoint | `https://api.github.com/user` |
| Scope | `read:user user:email` |

### Discord

| Setting | Value |
|---|---|
| Authorization Endpoint | `https://discord.com/api/oauth2/authorize` |
| Token Endpoint | `https://discord.com/api/oauth2/token` |
| User API Endpoint | `https://discord.com/api/users/@me` |
| Scope | `identify email` |

### Custom / Self-Hosted

Use whatever URLs your provider exposes. The only hard requirements are:
1. The provider supports the **Authorization Code** grant type
2. The **User Info** endpoint returns JSON with `email` and some form of user ID

## Troubleshooting

| Problem | Solution |
|---|---|
| Button doesn't appear on login page | Make sure **Enable** is `true` and you've saved. Clear browser cache. |
| "URL is too long" error | The default max URL length is 8192. If your provider adds very large state, increase `MaximumURLLength` in config. |
| Redirected back to login silently | Check that your **Redirect URI** in the OAuth provider exactly matches `https://your-site/signup/oauth2/complete`. |
| "user email is empty" error | Your User Info endpoint isn't returning an `email` field. Check the scope and API response. |
| "user id/sub is empty" error | Your User Info endpoint must return at least one of: `sub`, `id`, or `uid`. |

## How It Works

```
User clicks "Sign In" button
        │
        ▼
Browser redirects to Authorization Endpoint
with client_id, redirect_uri, state, scope
        │
        ▼
User logs in at OAuth Provider
        │
        ▼
Provider redirects back to
/signup/oauth2/complete?code=...&state=...
        │
        ▼
Matterspark exchanges code for access_token
at Token Endpoint
        │
        ▼
Matterspark fetches user info from
User API Endpoint using Bearer token
        │
        ▼
User is matched/created and logged in
```
