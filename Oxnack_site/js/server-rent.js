class ServerRentManager {
    constructor() {
        this.currentCountry = '';
        this.currentOS = '';
        this.currentParams = null;
        this.currentPrice = 0;
        this.isAuthenticated = false;
        
        this.init();
    }

    async init() {
        await this.checkAuthentication();
        if (this.isAuthenticated) {
            await this.loadBalance();
        }
        await this.loadCountries();
        await this.loadOS();
        await this.loadParameters();
        
        this.setupEventListeners();
    }

    async checkAuthentication() {
        try {
            const response = await fetch('http://localhost:7002/get_mail', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            const data = await response.json();
            this.isAuthenticated = response.ok && data.status === "good";
        } catch (error) {
            this.isAuthenticated = false;
        }
    }

    async loadBalance() {
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
                    document.getElementById('userBalance').textContent = `${data.balance} руб.`;
                }
            }
        } catch (error) {
            console.error('Balance load failed');
        }
    }

    async loadCountries() {
        const countrySelect = document.getElementById('countrySelect');
        
        try {
            const response = await fetch('http://localhost:7002/countries', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === "good") {
                    countrySelect.innerHTML = '<option value="">Select country</option>';
                    
                    data.countries.forEach(country => {
                        const option = document.createElement('option');
                        option.value = country;
                        option.textContent = this.getCountryName(country);
                        countrySelect.appendChild(option);
                    });
                } else {
                    this.setDefaultCountries(countrySelect);
                }
            } else {
                this.setDefaultCountries(countrySelect);
            }
        } catch (error) {
            this.setDefaultCountries(countrySelect);
        }
    }

    setDefaultCountries(countrySelect) {
        const defaultCountries = ['russia', 'usa', 'germany'];
        
        countrySelect.innerHTML = '<option value="">Select country</option>';
        
        defaultCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = this.getCountryName(country);
            countrySelect.appendChild(option);
        });
    }

    async loadOS() {
        const osSelect = document.getElementById('osSelect');
        
        try {
            const response = await fetch('http://localhost:7002/osystems', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === "good") {
                    osSelect.innerHTML = '<option value="">Select OS</option>';
                    
                    data.oss.forEach(os => {
                        const option = document.createElement('option');
                        option.value = os;
                        option.textContent = this.getOSName(os);
                        osSelect.appendChild(option);
                    });
                } else {
                    this.setDefaultOS(osSelect);
                }
            } else {
                this.setDefaultOS(osSelect);
            }
        } catch (error) {
            this.setDefaultOS(osSelect);
        }
    }

    setDefaultOS(osSelect) {
        const defaultOS = ['ubuntu', 'debian', 'centos'];
        
        osSelect.innerHTML = '<option value="">Select OS</option>';
        
        defaultOS.forEach(os => {
            const option = document.createElement('option');
            option.value = os;
            option.textContent = this.getOSName(os);
            osSelect.appendChild(option);
        });
    }

    async loadParameters() {
        try {
            const response = await fetch('http://localhost:7002/parametrs', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === "good") {
                    this.currentParams = data;
                    this.updateSliders();
                    await this.calculatePrice();
                } else {
                    this.setDefaultParameters();
                }
            } else {
                this.setDefaultParameters();
            }
        } catch (error) {
            this.setDefaultParameters();
        }
    }

    setDefaultParameters() {
        this.currentParams = {
            min_ram: 1,
            mx_ram: 32,
            min_core: 1,
            mx_core: 16,
            min_hdd: 20,
            mx_hdd: 1000
        };
        this.updateSliders();
        this.calculatePrice();
    }

    updateSliders() {
        if (!this.currentParams) return;

        const { min_ram, mx_ram, min_core, mx_core, min_hdd, mx_hdd } = this.currentParams;

        const ramSlider = document.getElementById('ramSlider');
        ramSlider.min = min_ram;
        ramSlider.max = mx_ram;
        ramSlider.value = min_ram;
        
        document.getElementById('ramMin').textContent = `${min_ram} GB`;
        document.getElementById('ramMax').textContent = `${mx_ram} GB`;
        document.getElementById('ramValue').textContent = min_ram;

        const coreSlider = document.getElementById('coreSlider');
        coreSlider.min = min_core;
        coreSlider.max = mx_core;
        coreSlider.value = min_core;
        
        document.getElementById('coreMin').textContent = `${min_core} core`;
        document.getElementById('coreMax').textContent = `${mx_core} cores`;
        document.getElementById('coreValue').textContent = min_core;

        const ssdSlider = document.getElementById('ssdSlider');
        ssdSlider.min = min_hdd;
        ssdSlider.max = mx_hdd;
        ssdSlider.value = min_hdd;
        ssdSlider.step = 1;
        
        document.getElementById('ssdMin').textContent = `${min_hdd} GB`;
        document.getElementById('ssdMax').textContent = `${mx_hdd} GB`;
        document.getElementById('ssdValue').textContent = min_hdd;
    }

    async calculatePrice() {
        const ram = document.getElementById('ramSlider').value;
        const core = document.getElementById('coreSlider').value;
        const ssd = document.getElementById('ssdSlider').value;

        try {
            const response = await fetch('http://localhost:7002/calc_price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    core: parseInt(core),
                    ram: parseInt(ram),
                    ssd: parseInt(ssd)
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === "good") {
                    this.currentPrice = data.price;
                    document.getElementById('totalPrice').textContent = `${this.currentPrice} руб.`;
                    
                    const createBtn = document.querySelector('.oxnack-create-btn');
                    if (createBtn) createBtn.disabled = false;
                } else {
                    this.setDefaultPrice(ram, core, ssd);
                }
            } else {
                this.setDefaultPrice(ram, core, ssd);
            }
        } catch (error) {
            this.setDefaultPrice(ram, core, ssd);
        }
    }

    setDefaultPrice(ram, core, ssd) {
        const price = (core * 100) + (ram * 50) + (ssd * 2);
        this.currentPrice = price;
        document.getElementById('totalPrice').textContent = `${price} руб.`;
        
        const createBtn = document.querySelector('.oxnack-create-btn');
        if (createBtn) createBtn.disabled = false;
    }

    async createServer(event) {
        event.preventDefault();

        if (!this.isAuthenticated) {
            this.showModal('error', 'Authentication Required', 'Please log in to create a server. By creating a server you agree to our Terms of Service and Privacy Policy.');
            return;
        }

        if (!this.currentOS) {
            this.showModal('error', 'Error', 'Please select operating system');
            return;
        }

        const ram = document.getElementById('ramSlider').value;
        const core = document.getElementById('coreSlider').value;
        const ssd = document.getElementById('ssdSlider').value;
        const promo = document.getElementById('promoCode').value;

        try {
            const response = await fetch('http://localhost:7002/create_machine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    core: parseInt(core),
                    ram: parseInt(ram),
                    hdd: parseInt(ssd),
                    promo: promo || 'NOT',
                    os: this.currentOS
                })
            });

            const data = await response.json();
            
            if (response.ok && data.status === 'created') {
                this.showModal('success', 'Server Created!', 'Your server has been successfully created. By creating this server, you agree to our Terms of Service and Privacy Policy.');
                if (this.isAuthenticated) {
                    await this.loadBalance();
                }
            } else {
                this.showModal('error', 'Error', data.message || 'An error occurred');
            }
        } catch (error) {
            this.showModal('error', 'Error', 'No connection to server');
        }
    }

    showModal(type, title, message) {
        const modal = document.getElementById('serverModal');
        const modalBody = document.getElementById('modalBody');
        
        let icon = '';
        if (type === 'success') {
            icon = '<i class="fas fa-check-circle oxnack-modal-success"></i>';
        } else {
            icon = '<i class="fas fa-exclamation-circle oxnack-modal-error"></i>';
        }
        
        modalBody.innerHTML = `
            ${icon}
            <h3 class="oxnack-modal-title">${title}</h3>
            <p class="oxnack-modal-message">${message}</p>
            <button class="oxnack-primary-btn oxnack-modal-ok-btn">OK</button>
        `;
        
        modal.style.display = 'block';

        modalBody.querySelector('.oxnack-modal-ok-btn').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    getCountryName(countryCode) {
        const countries = {
            'russia': 'Russia',
            'usa': 'USA',
            'germany': 'Germany',
            'france': 'France'
        };
        return countries[countryCode] || countryCode;
    }

    getOSName(osCode) {
        const osNames = {
            'ubuntu': 'Ubuntu',
            'debian': 'Debian',
            'centos': 'CentOS',
            'windows': 'Windows'
        };
        return osNames[osCode] || osCode;
    }

    setupEventListeners() {
        const countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            countrySelect.addEventListener('change', (e) => {
                this.currentCountry = e.target.value;
            });
        }

        const osSelect = document.getElementById('osSelect');
        if (osSelect) {
            osSelect.addEventListener('change', (e) => {
                this.currentOS = e.target.value;
                if (this.currentOS) {
                    this.calculatePrice();
                }
            });
        }

        ['ramSlider', 'coreSlider', 'ssdSlider'].forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const value = e.target.value;
                    const valueElement = document.getElementById(sliderId.replace('Slider', 'Value'));
                    if (valueElement) {
                        valueElement.textContent = value;
                    }
                    
                    this.calculatePrice();
                });
            }
        });

        const form = document.getElementById('serverConfigForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                this.createServer(e);
            });
        }

        const closeBtn = document.querySelector('.oxnack-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const modal = document.getElementById('serverModal');
                if (modal) modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('serverModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ServerRentManager();
});