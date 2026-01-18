document.addEventListener('DOMContentLoaded', async () => {
    await loadHTML('partials/header.html', 'header-placeholder');
    await loadHTML('partials/footer.html', 'footer-placeholder');
    // Ensure i18n script is loaded (header.html contains the tag but injected scripts don't execute)
    if (!document.querySelector('script[data-i18n-loader]')) {
        const s = document.createElement('script');
        s.src = '/js/i18n.js';
        s.defer = true;
        s.setAttribute('data-i18n-loader', '1');
        document.head.appendChild(s);
    }
    
    await checkAuthStatus();
    initMobileMenu();
    updateFooterYear();
    initSmoothScroll();
});

async function loadHTML(url, elementId) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load: ${url}`);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function checkAuthStatus() {
    try {
        const response = await fetch('http://localhost:7002/get_mail', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === "good") {
            showUserPanel(data.mail);
            await loadUserBalance();
        } else {
            showAuthButtons();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuthButtons();
    }
}

async function loadUserBalance() {
    try {
        const response = await fetch('http://localhost:7002/get_balance', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.status === "good") {
                updateBalanceDisplay(data.balance);
            }
        }
    } catch (error) {
        console.error('Balance load failed:', error);
    }
}

function showUserPanel(email) {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    const mobileAuth = document.getElementById('mobileAuth');
    const mobileUser = document.getElementById('mobileUser');
    const mobileUserEmail = document.getElementById('mobileUserEmail');
    
    if (userInfo) userInfo.style.display = 'flex';
    if (authButtons) authButtons.style.display = 'none';
    if (mobileAuth) mobileAuth.style.display = 'none';
    if (mobileUser) mobileUser.style.display = 'block';
    if (mobileUserEmail) mobileUserEmail.textContent = email;
    
    const userEmail = document.getElementById('userEmail');
    if (userEmail) userEmail.textContent = email;
}

function showAuthButtons() {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    const mobileAuth = document.getElementById('mobileAuth');
    const mobileUser = document.getElementById('mobileUser');
    
    if (userInfo) userInfo.style.display = 'none';
    if (authButtons) authButtons.style.display = 'flex';
    if (mobileAuth) mobileAuth.style.display = 'block';
    if (mobileUser) mobileUser.style.display = 'none';
}

function updateBalanceDisplay(balance) {
    const balanceAmount = document.getElementById('userBalanceAmount');
    const mobileBalanceAmount = document.getElementById('mobileUserBalanceAmount');

    if (balanceAmount) balanceAmount.textContent = `${balance} руб.`;
    if (mobileBalanceAmount) mobileBalanceAmount.textContent = `${balance} руб.`;
}

function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (!mobileMenuBtn || !mobileMenu) return;
    
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('oxnack-active');
    });
    
    document.querySelectorAll('.oxnack-mobile-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            mobileMenu.classList.remove('oxnack-active');
        });
    });
}

function updateFooterYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
                
                const mobileMenu = document.getElementById('mobileMenu');
                if (mobileMenu && mobileMenu.classList.contains('oxnack-active')) {
                    mobileMenu.classList.remove('oxnack-active');
                }
            }
        });
    });
}