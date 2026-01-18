document.addEventListener('DOMContentLoaded', function() {
    // Common elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const verificationForm = document.getElementById('verificationForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const backToLoginLink = document.getElementById('backToLogin');
    const resendCodeLink = document.getElementById('resendCode');
    
    // Current user data for verification
    let currentUser = null;

    function validatePassword(password){
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (password.length < minLength) {
            return 'Пароль должен содержать минимум 8 символов';
        }
        
        if (!hasUpperCase) {
            return 'Пароль должен содержать хотя бы одну заглавную букву';
        }
        
        if (!hasLowerCase) {
            return 'Пароль должен содержать хотя бы одну строчную букву';
        }
        
        if (!hasNumbers) {
            return 'Пароль должен содержать хотя бы одну цифру';
        }
        
        return null; // Пароль надежный
    }
    
    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('http://localhost:7004/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        mail: email,
                        passwd: password
                    }),
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Successful login - redirect to dashboard
                    window.location.href = '/';
                } else {
                    showError(loginForm, data.error || 'Неверный email или пароль');
                }
            } catch (error) {
                showError(loginForm, 'Ошибка соединения с сервером');
            }
        });
    }
    
    // Register form handler
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;

            // Валидация пароля по требованиям бэкенда
            const passwordError = validatePassword(password);
            if (passwordError) {
                showError(registerForm, passwordError);
                return;
            }
            
            // Проверка на кавычки в пароле
            if (password.includes('"') || password.includes("'")) {
                showError(registerForm, 'Пароль не должен содержать кавычки');
                return;
            }
            
            // Проверка совпадения паролей
            if (password !== passwordConfirm) {
                showError(registerForm, 'Пароли не совпадают');
                return;
            }
            
            try {
                const response = await fetch('http://localhost:7004/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        mail: email,
                        passwd: password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Сохраняем данные пользователя и показываем форму верификации
                    currentUser = { email, password };
                    registerForm.classList.add('oxnack-hidden');
                    verificationForm.classList.remove('oxnack-hidden');
                    
                    // Фокус на поле ввода кода
                    document.getElementById('verificationCode').focus();
                } else {
                    showError(registerForm, data.error || 'Ошибка регистрации');
                }
            } catch (error) {
                showError(registerForm, 'Ошибка соединения с сервером');
            }
        });
    }
    
    // Verification form handler
    if (verificationForm) {
        verificationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const code = document.getElementById('verificationCode').value;
            
            // Валидация кода
            if (!code || !code.trim()) {
                showError(verificationForm, 'Введите код подтверждения');
                return;
            }
            
            if (!/^\d+$/.test(code)) {
                showError(verificationForm, 'Код должен содержать только цифры');
                return;
            }
            
            try {
                const response = await fetch('http://localhost:7004/register/code', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        mail: currentUser.email,
                        code: code
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Регистрация завершена, автоматически логиним пользователя
                    const loginResponse = await fetch('http://localhost:7004/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            mail: currentUser.email,
                            passwd: currentUser.password
                        }),
                        credentials: 'include'
                    });
                    
                    if (loginResponse.ok) {
                        window.location.href = '/';
                    } else {
                        showError(verificationForm, 'Регистрация успешна, но вход не удался. Пожалуйста, войдите вручную.');
                        // Возвращаем к форме логина
                        verificationForm.classList.add('oxnack-hidden');
                        loginForm.classList.remove('oxnack-hidden');
                    }
                } else {
                    showError(verificationForm, data.error || 'Неверный код подтверждения');
                }
            } catch (error) {
                showError(verificationForm, 'Ошибка соединения с сервером');
            }
        });
    }
    
    // Forgot password handlers
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.classList.add('oxnack-hidden');
            forgotPasswordForm.classList.remove('oxnack-hidden');
        });
    }
    
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            forgotPasswordForm.classList.add('oxnack-hidden');
            loginForm.classList.remove('oxnack-hidden');
        });
    }
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('resetEmail').value;
            const codeInput = document.getElementById('resetCode');
            const codeGroup = document.getElementById('resetCodeGroup');
            
            if (!codeGroup.classList.contains('oxnack-hidden')) {
                // Code verification phase
                const code = codeInput.value;
                
                // Здесь будет логика сброса пароля
                alert('Пароль успешно сброшен. Проверьте ваш email для инструкций.');
                forgotPasswordForm.classList.add('oxnack-hidden');
                loginForm.classList.remove('oxnack-hidden');
                return;
            }
            
            // Initial request phase
            try {
                // Временная заглушка для сброса пароля
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Показываем поле для кода
                codeGroup.classList.remove('oxnack-hidden');
                this.querySelector('button[type="submit"]').textContent = 'Сбросить пароль';
                
                // Фокус на поле ввода кода
                codeInput.focus();
            } catch (error) {
                showError(forgotPasswordForm, 'Ошибка при запросе сброса пароля');
            }
        });
    }
    
    // Resend code handler
    if (resendCodeLink) {
        resendCodeLink.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (!currentUser || !currentUser.email) {
                alert('Ошибка: данные пользователя не найдены');
                return;
            }
            
            try {
                // Повторная отправка кода через регистрацию
                const response = await fetch('http://localhost:7004/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        mail: currentUser.email,
                        passwd: currentUser.password
                    })
                });
                
                if (response.ok) {
                    alert('Код подтверждения был отправлен повторно на вашу почту');
                } else {
                    const data = await response.json();
                    alert(data.error || 'Ошибка при повторной отправке кода');
                }
            } catch (error) {
                alert('Ошибка соединения с сервером');
            }
        });
    }
    
    // Password confirmation check
    const passwordConfirmInput = document.getElementById('regPasswordConfirm');
    if (passwordConfirmInput) {
        passwordConfirmInput.addEventListener('input', function() {
            const password = document.getElementById('regPassword').value;
            const errorElement = this.parentNode.querySelector('.oxnack-confirm-error');
            
            // Удаляем предыдущую ошибку
            if (errorElement) {
                errorElement.remove();
            }
            
            if (this.value && password !== this.value) {
                const errorElement = document.createElement('div');
                errorElement.className = 'oxnack-confirm-error';
                errorElement.style.color = '#b91c1c';
                errorElement.style.fontSize = '0.8rem';
                errorElement.style.marginTop = '5px';
                errorElement.textContent = 'Пароли не совпадают';
                this.parentNode.appendChild(errorElement);
            }
        });
    }
    
    // Password validation display
    const passwordInput = document.getElementById('regPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const errorElement = this.parentNode.querySelector('.oxnack-password-error');
            
            // Удаляем предыдущую ошибку
            if (errorElement) {
                errorElement.remove();
            }
            
            // Проверяем только если поле не пустое
            if (this.value.length > 0) {
                const error = validatePassword(this.value);
                if (error) {
                    const errorElement = document.createElement('div');
                    errorElement.className = 'oxnack-password-error';
                    errorElement.style.color = '#b91c1c';
                    errorElement.style.fontSize = '0.8rem';
                    errorElement.style.marginTop = '5px';
                    errorElement.textContent = error;
                    this.parentNode.appendChild(errorElement);
                }
                
                // Проверка на кавычки
                if (this.value.includes('"') || this.value.includes("'")) {
                    const quoteError = document.createElement('div');
                    quoteError.className = 'oxnack-password-error';
                    quoteError.style.color = '#b91c1c';
                    quoteError.style.fontSize = '0.8rem';
                    quoteError.style.marginTop = '5px';
                    quoteError.textContent = 'Пароль не должен содержать кавычки';
                    this.parentNode.appendChild(quoteError);
                }
            }
        });
    }
    
    // Code input validation
    const codeInput = document.getElementById('verificationCode');
    if (codeInput) {
        codeInput.addEventListener('input', function() {
            // Оставляем только цифры
            this.value = this.value.replace(/\D/g, '');
            
            // Ограничиваем длину 6 символами
            if (this.value.length > 6) {
                this.value = this.value.slice(0, 6);
            }
        });
    }
    
    // Helper function to show errors
    function showError(form, message) {
        // Remove any existing error messages
        const existingErrors = form.querySelectorAll('.oxnack-error-message');
        existingErrors.forEach(el => el.remove());
        
        // Create and show new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'oxnack-error-message';
        errorElement.style.color = '#b91c1c';
        errorElement.style.backgroundColor = '#fef2f2';
        errorElement.style.border = '1px solid #fecaca';
        errorElement.style.borderRadius = '4px';
        errorElement.style.padding = '10px';
        errorElement.style.margin = '10px 0';
        errorElement.style.fontSize = '0.9rem';
        errorElement.textContent = message;
        
        // Insert after the last form group
        const lastFormGroup = form.querySelector('.oxnack-form-group:last-child') || form;
        lastFormGroup.parentNode.insertBefore(errorElement, lastFormGroup.nextSibling);
        
        // Scroll to error
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});