# Legal AI SaaS - Deployment Guide

## 🚀 Automated Deployment Setup

This guide covers the complete automation setup for GitHub integration and Vercel deployment for the Legal AI SaaS platform.

## 📋 Prerequisites

Before starting the automated setup, ensure you have:

1. **Node.js** (v18 or later)
2. **npm** (v8 or later)
3. **Git** (latest version)
4. **GitHub CLI** ([Download here](https://cli.github.com/))
5. **Vercel CLI** (will be installed automatically)

## 🛠️ Quick Start

### 1. Initial Setup

```bash
# Clone or navigate to your project directory
cd Legal_AI_SaaS

# Make scripts executable
chmod +x deploy.sh setup-github.sh

# Install dependencies
npm install
```

### 2. GitHub Repository Setup

```bash
# Run the GitHub setup script
./setup-github.sh

# Or with custom repository name
./setup-github.sh --repo-name "my-legal-ai-saas"
```

This script will:
- Initialize Git repository
- Create GitHub repository
- Set up GitHub secrets
- Configure branch protection
- Create issue/PR templates
- Set up Vercel integration

### 3. Environment Variables

Copy and configure your environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `CLAUDE_API_KEY`: Your Claude API key
- `DATABASE_URL`: Your database connection string

### 4. Deploy to Production

```bash
# Full deployment (recommended for first deploy)
./deploy.sh

# Quick deployment (skip tests and build)
./deploy.sh --skip-tests --skip-build

# Deploy only to Vercel
./deploy.sh --deploy-only
```

## 🔧 Configuration Files

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "type-check": "tsc --noEmit",
    "deploy": "vercel --prod"
  }
}
```

### GitHub Actions Workflows

#### CI/CD Pipeline (`.github/workflows/ci-cd.yml`)
- Runs tests on Node.js 18.x and 20.x
- Performs security scanning
- Deploys previews for PRs
- Deploys to production on main branch

#### Deploy to Vercel (`.github/workflows/deploy-vercel.yml`)
- Builds and tests application
- Deploys to Vercel production

### Vercel Configuration

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "functions": {
    "src/pages/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

## 🔐 Security Setup

### GitHub Secrets Required

Set these secrets in your GitHub repository:

```bash
VERCEL_TOKEN          # Vercel deployment token
VERCEL_ORG_ID         # Vercel organization ID
VERCEL_PROJECT_ID     # Vercel project ID
NEXTAUTH_SECRET       # NextAuth secret
STRIPE_SECRET_KEY     # Stripe secret key
CLAUDE_API_KEY        # Claude API key
DATABASE_URL          # Database connection string
CYPRESS_RECORD_KEY    # Cypress recording key (optional)
```

### Vercel Environment Variables

Configure these in your Vercel dashboard:

- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `CLAUDE_API_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## 📊 Monitoring and Analytics

### GitHub Actions

Monitor your deployments at:
`https://github.com/YOUR_USERNAME/REPO_NAME/actions`

### Vercel Dashboard

Access your deployment logs and analytics at:
`https://vercel.com/dashboard`

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build locally
   npm run build
   
   # Fix TypeScript errors
   npm run type-check
   ```

2. **Environment Variables**
   ```bash
   # Verify environment variables
   vercel env ls
   
   # Add missing variables
   vercel env add VARIABLE_NAME
   ```

3. **GitHub Actions Failures**
   ```bash
   # Check workflow status
   gh workflow list
   
   # View workflow runs
   gh run list
   ```

### Deploy Script Options

```bash
# Available options for deploy.sh
./deploy.sh --help

Options:
  --skip-tests    Skip running tests
  --skip-build    Skip building application
  --skip-git      Skip git operations
  --deploy-only   Only deploy to Vercel
  -h, --help      Show help message
```

### GitHub Setup Script Options

```bash
# Available options for setup-github.sh
./setup-github.sh --help

Options:
  --repo-name NAME    Set repository name (default: legal-ai-saas)
  --skip-secrets      Skip setting up GitHub secrets
  --skip-vercel       Skip Vercel integration setup
  -h, --help          Show help message
```

## 📝 Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push and create PR
git push origin feature/new-feature
gh pr create --title "Add new feature" --body "Description of changes"
```

### 2. Code Review Process

1. Create pull request
2. Automated tests run via GitHub Actions
3. Code review by team members
4. Merge to main branch
5. Automatic deployment to production

### 3. Hotfix Process

```bash
# Create hotfix branch
git checkout -b hotfix/critical-fix

# Make fix and deploy immediately
git add .
git commit -m "Fix critical issue"
git push origin hotfix/critical-fix

# Emergency deploy
./deploy.sh --deploy-only
```

## 📈 Performance Optimization

### Build Optimization

- TypeScript compilation caching
- Next.js incremental builds
- Vercel edge functions for API routes
- Automatic code splitting

### Monitoring

- Vercel Analytics integration
- Error tracking with Sentry (recommended)
- Performance monitoring with Web Vitals
- User analytics with Google Analytics

## 🔄 Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Security audit
npm audit

# Deploy updates
./deploy.sh
```

### Backup Strategy

- Code: GitHub repository
- Database: Automated backups (configure with your DB provider)
- Environment variables: Secure storage (1Password, etc.)

## 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Vercel deployment logs
3. Verify environment variables
4. Run local build test

## 🎯 Next Steps

After successful deployment:

1. Set up domain in Vercel
2. Configure SSL certificates
3. Set up monitoring alerts
4. Configure backup schedules
5. Set up staging environment
6. Configure CDN (if needed)

---

**Note**: This automation setup provides a production-ready deployment pipeline with security best practices, automated testing, and continuous deployment capabilities.