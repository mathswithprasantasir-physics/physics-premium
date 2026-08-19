/* ============================================
   TOAST NOTIFICATION SYSTEM
   ============================================ */
class Toast {
    static show(message, type = 'info', duration = 4000) {
        const container = document.querySelector('.toast-container') || (() => {
            const div = document.createElement('div');
            div.className = 'toast-container';
            document.body.appendChild(div);
            return div;
        })();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.4s ease';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }
}

/* ============================================
   LOADING SPINNER
   ============================================ */
function showSpinner(container) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.id = 'globalSpinner';
    container.appendChild(spinner);
}

function hideSpinner() {
    const spinner = document.getElementById('globalSpinner');
    if (spinner) spinner.remove();
}

/* ============================================
   DARK MODE TOGGLE
   ============================================ */
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    Toast.show(`Dark mode ${newTheme === 'dark' ? 'enabled' : 'disabled'}`, 'info');
}

// Load saved theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
});

/* ============================================
   EMAIL VALIDATION
   ============================================ */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ============================================
   COPY TO CLIPBOARD
   ============================================ */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        Toast.show('✅ Copied to clipboard!', 'success');
    } catch {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        Toast.show('✅ Copied to clipboard!', 'success');
    }
}

/* ============================================
   LOCAL STORAGE HELPERS
   ============================================ */
function setUserData(email, postId) {
    localStorage.setItem('userEmail', email);
    localStorage.setItem('postId', postId);
}

function getUserData() {
    return {
        email: localStorage.getItem('userEmail'),
        postId: localStorage.getItem('postId')
    };
}

function clearUserData() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('postId');
}

/* ============================================
   LOGIN CHECK
   ============================================ */
function checkAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.href = '/admin-login.html';
        return false;
    }
    const loginTime = localStorage.getItem('adminLoginTime');
    if (loginTime) {
        const hours = (new Date() - new Date(loginTime)) / (1000 * 60 * 60);
        if (hours > 24) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            window.location.href = '/admin-login.html';
            return false;
        }
    }
    return true;
}

/* ============================================
   EXPORT FUNCTIONS
   ============================================ */
window.Toast = Toast;
window.toggleDarkMode = toggleDarkMode;
window.isValidEmail = isValidEmail;
window.copyToClipboard = copyToClipboard;
window.setUserData = setUserData;
window.getUserData = getUserData;
window.clearUserData = clearUserData;
window.checkAuth = checkAuth;
window.showSpinner = showSpinner;
window.hideSpinner = hideSpinner;