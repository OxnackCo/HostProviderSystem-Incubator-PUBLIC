// Projects data with translation keys
const projectsData = [
    {
        id: 1,
        titleKey: "project1.title",
        descriptionKey: "project1.shortDesc",
        fullDescriptionKey: "project1.fullDesc",
        image: "images/tiktok.png",
        technologies: ["C#", "dotnet", "WebSocket", "API", "WinAPI"],
        github: "https://github.com/Oxnack/TikTok_Events.git",
        liveDemo: ""
    },
    {
        id: 2,
        titleKey: "project2.title",
        descriptionKey: "project2.shortDesc",
        fullDescriptionKey: "project2.fullDesc",
        image: "images/tg-bot.png",
        technologies: ["Python", "PyTelegramBotAPI", "Postgresql", "Flask", "HTTP API"],
        github: "https://github.com/Oxnack/bot_with_questionnaires.git",
        liveDemo: ""
    },
    {
        id: 3,
        titleKey: "project3.title",
        descriptionKey: "project3.shortDesc",
        fullDescriptionKey: "project3.fullDesc",
        image: "images/ZombieShoot.png",
        technologies: ["C#", "Unity", "RayCast"],
        github: "https://github.com/Oxnack/ShooterZombie.git",
        liveDemo: ""
    },
    {
        id: 4,
        titleKey: "project4.title",
        descriptionKey: "project4.shortDesc",
        fullDescriptionKey: "project4.fullDesc",
        image: "images/glados.png",
        technologies: ["Vosk", "TTS", "LLM", "API", "Devices", "Threading"],
        github: "https://github.com/Oxnack/GLaDOS_sound_assistant.git",
        liveDemo: ""
    }
];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavbar();
    renderProjects();
    initializeModal();
    initScrollAnimation();
});

// Navigation
function initializeNavbar() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Close menu when clicking on links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (hamburger) hamburger.classList.remove('active');
            if (navMenu) navMenu.classList.remove('active');
        });
    });
}

// Render projects
function renderProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;
    
    projectsGrid.innerHTML = '';
    
    projectsData.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.setAttribute('data-id', project.id);
        
        projectCard.innerHTML = `
            <div class="project-image">
                <img src="${project.image}" alt="${getTranslation(project.titleKey)}">
            </div>
            <div class="project-info">
                <h3>${getTranslation(project.titleKey)}</h3>
                <p>${getTranslation(project.descriptionKey)}</p>
                <div class="project-tech">
                    ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                </div>
                <div class="project-links">
                    <a href="#" class="project-link view-details" data-id="${project.id}">
                        <i class="fas fa-eye"></i> ${getTranslation('projects.viewDetails')}
                    </a>
                    ${project.github ? `<a href="${project.github}" target="_blank" class="project-link">
                        <i class="fab fa-github"></i> GitHub
                    </a>` : ''}
                </div>
            </div>
        `;
        
        projectsGrid.appendChild(projectCard);
    });
    
    // Add event listeners for detail buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const projectId = parseInt(this.getAttribute('data-id'));
            openProjectModal(projectId);
        });
    });
}

// Modal functionality
function initializeModal() {
    const modal = document.getElementById('project-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (modal) modal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function openProjectModal(projectId) {
    const project = projectsData.find(p => p.id === projectId);
    if (!project) return;
    
    const modal = document.getElementById('project-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalGithub = document.getElementById('modal-github');
    const modalLive = document.getElementById('modal-live');
    
    if (modalImage) modalImage.src = project.image;
    if (modalImage) modalImage.alt = getTranslation(project.titleKey);
    if (modalTitle) modalTitle.textContent = getTranslation(project.titleKey);
    if (modalDescription) modalDescription.textContent = getTranslation(project.fullDescriptionKey);
    
    if (modalGithub && project.github) {
        modalGithub.href = project.github;
        modalGithub.style.display = 'flex';
    } else if (modalGithub) {
        modalGithub.style.display = 'none';
    }
    
    if (modalLive && project.liveDemo) {
        modalLive.href = project.liveDemo;
        modalLive.style.display = 'flex';
    } else if (modalLive) {
        modalLive.style.display = 'none';
    }
    
    if (modal) modal.style.display = 'block';
}

// Scroll effects
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const heroVisual = document.querySelector('.hero-visual');
    
    if (heroVisual) {
        heroVisual.style.transform = `translateY(${scrolled * 0.1}px)`;
    }
    
    // Scroll animation for project cards
    const scrollElements = document.querySelectorAll('.project-card');
    
    scrollElements.forEach(el => {
        if (isElementInViewport(el)) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }
    });
});

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.9
    );
}

// Scroll animation initialization
function initScrollAnimation() {
    const scrollElements = document.querySelectorAll('.project-card');
    
    scrollElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // Trigger initial animation
    setTimeout(() => {
        const scrollElements = document.querySelectorAll('.project-card');
        scrollElements.forEach((el, index) => {
            setTimeout(() => {
                if (isElementInViewport(el)) {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }
            }, index * 100);
        });
    }, 300);
}