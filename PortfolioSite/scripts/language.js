// Language configuration
const translations = {
    en: {
        // Navigation
        "nav.home": "Home",
        "nav.projects": "Projects",
        "nav.contact": "Collaboration",
        
        // Hero section
        "hero.title": "We Create Digital Solutions for the Future",
        "hero.subtitle": "Oxnack is a team of passionate developers creating innovative web applications and software.",
        "hero.cta": "Our Work",
        
        // Projects section
        "projects.title": "Our Projects",
        "projects.viewDetails": "View Details",
        "projects.technologies": "Technologies",
        
        // Contact section
        "contact.title": "Have a project or idea?",
        "contact.description": "We're always open to discussing new challenges. Our Telegram bot will help you quickly get in touch with us and start a conversation.",
        "contact.telegram": "Write in Telegram",
        
        // Modal
        "modal.demo": "Live Demo",
        "modal.close": "Close",
        
        // Footer
        "footer.rights": "All rights reserved",
        
        // Project descriptions
        "project1.title": "TikTok Event Effects",
        "project1.shortDesc": "A system for detecting and processing events on TikTok broadcasts.",
        "project1.fullDesc": "This project represents a comprehensive solution to a client's problem, the task was to change the configuration on the local computer upon receiving certain awards on the broadcast.",
        
        "project2.title": "Tg Bot for feedback from participants",
        "project2.shortDesc": "This is a Telegram bot for user registration, creating polls with buttons, and managing access rights through deep links.",
        "project2.fullDesc": "The bot allows users to register, authorize via phone number and code, create messages with images, videos, and interactive buttons. Administrators and managers can assign roles via deep links. The bot is integrated with a PostgreSQL database and includes a Flask server for API requests.",
        
        "project3.title": "Zombie Shooter",
        "project3.shortDesc": "A simple shooting game was made to order for the client, he was satisfied.",
        "project3.fullDesc": "A simple shooting game was made to order for the client, he was satisfied. This is probably one of our first custom projects.",

        "project4.title": "GLaDOS voice assistant",
        "project4.shortDesc": "A voice assistant personalized as GLaDOS from Portal, using speech recognition, AI response generation, and voice synthesis.",
        "project4.fullDesc": "A GLaDOS-style voice assistant implementation with full processing pipeline: microphone audio recording, speech recognition via Vosk, character-style response generation through DeepSeek AI with English character filtering, and recognizable voice synthesis via TeraTTS with customized accent. The system uses multithreading for parallel audio stream processing and recording lock during assistant speech."
   
    },
    ru: {
        // Navigation
        "nav.home": "Главная",
        "nav.projects": "Проекты",
        "nav.contact": "Сотрудничество",
        
        // Hero section
        "hero.title": "Мы создаем цифровые решения будущего",
        "hero.subtitle": "Oxnack — это команда увлеченных разработчиков, создающих инновационные веб-приложения и программное обеспечение.",
        "hero.cta": "Наши работы",
        
        // Projects section
        "projects.title": "Наши проекты",
        "projects.viewDetails": "Подробнее",
        "projects.technologies": "Технологии",
        
        // Contact section
        "contact.title": "Есть проект или идея?",
        "contact.description": "Мы всегда открыты для обсуждения новых вызовов. Наш Telegram-бот поможет быстро связаться с нами и начать диалог.",
        "contact.telegram": "Написать в Telegram",
        
        // Modal
        "modal.demo": "Демо",
        "modal.close": "Закрыть",
        
        // Footer
        "footer.rights": "Все права защищены",
        
        // Project descriptions
        "project1.title": "Эффекты событий TikTok",
        "project1.shortDesc": "Система для обнаружения и обработки событий на трансляции в ТикТок.",
        "project1.fullDesc": "Этот проект представляет комплексное решение задачи для клиента, задача была в том чтобы при получении определенных наград на трансляции, на локальном компьютере менялась конфигурация.",
        
        "project2.title": "Бот для получения фитбека от участников",
        "project2.shortDesc": "Это Telegram-бот для регистрации пользователей, создания опросов с кнопками и управления правами доступа через глубокие ссылки.",
        "project2.fullDesc": "Бот позволяет пользователям регистрироваться, проходить авторизацию по номеру телефона и коду, создавать сообщения с изображениями, видео и интерактивными кнопками. Администраторы и менеджеры могут назначать роли через глубокие ссылки. Бот интегрирован с базой данных PostgreSQL и поддерживает Flask-сервер для API-запросов.",
        
        "project3.title": "Зомби Шутер",
        "project3.shortDesc": "Простой шутер был создан на заказ клиенту, он остался доволен.",
        "project3.fullDesc": "Простой шутер был создан на заказ клиенту, он остался доволен. Это пожалуй один из первых наших проектов на заказ.",
 
        "project4.title": "GLaDOS голосовой ассистент",
        "project4.shortDesc": "Голосовой ассистент с персонализацией под GLaDOS из Portal, использующий распознавание речи, ИИ-генерацию ответов и синтез голоса.",
        "project4.fullDesc": "Реализация голосового ассистента в стиле GLaDOS с полным циклом обработки: запись аудио с микрофона, распознавание речи через Vosk, генерация ответов в характере персонажа через DeepSeek AI с фильтрацией английских символов, и синтез узнаваемого голоса через TeraTTS с настроенным акцентом. Система использует многопоточность для параллельной обработки аудиопотока и блокировки записи во время речи ассистента."
    }
};

// Current language
let currentLanguage = 'en';

// Initialize language system
function initLanguage() {
    // Load saved language from localStorage or default to English
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && translations[savedLanguage]) {
        currentLanguage = savedLanguage;
    }
    
    // Set selector value
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = currentLanguage;
        
        // Add event listener for language change
        languageSelect.addEventListener('change', function(e) {
            switchLanguage(e.target.value);
        });
    }
    
    // Apply current language
    applyLanguage(currentLanguage);
}

// Switch language
function switchLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        localStorage.setItem('preferred-language', lang);
        applyLanguage(lang);
        
        // Update projects with new language data
        renderProjects();
    }
}

// Apply language to all elements
function applyLanguage(lang) {
    const elements = document.querySelectorAll('[data-key]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-key');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
}

// Get translation for dynamic content
function getTranslation(key) {
    return translations[currentLanguage] && translations[currentLanguage][key] 
        ? translations[currentLanguage][key] 
        : key;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initLanguage);