window.HELP_IMPROVE_VIDEOJS = false;

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');
    
    if (carouselVideos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });
    
    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

function parsePercent(text) {
    if (!text) return null;
    const m = String(text).trim().match(/(-?\d+(\.\d+)?)\s*%?/);
    if (!m) return null;
    const v = Number(m[1]);
    if (!Number.isFinite(v)) return null;
    return v;
}

function heatColor(value) {
    // Map 0..100 to red->green with very light backgrounds.
    const v = Math.max(0, Math.min(100, value));
    const hue = (v / 100) * 120; // 0=red, 120=green
    const sat = 55;
    const light = 92 - (v / 100) * 14; // 92..78
    return `hsl(${hue} ${sat}% ${light}%)`;
}

function applyScoreTables() {
    const tables = document.querySelectorAll('table.score-table');
    tables.forEach((table) => {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        if (rows.length === 0) return;

        // Split into blocks by section header rows; compute heat/max per block
        const blocks = [];
        let current = [];
        let lastWasSubheader = false;

        function flush() {
            if (current.length > 0) blocks.push(current);
            current = [];
        }

        rows.forEach((tr) => {
            const hasSection = tr.classList.contains('score-section') || tr.querySelector('th[colspan]');
            const isSubheader = tr.classList.contains('score-subheader');
            const tds = tr.querySelectorAll('td');
            const isDataRow = tds.length > 1;

            if (hasSection) {
                flush();
                lastWasSubheader = false;
                return;
            }
            if (isSubheader) {
                // Start a new block at the first subheader row only.
                // Some tables use two header rows for Step Level.
                if (!lastWasSubheader) flush();
                lastWasSubheader = true;
                return;
            }
            lastWasSubheader = false;
            if (isDataRow) current.push(tr);
        });
        flush();

        blocks.forEach((blockRows) => {
            // Apply heatmap per cell (skip first column = method)
            blockRows.forEach((tr) => {
                const tds = Array.from(tr.querySelectorAll('td'));
                tds.forEach((td, idx) => {
                    if (idx === 0) return;
                    const v = parsePercent(td.textContent);
                    if (v === null) return;
                    td.style.background = heatColor(v);
                });
            });

            // Highlight max per column (skip first column) within the block
            if (table.dataset.highlightMax !== 'true') return;
            const colCount = blockRows[0].querySelectorAll('td').length;
            for (let c = 1; c < colCount; c++) {
                let max = -Infinity;
                blockRows.forEach((tr) => {
                    const td = tr.querySelectorAll('td')[c];
                    const v = parsePercent(td?.textContent);
                    if (v === null) return;
                    if (v > max) max = v;
                });
                if (!Number.isFinite(max)) continue;
                blockRows.forEach((tr) => {
                    const td = tr.querySelectorAll('td')[c];
                    const v = parsePercent(td?.textContent);
                    if (v === null) return;
                    if (v === max) td.classList.add('score-best');
                });
            }
        });
    });
}

$(document).ready(function() {
    var options = {
		slidesToScroll: 1,
		slidesToShow: 1,
		loop: true,
		infinite: true,
		autoplay: true,
		autoplaySpeed: 5000,
    }

    if (document.querySelectorAll('.carousel').length > 0) {
        bulmaCarousel.attach('.carousel', options);
        setupVideoCarouselAutoplay();
    }

    if (typeof bulmaSlider !== 'undefined' && document.querySelectorAll('.slider').length > 0) {
        bulmaSlider.attach();
    }

    applyScoreTables();

})
