// ===========================
// FLASH CARDS APP - JAVASCRIPT
// ===========================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Get button elements
    const previewBtn = document.getElementById('previewBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    // Add event listeners
    previewBtn.addEventListener('click', populateCardsAndPrint);
    clearBtn.addEventListener('click', clearAllFields);
    
    // Also populate cards whenever user types (for real-time preview)
    const allTextareas = document.querySelectorAll('textarea');
    allTextareas.forEach(textarea => {
        textarea.addEventListener('input', populateCards);
    });
    
    // Initial population (in case of browser auto-fill)
    populateCards();
});

// ===========================
// POPULATE PRINT CARDS
// ===========================
function populateCards() {
    // Loop through all 8 cards
    for (let i = 1; i <= 8; i++) {
        // Get input values
        const questionText = document.getElementById(`q${i}`).value.trim();
        const answerText = document.getElementById(`a${i}`).value.trim();
        
        // Get print card elements
        const printQuestionCard = document.getElementById(`print-q${i}`);
        const printAnswerCard = document.getElementById(`print-a${i}`);
        
        // Set text content
        printQuestionCard.textContent = questionText || `Q${i}`;
        printAnswerCard.textContent = answerText || `A${i}`;
        
        // Auto-resize text to fit card
        autoResizeText(printQuestionCard);
        autoResizeText(printAnswerCard);
    }
}

// ===========================
// AUTO-RESIZE TEXT TO FIT CARD
// ===========================
function autoResizeText(element) {
    // Reset to default size
    let fontSize = 16; // Start at 16pt
    element.style.fontSize = fontSize + 'pt';
    
    // Get element dimensions
    const maxHeight = element.clientHeight;
    const maxWidth = element.clientWidth;
    
    // If there's no text, keep default size
    if (!element.textContent || element.textContent.trim() === '') {
        return;
    }
    
    // Decrease font size until text fits
    while (fontSize > 8) { // Minimum 8pt
        element.style.fontSize = fontSize + 'pt';
        
        // Check if text overflows
        if (element.scrollHeight <= maxHeight && element.scrollWidth <= maxWidth) {
            break; // Text fits!
        }
        
        fontSize -= 0.5; // Decrease by 0.5pt increments
    }
    
    // If text is very short, try to make it bigger (up to 24pt max)
    if (element.textContent.length < 20) {
        fontSize = Math.min(24, fontSize + 4);
        element.style.fontSize = fontSize + 'pt';
        
        // Check if it still fits
        while (fontSize > 8 && (element.scrollHeight > maxHeight || element.scrollWidth > maxWidth)) {
            fontSize -= 0.5;
            element.style.fontSize = fontSize + 'pt';
        }
    }
}

// ===========================
// POPULATE AND TRIGGER PRINT
// ===========================
function populateCardsAndPrint() {
    // Check if at least one card is filled
    let hasContent = false;
    for (let i = 1; i <= 8; i++) {
        const q = document.getElementById(`q${i}`).value.trim();
        const a = document.getElementById(`a${i}`).value.trim();
        if (q || a) {
            hasContent = true;
            break;
        }
    }
    
    if (!hasContent) {
        alert('⚠️ Please fill in at least one question or answer before printing!');
        return;
    }
    
    // Populate the print cards
    populateCards();
    
    // Small delay to ensure rendering is complete
    setTimeout(() => {
        window.print();
    }, 100);
}

// ===========================
// CLEAR ALL FIELDS
// ===========================
function clearAllFields() {
    // Confirm before clearing
    const confirmClear = confirm('🗑️ Are you sure you want to clear all fields?');
    
    if (confirmClear) {
        // Clear all textareas
        for (let i = 1; i <= 8; i++) {
            document.getElementById(`q${i}`).value = '';
            document.getElementById(`a${i}`).value = '';
        }
        
        // Clear print cards
        populateCards();
        
        // Optional: Show confirmation
        console.log('✅ All fields cleared');
    }
}

// ===========================
// KEYBOARD SHORTCUTS (Optional)
// ===========================
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + P for print
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault(); // Prevent default browser print
        populateCardsAndPrint();
    }
    
    // Ctrl/Cmd + L for clear (optional)
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        clearAllFields();
    }
});