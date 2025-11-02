// ===========================
// FLASH CARDS APP - WITH AUTO-MERGE
// ===========================

// Track merged cards
const mergedCards = {
    questions: new Set(),
    answers: new Set()
};

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
// POPULATE PRINT CARDS WITH MERGE DETECTION
// ===========================
function populateCards() {
    // Reset merged cards tracking
    mergedCards.questions.clear();
    mergedCards.answers.clear();
    
    // Reset all card classes
    for (let i = 1; i <= 8; i++) {
        const printQ = document.getElementById(`print-q${i}`);
        const printA = document.getElementById(`print-a${i}`);
        printQ.className = 'card';
        printA.className = 'card';
        
        // Re-enable all input groups
        const cardGroup = document.querySelector(`#q${i}`).closest('.card-input-group');
        cardGroup.classList.remove('merged-into');
    }
    
    // Reset grid classes
    const sideA = document.getElementById('sideA').querySelector('.cards-grid');
    const sideB = document.getElementById('sideB').querySelector('.cards-grid');
    sideA.className = 'cards-grid';
    sideB.className = 'cards-grid mirrored';
    
    // Process each card
    for (let i = 1; i <= 8; i++) {
        // Skip if this card was merged into previous card
        if (mergedCards.questions.has(i) || mergedCards.answers.has(i)) {
            continue;
        }
        
        // Get input values
        const questionText = document.getElementById(`q${i}`).value.trim();
        const answerText = document.getElementById(`a${i}`).value.trim();
        
        // Get print card elements
        const printQuestionCard = document.getElementById(`print-q${i}`);
        const printAnswerCard = document.getElementById(`print-a${i}`);
        
        // Check if merge is needed for question
        if (questionText && needsMerge(questionText)) {
            const mergeTarget = i + 2; // Merge with card 2 rows down (same column)
            if (mergeTarget <= 8) {
                handleMerge(i, mergeTarget, 'q', questionText);
            } else {
                // Can't merge, just fit as best as possible
                printQuestionCard.textContent = questionText;
                autoResizeText(printQuestionCard, false);
            }
        } else {
            printQuestionCard.textContent = questionText || `Q${i}`;
            autoResizeText(printQuestionCard, false);
        }
        
        // Check if merge is needed for answer
        if (answerText && needsMerge(answerText)) {
            const mergeTarget = i + 2; // Merge with card 2 rows down (same column)
            if (mergeTarget <= 8) {
                handleMerge(i, mergeTarget, 'a', answerText);
            } else {
                // Can't merge, just fit as best as possible
                printAnswerCard.textContent = answerText;
                autoResizeText(printAnswerCard, false);
            }
        } else {
            printAnswerCard.textContent = answerText || `A${i}`;
            autoResizeText(printAnswerCard, false);
        }
    }
}

// ===========================
// CHECK IF TEXT NEEDS MERGE
// ===========================
function needsMerge(text) {
    // Simple heuristic: if text is very long, it needs merge
    // Adjust threshold as needed
    return text.length > 250; // Characters threshold
}

// ===========================
// HANDLE MERGING TWO CARDS
// ===========================
function handleMerge(sourceIndex, targetIndex, type, text) {
    // type is 'q' or 'a'
    const sourceCard = document.getElementById(`print-${type}${sourceIndex}`);
    const targetCard = document.getElementById(`print-${type}${targetIndex}`);
    
    // Mark as merged
    sourceCard.classList.add('merged');
    targetCard.classList.add('hidden');
    
    // Set text in the merged card
    sourceCard.textContent = text;
    
    // Track merge
    if (type === 'q') {
        mergedCards.questions.add(targetIndex);
    } else {
        mergedCards.answers.add(targetIndex);
    }
    
    // Disable the target input field
    const targetInput = document.getElementById(`${type}${targetIndex}`);
    const targetCardGroup = targetInput.closest('.card-input-group');
    targetCardGroup.classList.add('merged-into');
    targetInput.value = ''; // Clear merged field
    targetInput.disabled = true;
    
    // Add grid class to parent
    const gridParent = sourceCard.parentElement;
    gridParent.classList.add(`has-merged-${type}${sourceIndex}-${type}${targetIndex}`);
    
    // Auto-resize the merged card
    autoResizeText(sourceCard, true);
}

// ===========================
// AUTO-RESIZE TEXT TO FIT CARD
// ===========================
function autoResizeText(element, isMerged = false) {
    const text = element.textContent.trim();
    
    // If empty, keep default and exit
    if (!text || text.startsWith('Q') || text.startsWith('A')) {
        element.style.fontSize = '16pt';
        return;
    }
    
    // Starting font size based on text length and merge status
    let fontSize;
    if (isMerged) {
        // Merged cards have more space
        if (text.length < 50) {
            fontSize = 20;
        } else if (text.length < 150) {
            fontSize = 16;
        } else if (text.length < 300) {
            fontSize = 14;
        } else {
            fontSize = 12;
        }
    } else {
        // Single cards
        if (text.length < 20) {
            fontSize = 24;
        } else if (text.length < 50) {
            fontSize = 20;
        } else if (text.length < 100) {
            fontSize = 16;
        } else if (text.length < 200) {
            fontSize = 14;
        } else {
            fontSize = 12;
        }
    }
    
    const minFontSize = isMerged ? 10 : 8;  // Merged cards can be slightly larger
    const maxFontSize = 28;
    
    // Binary search for optimal font size
    let low = minFontSize;
    let high = Math.min(fontSize, maxFontSize);
    let bestFit = minFontSize;
    
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        element.style.fontSize = mid + 'pt';
        
        // Check if text fits
        const fits = element.scrollHeight <= element.clientHeight && 
                     element.scrollWidth <= element.clientWidth;
        
        if (fits) {
            bestFit = mid;
            low = mid + 1; // Try larger
        } else {
            high = mid - 1; // Try smaller
        }
    }
    
    // Set the best fitting size
    element.style.fontSize = bestFit + 'pt';
    
    // Final check - if still overflowing, force smaller
    let attempts = 0;
    while ((element.scrollHeight > element.clientHeight || 
            element.scrollWidth > element.clientWidth) && 
            bestFit > minFontSize && 
            attempts < 20) {
        bestFit -= 0.5;
        element.style.fontSize = bestFit + 'pt';
        attempts++;
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
    }, 200); // Increased delay for merge calculations
}

// ===========================
// CLEAR ALL FIELDS
// ===========================
function clearAllFields() {
    // Confirm before clearing
    const confirmClear = confirm('🗑️ Are you sure you want to clear all fields?');
    
    if (confirmClear) {
        // Clear all textareas and re-enable them
        for (let i = 1; i <= 8; i++) {
            const qField = document.getElementById(`q${i}`);
            const aField = document.getElementById(`a${i}`);
            
            qField.value = '';
            aField.value = '';
            qField.disabled = false;
            aField.disabled = false;
            
            // Remove merged-into class
            qField.closest('.card-input-group').classList.remove('merged-into');
        }
        
        // Reset merged cards tracking
        mergedCards.questions.clear();
        mergedCards.answers.clear();
        
        // Clear print cards
        populateCards();
        
        console.log('✅ All fields cleared');
    }
}

// ===========================
// KEYBOARD SHORTCUTS
// ===========================
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + P for print
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        populateCardsAndPrint();
    }
    
    // Ctrl/Cmd + L for clear
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        clearAllFields();
    }
});