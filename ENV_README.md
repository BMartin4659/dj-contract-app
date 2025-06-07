# Environment Setup Guide for DJ Contract App

This project uses different environment configurations for development, testing, and production environments. This ensures that your dev and main branches can use different API keys, Firebase configs, Stripe keys, etc.

## Environment Files

The following environment files are used:

- `.env.development.local` - Used for local development
- `.env.test.local` - Used for testing and QA environments
- `.env.production.local` - Template for production values (actual values should be set in Vercel)
- `.env.local` - Fallback for any environment

## How It Works

1. **Local Development**: 
   - When you run `npm run dev`, Next.js uses variables from `.env.development.local`
   - This ensures you're using development/test API keys and services locally

2. **Testing Environment**:
   - Test environments load variables from `.env.test.local`
   - Useful for automated testing and QA environments

3. **Production Deployment**:
   - Production values should be set in Vercel's environment variables
   - The `.env.production.local` file serves as a template but should never contain actual production credentials

## Vercel Environment Setup

For deployed branches, environment variables should be configured in Vercel:

1. **Main Branch (Production)**:
   - Go to Vercel → Project Settings → Environment Variables
   - Add production variables in the "Production" tab
   - Use real production API keys, credentials, and secrets

2. **Dev Branch (Preview)**:
   - Go to Vercel → Project Settings → Environment Variables
   - Add development variables in the "Preview" tab
   - Use test API keys and credentials

## Important Security Notes

1. **NEVER commit real API keys or secrets to Git**:
   - All `.env*` files are gitignored
   - The files included in the repo are templates with placeholder values

2. **NEXT_PUBLIC_ Variables**:
   - Variables prefixed with `NEXT_PUBLIC_` are available in the browser
   - Only use this prefix for values that are safe to expose publicly
   - Sensitive API keys and secrets should never have this prefix

3. **Service Accounts**:
   - Firebase service account JSON should be properly escaped in the environment variable
   - Never commit actual service account credentials

## Testing Environment Configuration

To verify that environment variables are loading correctly:

1. The `EnvChecker` component will display in development mode
2. It shows a badge indicating the current environment (DEV or PROD)
3. You can click "Show Environment Details" to see partial key information

This helps ensure your application is using the correct environment configuration. 