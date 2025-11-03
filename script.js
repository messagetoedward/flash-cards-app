// ===========================
// FLASH CARDS APP - FINAL FIX
// ===========================

const STORAGE_KEY = 'flashcards_data';
const MERGE_THRESHOLD = 450;

let cards = [];
let editingCardId = null;
let pendingCard = null;

let questionInput, answerInput, addCardBtn, updateCardBtn, cancelEditBtn;
let questionCharCount, answerCharCount;
let cardList, cardCount, printAllBtn, clearAllBtn, cardsPerSheetSelect;
let gridContainer, sheetTabs, printContainer;
let mergeDialog, confirmMergeBtn, cancelMergeBtn, mergeDialogText;

document.addEventListener('DOMContentLoaded', function() {
    questionInput = document.getElementById('questionInput');
    answerInput = document.getElementById('answerInput');
    addCardBtn = document.getElementById('addCardBtn');
    updateCardBtn = document.getElementById('updateCardBtn');
    cancelEditBtn = document.getElementById('cancelEditBtn');
    questionCharCount = document.getElementById('questionCharCount');
    answerCharCount = document.getElementById('answerCharCount');
    cardList = document.getElementById('cardList');
    cardCount = document.getElementById('cardCount');
    printAllBtn = document.getElementById('printAllBtn');
    clearAllBtn = document.getElementById('clearAllBtn');
    cardsPerSheetSelect = document.getElementById('cardsPerSheet');
    gridContainer = document.getElementById('gridContainer');
    sheetTabs = document.getElementById('sheetTabs');
    printContainer = document.getElementById('printContainer');
    mergeDialog = document.getElementById('mergeDialog');
    confirmMergeBtn = document.getElementById('confirmMergeBtn');
    cancelMergeBtn = document.getElementById('cancelMergeBtn');
    mergeDialogText = document.getElementById('mergeDialogText');

    addCardBtn.addEventListener('click', checkAndAddCard);
    updateCardBtn.addEventListener('click', updateCard);
    cancelEditBtn.addEventListener('click', cancelEdit);
    printAllBtn.addEventListener('click', printAllCards);
    clearAllBtn.addEventListener('click', clearAllCards);
    cardsPerSheetSelect.addEventListener('change', () => {
        updateCardCount();
        renderGridPreview();
    });
    confirmMergeBtn.addEventListener('click', confirmMerge);
    cancelMergeBtn.addEventListener('click', () => {
        mergeDialog.classList.remove('show');
        pendingCard = null;
    });

    questionInput.addEventListener('input', updateCharCount);
    answerInput.addEventListener('input', updateCharCount);
    questionInput.addEventListener('keydown', handleInputKeydown);
    answerInput.addEventListener('keydown', handleInputKeydown);

    loadCards();
    renderCardList();
    updateCardCount();
    renderGridPreview();
});

function updateCharCount() {
    const qLen = questionInput.value.length;
    const aLen = answerInput.value.length;
    
    questionCharCount.textContent = `${qLen} chars`;
    answerCharCount.textContent = `${aLen} chars`;
    
    questionCharCount.classList.toggle('warning', qLen > MERGE_THRESHOLD);
    answerCharCount.classList.toggle('warning', aLen > MERGE_THRESHOLD);
}

function checkAndAddCard() {
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();

    if (!question && !answer) {
        alert('⚠️ Please enter at least a question or answer!');
        return;
    }

    const needsMerge = question.length > MERGE_THRESHOLD || answer.length > MERGE_THRESHOLD;

    if (needsMerge) {
        pendingCard = {
            question: question || '(No question)',
            answer: answer || '(No answer)'
        };
        
        const maxChars = Math.max(question.length, answer.length);
        mergeDialogText.innerHTML = `This card has <strong>${maxChars} characters</strong> and needs 2 cell positions.`;
        mergeDialog.classList.add('show');
    } else {
        addCard(null);
    }
}

function confirmMerge() {
    const selectedMerge = document.querySelector('input[name="mergeType"]:checked').value;
    mergeDialog.classList.remove('show');
    addCard(selectedMerge === 'none' ? null : selectedMerge);
}

function addCard(mergeType) {
    const question = pendingCard ? pendingCard.question : (questionInput.value.trim() || '(No question)');
    const answer = pendingCard ? pendingCard.answer : (answerInput.value.trim() || '(No answer)');

    const card = {
        id: Date.now(),
        question: question,
        answer: answer,
        mergeType: mergeType,
        createdAt: new Date().toISOString()
    };

    cards.push(card);
    saveCards();
    renderCardList();
    updateCardCount();
    renderGridPreview();
    clearInputs();
    pendingCard = null;
    
    cardList.scrollTop = cardList.scrollHeight;
}

function editCard(id) {
    const card = cards.find(c => c.id === id);
    if (!card) return;

    questionInput.value = card.question === '(No question)' ? '' : card.question;
    answerInput.value = card.answer === '(No answer)' ? '' : card.answer;

    editingCardId = id;
    addCardBtn.style.display = 'none';
    updateCardBtn.style.display = 'inline-flex';
    cancelEditBtn.style.display = 'inline-flex';

    questionInput.focus();
    updateCharCount();
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
        
        const needsMerge = question.length > MERGE_THRESHOLD || answer.length > MERGE_THRESHOLD;
        if (!needsMerge) {
            cards[cardIndex].mergeType = null;
        }
        
        saveCards();
        renderCardList();
        renderGridPreview();
    }

    cancelEdit();
}

function deleteCard(id) {
    if (!confirm('🗑️ Delete this card?')) return;

    cards = cards.filter(c => c.id !== id);
    saveCards();
    renderCardList();
    updateCardCount();
    renderGridPreview();
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
    renderGridPreview();
}

function cancelEdit() {
    editingCardId = null;
    clearInputs();
    addCardBtn.style.display = 'inline-flex';
    updateCardBtn.style.display = 'none';
    cancelEditBtn.style.display = 'none';
}

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
        <div class="card-item ${card.mergeType ? 'merged' : ''}">
            <div class="card-number">${index + 1}</div>
            <div class="card-preview">
                <div class="card-preview-question">${escapeHtml(card.question)}</div>
                <div class="card-preview-answer">${escapeHtml(card.answer)}</div>
            </div>
            ${card.mergeType ? `<span class="card-badge">Merged ${card.mergeType}</span>` : ''}
            <div class="card-actions">
                <button class="btn-edit" onclick="editCard(${card.id})">✏️ Edit</button>
                <button class="btn-delete" onclick="deleteCard(${card.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ===========================
// GRID PREVIEW
// ===========================
function renderGridPreview() {
    const cardsPerSheet = parseInt(cardsPerSheetSelect.value);
    const layoutInfo = calculateLayout(cards, cardsPerSheet);
    const totalSheets = layoutInfo.totalSheets;

    // Render tabs
    sheetTabs.innerHTML = Array.from({ length: totalSheets }, (_, i) => 
        `<button class="sheet-tab ${i === 0 ? 'active' : ''}" data-sheet="${i}">Sheet ${i + 1}</button>`
    ).join('');

    // Render first sheet
    renderSheetGrid(0, cardsPerSheet, layoutInfo);

    // Tab listeners
    document.querySelectorAll('.sheet-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            const sheetNum = parseInt(e.target.dataset.sheet);
            renderSheetGrid(sheetNum, cardsPerSheet, layoutInfo);
        });
    });
}

function calculateLayout(cards, cardsPerSheet) {
    const sheets = [];
    let currentSheet = [];
    let positionsUsed = 0;

    for (let card of cards) {
        const positionsNeeded = card.mergeType ? 2 : 1;
        
        if (positionsUsed + positionsNeeded > cardsPerSheet) {
            sheets.push(currentSheet);
            currentSheet = [];
            positionsUsed = 0;
        }
        
        currentSheet.push(card);
        positionsUsed += positionsNeeded;
    }
    
    if (currentSheet.length > 0) {
        sheets.push(currentSheet);
    }

    return {
        sheets: sheets,
        totalSheets: sheets.length || 1
    };
}

function renderSheetGrid(sheetNum, cardsPerSheet, layoutInfo) {
    const rows = cardsPerSheet / 2;
    const sheetCards = layoutInfo.sheets[sheetNum] || [];

    gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    gridContainer.innerHTML = '';

    // Build position map
    let position = 1;
    const positionMap = {};

    for (let card of sheetCards) {
        const cardIndex = cards.indexOf(card) + 1;
        positionMap[position] = { card, cardIndex };
        
        if (card.mergeType === 'down') {
            positionMap[position + 2] = { isMerged: true };
            position += 1;
        } else if (card.mergeType === 'right') {
            positionMap[position + 1] = { isMerged: true };
            position += 2;
        } else {
            position += 1;
        }
    }

    // Render only used positions
    const maxPosition = Math.max(...Object.keys(positionMap).map(Number));
    
    for (let i = 1; i <= maxPosition; i++) {
        const item = positionMap[i];
        
        if (!item) {
            // Empty
            const cell = document.createElement('div');
            cell.className = 'grid-cell empty';
            cell.textContent = i;
            gridContainer.appendChild(cell);
        } else if (item.isMerged) {
            // Skip
            continue;
        } else {
            // Card
            const cell = document.createElement('div');
            cell.className = `grid-cell ${item.card.mergeType ? 'merged' : 'occupied'}`;
            cell.textContent = item.cardIndex; // Use actual card number
            
            if (item.card.mergeType === 'down') {
                cell.style.gridRow = 'span 2';
            } else if (item.card.mergeType === 'right') {
                cell.style.gridColumn = 'span 2';
            }
            
            gridContainer.appendChild(cell);
        }
    }
}

// ===========================
// PRINT
// ===========================
function printAllCards() {
    if (cards.length === 0) {
        alert('⚠️ No cards to print!');
        return;
    }

    const cardsPerSheet = parseInt(cardsPerSheetSelect.value);
    generatePrintPages(cardsPerSheet);

    setTimeout(() => window.print(), 200);
}

function generatePrintPages(cardsPerSheet) {
    printContainer.innerHTML = '';
    const layoutInfo = calculateLayout(cards, cardsPerSheet);

    for (let sheetNum = 0; sheetNum < layoutInfo.sheets.length; sheetNum++) {
        const sheetCards = layoutInfo.sheets[sheetNum];

        // Side A
        const sideA = createPrintPage(sheetCards, 'question', cardsPerSheet, false);
        printContainer.appendChild(sideA);

        // Side B (mirrored)
        const sideB = createPrintPage(sheetCards, 'answer', cardsPerSheet, true);
        printContainer.appendChild(sideB);
    }
}

function createPrintPage(sheetCards, side, cardsPerSheet, isMirrored) {
    const page = document.createElement('div');
    page.className = 'print-page';

    const grid = document.createElement('div');
    grid.className = `cards-grid cards-grid-${cardsPerSheet}`;

    const cols = 2;
    
    // Build full position map for ALL 8 positions
    const gridPositions = Array(cardsPerSheet).fill(null);
    
    let position = 1;
    for (let card of sheetCards) {
        const gridIndex = position - 1; // Convert to 0-based array index
        gridPositions[gridIndex] = { card, type: 'main' };
        
        if (card.mergeType === 'down') {
            // Mark position 2 rows down as part of this merge
            const mergeIndex = position + 1; // +2 positions, but -1 for 0-based = +1
            if (mergeIndex < cardsPerSheet) {
                gridPositions[mergeIndex] = { card, type: 'merged' };
            }
            position += 1; // Move to next available position
        } else if (card.mergeType === 'right') {
            // Mark next position as part of this merge
            const mergeIndex = position; // Next position (0-based)
            if (mergeIndex < cardsPerSheet) {
                gridPositions[mergeIndex] = { card, type: 'merged' };
            }
            position += 2; // Skip both positions
        } else {
            position += 1;
        }
    }

    // Render ALL positions in order
    for (let i = 0; i < cardsPerSheet; i++) {
        const item = gridPositions[i];
        const cardEl = document.createElement('div');
        
        if (!item) {
            // Empty position
            cardEl.className = 'card card-empty';
            cardEl.style.border = 'none';
        } else if (item.type === 'merged') {
            // Hidden merged cell
            cardEl.className = 'card card-hidden';
            cardEl.style.display = 'none';
        } else {
            // Main card
            const card = item.card;
            cardEl.className = 'card';
            
            const text = side === 'question' ? card.question : card.answer;
            cardEl.textContent = text;
            
            // Apply span classes
            if (card.mergeType === 'down') {
                cardEl.classList.add('span-down');
            } else if (card.mergeType === 'right') {
                cardEl.classList.add('span-right');
            }
            
            setTimeout(() => autoResizeText(cardEl), 10);
        }
        
        grid.appendChild(cardEl);
    }
    
    // Apply mirror class to grid if needed
    if (isMirrored) {
        grid.classList.add('mirrored');
    }

    page.appendChild(grid);
    return page;
}

function autoResizeText(element) {
    const text = element.textContent.trim();
    if (!text || text.startsWith('(No ')) {
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

    let attempts = 0;
    while ((element.scrollHeight > element.clientHeight || 
            element.scrollWidth > element.clientWidth) && 
            bestFit > minFontSize && attempts < 20) {
        bestFit -= 0.5;
        element.style.fontSize = bestFit + 'pt';
        attempts++;
    }
}

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

function updateCardCount() {
    const count = cards.length;
    cardCount.textContent = `${count} card${count !== 1 ? 's' : ''}`;
}

function clearInputs() {
    questionInput.value = '';
    answerInput.value = '';
    questionInput.focus();
    updateCharCount();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleInputKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (editingCardId) {
            updateCard();
        } else {
            checkAndAddCard();
        }
    }
}

window.editCard = editCard;
window.deleteCard = deleteCard;