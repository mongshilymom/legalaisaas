#!/bin/bash

# Legal AI SaaS - GitHub Setup Script
# This script sets up GitHub repository and Vercel integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if GitHub CLI is installed
check_github_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI is not installed. Please install it first:"
        print_error "Visit: https://cli.github.com/"
        exit 1
    fi
    
    # Check if user is authenticated
    if ! gh auth status &> /dev/null; then
        print_error "You are not authenticated with GitHub CLI."
        print_error "Please run: gh auth login"
        exit 1
    fi
    
    print_success "GitHub CLI is ready."
}

# Initialize git repository
init_git_repo() {
    print_status "Initializing Git repository..."
    
    if [ ! -d ".git" ]; then
        git init
        print_success "Git repository initialized."
    else
        print_warning "Git repository already exists."
    fi
    
    # Add all files
    git add .
    
    # Create initial commit
    if ! git log --oneline -1 &> /dev/null; then
        git commit -m "Initial commit: Legal AI SaaS project setup"
        print_success "Initial commit created."
    else
        print_warning "Repository already has commits."
    fi
}

# Create GitHub repository
create_github_repo() {
    print_status "Creating GitHub repository..."
    
    # Get repository name
    REPO_NAME=${1:-legal-ai-saas}
    
    # Check if repository already exists
    if gh repo view "$REPO_NAME" &> /dev/null; then
        print_warning "Repository '$REPO_NAME' already exists."
        return 0
    fi
    
    # Create repository
    gh repo create "$REPO_NAME" \
        --public \
        --description "AI-powered legal compliance and document automation SaaS platform" \
        --confirm
    
    print_success "GitHub repository '$REPO_NAME' created successfully."
}

# Set up GitHub repository secrets
setup_github_secrets() {
    print_status "Setting up GitHub repository secrets..."
    
    # List of required secrets
    SECRETS=(
        "VERCEL_TOKEN"
        "VERCEL_ORG_ID"
        "VERCEL_PROJECT_ID"
        "NEXTAUTH_SECRET"
        "STRIPE_SECRET_KEY"
        "CLAUDE_API_KEY"
        "DATABASE_URL"
        "CYPRESS_RECORD_KEY"
    )
    
    for secret in "${SECRETS[@]}"; do
        print_status "Setting up secret: $secret"
        echo -n "Enter value for $secret: "
        read -s secret_value
        echo
        
        if [ -n "$secret_value" ]; then
            gh secret set "$secret" --body "$secret_value"
            print_success "Secret '$secret' set successfully."
        else
            print_warning "Skipping empty secret: $secret"
        fi
    done
}

# Set up branch protection
setup_branch_protection() {
    print_status "Setting up branch protection rules..."
    
    # Enable branch protection for main branch
    gh api repos/:owner/:repo/branches/main/protection \
        --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["test","security-scan"]}' \
        --field enforce_admins=true \
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
        --field restrictions=null \
        --field allow_force_pushes=false \
        --field allow_deletions=false
    
    print_success "Branch protection rules set up successfully."
}

# Set up Vercel integration
setup_vercel_integration() {
    print_status "Setting up Vercel integration..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Link project to Vercel
    print_status "Linking project to Vercel..."
    print_warning "Please follow the prompts to link your project to Vercel."
    vercel link
    
    # Set up environment variables in Vercel
    print_status "Setting up Vercel environment variables..."
    print_warning "Please set up the following environment variables in your Vercel dashboard:"
    print_warning "- NEXTAUTH_SECRET"
    print_warning "- STRIPE_SECRET_KEY"
    print_warning "- CLAUDE_API_KEY"
    print_warning "- DATABASE_URL"
    print_warning "Visit: https://vercel.com/dashboard"
    
    print_success "Vercel integration setup complete."
}

# Create GitHub issue templates
create_issue_templates() {
    print_status "Creating GitHub issue templates..."
    
    mkdir -p .github/ISSUE_TEMPLATE
    
    # Bug report template
    cat > .github/ISSUE_TEMPLATE/bug_report.md << 'EOF'
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
EOF

    # Feature request template
    cat > .github/ISSUE_TEMPLATE/feature_request.md << 'EOF'
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
EOF

    print_success "GitHub issue templates created."
}

# Create pull request template
create_pr_template() {
    print_status "Creating pull request template..."
    
    cat > .github/pull_request_template.md << 'EOF'
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cypress tests pass

## Checklist
- [ ] Code follows the project's style guidelines
- [ ] Self-review of code completed
- [ ] Code is properly commented
- [ ] Documentation updated if needed
- [ ] No breaking changes without proper documentation
- [ ] Security considerations addressed

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Additional Notes
Any additional information that reviewers should know.
EOF

    print_success "Pull request template created."
}

# Main function
main() {
    print_status "Starting GitHub setup for Legal AI SaaS..."
    
    # Parse command line arguments
    REPO_NAME="legal-ai-saas"
    SKIP_SECRETS=false
    SKIP_VERCEL=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --repo-name)
                REPO_NAME="$2"
                shift 2
                ;;
            --skip-secrets)
                SKIP_SECRETS=true
                shift
                ;;
            --skip-vercel)
                SKIP_VERCEL=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --repo-name NAME    Set repository name (default: legal-ai-saas)"
                echo "  --skip-secrets      Skip setting up GitHub secrets"
                echo "  --skip-vercel       Skip Vercel integration setup"
                echo "  -h, --help          Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute setup steps
    check_github_cli
    init_git_repo
    create_github_repo "$REPO_NAME"
    create_issue_templates
    create_pr_template
    
    if [ "$SKIP_SECRETS" = false ]; then
        setup_github_secrets
    fi
    
    setup_branch_protection
    
    if [ "$SKIP_VERCEL" = false ]; then
        setup_vercel_integration
    fi
    
    # Final git push
    git push -u origin main
    
    print_success "GitHub setup completed successfully!"
    print_status "Repository URL: https://github.com/$(gh api user --jq .login)/$REPO_NAME"
    print_status "Next steps:"
    print_status "1. Set up environment variables in Vercel dashboard"
    print_status "2. Configure your domain in Vercel"
    print_status "3. Set up monitoring and analytics"
}

# Run main function
main "$@"