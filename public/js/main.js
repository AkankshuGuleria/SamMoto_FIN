document.addEventListener('DOMContentLoaded', () => {
    // Preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('hidden');
            setTimeout(() => preloader.remove(), 500);
        }, 1000);
    }

    // Navbar scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
        });
    }

    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    }

    // Render nav based on auth state
    renderNav();

    // Cart badge
    updateCartBadge();
});

function renderNav() {
    if (typeof Auth === 'undefined') return;
    const auth = Auth.getAuth();

    const navLinks = document.getElementById('nav-links');
    const navRight = document.getElementById('nav-right');
    const mobileLinks = document.getElementById('mobile-links');

    if (!navLinks || !navRight) return;

    if (!auth.loggedIn) {
        navLinks.innerHTML = `
            <li><a href="/index.html">Home</a></li>
            <li><a href="/shop.html">Shop</a></li>
            <li><a href="/booking.html">Book Service</a></li>`;
        navRight.innerHTML = `
            <a href="/cart.html" class="nav-cart"><i class="fas fa-shopping-cart"></i><span class="cart-badge" id="cart-count">0</span></a>
            <a href="/login.html" class="btn-nav outline">Login</a>
            <a href="/signup.html" class="btn-nav solid">Sign Up</a>`;
    } else if (auth.role === 'customer') {
        navLinks.innerHTML = `
            <li><a href="/index.html">Home</a></li>
            <li><a href="/shop.html">Shop</a></li>
            <li><a href="/booking.html">Book Service</a></li>
            <li><a href="/cust_dashboard.html">My Garage</a></li>`;
        navRight.innerHTML = `
            <a href="/cart.html" class="nav-cart"><i class="fas fa-shopping-cart"></i><span class="cart-badge" id="cart-count">0</span></a>
            <span style="color:var(--muted);font-size:0.85rem">Hi, ${auth.name.split(' ')[0]}</span>
            <button onclick="Auth.logout()" class="btn-nav outline">Logout</button>`;
    } else if (auth.role === 'admin') {
        navLinks.innerHTML = `
            <li><a href="/index.html">Home</a></li>
            <li><a href="/admindashboard.html">Dashboard</a></li>
            <li><a href="/admin_bookings.html">Bookings</a></li>
            <li><a href="/admin_spares.html">Inventory</a></li>`;
        navRight.innerHTML = `
            <span style="color:var(--accent);font-size:0.82rem;font-weight:600;letter-spacing:0.5px">ADMIN</span>
            <button onclick="Auth.logout()" class="btn-nav outline">Logout</button>`;
    }

    if (mobileLinks) mobileLinks.innerHTML = navLinks.innerHTML;
    updateCartBadge();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const cart = JSON.parse(localStorage.getItem('sm_cart') || '[]');
    const count = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}
