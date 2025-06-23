# Daisyworld Simulation - Vercel Deployment Guide

## Quick Deployment

### Option 1: One-Click Deploy (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/0xhubed/testDaisyworld)

### Option 2: Manual Deployment

1. **Fork or Clone the Repository**
   ```bash
   git clone https://github.com/0xhubed/testDaisyworld.git
   cd testDaisyworld
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Test Build Locally**
   ```bash
   npm run build
   ```

4. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI if not already installed
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

## Configuration

The project includes:
- `vercel.json` - Vercel deployment configuration
- `.vercelignore` - Files to exclude from deployment
- Webpack production build configuration
- Optimized assets and static file handling

## Build Output

- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist/`
- **Framework**: Static (Webpack)

## Environment Variables

No environment variables are required for this static site deployment.

## Performance Optimizations

The deployed version includes:
- Minified JavaScript and CSS
- Optimized Three.js and Chart.js bundles
- Cached static assets
- Gzip compression
- Security headers

## Custom Domain

To use a custom domain:
1. Go to your Vercel dashboard
2. Select your project
3. Navigate to Settings → Domains
4. Add your custom domain

## Troubleshooting

### Build Fails
- Ensure all dependencies are in `package.json`
- Check webpack configuration
- Verify Node.js version compatibility

### 404 Errors
- The `vercel.json` routes configuration handles SPA routing
- All routes redirect to `index.html`

### Performance Issues
- Assets are automatically optimized by Vercel
- Three.js is bundled with webpack optimizations
- Chart.js uses CDN fallback for better performance

## Project Structure

```
dist/                 # Build output (auto-generated)
├── index.html       # Main HTML file
├── bundle.js        # Compiled JavaScript
├── styles.css       # Compiled CSS
└── assets/          # Static assets
```