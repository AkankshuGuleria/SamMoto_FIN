(function () {
    function getAuth() {
        const token = localStorage.getItem('sm_token') || '';
        const role = localStorage.getItem('sm_role') || '';
        const name = localStorage.getItem('sm_name') || '';
        const email = localStorage.getItem('sm_email') || '';
        return { loggedIn: Boolean(token && role), token, role, name, email };
    }

    function setAuth(data) {
        localStorage.setItem('sm_token', data.token || '');
        localStorage.setItem('sm_role', data.role || '');
        localStorage.setItem('sm_name', data.name || '');
        localStorage.setItem('sm_email', data.email || '');
    }

    function clearAuth() {
        ['sm_token', 'sm_role', 'sm_name', 'sm_email'].forEach(k => localStorage.removeItem(k));
    }

    function getAuthHeader() {
        const { token } = getAuth();
        return token ? { 'Authorization': 'Bearer ' + token } : {};
    }

    function requireAuth() {
        const { loggedIn } = getAuth();
        if (!loggedIn) { window.location.replace('/login.html'); return false; }
        return true;
    }

    function requireRole(role) {
        const auth = getAuth();
        if (!auth.loggedIn) { window.location.replace('/login.html'); return false; }
        const roles = Array.isArray(role) ? role : [role];
        if (!roles.includes(auth.role)) {
            window.location.replace(auth.role === 'admin' ? '/admindashboard.html' : '/cust_dashboard.html');
            return false;
        }
        return true;
    }

    async function logout() {
        try { await fetch('/api/auth/logout', { method: 'POST', headers: getAuthHeader() }); } catch (_) {}
        clearAuth();
        window.location.replace('/login.html');
    }

    window.Auth = { getAuth, setAuth, clearAuth, getAuthHeader, requireAuth, requireRole, logout };
})();

// Toast notifications
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}
