// ===============================================
// PROFESSIONAL SOFTWARE SHOWCASE
// Enhanced JavaScript with GitHub API Integration
// ===============================================

(function() {
    'use strict';

    // ===============================================
    // CONFIGURATION
    // ===============================================

    const CONFIG = {
        githubUsername: 'skillerious',
        githubApiBase: 'https://api.github.com',
        // Optionally add your personal access token for higher rate limits
        // githubToken: 'your_token_here',
        featuredRepos: [], // Leave empty to show all public repos
        excludeRepos: ['skillerious'], // Repos to exclude from showcase
        maxRepos: 12, // Maximum number of repositories to display
        featuredLimit: 6, // Number of repos to show on home page (rest go to software.html)
        cacheTimeout: 5 * 60 * 1000 // Cache GitHub data for 5 minutes
    };

    // ===============================================
    // STATE MANAGEMENT
    // ===============================================

    const state = {
        repositories: [],
        userInfo: null,
        currentRepo: null,
        cache: {
            repos: null,
            userInfo: null,
            timestamp: null
        }
    };

    // ===============================================
    // NAVIGATION
    // ===============================================

    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navLinkItems = document.querySelectorAll('.nav-link');

    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Mobile hamburger menu
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Smooth scrolling for nav links
    navLinkItems.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    // Close mobile menu if open
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('active');

                    // Scroll to target
                    const offsetTop = targetElement.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });

                    // Update active link
                    navLinkItems.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    });

    // Update active nav link on scroll
    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinkItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // ===============================================
    // PARTICLES ANIMATION
    // ===============================================

    const particlesContainer = document.getElementById('particles');

    if (particlesContainer) {
        createParticles();
    }

    function createParticles() {
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = Math.random() * 3 + 1;
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 5;

            particle.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                background: rgba(59, 130, 246, ${Math.random() * 0.5 + 0.2});
                border-radius: 50%;
                animation: float ${duration}s ${delay}s infinite ease-in-out;
            `;

            particlesContainer.appendChild(particle);
        }

        if (!document.getElementById('particle-styles')) {
            const style = document.createElement('style');
            style.id = 'particle-styles';
            style.textContent = `
                @keyframes float {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                        opacity: 0.3;
                    }
                    25% {
                        transform: translate(20px, -30px) scale(1.1);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translate(-20px, -60px) scale(0.9);
                        opacity: 0.4;
                    }
                    75% {
                        transform: translate(30px, -40px) scale(1.05);
                        opacity: 0.5;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ===============================================
    // TYPING ANIMATION
    // ===============================================

    const typingText = document.querySelector('.typing-text');

    if (typingText) {
        const texts = [
            'Building the Future',
            'Crafting Solutions',
            'Writing Clean Code',
            'Creating Innovation',
            'Exploring Technologies'
        ];

        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 100;

        function type() {
            const currentText = texts[textIndex];

            if (isDeleting) {
                typingText.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
                typingSpeed = 50;
            } else {
                typingText.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
                typingSpeed = 100;
            }

            if (!isDeleting && charIndex === currentText.length) {
                typingSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                typingSpeed = 500;
            }

            setTimeout(type, typingSpeed);
        }

        setTimeout(type, 1000);
    }

    // ===============================================
    // COUNTER ANIMATION
    // ===============================================

    let statsAnimated = false;

    function animateCounters(stats) {
        if (statsAnimated) return;

        stats.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count'));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    stat.textContent = Math.floor(current).toLocaleString();
                    requestAnimationFrame(updateCounter);
                } else {
                    stat.textContent = target.toLocaleString();
                }
            };

            updateCounter();
        });

        statsAnimated = true;
    }

    // ===============================================
    // GITHUB API FUNCTIONS
    // ===============================================

    async function fetchFromGitHub(endpoint) {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (CONFIG.githubToken) {
            headers['Authorization'] = `token ${CONFIG.githubToken}`;
        }

        try {
            const response = await fetch(`${CONFIG.githubApiBase}${endpoint}`, { headers });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('GitHub API fetch error:', error);
            throw error;
        }
    }

    async function fetchUserInfo() {
        // Check cache
        if (state.cache.userInfo && state.cache.timestamp &&
            (Date.now() - state.cache.timestamp) < CONFIG.cacheTimeout) {
            return state.cache.userInfo;
        }

        const userInfo = await fetchFromGitHub(`/users/${CONFIG.githubUsername}`);
        state.cache.userInfo = userInfo;
        state.userInfo = userInfo;
        return userInfo;
    }

    async function fetchRepositories() {
        // Check cache
        if (state.cache.repos && state.cache.timestamp &&
            (Date.now() - state.cache.timestamp) < CONFIG.cacheTimeout) {
            return state.cache.repos;
        }

        const repos = await fetchFromGitHub(`/users/${CONFIG.githubUsername}/repos?sort=updated&per_page=100`);

        // Filter and sort repositories
        let filteredRepos = repos.filter(repo =>
            !repo.fork &&
            !CONFIG.excludeRepos.includes(repo.name) &&
            !repo.private
        );

        // If featured repos are specified, prioritize them
        if (CONFIG.featuredRepos.length > 0) {
            filteredRepos = filteredRepos.sort((a, b) => {
                const aIndex = CONFIG.featuredRepos.indexOf(a.name);
                const bIndex = CONFIG.featuredRepos.indexOf(b.name);

                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return new Date(b.updated_at) - new Date(a.updated_at);
            });
        }

        filteredRepos = filteredRepos.slice(0, CONFIG.maxRepos);

        state.cache.repos = filteredRepos;
        state.cache.timestamp = Date.now();
        state.repositories = filteredRepos;

        return filteredRepos;
    }

    async function fetchReadme(repoName) {
        try {
            const response = await fetch(
                `https://raw.githubusercontent.com/${CONFIG.githubUsername}/${repoName}/main/README.md`
            );

            if (!response.ok) {
                // Try master branch
                const masterResponse = await fetch(
                    `https://raw.githubusercontent.com/${CONFIG.githubUsername}/${repoName}/master/README.md`
                );
                if (masterResponse.ok) {
                    return await masterResponse.text();
                }
                return null;
            }

            return await response.text();
        } catch (error) {
            console.error('Error fetching README:', error);
            return null;
        }
    }

    // ===============================================
    // RENDER FUNCTIONS
    // ===============================================

    function renderGitHubStats(userInfo) {
        const statsContainer = document.getElementById('githubStats');
        if (!statsContainer || !userInfo) return;

        const stats = [
            {
                icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
                value: userInfo.followers,
                label: 'Followers'
            },
            {
                icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>',
                value: userInfo.public_repos,
                label: 'Repositories'
            },
            {
                icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
                value: userInfo.following,
                label: 'Following'
            },
            {
                icon: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
                value: userInfo.public_gists,
                label: 'Gists'
            }
        ];

        statsContainer.innerHTML = stats.map(stat => `
            <div class="github-stat-card">
                ${stat.icon}
                <span class="github-stat-value">${stat.value.toLocaleString()}</span>
                <span class="github-stat-label">${stat.label}</span>
            </div>
        `).join('');

        // Update hero stats
        const heroStats = document.querySelectorAll('.hero .stat-number');
        if (heroStats.length >= 2) {
            heroStats[0].setAttribute('data-count', userInfo.public_repos);
            heroStats[2].setAttribute('data-count', userInfo.followers);
        }
    }

    function getLanguageIcon(language) {
        const icons = {
            'JavaScript': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/></svg>',
            'Python': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/></svg>',
            'TypeScript': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/></svg>',
            'Java': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.851 18.56s-.917.534.653.714c1.902.218 2.874.187 4.969-.211 0 0 .552.346 1.321.646-4.699 2.013-10.633-.118-6.943-1.149M8.276 15.933s-1.028.761.542.924c2.032.209 3.636.227 6.413-.308 0 0 .384.389.987.602-5.679 1.661-12.007.13-7.942-1.218M13.116 11.475c1.158 1.333-.304 2.533-.304 2.533s2.939-1.518 1.589-3.418c-1.261-1.772-2.228-2.652 3.007-5.688 0-.001-8.216 2.051-4.292 6.573M19.33 20.504s.679.559-.747.991c-2.712.822-11.288 1.069-13.669.033-.856-.373.75-.89 1.254-.998.527-.114.828-.093.828-.093-.953-.671-6.156 1.317-2.643 1.887 9.58 1.553 17.462-.7 14.977-1.82M9.292 13.21s-4.362 1.036-1.544 1.412c1.189.159 3.561.123 5.77-.062 1.806-.152 3.618-.477 3.618-.477s-.637.272-1.098.587c-4.429 1.165-12.986.623-10.522-.568 2.082-1.006 3.776-.892 3.776-.892M17.116 17.584c4.503-2.34 2.421-4.589.968-4.285-.355.074-.515.138-.515.138s.132-.207.385-.297c2.875-1.011 5.086 2.981-.928 4.562 0-.001.07-.062.09-.118M14.401 0s2.494 2.494-2.365 6.33c-3.896 3.077-.888 4.832-.001 6.836-2.274-2.053-3.943-3.858-2.824-5.539 1.644-2.469 6.197-3.665 5.19-7.627M9.734 23.924c4.322.277 10.959-.153 11.116-2.198 0 0-.302.775-3.572 1.391-3.688.694-8.239.613-10.937.168 0-.001.553.457 3.393.639"/></svg>',
            'C#': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zM9.426 7.12c.974 0 1.457.328 1.902.548l.362.164v2.305l-.104-.086c-.455-.313-.975-.475-1.546-.483-1.066 0-1.812.795-1.812 1.933 0 1.138.738 1.93 1.799 1.93.54 0 1.05-.161 1.518-.477l.104-.08v2.285l-.36.159c-.452.204-.964.403-1.87.403-1.87 0-3.25-1.33-3.25-3.131 0-1.875 1.38-3.47 3.257-3.47zm6.24.19h2.354v1.103h-2.354V10.2h2.354v1.093h-2.354v1.866h2.354v1.093h-3.585V7.31zm6.84 0v1.103h-1.477v4.739h-1.23V8.413h-1.477V7.31z"/></svg>',
            'Go': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.811 10.231c-.047 0-.058-.023-.035-.059l.246-.315c.023-.035.081-.058.128-.058h4.172c.046 0 .058.035.035.07l-.199.303c-.023.036-.082.07-.117.07zM.047 11.306c-.047 0-.059-.023-.035-.058l.245-.316c.023-.035.082-.058.129-.058h5.328c.047 0 .07.035.058.07l-.093.28c-.012.047-.058.07-.105.07zm2.828 1.075c-.047 0-.059-.035-.035-.07l.163-.292c.023-.035.07-.07.117-.07h2.337c.047 0 .07.035.07.082l-.023.28c0 .047-.047.082-.082.082zm12.129-2.36c-.736.187-1.239.327-1.963.514-.176.046-.187.058-.34-.117-.174-.199-.303-.327-.548-.444-.737-.362-1.45-.257-2.115.175-.795.514-1.204 1.274-1.192 2.22.011.935.654 1.706 1.577 1.835.795.105 1.46-.175 1.987-.77.105-.13.198-.27.315-.434H10.47c-.245 0-.303-.152-.222-.35.152-.362.432-.97.596-1.274a.315.315 0 0 1 .292-.187h4.253c-.023.316-.023.631-.07.947a4.983 4.983 0 0 1-.958 2.29c-.841 1.11-1.94 1.8-3.33 1.986-1.145.152-2.209-.07-3.143-.77-.865-.655-1.403-1.52-1.588-2.593-.152-.888-.011-1.728.327-2.523.654-1.52 1.798-2.523 3.424-2.97 1.122-.317 2.209-.24 3.284.313.363.188.7.421 1.061.632zm3.66 2.218c.012-.047.024-.059.036-.059h1.192c.047 0 .059.023.059.059v.525c0 .047-.012.059-.059.059h-1.192c-.023 0-.036-.012-.036-.059zm-1.963-.932c.012-.047.024-.058.036-.058h1.192c.047 0 .059.023.059.058v.618c0 .047-.012.058-.059.058h-1.192c-.023 0-.036-.012-.036-.058z"/></svg>',
            'Rust': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.834 8.101a13.912 13.912 0 0 1-13.643 11.72a10.105 10.105 0 0 1-1.994-.12a6.111 6.111 0 0 1-5.082-5.761a5.934 5.934 0 0 1 11.867-.084c.025.983-.401 1.846-1.277 1.871c-.936 0-1.374-.668-1.374-1.567v-2.5a1.531 1.531 0 0 0-1.52-1.533H8.715a3.648 3.648 0 1 0 2.695 6.08l.073-.11l.074.121a2.58 2.58 0 0 0 2.2 1.048a2.909 2.909 0 0 0 2.695-3.04a7.912 7.912 0 0 0-.217-1.933a7.404 7.404 0 0 0-14.64 1.603a7.497 7.497 0 0 0 7.308 7.405s.549.05 1.167.035a15.803 15.803 0 0 0 8.475-2.528c.036-.025.072.025.048.061a12.44 12.44 0 0 1-9.69 3.963a8.744 8.744 0 0 1-8.9-8.972a9.049 9.049 0 0 1 3.635-7.247a8.863 8.863 0 0 1 5.229-1.726h2.813a7.915 7.915 0 0 0 5.839-2.578a.11.11 0 0 1 .059-.034a.112.112 0 0 1 .12.053a.113.113 0 0 1 .015.067a7.934 7.934 0 0 1-1.227 3.549a.107.107 0 0 0-.014.06a.11.11 0 0 0 .073.095a.109.109 0 0 0 .062.004a8.505 8.505 0 0 0 5.913-4.876a.155.155 0 0 1 .055-.053a.15.15 0 0 1 .147 0a.153.153 0 0 1 .054.053A10.779 10.779 0 0 1 23.834 8.1zM8.895 11.628a2.188 2.188 0 1 0 2.188 2.188v-2.042a.158.158 0 0 0-.15-.15Z"/></svg>',
            'PHP': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.01 10.207h-.944l-.515 2.648h.838c.556 0 .97-.105 1.242-.314.272-.21.455-.559.55-1.049.092-.47.05-.802-.124-.995-.175-.193-.523-.29-1.047-.29zM12 5.688C5.373 5.688 0 8.514 0 12s5.373 6.313 12 6.313S24 15.486 24 12c0-3.486-5.373-6.312-12-6.312zm-3.26 7.451c-.261.25-.575.438-.917.551-.336.108-.765.164-1.285.164H5.357l-.327 1.681H3.652l1.23-6.326h2.65c.797 0 1.378.209 1.744.628.366.418.476 1.002.33 1.752a2.836 2.836 0 0 1-.305.847c-.143.255-.33.49-.561.703zm4.024.715l.543-2.799c.063-.318.039-.536-.068-.651-.107-.116-.336-.174-.687-.174H11.46l-.704 3.625H9.388l1.23-6.327h1.367l-.327 1.682h1.218c.767 0 1.295.134 1.586.401s.378.7.263 1.299l-.572 2.944h-1.389zm7.597-2.265a2.782 2.782 0 0 1-.305.847c-.143.255-.33.49-.561.703a2.44 2.44 0 0 1-.917.551c-.336.108-.765.164-1.286.164h-1.18l-.327 1.682h-1.378l1.23-6.326h2.649c.797 0 1.378.209 1.744.628.366.417.477 1.001.331 1.751zM17.766 10.207h-.943l-.516 2.648h.838c.557 0 .971-.105 1.242-.314.272-.21.455-.559.551-1.049.092-.47.049-.802-.125-.995s-.524-.29-1.047-.29z"/></svg>',
            'Ruby': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.156.083c3.033.525 3.893 2.598 3.829 4.77L24 4.822 22.635 22.71 4.89 23.926h.016C3.433 23.864.15 23.729 0 19.139l1.645-3 2.819 6.586.503 1.415 2.621-.08 9.255-.275.37-.027.733-.011L22.22 24l.78.974-1.68-13.136-1.544-11.743-1.78-.905L1.924 0l.588 2.595 1.277.54.026.02.111.047 3.156 1.384 3.562 1.577 2.171.876 3.486 1.544 2.205 1.02 1.07.499-.002-.002.506.234.273.128-.002.002c1.085.519 1.644 1.326 1.671 2.362.015.529-.116 1.08-.4 1.665l-.49 1.012-1.033 2.124-1.096 2.246-3.166 6.48-.3.61.209.101-.176-.362L12.51 19.95l1.306 2.683.146-.307.062-.124.04-.077.047-.088.096-.178.196-.366 3.176-5.769 2.421-4.393 1.196-2.169.526-.953.171-.308.044-.076.041-.073.095-.165.09-.16.106-.182.107-.18.062-.101.013-.023a5.494 5.494 0 0 0 .365-.728 5.997 5.997 0 0 0 .357-1.1l-.04.006.03-.146.006-.028v-.025a5.844 5.844 0 0 0 .071-.814c0-.04-.002-.096-.006-.144V7.24c0-.027 0-.053-.003-.08A6.293 6.293 0 0 0 23.816 5c-.007-.011-.013-.02-.02-.03l-.01-.02-.007-.007a6.432 6.432 0 0 0-1.143-1.315c-.044-.04-.09-.079-.135-.118l-.014-.012-.054-.047a6.293 6.293 0 0 0-2.27-1.196L20.156.083zM7.024 3.555c.01 0 .02 0 .029.002l.074.008.117.011L13.933 4.6l.083.015.08.015a.134.134 0 0 1 .026.004l.039.008.056.012.117.026a1.844 1.844 0 0 1 .288.096c.073.03.138.063.194.096l-.008-.004A1.382 1.382 0 0 1 15.285 5.9l-.007-.017.004.021a2.041 2.041 0 0 1 .036.308v.051c.001.02 0 .041 0 .063l-.003.074-.003.065c-.002.036-.004.073-.01.109l-.003.024a2.062 2.062 0 0 1-.09.319l-.013.033c-.022.052-.045.102-.071.152l-.016.027a2.132 2.132 0 0 1-1.113.903c-.062.03-.124.055-.186.075l-.093.03-.048.013-.03.008-.063.014-.113.023-.117.016-.037.005-.07.006a1.914 1.914 0 0 1-.244.011H13.12L6.66 7.18l-.105-.013a1.815 1.815 0 0 1-.39-.096c-.16-.061-.3-.151-.406-.277A.915.915 0 0 1 5.544 6.2c.013-.048.028-.09.047-.13l.028-.052c.014-.026.028-.05.045-.073l.038-.047c.022-.026.045-.05.07-.072l.036-.03c.031-.025.064-.048.1-.07l.044-.026a1.047 1.047 0 0 1 .153-.068l.036-.012a1.206 1.206 0 0 1 .188-.046l.059-.01a1.598 1.598 0 0 1 .185-.016h.017c.03-.001.06-.002.089-.002.024 0 .048 0 .072.002l.031.002.066.004.078.007z"/></svg>'
        };

        return icons[language] || '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>';
    }

    function renderProjectCard(repo) {
        const languageColor = {
            'JavaScript': '#f1e05a',
            'Python': '#3572A5',
            'TypeScript': '#2b7489',
            'Java': '#b07219',
            'C#': '#178600',
            'Go': '#00ADD8',
            'Rust': '#dea584',
            'PHP': '#4F5D95',
            'Ruby': '#701516',
            'HTML': '#e34c26',
            'CSS': '#563d7c'
        };

        const color = languageColor[repo.language] || '#8b949e';

        return `
            <div class="project-card" data-repo="${repo.name}">
                <div class="project-header">
                    <div class="project-icon">
                        ${getLanguageIcon(repo.language)}
                    </div>
                    <span class="project-status ${repo.archived ? 'status-archived' : ''}">${repo.archived ? 'Archived' : 'Active'}</span>
                </div>
                <h3 class="project-title">${repo.name}</h3>
                <p class="project-description">${repo.description || 'No description provided'}</p>
                <div class="project-tech">
                    ${repo.language ? `<span class="tech-tag" style="background: ${color}15; color: ${color};">${repo.language}</span>` : ''}
                    ${repo.topics.slice(0, 3).map(topic => `<span class="tech-tag">${topic}</span>`).join('')}
                </div>
                <div class="project-footer">
                    <span class="project-stat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        ${repo.stargazers_count}
                    </span>
                    <span class="project-stat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path>
                        </svg>
                        ${repo.forks_count}
                    </span>
                </div>
            </div>
        `;
    }

    function renderProjects(repositories, limit = null) {
        const projectsGrid = document.getElementById('projectsGrid');
        if (!projectsGrid) return;

        // Determine if we're on the main page or software page
        const isMainPage = window.location.pathname.endsWith('index.html') ||
                          window.location.pathname.endsWith('/') ||
                          !window.location.pathname.includes('software.html');

        // Limit repos for main page only
        const reposToShow = (isMainPage && limit) ? repositories.slice(0, limit) : repositories;
        const hasMore = isMainPage && repositories.length > (limit || 0);
        const remainingCount = repositories.length - (limit || 0);

        projectsGrid.innerHTML = reposToShow.map(repo => renderProjectCard(repo)).join('');

        // Add "Show More" button if on main page and there are more repos
        if (hasMore && remainingCount > 0) {
            const showMoreContainer = document.createElement('div');
            showMoreContainer.className = 'show-more-container';

            // Calculate statistics for the button
            const hiddenRepos = repositories.slice(limit);
            const totalStarsHidden = hiddenRepos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
            const languagesHidden = new Set(hiddenRepos.map(r => r.language).filter(Boolean)).size;

            showMoreContainer.innerHTML = `
                <a href="software.html" class="btn-show-more">
                    <div class="show-more-content">
                        <span class="show-more-text">View All Projects</span>
                        <div class="show-more-stats">
                            <span class="show-more-count">+${remainingCount} more</span>
                            <span class="show-more-divider">•</span>
                            <span class="show-more-detail">${totalStarsHidden} ⭐</span>
                            <span class="show-more-divider">•</span>
                            <span class="show-more-detail">${languagesHidden} languages</span>
                        </div>
                    </div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="show-more-arrow">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </a>
            `;
            projectsGrid.appendChild(showMoreContainer);
        }

        // Add click handlers
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', function() {
                const repoName = this.getAttribute('data-repo');
                const repo = repositories.find(r => r.name === repoName);
                if (repo) {
                    openProjectModal(repo);
                }
            });
        });

        // Trigger fade-in animation with stagger
        setTimeout(() => {
            document.querySelectorAll('.project-card').forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('fade-in-up');
                }, index * 80);
            });

            // Animate show more button
            const showMoreBtn = document.querySelector('.show-more-container');
            if (showMoreBtn) {
                setTimeout(() => {
                    showMoreBtn.style.opacity = '0';
                    showMoreBtn.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        showMoreBtn.style.transition = 'all 0.5s ease';
                        showMoreBtn.style.opacity = '1';
                        showMoreBtn.style.transform = 'translateY(0)';
                    }, 50);
                }, reposToShow.length * 80);
            }
        }, 100);
    }

    // ===============================================
    // MODAL FUNCTIONS
    // ===============================================

    async function openProjectModal(repo) {
        const modal = document.getElementById('projectModal');
        if (!modal) return;

        // Populate modal
        document.getElementById('modalTitle').textContent = repo.name;
        document.getElementById('modalDescription').textContent = repo.description || 'No description provided';
        document.getElementById('modalStatus').textContent = repo.archived ? 'Archived' : 'Active';
        document.getElementById('modalLanguage').textContent = repo.language || 'N/A';
        document.getElementById('modalStars').textContent = repo.stargazers_count.toLocaleString();
        document.getElementById('modalForks').textContent = repo.forks_count.toLocaleString();
        document.getElementById('modalIssues').textContent = repo.open_issues_count.toLocaleString();
        document.getElementById('modalSize').textContent = (repo.size / 1024).toFixed(2) + ' MB';
        document.getElementById('modalCreated').textContent = new Date(repo.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('modalUpdated').textContent = new Date(repo.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('modalLicense').textContent = repo.license?.name || 'No license';
        document.getElementById('modalBranch').textContent = repo.default_branch;

        // Icon
        const modalIcon = document.getElementById('modalIcon');
        modalIcon.innerHTML = getLanguageIcon(repo.language);

        // Technologies
        const techContainer = document.getElementById('modalTech');
        const techs = [repo.language, ...repo.topics.slice(0, 5)].filter(Boolean);
        techContainer.innerHTML = techs.map(tech => `<span class="tech-tag">${tech}</span>`).join('');

        // Topics
        const topicsSection = document.getElementById('modalTopicsSection');
        const topicsContainer = document.getElementById('modalTopics');
        if (repo.topics && repo.topics.length > 0) {
            topicsSection.style.display = 'block';
            topicsContainer.innerHTML = repo.topics.map(topic =>
                `<span class="topic-tag">${topic}</span>`
            ).join('');
        } else {
            topicsSection.style.display = 'none';
        }

        // Links
        document.getElementById('modalGithubLink').href = repo.html_url;
        const homepageLink = document.getElementById('modalHomepageLink');
        if (repo.homepage) {
            homepageLink.href = repo.homepage;
            homepageLink.style.display = 'flex';
        } else {
            homepageLink.style.display = 'none';
        }

        // Fetch and display README
        const readmeContainer = document.getElementById('modalReadme');
        readmeContainer.innerHTML = '<h3>README</h3><div class="loading-spinner"><div class="spinner"></div><p>Loading README...</p></div>';

        const readme = await fetchReadme(repo.name);
        if (readme) {
            // Simple markdown to HTML conversion
            const htmlContent = markdownToHtml(readme);
            readmeContainer.innerHTML = `<h3>README Preview</h3><div class="modal-readme-content">${htmlContent}</div>`;
        } else {
            readmeContainer.innerHTML = '<h3>README</h3><p style="color: var(--text-muted);">No README file found</p>';
        }

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeProjectModal() {
        const modal = document.getElementById('projectModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Modal event listeners
    document.querySelector('.modal-close')?.addEventListener('click', closeProjectModal);
    document.querySelector('.modal-overlay')?.addEventListener('click', closeProjectModal);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProjectModal();
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });

    // ===============================================
    // MARKDOWN TO HTML (Simple Converter)
    // ===============================================

    function markdownToHtml(markdown) {
        if (!markdown) return '';

        let html = markdown;

        // Code blocks
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';

        // Lists
        html = html.replace(/<p>([*-] .*?)<\/p>/gs, function(_match, list) {
            const items = list.split('\n').map(item =>
                item.replace(/^[*-] /, '').trim()
            ).filter(Boolean);
            return '<ul>' + items.map(item => `<li>${item}</li>`).join('') + '</ul>';
        });

        return html;
    }

    // ===============================================
    // INITIALIZATION
    // ===============================================

    async function initializeGitHubShowcase() {
        try {
            // Fetch user info and repositories in parallel
            const [userInfo, repositories] = await Promise.all([
                fetchUserInfo(),
                fetchRepositories()
            ]);

            // Render GitHub stats
            renderGitHubStats(userInfo);

            // Render projects (with limit on main page)
            const isMainPage = window.location.pathname.endsWith('index.html') ||
                              window.location.pathname.endsWith('/') ||
                              !window.location.pathname.includes('software.html');

            renderProjects(repositories, isMainPage ? CONFIG.featuredLimit : null);

            // Animate hero stats
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const stats = document.querySelectorAll('.stat-number');
                            animateCounters(stats);
                        }
                    });
                }, { threshold: 0.5 });

                observer.observe(heroSection);
            }

        } catch (error) {
            console.error('Error initializing GitHub showcase:', error);

            // Show error message
            const projectsGrid = document.getElementById('projectsGrid');
            if (projectsGrid) {
                projectsGrid.innerHTML = `
                    <div class="loading-spinner">
                        <p style="color: var(--text-muted);">
                            Failed to load projects from GitHub. Please check your internet connection or try again later.
                        </p>
                    </div>
                `;
            }
        }
    }

    // Start the application
    window.addEventListener('DOMContentLoaded', () => {
        initializeGitHubShowcase();
    });

    // ===============================================
    // SCROLL ANIMATIONS
    // ===============================================

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for fade-in animation
    setTimeout(() => {
        const animateElements = document.querySelectorAll('.skill-category, .contact-card, .github-stat-card');
        animateElements.forEach(el => fadeObserver.observe(el));
    }, 1000);

    // ===============================================
    // CONSOLE MESSAGE
    // ===============================================

    console.log('%c👋 Hello Developer!', 'font-size: 24px; font-weight: bold; color: #3b82f6;');
    console.log('%cExploring the code? Check out the repository on GitHub!', 'font-size: 14px; color: #60a5fa;');
    console.log('%chttps://github.com/skillerious', 'font-size: 14px; color: #3b82f6; font-weight: bold;');

})();
