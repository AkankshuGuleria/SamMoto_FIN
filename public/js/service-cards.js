/* service-cards.js – scroll-triggered drop animations */

window.addEventListener('load', function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* ── 1. Queue & Team status cards (below hero, index.html): DROP from above ── */
  var qtCards = document.querySelectorAll('.qt-card');
  if (qtCards.length) {
    gsap.fromTo(qtCards,
      { y: -120, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.2,
        ease: 'back.out(1.5)',
        scrollTrigger: {
          trigger: '#queue-team-section',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }

  /* ── 2. Queue & Team cards inside overview-summary (dashboard page): DROP from above ── */
  var summaryCards = document.querySelectorAll('.overview-summary .card');
  if (summaryCards.length) {
    gsap.fromTo(summaryCards,
      { y: -90, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.18,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: '.overview-summary',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }

  /* ── 3. Workshop service cards (.grid-3 .card on index.html): DROP from above ── */
  var workshopCards = document.querySelectorAll('.grid-3 .card');
  if (workshopCards.length) {
    gsap.fromTo(workshopCards,
      { y: -100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.13,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: '.grid-3',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }

  /* ── 4. Why SamMoto cards (.grid-4 .card on index.html): DROP from above ── */
  var whyCards = document.querySelectorAll('.grid-4 .card');
  if (whyCards.length) {
    gsap.fromTo(whyCards,
      { y: -100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.13,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: '.grid-4',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }


  /* ── 4. .service-card elements (booking/dashboard pages): DROP from above ── */
  var serviceCards = document.querySelectorAll('.service-card');
  if (serviceCards.length) {
    gsap.fromTo(serviceCards,
      { y: -100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.13,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: '.service-cards',
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    /* Click: pre-select service type + visual pulse */
    serviceCards.forEach(function (card) {
      card.addEventListener('click', function () {
        var service = card.dataset.service;
        var sel = document.getElementById('serviceType');
        if (sel) {
          var match = Array.from(sel.options).find(function (o) {
            return o.textContent.trim() === service;
          });
          if (match) {
            sel.value = match.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        serviceCards.forEach(function (c) { c.classList.remove('sc-selected'); });
        card.classList.add('sc-selected');
        gsap.fromTo(card, { scale: 0.96 }, { scale: 1, duration: 0.25, ease: 'power1.out' });
      });
    });
  }
});
