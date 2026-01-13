// Language Management - Chinese version
let currentLanguage = 'zh';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Chinese page - no switching needed
    document.documentElement.lang = 'zh-HK';
});

// Language Switcher Function - Updates all Chinese text
function switchLanguage(lang) {
    currentLanguage = lang;
    
    // Update all translatable elements
    document.querySelectorAll('[data-zh]').forEach(element => {
        const translation = element.getAttribute('data-zh');
        if (translation) {
            if (element.tagName === 'BUTTON' || element.tagName === 'SPAN') {
                element.textContent = translation;
            } else {
                element.innerHTML = translation;
            }
        }
    });
}

// Show overlay on hover (Desktop) - Exact copy from aligner.vue behavior
function showOverlay(element) {
    const overlay = element.querySelector('.box_text');
    const title = element.querySelector('.title:not(.box_text .title)');
    
    if (overlay) {
        overlay.classList.add('visible');
    }
    if (title) {
        title.style.display = 'none';
    }
    
    // Shrink other boxes
    const allBoxes = document.querySelectorAll('.box');
    allBoxes.forEach(box => {
        if (box !== element && !box.classList.contains('hovering')) {
            box.style.transform = 'scale(0.9)';
        }
    });
    
    element.classList.add('hovering');
}

// Hide overlay on mouse leave (Desktop) - Exact copy from aligner.vue behavior
function hideOverlay(element) {
    const overlay = element.querySelector('.box_text');
    const title = element.querySelector('.title:not(.box_text .title)');
    
    if (overlay) {
        overlay.classList.remove('visible');
    }
    if (title) {
        title.style.display = 'block';
    }
    
    // Reset all boxes
    const allBoxes = document.querySelectorAll('.box');
    allBoxes.forEach(box => {
        box.style.transform = 'scale(1)';
    });
    
    element.classList.remove('hovering');
}

// Navigate to the teeth straightener app
function startAnalysis() {
    console.log('Starting AI analysis, navigating to app...');
    // Navigate to the main teeth straightener app
    window.location.href = '../app.html';
}

// Book consultation (placeholder function - can be customized)
function bookConsultation() {
    const message = currentLanguage === 'zh' 
        ? '諮詢預約功能即將推出！現在請使用 AI 分析功能體驗即時效果。' 
        : 'Consultation booking coming soon! Please try our AI Analysis feature for instant results.';
    alert(message);
    // Alternative: you can navigate to a booking page or open WhatsApp
    // window.location.href = 'https://api.whatsapp.com/send/?phone=85266627628';
}

// Export functions for use in HTML onclick attributes
window.switchLanguage = switchLanguage;
window.startAnalysis = startAnalysis;
window.bookConsultation = bookConsultation;
window.showOverlay = showOverlay;
window.hideOverlay = hideOverlay;
