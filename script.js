// ===========================
// FLASH CARDS APP - DYNAMIC VERSION
// ===========================

// State
let cards = [];
let editingCardId = null;
const STORAGE_KEY = 'flashcards_data';

// DOM Elements
let questionInput, answerInput, addCardBtn, updateCardBtn, cancelEditBtn;
let cardList, cardCount, printAllBtn, clearAllBtn, cardsPerSheetSelect;
let printContainer;

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    questionInput = document.getElementById('questionInput');
    answerInput = document.getElementById('answerInput');
    addCardBtn = document.getElementById('addCardBtn');
    updateCardBtn = document.getElementById('updateCardBtn');
    cancelEditBtn = document.getElementById('cancelEditBtn');
    cardList = document.getElementById('cardList');
    cardCount = document.getElementById('cardCount');
    printAllBtn = document.getElementById('printAllBtn');
    clearAllBtn = document.getElementById('clearAllBtn');
    cardsPerSheetSelect = document.getElementById('cardsPerSheet');
    printContainer = document.getElementById('printContainer');

    // Event listeners
    addCardBtn.addEventListener('click', addCard);
    updateCardBtn.addEventListener('click', updateCard);
    cancelEditBtn.addEventListener('click', cancelEdit);
    printAllBtn.addEventListener('click', printAllCards);
    clearAllBtn.addEventListener('click', clearAllCards);
    cardsPerSheetSelect.addEventListener('change', updateCardCount);

    // Keyboard shortcuts
    questionInput.addEventListener('keydown', handleInputKeydown);
    answerInput.addEventListener('keydown', handleInputKeydown);

    // Load cards from localStorage
    loadCards();
    renderCardList();
    updateCardCount();
});

// ===========================
// CARD CRUD OPERATIONS
// ===========================

function addCard() {
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();

    if (!question && !answer) {
        alert('⚠️ Please enter at least a question or answer!');
        return;
    }

    const card = {
        id: Date.now(),
        question: question || '(No question)',
        answer: answer || '(No answer)',
        createdAt: new Date().toISOString()
    };

    cards.push(card);
    saveCards();
    renderCardList();
    updateCardCount();
    clearInputs();
    
    // Scroll to bottom to show new card
    cardList.scrollTop = cardList.scrollHeight;
}

function editCard(id) {
    const card = cards.find(c => c.id === id);
    if (!card) return;

    // Populate inputs
    questionInput.value = card.question === '(No question)' ? '' : card.question;
    answerInput.value = card.answer === '(No answer)' ? '' : card.answer;

    // Switch to edit mode
    editingCardId = id;
    addCardBtn.style.display = 'none';
    updateCardBtn.style.display = 'inline-flex';
    cancelEditBtn.style.display = 'inline-flex';

    // Focus question input
    questionInput.focus();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateCard() {
    if (!editingCardId) return;

    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();

    if (!question && !answer) {
        alert('⚠️ Please enter at least a question or answer!');
        return;
    }

    const cardIndex = cards.findIndex(c => c.id === editingCardId);
    if (cardIndex !== -1) {
        cards[cardIndex].question = question || '(No question)';
        cards[cardIndex].answer = answer || '(No answer)';
        saveCards();
        renderCardList();
    }

    cancelEdit();
}

function deleteCard(id) {
    if (!confirm('🗑️ Delete this card?')) return;

    cards = cards.filter(c => c.id !== id);
    saveCards();
    renderCardList();
    updateCardCount();
}

function clearAllCards() {
    if (cards.length === 0) {
        alert('No cards to clear!');
        return;
    }

    if (!confirm(`🗑️ Delete all ${cards.length} cards? This cannot be undone!`)) return;

    cards = [];
    saveCards();
    renderCardList();
    updateCardCount();
}

function cancelEdit() {
    editingCardId = null;
    clearInputs();
    addCardBtn.style.display = 'inline-flex';
    updateCardBtn.style.display = 'none';
    cancelEditBtn.style.display = 'none';
}

// ===========================
// RENDER FUNCTIONS
// ===========================

function renderCardList() {
    if (cards.length === 0) {
        cardList.innerHTML = `
            <div class="empty-state">
                <p>No cards yet. Create your first card above! 👆</p>
            </div>
        `;
        return;
    }

    cardList.innerHTML = cards.map((card, index) => `
        <div class="card-item">
            <div class="card-number">${index + 1}</div>
            <div class="card-preview">
                <div class="card-preview-question">${escapeHtml(card.question)}</div>
                <div class="card-preview-answer">${escapeHtml(card.answer)}</div>
            </div>
            <div class="card-actions">
                <button class="btn-edit" onclick="editCard(${card.id})">✏️ Edit</button>
                <button class="btn-delete" onclick="deleteCard(${card.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ===========================
// PRINT FUNCTIONS
// ===========================

function printAllCards() {
    if (cards.length === 0) {
        alert('⚠️ No cards to print! Create some cards first.');
        return;
    }

    const cardsPerSheet = parseInt(cardsPerSheetSelect.value);
    generatePrintPages(cardsPerSheet);

    setTimeout(() => {
        window.print();
    }, 200);
}

function generatePrintPages(cardsPerSheet) {
    printContainer.innerHTML = '';

    // Calculate how many sheets needed
    const totalSheets = Math.ceil(cards.length / cardsPerSheet);

    for (let sheetNum = 0; sheetNum < totalSheets; sheetNum++) {
        const startIdx = sheetNum * cardsPerSheet;
        const endIdx = Math.min(startIdx + cardsPerSheet, cards.length);
        const sheetCards = cards.slice(startIdx, endIdx);

        // Create Side A (Questions)
        const sideA = createPrintPage(sheetCards, 'question', cardsPerSheet);
        printContainer.appendChild(sideA);

        // Create Side B (Answers - mirrored)
        const sideB = createPrintPage(sheetCards, 'answer', cardsPerSheet);
        printContainer.appendChild(sideB);
    }
}

function createPrintPage(cards, side, cardsPerSheet) {
    const page = document.createElement('div');
    page.className = 'print-page';

    const grid = document.createElement('div');
    grid.className = `cards-grid-${cardsPerSheet}`;

    // Determine grid layout
    const cols = 2;
    const rows = cardsPerSheet / cols;

    // Fill grid with cards
    for (let i = 0; i < cardsPerSheet; i++) {
        const card = document.createElement('div');
        card.className = 'card';

        if (i < cards.length) {
            const cardData = cards[i];
            const text = side === 'question' ? cardData.question : cardData.answer;
            card.textContent = text;

            // Auto-resize text
            setTimeout(() => autoResizeText(card), 10);
        } else {
            // Empty card
            card.textContent = '';
        }

        // Position card in grid
        if (side === 'answer') {
            // Mirror for answers
            const row = Math.floor(i / cols) + 1;
            const col = (i % cols === 0) ? 2 : 1;
            card.style.gridRow = row;
            card.style.gridColumn = col;
        }

        grid.appendChild(card);
    }

    page.appendChild(grid);
    return page;
}

// ===========================
// AUTO-RESIZE TEXT
// ===========================

function autoResizeText(element) {
    const text = element.textContent.trim();
    if (!text) {
        element.style.fontSize = '16pt';
        return;
    }

    let fontSize = text.length < 50 ? 20 : text.length < 150 ? 16 : 12;
    const minFontSize = 8;
    const maxFontSize = 28;

    let low = minFontSize;
    let high = Math.min(fontSize, maxFontSize);
    let bestFit = minFontSize;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        element.style.fontSize = mid + 'pt';

        const fits = element.scrollHeight <= element.clientHeight && 
                     element.scrollWidth <= element.clientWidth;

        if (fits) {
            bestFit = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    element.style.fontSize = bestFit + 'pt';

    // Final check
    let attempts = 0;
    while ((element.scrollHeight > element.clientHeight || 
            element.scrollWidth > element.clientWidth) && 
            bestFit > minFontSize && attempts < 20) {
        bestFit -= 0.5;
        element.style.fontSize = bestFit + 'pt';
        attempts++;
    }
}

// ===========================
// LOCALSTORAGE FUNCTIONS
// ===========================

function saveCards() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function loadCards() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            cards = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to load cards:', e);
            cards = [];
        }
    }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function updateCardCount() {
    const count = cards.length;
    cardCount.textContent = `${count} card${count !== 1 ? 's' : ''}`;
}

function clearInputs() {
    questionInput.value = '';
    answerInput.value = '';
    questionInput.focus();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleInputKeydown(e) {
    // Ctrl/Cmd + Enter to add card quickly
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (editingCardId) {
            updateCard();
        } else {
            addCard();
        }
    }
}

// Make functions globally accessible for onclick handlers
window.editCard = editCard;
window.deleteCard = deleteCard;