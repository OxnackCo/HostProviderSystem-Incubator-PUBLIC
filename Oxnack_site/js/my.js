class MyServicesManager {
    constructor() {
        this.services = [];
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadServices();
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const response = await fetch('http://localhost:7002/get_mail', {
                method: 'GET',
                credentials: 'include'
            });
            
            const data = await response.json();
            if (!response.ok || data.status !== "good") {
                window.location.href = '/login';
                return;
            }
            
            document.getElementById('userEmail').textContent = data.mail;
        } catch (error) {
            window.location.href = '/login';
        }
    }

    async loadServices() {
        const loadingElement = document.getElementById('loading');
        const servicesGrid = document.getElementById('servicesGrid');
        const noServices = document.getElementById('noServices');
        
        try {
            const response = await fetch('http://localhost:7002/user_services', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === "good" && data.services) {
                    this.services = data.services;
                    this.renderServices();
                } else {
                    this.showNoServices();
                }
            } else {
                this.showNoServices();
            }
        } catch (error) {
            this.showNoServices();
        }
        
        if (loadingElement) loadingElement.style.display = 'none';
    }

    renderServices() {
        const servicesGrid = document.getElementById('servicesGrid');
        const noServices = document.getElementById('noServices');
        
        if (this.services.length === 0) {
            this.showNoServices();
            return;
        }
        
        servicesGrid.innerHTML = '';
        noServices.style.display = 'none';
        
        this.services.forEach(service => {
            const serviceCard = this.createServiceCard(service);
            servicesGrid.appendChild(serviceCard);
        });
    }

    createServiceCard(service) {
        const card = document.createElement('div');
        card.className = 'oxnack-service-card';
        
        const statusClass = service.status === 'on' ? 'oxnack-status-on' : 'oxnack-status-off';
        const statusText = service.status === 'on' ? 'Online' : 'Offline';
        
        card.innerHTML = `
            <div class="oxnack-service-header">
                <h3>Server #${service.id}</h3>
                <span class="oxnack-service-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="oxnack-service-details">
                <div class="oxnack-service-detail">
                    <span class="oxnack-detail-label">OS</span>
                    <span class="oxnack-detail-value">${this.getOSName(service.os)}</span>
                </div>
                <div class="oxnack-service-detail">
                    <span class="oxnack-detail-label">Location</span>
                    <span class="oxnack-detail-value">${this.getCountryName(service.country)}</span>
                </div>
                <div class="oxnack-service-detail">
                    <span class="oxnack-detail-label">CPU Cores</span>
                    <span class="oxnack-detail-value">${service.cores}</span>
                </div>
                <div class="oxnack-service-detail">
                    <span class="oxnack-detail-label">RAM</span>
                    <span class="oxnack-detail-value">${service.ram} GB</span>
                </div>
                <div class="oxnack-service-detail">
                    <span class="oxnack-detail-label">SSD</span>
                    <span class="oxnack-detail-value">${service.ssd} GB</span>
                </div>
                <div class="oxnack-service-detail">
                    <span class="oxnack-detail-label">IP Address</span>
                    <span class="oxnack-detail-value">${service.ip}</span>
                </div>
            </div>
            
            <div class="oxnack-service-dates">
                <div class="oxnack-service-detail">
                    <span class="oxnack-detail-label">Created</span>
                    <span class="oxnack-detail-value">${this.formatDate(service.date_start)}</span>
                </div>
                <div class="oxnack-service-detail">
                    <span class="oxnack-detail-label">Expires</span>
                    <span class="oxnack-detail-value">${this.formatDate(service.date_stop)}</span>
                </div>
            </div>
            
            <div class="oxnack-service-actions">
                <button class="oxnack-action-btn oxnack-start-btn" onclick="myServicesManager.controlServer(${service.id}, 'start')">
                    Start
                </button>
                <button class="oxnack-action-btn oxnack-stop-btn" onclick="myServicesManager.controlServer(${service.id}, 'stop')">
                    Stop
                </button>
                <button class="oxnack-action-btn oxnack-restart-btn" onclick="myServicesManager.controlServer(${service.id}, 'restart')">
                    Restart
                </button>
            </div>
        `;
        
        return card;
    }

    showNoServices() {
        const servicesGrid = document.getElementById('servicesGrid');
        const noServices = document.getElementById('noServices');
        
        servicesGrid.innerHTML = '';
        noServices.style.display = 'block';
    }

    async controlServer(serverId, action) {
        try {
            const response = await fetch('http://localhost:7002/control_server', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    server_id: serverId,
                    action: action
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.status === 'success') {
                this.showMessage('success', `Server ${action} command sent successfully`);
                await this.loadServices();
            } else {
                this.showMessage('error', data.message || 'Failed to control server');
            }
        } catch (error) {
            this.showMessage('error', 'No connection to server');
        }
    }

    async logoutAllDevices() {
        if (!confirm('Are you sure you want to logout from all devices?')) {
            return;
        }
        
        try {
            const response = await fetch('http://localhost:7002/reset_cookie', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                this.showMessage('success', 'Logged out from all devices successfully');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                this.showMessage('error', 'Logout failed');
            }
        } catch (error) {
            this.showMessage('error', 'No connection to server');
        }
    }

    showMessage(type, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `oxnack-message oxnack-message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            z-index: 10000;
            max-width: 300px;
        `;
        
        if (type === 'success') {
            messageDiv.style.backgroundColor = '#22c55e';
        } else {
            messageDiv.style.backgroundColor = '#ef4444';
        }
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
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

    getCountryName(countryCode) {
        const countries = {
            'russia': 'Russia',
            'usa': 'USA',
            'germany': 'Germany'
        };
        return countries[countryCode] || countryCode;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }

    setupEventListeners() {
        const logoutBtn = document.getElementById('logoutAllBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logoutAllDevices();
            });
        }
    }
}

let myServicesManager;

document.addEventListener('DOMContentLoaded', () => {
    myServicesManager = new MyServicesManager();
});