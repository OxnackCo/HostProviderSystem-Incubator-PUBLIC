document.addEventListener('DOMContentLoaded', function() {
    const servicesContainer = document.getElementById('servicesContainer');
    const serviceModal = document.getElementById('serviceModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const modalImage = document.getElementById('modalImage');
    const modalName = document.getElementById('modalName');
    const modalPrice = document.getElementById('modalPrice');
    const modalCurrency = document.getElementById('modalCurrency');
    const modalDescription = document.getElementById('modalDescription');
    const modalBotLink = document.getElementById('modalBotLink');
    
    let services = [];
    let currentLang = localStorage.getItem('ox_lang') || 'ru';
    
    async function loadServices() {
        servicesContainer.innerHTML = '<div class="loading">Загрузка услуг...</div>';
        
        try {
            const response = await fetch('https://services-market-api.oxnack.com/services');
            if (!response.ok) throw new Error('Network response was not ok');
            
            services = await response.json();
            displayServices();
        } catch (error) {
            console.error('Error loading services:', error);
            servicesContainer.innerHTML = '<div class="error-message">Ошибка загрузки услуг. Пожалуйста, попробуйте позже.</div>';
        }
    }
    
    function displayServices() {
        const filteredServices = services.filter(service => service.enabled);
        
        if (filteredServices.length === 0) {
            servicesContainer.innerHTML = '<div class="loading">Услуги временно недоступны</div>';
            return;
        }
        
        servicesContainer.innerHTML = '';
        
        filteredServices.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card';
            serviceCard.dataset.id = service.id;
            
            const isRu = currentLang === 'ru';
            const name = isRu ? service.name_ru : service.name_en;
            const description = isRu ? service.description_ru : service.description_en;
            const price = isRu ? service.price_rub : service.price_usd;
            const currency = isRu ? '₽' : '$';
            
            serviceCard.innerHTML = `
                <img src="${service.image_link}" alt="${name}" class="service-image" onerror="this.src='./site_files/logo.svg'">
                <div class="service-info">
                    <h3 class="service-name">${name}</h3>
                    <div class="service-price-container">
                        <span class="service-price">${price}</span>
                        <span class="service-currency">${currency}</span>
                    </div>
                </div>
            `;
            
            serviceCard.addEventListener('click', () => openServiceModal(service));
            servicesContainer.appendChild(serviceCard);
        });
    }
    
    function openServiceModal(service) {
        const isRu = currentLang === 'ru';
        const name = isRu ? service.name_ru : service.name_en;
        const description = isRu ? service.description_ru : service.description_en;
        const price = isRu ? service.price_rub : service.price_usd;
        const currency = isRu ? '₽' : '$';
        
        modalImage.src = service.image_link;
        modalImage.alt = name;
        modalName.textContent = name;
        modalPrice.textContent = price;
        modalCurrency.textContent = currency;
        modalDescription.textContent = description || (isRu ? 'Описание отсутствует' : 'No description available');
        modalBotLink.href = `https://t.me/OxnackSupport_bot?start=service_${service.id}`;
        
        serviceModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    function closeServiceModal() {
        serviceModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    modalOverlay.addEventListener('click', closeServiceModal);
    modalClose.addEventListener('click', closeServiceModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && serviceModal.style.display === 'block') {
            closeServiceModal();
        }
    });
    
    function updateLanguage() {
        const lang = localStorage.getItem('ox_lang') || 'ru';
        if (lang !== currentLang) {
            currentLang = lang;
            if (services.length > 0) {
                displayServices();
            }
        }
    }
    
    setInterval(updateLanguage, 1000);
    
    loadServices();
});