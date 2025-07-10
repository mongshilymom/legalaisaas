#!/bin/bash

# Legal AI SaaS - Automated Deployment Script
# This script automates the entire deployment process

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

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    print_success "All prerequisites are satisfied."
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci
    print_success "Dependencies installed successfully."
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Run linting
    print_status "Running ESLint..."
    npm run lint
    
    # Run type checking
    print_status "Running TypeScript type checking..."
    npm run type-check
    
    # Run unit tests
    print_status "Running unit tests..."
    npm run test
    
    print_success "All tests passed successfully."
}

# Build the application
build_application() {
    print_status "Building application..."
    npm run build
    print_success "Application built successfully."
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_warning "Created .env.local from .env.example. Please update with your values."
        else
            print_error ".env.example not found. Please create environment variables manually."
            exit 1
        fi
    fi
    
    print_success "Environment variables setup complete."
}

# Git operations
git_operations() {
    print_status "Performing git operations..."
    
    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_status "Adding changes to git..."
        git add .
        
        # Commit changes
        commit_message="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
        git commit -m "$commit_message"
        print_success "Changes committed successfully."
    else
        print_warning "No changes to commit."
    fi
    
    # Push to remote
    print_status "Pushing to remote repository..."
    git push origin main
    print_success "Pushed to remote repository successfully."
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy to production
    vercel --prod
    print_success "Deployed to Vercel successfully."
}

# GitHub Actions check
check_github_actions() {
    print_status "Checking GitHub Actions status..."
    
    # This is a placeholder - you would integrate with GitHub API
    # to check the status of the latest workflow run
    print_warning "GitHub Actions status check is not implemented yet."
    print_warning "Please check https://github.com/your-repo/actions manually."
}

# Main deployment function
main() {
    print_status "Starting Legal AI SaaS deployment process..."
    
    # Parse command line arguments
    SKIP_TESTS=false
    SKIP_BUILD=false
    SKIP_GIT=false
    DEPLOY_ONLY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-git)
                SKIP_GIT=true
                shift
                ;;
            --deploy-only)
                DEPLOY_ONLY=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-tests    Skip running tests"
                echo "  --skip-build    Skip building application"
                echo "  --skip-git      Skip git operations"
                echo "  --deploy-only   Only deploy to Vercel"
                echo "  -h, --help      Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute deployment steps
    if [ "$DEPLOY_ONLY" = true ]; then
        deploy_to_vercel
        exit 0
    fi
    
    check_prerequisites
    setup_environment
    install_dependencies
    
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    fi
    
    if [ "$SKIP_BUILD" = false ]; then
        build_application
    fi
    
    if [ "$SKIP_GIT" = false ]; then
        git_operations
    fi
    
    deploy_to_vercel
    check_github_actions
    
    print_success "Deployment completed successfully!"
    print_status "Your Legal AI SaaS application is now live!"
}

# Run main function
main "$@"