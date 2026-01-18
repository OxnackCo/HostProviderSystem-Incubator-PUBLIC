class PayManager {
    constructor() {
        this.selectedAmount = 0;
        this.selectedMethod = 'card';
        this.init();
    }

    async init() {
        await this.loadBalance();
        this.setupEventListeners();
    }

    async loadBalance() {
        try {
            const response = await fetch('http://localhost:7002/get_balance', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === "good") {
                    document.getElementById('currentBalance').textContent = `${data.balance} руб.`;
                }
            }
        } catch (error) {
            document.getElementById('currentBalance').textContent = 'Error loading balance';
        }
    }

    setupEventListeners() {
        const amountButtons = document.querySelectorAll('.oxnack-amount-btn');
        amountButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                amountButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedAmount = parseInt(e.target.dataset.amount);
                document.getElementById('customAmount').value = '';
            });
        });

        const customAmountInput = document.getElementById('customAmount');
        customAmountInput.addEventListener('input', (e) => {
            amountButtons.forEach(b => b.classList.remove('active'));
            this.selectedAmount = parseInt(e.target.value) || 0;
        });

        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', (e) => {
                this.selectedMethod = e.target.value;
            });
        });

        const payButton = document.getElementById('payButton');
        payButton.addEventListener('click', () => {
            this.processPayment();
        });
    }

    processPayment() {
        let amount = this.selectedAmount;
        
        if (amount <= 0) {
            const customAmount = parseInt(document.getElementById('customAmount').value);
            if (customAmount && customAmount >= 10) {
                amount = customAmount;
            } else {
                alert('Please select or enter a valid amount (minimum 10 RUB)');
                return;
            }
        }

        if (amount < 10) {
            alert('Minimum payment amount is 10 RUB');
            return;
        }

        this.showPaymentModal(amount);
    }

    showPaymentModal(amount) {
        const modal = document.createElement('div');
        modal.className = 'oxnack-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div class="oxnack-modal-content" style="background: white; padding: 30px; border-radius: 10px; max-width: 400px; width: 90%;">
                <h3>Payment Processing</h3>
                <p>Amount: <strong>${amount} RUB</strong></p>
                <p>Method: <strong>${this.selectedMethod === 'card' ? 'Bank Card' : 'Cryptocurrency'}</strong></p>
                <p style="color: var(--gray-color); font-size: 0.9rem; margin: 15px 0;">
                    This is a demo payment system. In production, you would be redirected to the payment gateway.
                </p>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button id="confirmPay" class="oxnack-primary-btn" style="flex: 1;">Confirm Payment</button>
                    <button id="cancelPay" style="flex: 1; padding: 12px; border: 1px solid var(--light-gray); border-radius: 6px; background: white; cursor: pointer;">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('confirmPay').addEventListener('click', () => {
            this.simulatePayment(amount);
            modal.remove();
        });

        document.getElementById('cancelPay').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    simulatePayment(amount) {
        const processing = document.createElement('div');
        processing.className = 'oxnack-modal';
        processing.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        processing.innerHTML = `
            <div class="oxnack-modal-content" style="background: white; padding: 30px; border-radius: 10px; max-width: 400px; width: 90%; text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 15px;"></i>
                <h3>Processing Payment</h3>
                <p>Please wait while we process your payment...</p>
            </div>
        `;

        document.body.appendChild(processing);

        setTimeout(() => {
            processing.remove();
            this.showPaymentResult(amount, true);
        }, 3000);
    }

    showPaymentResult(amount, success) {
        const result = document.createElement('div');
        result.className = 'oxnack-modal';
        result.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        if (success) {
            result.innerHTML = `
                <div class="oxnack-modal-content" style="background: white; padding: 30px; border-radius: 10px; max-width: 400px; width: 90%; text-align: center;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #22c55e; margin-bottom: 15px;"></i>
                    <h3>Payment Successful!</h3>
                    <p>Your balance has been topped up by <strong>${amount} RUB</strong></p>
                    <button id="closeResult" class="oxnack-primary-btn" style="margin-top: 20px;">Close</button>
                </div>
            `;
        } else {
            result.innerHTML = `
                <div class="oxnack-modal-content" style="background: white; padding: 30px; border-radius: 10px; max-width: 400px; width: 90%; text-align: center;">
                    <i class="fas fa-times-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;"></i>
                    <h3>Payment Failed</h3>
                    <p>Please try again or contact support</p>
                    <button id="closeResult" class="oxnack-primary-btn" style="margin-top: 20px;">Close</button>
                </div>
            `;
        }

        document.body.appendChild(result);

        document.getElementById('closeResult').addEventListener('click', () => {
            result.remove();
            if (success) {
                this.loadBalance();
            }
        });

        result.addEventListener('click', (e) => {
            if (e.target === result) {
                result.remove();
                if (success) {
                    this.loadBalance();
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PayManager();
});