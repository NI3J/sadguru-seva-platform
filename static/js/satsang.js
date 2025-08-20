document.addEventListener('DOMContentLoaded', function () {
    setupLanguageToggle();
    setupFontControls();
    setupPrintShare();
});

/**
 * 🌐 Language Toggle Logic
 */
function setupLanguageToggle() {
    const marathiBtn = document.getElementById('marathiBtn');
    const englishBtn = document.getElementById('englishBtn');
    const marathiContent = document.getElementById('marathiContent');
    const englishContent = document.getElementById('englishContent');

    marathiBtn.addEventListener('click', function () {
        marathiContent.style.display = 'block';
        englishContent.style.display = 'none';
        marathiBtn.classList.add('active');
        englishBtn.classList.remove('active');
    });

    englishBtn.addEventListener('click', function () {
        marathiContent.style.display = 'none';
        englishContent.style.display = 'block';
        englishBtn.classList.add('active');
        marathiBtn.classList.remove('active');
    });
}

/**
 * 🔠 Font Size Controls
 */
function setupFontControls() {
    const contentSections = document.querySelectorAll('.content-text');

    window.increaseFontSize = function () {
        contentSections.forEach(section => {
            const currentSize = parseFloat(window.getComputedStyle(section).fontSize);
            section.style.fontSize = (currentSize + 1) + 'px';
        });
    };

    window.decreaseFontSize = function () {
        contentSections.forEach(section => {
            const currentSize = parseFloat(window.getComputedStyle(section).fontSize);
            section.style.fontSize = (currentSize - 1) + 'px';
        });
    };
}

/**
 * 🖨️ Print and 📤 Share Actions
 */
function setupPrintShare() {
    window.printSatsang = function () {
        window.print();
    };

    window.shareSatsang = function () {
        const shareData = {
            title: document.title,
            text: 'सद्गुरूंचा आजचा सत्संग वाचा',
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(err => {
                alert('शेअर करताना त्रुटी आली: ' + err);
            });
        } else {
            alert('शेअर सुविधा तुमच्या ब्राउझरमध्ये उपलब्ध नाही.');
        }
    };
}
