/* ============================================
   AUTHENTICATION LOGIC
   ============================================ */

// DOM Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginFormContainer = document.getElementById('loginForm');
const signupFormContainer = document.getElementById('signupForm');
const successMessage = document.getElementById('successMessage');

// ============================================
// FORM TOGGLE
// ============================================

function toggleForms() {
    loginFormContainer.classList.toggle('active');
    signupFormContainer.classList.toggle('active');
    
    // Clear errors and messages
    clearAllErrors();
    loginForm.reset();
    signupForm.reset();
}

// ============================================
// PASSWORD VISIBILITY TOGGLE
// ============================================

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
}

// ============================================
// VALIDATION RULES
// ============================================

const validators = {
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },
    
    password: (value) => {
        return value.length >= 8;
    },
    
    passwordStrength: (value) => {
        let strength = 0;
        if (value.length >= 8) strength++;
        if (value.length >= 12) strength++;
        if (/[A-Z]/.test(value)) strength++;
        if (/[a-z]/.test(value)) strength++;
        if (/[0-9]/.test(value)) strength++;
        if (/[^A-Za-z0-9]/.test(value)) strength++;
        return strength;
    },
    
    phone: (value) => {
        const phoneRegex = /^[\d\s\-+()]+$/;
        return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
    },
    
    name: (value) => {
        return value.trim().length >= 2;
    }
};

// ============================================
// ERROR HANDLING
// ============================================

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    const fieldId = elementId.replace('-error', '');
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    
    if (inputElement) {
        inputElement.classList.add('error');
    }
}

function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    const fieldId = elementId.replace('-error', '');
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
    
    if (inputElement) {
        inputElement.classList.remove('error');
    }
}

function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const inputElements = document.querySelectorAll('input.error');
    
    errorElements.forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
    
    inputElements.forEach(el => {
        el.classList.remove('error');
    });
}

// ============================================
// PASSWORD STRENGTH INDICATOR
// ============================================

const signupPasswordInput = document.getElementById('signup-password');
if (signupPasswordInput) {
    signupPasswordInput.addEventListener('input', function() {
        const strength = validators.passwordStrength(this.value);
        const strengthBar = document.getElementById('strength-bar');
        const passwordHint = document.getElementById('password-hint');
        
        // Remove all strength classes
        strengthBar.classList.remove('weak', 'medium', 'strong');
        
        let strengthText = '';
        if (this.value.length === 0) {
            strengthBar.style.width = '0';
            passwordHint.classList.remove('show');
        } else if (strength <= 2) {
            strengthBar.classList.add('weak');
            strengthText = '❌ Weak password. Add uppercase, numbers, and symbols.';
            passwordHint.classList.add('show');
        } else if (strength <= 4) {
            strengthBar.classList.add('medium');
            strengthText = '⚠️ Good password. Consider adding more complexity.';
            passwordHint.classList.add('show');
        } else {
            strengthBar.classList.add('strong');
            strengthText = '✓ Strong password!';
            passwordHint.classList.add('show');
        }
        
        passwordHint.textContent = strengthText;
    });
}

// ============================================
// LOGIN FORM VALIDATION & SUBMISSION
// ============================================

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    clearAllErrors();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    let isValid = true;
    
    // Validate email
    if (!email) {
        showError('login-email-error', 'Email is required');
        isValid = false;
    } else if (!validators.email(email)) {
        showError('login-email-error', 'Please enter a valid email address');
        isValid = false;
    } else {
        clearError('login-email-error');
    }
    
    // Validate password
    if (!password) {
        showError('login-password-error', 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        showError('login-password-error', 'Password must be at least 6 characters');
        isValid = false;
    } else {
        clearError('login-password-error');
    }
    
    if (isValid) {
        handleLogin(email, password);
    }
});

function handleLogin(email, password) {
    // Simulate API call
    console.log('Login attempt:', { email, password });
    
    // Disable submit button
    const submitBtn = loginForm.querySelector('.btn-primary');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    // Simulate network request
    setTimeout(() => {
        showSuccessMessage('Login Successful!', 'Welcome back to Credlink. Redirecting...');
        
        // Simulate redirect after 2 seconds
        setTimeout(() => {
            // In a real app, redirect to dashboard
            console.log('Redirecting to dashboard...');
            location.href = 'dashboard.html';
        }, 2000);
    }, 1500);
}

// ============================================
// SIGNUP FORM VALIDATION & SUBMISSION
// ============================================

signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    clearAllErrors();
    
    const firstName = document.getElementById('signup-firstname').value.trim();
    const lastName = document.getElementById('signup-lastname').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const termsAccepted = document.getElementById('terms').checked;
    
    let isValid = true;
    
    // Validate first name
    if (!firstName) {
        showError('firstname-error', 'First name is required');
        isValid = false;
    } else if (!validators.name(firstName)) {
        showError('firstname-error', 'First name must be at least 2 characters');
        isValid = false;
    } else {
        clearError('firstname-error');
    }
    
    // Validate last name
    if (!lastName) {
        showError('lastname-error', 'Last name is required');
        isValid = false;
    } else if (!validators.name(lastName)) {
        showError('lastname-error', 'Last name must be at least 2 characters');
        isValid = false;
    } else {
        clearError('lastname-error');
    }
    
    // Validate email
    if (!email) {
        showError('signup-email-error', 'Email is required');
        isValid = false;
    } else if (!validators.email(email)) {
        showError('signup-email-error', 'Please enter a valid email address');
        isValid = false;
    } else {
        clearError('signup-email-error');
    }
    
    // Validate phone
    if (!phone) {
        showError('signup-phone-error', 'Phone number is required');
        isValid = false;
    } else if (!validators.phone(phone)) {
        showError('signup-phone-error', 'Please enter a valid phone number (10+ digits)');
        isValid = false;
    } else {
        clearError('signup-phone-error');
    }
    
    // Validate password
    if (!password) {
        showError('signup-password-error', 'Password is required');
        isValid = false;
    } else if (!validators.password(password)) {
        showError('signup-password-error', 'Password must be at least 8 characters');
        isValid = false;
    } else {
        clearError('signup-password-error');
    }
    
    // Validate confirm password
    if (!confirmPassword) {
        showError('confirm-password-error', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showError('confirm-password-error', 'Passwords do not match');
        isValid = false;
    } else {
        clearError('confirm-password-error');
    }
    
    // Validate terms
    if (!termsAccepted) {
        showError('terms-error', 'You must agree to the terms and privacy policy');
        isValid = false;
    } else {
        clearError('terms-error');
    }
    
    if (isValid) {
        handleSignup({
            firstName,
            lastName,
            email,
            phone,
            password
        });
    }
}
);

function handleSignup(userData) {
    console.log('Signup attempt:', userData);
    
    // Disable submit button
    const submitBtn = signupForm.querySelector('.btn-primary');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    
    // Simulate API call
    setTimeout(() => {
        showSuccessMessage(
            'Account Created Successfully!',
            `Welcome ${userData.firstName}! Redirecting to your dashboard...`
        );
        
        // Simulate redirect after 2.5 seconds
        setTimeout(() => {
            // In a real app, redirect to dashboard with user token
            console.log('Redirecting to dashboard...');
            location.href = 'dashboard.html';
        }, 2500);
    }, 1500);
}

// ============================================
// SUCCESS MESSAGE
// ============================================

function showSuccessMessage(title, text) {
    document.getElementById('success-title').textContent = title;
    document.getElementById('success-text').textContent = text;
    successMessage.style.display = 'flex';
    
    // Add animation
    setTimeout(() => {
        successMessage.style.animation = 'fadeIn 0.3s ease-in';
    }, 10);
}

function hideSuccessMessage() {
    successMessage.style.display = 'none';
}

// ============================================
// SOCIAL LOGIN (PLACEHOLDER)
// ============================================

function loginWithGoogle() {
    console.log('Google login initiated');
    alert('Google login integration would go here');
    // In a real app, use Google OAuth
}

function signupWithGoogle() {
    console.log('Google signup initiated');
    alert('Google signup integration would go here');
    // In a real app, use Google OAuth
}

// ============================================
// REAL-TIME VALIDATION
// ============================================

// Email validation on blur
document.getElementById('login-email')?.addEventListener('blur', function() {
    if (this.value && !validators.email(this.value)) {
        showError('login-email-error', 'Invalid email format');
    } else {
        clearError('login-email-error');
    }
});

document.getElementById('signup-email')?.addEventListener('blur', function() {
    if (this.value && !validators.email(this.value)) {
        showError('signup-email-error', 'Invalid email format');
    } else {
        clearError('signup-email-error');
    }
});

// Phone validation on blur
document.getElementById('signup-phone')?.addEventListener('blur', function() {
    if (this.value && !validators.phone(this.value)) {
        showError('signup-phone-error', 'Invalid phone number (need 10+ digits)');
    } else {
        clearError('signup-phone-error');
    }
});

// Password match validation
document.getElementById('signup-confirm-password')?.addEventListener('blur', function() {
    const password = document.getElementById('signup-password').value;
    if (this.value && password !== this.value) {
        showError('confirm-password-error', 'Passwords do not match');
    } else {
        clearError('confirm-password-error');
    }
});

// Clear error on focus
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', function() {
        const errorElementId = this.id + '-error';
        clearError(errorElementId);
    });
});

// ============================================
// LOCAL STORAGE (Remember Me Functionality)
// ============================================

window.addEventListener('load', function() {
    const rememberMe = localStorage.getItem('rememberMe');
    const savedEmail = localStorage.getItem('userEmail');
    
    if (rememberMe === 'true' && savedEmail) {
        document.getElementById('login-email').value = savedEmail;
        document.getElementById('remember-me').checked = true;
    }
});

document.getElementById('remember-me')?.addEventListener('change', function() {
    if (this.checked) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('userEmail', document.getElementById('login-email').value);
    } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('userEmail');
    }
});

document.getElementById('login-email')?.addEventListener('change', function() {
    const rememberMe = document.getElementById('remember-me').checked;
    if (rememberMe) {
        localStorage.setItem('userEmail', this.value);
    }
});
