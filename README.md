# Skillerious - Software Project Showcase

A stunning, world-class portfolio website showcasing software projects with live GitHub integration. Built with vanilla HTML, CSS, and JavaScript - featuring a professional dark theme with vibrant blue accents.

## Features

### Core Features
- **Live GitHub Integration**: Automatically fetches and displays your repositories using the GitHub API
- **Beautiful Project Modals**: Click any project card to see detailed information including:
  - Repository statistics (stars, forks, issues, size)
  - Technologies and topics
  - Creation and update dates
  - License information
  - README preview with markdown rendering
- **Dark Theme**: Professional dark design (#0a0e1a) with blue accents (#3b82f6)
- **Fully Responsive**: Looks amazing on all devices from mobile to desktop
- **Smooth Animations**: Particle effects, typing animations, counter animations, and scroll effects

### Interactive Elements
- **Dynamic Project Cards**: Auto-generated from your GitHub repositories
- **GitHub Stats Dashboard**: Live statistics including followers, repos, following, and gists
- **Project Detail Modals**: Rich information display with smooth animations
- **Smart Caching**: 5-minute cache to reduce API calls
- **README Rendering**: Simple markdown to HTML conversion for repository READMEs
- **Mobile Navigation**: Hamburger menu with smooth transitions
- **Keyboard Navigation**: ESC to close modals and mobile menu

### Design Elements
- Particle animation background
- Typing effect cycling through phrases
- Animated counters
- Hover effects on all interactive elements
- Custom scrollbar
- Smooth scroll behavior
- Fade-in animations for sections

## Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS variables, flexbox, and grid
- **JavaScript (ES6+)**: Async/await, Fetch API, DOM manipulation
- **GitHub API**: Live repository data
- **Google Fonts**: Inter font family

## Quick Start

### Local Development

1. **Clone or download** this repository

2. **Open `index.html`** in your browser, or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (with http-server)
   npx http-server
   ```

3. **Visit** `http://localhost:8000`

## Configuration

### Update GitHub Username

Edit [script.js:14](script.js#L14) to change the GitHub username:

```javascript
const CONFIG = {
    githubUsername: 'skillerious',  // Change to your GitHub username
    githubApiBase: 'https://api.github.com',
    featuredRepos: [],  // Optionally specify repos to feature
    excludeRepos: ['skillerious'],  // Repos to exclude
    maxRepos: 12,  // Maximum number of repos to display
    cacheTimeout: 5 * 60 * 1000  // Cache duration (5 minutes)
};
```

### GitHub API Rate Limiting

The GitHub API allows 60 requests per hour for unauthenticated requests. For higher limits:

1. Create a [GitHub Personal Access Token](https://github.com/settings/tokens)
2. Add it to the config in [script.js:17](script.js#L17):
   ```javascript
   githubToken: 'your_token_here',
   ```

### Customize Featured Projects

To feature specific repositories in order:

```javascript
featuredRepos: ['awesome-project', 'another-project', 'third-project'],
```

## Deployment to GitHub Pages

### Method 1: GitHub UI (Easiest)

1. **Create a repository** named `your-username.github.io`
2. **Upload files**: index.html, styles.css, script.js, README.md
3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Select "main" branch as source
   - Save
4. **Visit**: `https://your-username.github.io`

### Method 2: Git Command Line

```bash
# Initialize and commit
git init
git add .
git commit -m "Initial commit: GitHub showcase website"

# Push to GitHub
git remote add origin https://github.com/skillerious/skillerious.github.io.git
git branch -M main
git push -u origin main

# Enable GitHub Pages in Settings → Pages
```

## Customization Guide

### Update Personal Information

1. **Edit [index.html:84-85](index.html#L84-L85)** - Update the About section
2. **Edit [index.html:88-105](index.html#L88-L105)** - Customize skills and technologies
3. **Change Colors** in [styles.css:7-24](styles.css#L7-L24):
   ```css
   :root {
       --primary-blue: #3b82f6;
       --primary-blue-dark: #2563eb;
       --primary-blue-light: #60a5fa;
   }
   ```

### Advanced Features

The website includes:

- **Language Icons**: SVG icons for JavaScript, Python, TypeScript, Java, C#, Go, Rust, PHP, Ruby
- **Language Colors**: GitHub-style language colors
- **Markdown Rendering**: Basic markdown to HTML conversion for READMEs
- **State Management**: Caches GitHub data to minimize API calls
- **Error Handling**: Graceful fallbacks if GitHub API fails

## File Structure

```
.
├── index.html          # Main HTML structure with modal dialog
├── styles.css          # Complete styling (1426 lines)
├── script.js           # GitHub API integration & interactivity (737 lines)
└── README.md           # This file
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

## Features Deep Dive

### Modal System

The modal dialog system provides:
- Full repository details from GitHub API
- README preview with markdown rendering
- Repository statistics and metadata
- Technology tags and topics
- Direct links to GitHub repository and homepage
- Responsive design for mobile devices

### GitHub Integration

The website dynamically:
- Fetches your GitHub profile statistics
- Loads all public repositories
- Filters out forks and excluded repos
- Sorts by update date or featured list
- Caches data for 5 minutes
- Handles API errors gracefully

### Animations

- **Particle System**: 50 floating particles with random paths
- **Typing Effect**: Cycles through phrases with realistic typing/deleting
- **Counter Animations**: Smooth number count-ups
- **Scroll Animations**: Fade-in effects as elements enter viewport
- **Hover Effects**: Transform and color transitions

## Performance

- **Lightweight**: Total size under 100KB (HTML + CSS + JS)
- **No Dependencies**: Pure vanilla JavaScript
- **Optimized Rendering**: Efficient DOM manipulation
- **Smart Caching**: Reduces API calls
- **Fast Loading**: Minimal blocking resources

## SEO Optimization

- Semantic HTML5 elements
- Meta descriptions
- Proper heading hierarchy
- Alt-ready (add to images if needed)
- Clean URLs with GitHub Pages

## Accessibility

- Keyboard navigation support
- ARIA labels on modal controls
- Sufficient color contrast
- Responsive text sizing
- Focus indicators
- ESC key to close modals

## License

This project is open source and available under the [MIT License](LICENSE).

## Credits

Designed and developed for showcasing software projects.

## Support

If you encounter issues:
- Check the browser console for errors
- Verify your GitHub username in the config
- Ensure you haven't hit GitHub API rate limits
- Check your internet connection

## Changelog

### Version 2.0.0 (2025-11-17)
- Complete redesign as project showcase
- Added GitHub API integration
- Implemented modal dialog system
- Added README preview with markdown rendering
- Enhanced animations and interactions
- Removed service-oriented content
- Focus on portfolio showcase
- Live repository statistics
- Automatic project card generation
- Smart caching system

### Version 1.0.0 (2025-11-17)
- Initial release
- Basic portfolio structure

---

**Built with passion using vanilla HTML, CSS, and JavaScript**

Made by [Skillerious](https://github.com/skillerious)
