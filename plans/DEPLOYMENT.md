# GitHub Pages Deployment Guide

This document explains how to deploy the Math Munchers game to GitHub Pages.

## Automatic Deployment

The repository is configured with GitHub Actions for automatic deployment. Every time you push to the `main` branch, the game will be automatically built and deployed to GitHub Pages.

### Setup Instructions

1. **Enable GitHub Pages** in your repository:
   - Go to your repository on GitHub
   - Click on "Settings" tab
   - Scroll down to "Pages" section
   - Under "Source", select "GitHub Actions"

2. **Update Repository Name** in `vite.config.ts`:
   - If your repository is not named "math", update the base path:
   ```typescript
   base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
   ```

3. **Push to Main Branch**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

4. **Access Your Game**:
   - After deployment, your game will be available at:
   - `https://your-username.github.io/your-repo-name/`

## Manual Deployment

If you prefer to deploy manually:

```bash
# Build the project
npm run build

# The built files will be in the 'dist' directory
# You can deploy these files to any static hosting service
```

## Workflow Details

The GitHub Action workflow (`.github/workflows/deploy.yml`) does the following:

1. **Triggers**: Runs on pushes to `main` branch and can be triggered manually
2. **Build Step**: 
   - Checks out code
   - Sets up Node.js 18
   - Installs dependencies with `npm ci`
   - Builds project with `npm run build`
3. **Deploy Step**: 
   - Uploads the `dist` folder to GitHub Pages
   - Makes the site available at your GitHub Pages URL

## Troubleshooting

### Common Issues

1. **404 Error**: Make sure the base path in `vite.config.ts` matches your repository name
2. **Build Fails**: Check that all dependencies are listed in `package.json`
3. **Pages Not Enabled**: Ensure GitHub Pages is enabled with "GitHub Actions" as source

### Checking Deployment Status

1. Go to the "Actions" tab in your GitHub repository
2. Click on the latest workflow run
3. Check if both "build" and "deploy" jobs completed successfully

### Local Testing

To test the production build locally:

```bash
npm run build
npm run preview
```

This will build the project and serve it locally with the same configuration as production.

## Environment Variables

The deployment uses these environment variables:

- `NODE_ENV`: Set to 'production' during GitHub Actions build
- `base`: Set to your repository path for proper routing

## Security

The workflow uses minimal permissions:
- `contents: read` - To read repository files
- `pages: write` - To deploy to GitHub Pages  
- `id-token: write` - For secure deployment

## Performance

The built game includes:
- Minified JavaScript and CSS
- Optimized assets
- Source maps for debugging
- Modern ES2015+ target for better performance 