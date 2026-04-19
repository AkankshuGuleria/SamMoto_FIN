/* Frontend redesign: shared SamMoto motion system for preloader, transitions, cursor, tilt, counters, scroll reveals, and the homepage diagnostic-board hero. */
(function () {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const tiltSelectors = '.card, .product-card, .stat-card, .booking-section, .table-section, .cart-item, .order-summary, .form-box, .modal, .hero-stat';
    const revealSelectors = [
        '.card',
        '.product-card',
        '.stat-card',
        '.booking-section',
        '.table-section',
        '.cart-item',
        '.order-summary',
        '.form-box',
        '.hero-content > *',
        '.section-header',
        '.footer-grid > *',
        '.empty-state',
        '.modal'
    ].join(', ');

    let refreshQueued = false;
    let revealObserver;
    let countObserver;

    document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('js-enhanced');

        setupPreloader();
        setupPageTransitions();
        setupFloatingLabels();
        decorateStatCards();
        setupHeadingReveal();
        setupRevealObserver();
        setupCountObserver();
        setupBookingStepper();
        queueRefresh();

        if (!reducedMotion && !isTouch) {
            setupCustomCursor();
            setupCardTilt();
            setupMagneticButtons();
        }

        setupMutationRefresh();
        initHeroScene();
    });

    function setupPreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        const firstLoad = !sessionStorage.getItem('sm_preloader_seen');
        const arc = preloader.querySelector('.preloader-arc');
        const letters = preloader.querySelectorAll('.preloader-word span');

        const hidePreloader = () => {
            preloader.classList.add('hidden');
            window.setTimeout(() => {
                if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
            }, 650);
        };

        if (!firstLoad || reducedMotion) {
            sessionStorage.setItem('sm_preloader_seen', '1');
            window.setTimeout(hidePreloader, 80);
            return;
        }

        sessionStorage.setItem('sm_preloader_seen', '1');

        if (arc) {
            const length = arc.getTotalLength ? arc.getTotalLength() : 565;
            arc.style.strokeDasharray = String(length);
            arc.style.strokeDashoffset = String(length);
        }

        if (window.gsap && arc) {
            const tl = window.gsap.timeline({ defaults: { ease: 'power3.out' } });
            tl.to(arc, { strokeDashoffset: 0, duration: 1.2 })
                .to(letters, { opacity: 1, y: 0, stagger: 0.06, duration: 0.35 }, 0.2)
                .to(preloader, { opacity: 0, duration: 0.45, delay: 0.18, onComplete: hidePreloader });
            return;
        }

        letters.forEach((letter, index) => {
            window.setTimeout(() => {
                letter.style.opacity = '1';
                letter.style.transform = 'translateY(0)';
            }, 140 + index * 60);
        });
        window.setTimeout(hidePreloader, 1450);
    }

    function setupPageTransitions() {
        const transition = document.getElementById('page-transition');
        if (!transition) return;

        const storedTransition = sessionStorage.getItem('sm_page_transition');
        if (storedTransition && !reducedMotion) {
            transition.classList.add('is-reveal');
            sessionStorage.removeItem('sm_page_transition');
            window.setTimeout(() => transition.classList.remove('is-reveal'), 700);
        } else {
            transition.classList.remove('is-reveal');
        }

        document.querySelectorAll('a[href]').forEach((link) => {
            if (link.dataset.transitionBound === 'true') return;
            link.dataset.transitionBound = 'true';
            link.addEventListener('click', (event) => {
                const href = link.getAttribute('href');
                if (!href) return;
                if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href === '#') return;
                if (link.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

                const destination = new URL(link.href, window.location.href);
                if (destination.origin !== window.location.origin) return;
                if (destination.pathname === window.location.pathname && destination.hash === window.location.hash) return;
                if (reducedMotion) return;

                event.preventDefault();
                sessionStorage.setItem('sm_page_transition', '1');
                transition.classList.add('is-active');
                window.setTimeout(() => {
                    window.location.href = destination.href;
                }, 420);
            });
        });
    }

    function setupFloatingLabels(scope) {
        const root = scope || document;
        root.querySelectorAll('.input-group').forEach((group) => {
            if (group.dataset.labelBound === 'true') return;
            group.dataset.labelBound = 'true';
            const field = group.querySelector('input, select, textarea');
            if (!field) return;

            const syncState = () => {
                const hasValue = field.type === 'date'
                    ? Boolean(field.value)
                    : field.tagName === 'SELECT'
                        ? field.selectedIndex > 0 || (field.value && field.value !== '')
                        : Boolean(field.value && field.value.trim());
                group.classList.toggle('has-value', hasValue);
            };

            ['input', 'change', 'blur'].forEach((eventName) => field.addEventListener(eventName, syncState));
            syncState();
        });
    }

    function decorateStatCards() {
        document.querySelectorAll('.stat-card').forEach((card) => {
            if (card.querySelector('.border-orbit')) return;
            const orbit = document.createElement('span');
            orbit.className = 'border-orbit';
            card.appendChild(orbit);
        });
    }

    function setupHeadingReveal() {
        document.querySelectorAll('.section-header h2, .form-box h2, .booking-container h2, .dash-header h1, .table-section-header h3').forEach((heading) => {
            if (heading.dataset.splitReady === 'true') return;
            const text = heading.textContent || '';
            heading.dataset.splitReady = 'true';
            heading.classList.add('text-reveal');
            heading.innerHTML = '';
            Array.from(text).forEach((char, index) => {
                const span = document.createElement('span');
                span.style.setProperty('--char-index', String(index));
                span.textContent = char === ' ' ? '\u00A0' : char;
                heading.appendChild(span);
            });
        });
    }

    function setupRevealObserver() {
        if (revealObserver) revealObserver.disconnect();
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.18, rootMargin: '0px 0px -10% 0px' });
    }

    function setupCountObserver() {
        if (countObserver) countObserver.disconnect();
        countObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                animateCounter(entry.target);
                countObserver.unobserve(entry.target);
            });
        }, { threshold: 0.4 });
    }

    function setupCustomCursor() {
        if (document.querySelector('.custom-cursor')) return;

        const dot = document.createElement('div');
        const ring = document.createElement('div');
        dot.className = 'custom-cursor';
        ring.className = 'custom-cursor-ring';
        document.body.appendChild(dot);
        document.body.appendChild(ring);
        document.body.classList.add('cursor-fx');

        const current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const target = { x: current.x, y: current.y };

        const animate = () => {
            current.x += (target.x - current.x) * 0.2;
            current.y += (target.y - current.y) * 0.2;
            dot.style.transform = `translate(${target.x}px, ${target.y}px) translate(-50%, -50%) scale(${dot.dataset.scale || 1})`;
            ring.style.transform = `translate(${current.x}px, ${current.y}px) translate(-50%, -50%)`;
            window.requestAnimationFrame(animate);
        };

        window.addEventListener('pointermove', (event) => {
            target.x = event.clientX;
            target.y = event.clientY;
        });

        const interactiveSelector = 'a, button, .btn, .btn-nav, .filter-btn, .sidebar-link, input, textarea, select';
        document.addEventListener('pointerover', (event) => {
            const targetElement = event.target.closest(interactiveSelector);
            if (!targetElement) return;
            dot.dataset.scale = targetElement.matches('button, .btn, .btn-nav, .filter-btn, a, .sidebar-link') ? '3' : '1.4';
            dot.classList.add('is-hover');
            ring.classList.add('is-hidden');
        });

        document.addEventListener('pointerout', (event) => {
            if (!event.target.closest(interactiveSelector)) return;
            dot.dataset.scale = '1';
            dot.classList.remove('is-hover');
            ring.classList.remove('is-hidden');
        });

        window.addEventListener('pointerdown', () => {
            dot.classList.remove('is-click');
            void dot.offsetWidth;
            dot.classList.add('is-click');
        });

        animate();
    }

    function setupCardTilt(scope) {
        const root = scope || document;
        root.querySelectorAll(tiltSelectors).forEach((card) => {
            if (card.dataset.tiltBound === 'true') return;
            card.dataset.tiltBound = 'true';

            card.addEventListener('pointermove', (event) => {
                const rect = card.getBoundingClientRect();
                const px = ((event.clientX - rect.left) / rect.width) * 100;
                const py = ((event.clientY - rect.top) / rect.height) * 100;
                const rotateY = ((px - 50) / 50) * 12;
                const rotateX = -((py - 50) / 50) * 12;

                card.style.setProperty('--pointer-x', `${px}%`);
                card.style.setProperty('--pointer-y', `${py}%`);
                card.style.setProperty('--shine-opacity', '0.75');
                card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
            });

            card.addEventListener('pointerleave', () => {
                card.style.setProperty('--shine-opacity', '0');
                card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
            });
        });
    }

    function setupMagneticButtons(scope) {
        const root = scope || document;
        root.querySelectorAll('.btn, .btn-nav, .filter-btn, .qty-btn, .modal-close').forEach((button) => {
            if (button.dataset.magneticBound === 'true') return;
            button.dataset.magneticBound = 'true';

            button.addEventListener('pointermove', (event) => {
                const rect = button.getBoundingClientRect();
                const x = event.clientX - rect.left - rect.width / 2;
                const y = event.clientY - rect.top - rect.height / 2;
                const moveX = Math.max(Math.min(x * 0.2, 10), -10);
                const moveY = Math.max(Math.min(y * 0.2, 8), -8);
                button.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });

            button.addEventListener('pointerleave', () => {
                button.style.transform = 'translate(0px, 0px)';
            });

            button.addEventListener('pointerdown', (event) => {
                createRipple(button, event);
            });
        });
    }

    function createRipple(element, event) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        element.appendChild(ripple);
        window.setTimeout(() => ripple.remove(), 700);
    }

    function setupBookingStepper() {
        const stepper = document.querySelector('.booking-steps');
        if (!stepper) return;

        const dots = Array.from(stepper.querySelectorAll('.step-dot'));
        if (!dots.length) return;

        const updateProgress = () => {
            const active = dots.filter((dot) => dot.classList.contains('active')).length;
            const ratio = dots.length === 1 ? 1 : Math.max(0, (active - 1) / (dots.length - 1));
            stepper.style.setProperty('--step-progress', String(ratio));
        };

        const mutationObserver = new MutationObserver(updateProgress);
        dots.forEach((dot) => mutationObserver.observe(dot, { attributes: true, attributeFilter: ['class'] }));
        updateProgress();

        const sections = document.querySelectorAll('#step1, #step2, #step3, #step-success');
        sections.forEach((section) => {
            section.classList.add('booking-step-content');
        });
    }

    function setupMutationRefresh() {
        const observer = new MutationObserver((mutations) => {
            let shouldRefresh = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    shouldRefresh = true;
                }
            });
            if (shouldRefresh) queueRefresh();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function queueRefresh() {
        if (refreshQueued) return;
        refreshQueued = true;

        window.requestAnimationFrame(() => {
            refreshQueued = false;
            refreshInteractiveElements();
        });
    }

    function refreshInteractiveElements() {
        document.querySelectorAll(revealSelectors).forEach((element) => {
            if (!element.classList.contains('reveal-item')) {
                element.classList.add('reveal-item');
            }
            if (revealObserver) revealObserver.observe(element);
        });

        document.querySelectorAll('.text-reveal').forEach((element) => {
            if (revealObserver) revealObserver.observe(element);
        });

        document.querySelectorAll('.hero-stat .num, .stat-card .value, [data-countup]').forEach((element) => {
            if (canAnimateCounter(element) && countObserver) {
                countObserver.observe(element);
            }
        });

        setupFloatingLabels(document);
        setupPageTransitions();

        if (!reducedMotion && !isTouch) {
            setupCardTilt(document);
            setupMagneticButtons(document);
        }
    }

    function canAnimateCounter(element) {
        const raw = (element.textContent || '').trim();
        if (!raw || raw === '-' || raw === '--' || raw === '—') return false;
        return /\d/.test(raw);
    }

    function parseCounter(raw) {
        const source = raw.replace(/,/g, '').trim();
        const numberMatch = source.match(/-?\d+(\.\d+)?/);
        if (!numberMatch) return null;

        const number = Number(numberMatch[0]);
        const prefix = source.slice(0, numberMatch.index);
        const suffix = source.slice((numberMatch.index || 0) + numberMatch[0].length);
        const decimals = numberMatch[0].includes('.') ? numberMatch[0].split('.')[1].length : 0;
        return { number, prefix, suffix, decimals };
    }

    function animateCounter(element) {
        const raw = (element.textContent || '').trim();
        if (element.dataset.counted === raw) return;
        const parsed = parseCounter(raw);
        if (!parsed) return;

        element.dataset.counted = raw;

        if (reducedMotion) {
            element.textContent = raw;
            return;
        }

        const start = performance.now();
        const duration = 1200;
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);

        const update = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = easeOut(progress);
            const value = parsed.number * eased;
            const formatted = parsed.decimals > 0
                ? value.toFixed(parsed.decimals)
                : Math.round(value).toLocaleString('en-IN');
            element.textContent = `${parsed.prefix}${formatted}${parsed.suffix}`;

            if (progress < 1) {
                window.requestAnimationFrame(update);
            } else {
                element.textContent = raw;
            }
        };

        window.requestAnimationFrame(update);
    }

    function initHeroScene() {
        const board = document.getElementById('hero-board');
        if (!board) return;

        const hero = board.closest('.hero');
        const shell = board.querySelector('.hero-board-shell');
        const floatingCards = Array.from(board.querySelectorAll('.hero-floating-card'));
        const signalBars = Array.from(board.querySelectorAll('.hero-signal-bar'));
        const timelineFill = board.querySelector('.hero-timeline-fill');
        const timelineStops = Array.from(board.querySelectorAll('.hero-timeline-stop'));

        if (window.gsap && !reducedMotion) {
            window.gsap.from(shell, {
                autoAlpha: 0,
                duration: 0.9,
                ease: 'power3.out',
                delay: 0.15
            });
            window.gsap.from(floatingCards, {
                autoAlpha: 0,
                duration: 0.7,
                stagger: 0.12,
                ease: 'power3.out',
                delay: 0.35
            });
        }

        if (reducedMotion) {
            if (timelineFill) timelineFill.style.transform = 'scaleX(0.68)';
            return;
        }

        const pointer = { x: 0, y: 0 };
        const current = { x: 0, y: 0 };
        let frameId = 0;

        const surface = hero || board;
        surface.addEventListener('pointermove', (event) => {
            const rect = surface.getBoundingClientRect();
            pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
            pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
        });
        surface.addEventListener('pointerleave', () => {
            pointer.x = 0;
            pointer.y = 0;
        });

        const animate = (now) => {
            const time = now * 0.001;

            current.x += (pointer.x - current.x) * 0.08;
            current.y += (pointer.y - current.y) * 0.08;

            if (shell) {
                const moveX = current.x * 18;
                const moveY = current.y * 14;
                const rotateY = current.x * 10;
                const rotateX = current.y * -8;
                shell.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
            }

            floatingCards.forEach((card, index) => {
                const depth = Number(card.dataset.floatDepth || (index === 0 ? 0.7 : -0.55));
                const driftX = Math.sin(time * (0.85 + index * 0.2) + index) * 10;
                const driftY = Math.cos(time * (1.1 + index * 0.15) + index * 0.6) * 10;
                const moveX = driftX + current.x * 30 * depth;
                const moveY = driftY + current.y * 18 * depth;
                card.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
            });

            signalBars.forEach((bar, index) => {
                const base = Number(bar.dataset.baseScale || 0.42);
                const pulse = 0.88 + Math.abs(Math.sin(time * 2.2 + index * 0.45)) * 0.24;
                bar.style.transform = `scaleY(${pulse.toFixed(3)})`;
                bar.style.opacity = String(Math.min(0.95, 0.28 + base * 0.58));
            });

            if (timelineFill) {
                const baseProgress = Number(timelineFill.dataset.targetScale || 0.68);
                const progress = Math.max(0.12, Math.min(1, baseProgress + Math.sin(time * 0.7) * 0.03));
                timelineFill.style.transform = `scaleX(${progress.toFixed(3)})`;
            }

            timelineStops.forEach((stop, index) => {
                if (index < 2) return;
                stop.style.opacity = String(0.56 + Math.abs(Math.sin(time * 1.15 + index * 0.8)) * 0.28);
            });

            frameId = window.requestAnimationFrame(animate);
        };

        const syncVisibility = () => {
            if (document.hidden) {
                if (frameId) {
                    window.cancelAnimationFrame(frameId);
                    frameId = 0;
                }
                return;
            }
            if (!frameId) {
                frameId = window.requestAnimationFrame(animate);
            }
        };

        document.addEventListener('visibilitychange', syncVisibility);
        frameId = window.requestAnimationFrame(animate);
    }
})();
