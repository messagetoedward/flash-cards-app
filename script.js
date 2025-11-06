// ===========================
// FLASH CARDS APP - WITH EDIT MODAL
// ===========================

const STORAGE_KEY = 'flashcards_data';
const MERGE_THRESHOLD = 450;

let cards = [];
let editingCardId = null;
let pendingCard = null;

// Main form elements
let questionInput, answerInput, addCardBtn, updateCardBtn, cancelEditBtn;
let questionCharCount, answerCharCount;
let cardList, cardCount, printAllBtn, clearAllBtn, cardsPerSheetSelect;
let gridContainer, sheetTabs, printContainer;
let mergeDialog, confirmMergeBtn, cancelMergeBtn, mergeDialogText;

// Edit modal elements
let editModal, editCardNumber;
let editQuestionInput, editAnswerInput;
let editQuestionCharCount, editAnswerCharCount;
let saveEditBtn, deleteFromEditBtn, cancelEditModalBtn, closeEditModal;

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    // Get main form elements
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

    // Main form event listeners
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

    // Initialize features
    initializeEditModal();
    initializeJsonImport();
    
    loadCards();
    renderCardList();
    updateCardCount();
    renderGridPreview();
});

// ===========================
// CHARACTER COUNTER
// ===========================
function updateCharCount() {
    const qLen = getTextLength(questionInput.value);
    const aLen = getTextLength(answerInput.value);
    
    questionCharCount.textContent = `${qLen} chars`;
    answerCharCount.textContent = `${aLen} chars`;
    
    questionCharCount.classList.toggle('warning', qLen > MERGE_THRESHOLD);
    answerCharCount.classList.toggle('warning', aLen > MERGE_THRESHOLD);
}

// ===========================
// CARD OPERATIONS
// ===========================
function checkAndAddCard() {
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();

    if (!question && !answer) {
        alert('⚠️ Please enter at least a question or answer!');
        return;
    }

    // Use text length without HTML tags for merge detection
    const qLen = getTextLength(question);
    const aLen = getTextLength(answer);
    const needsMerge = qLen > MERGE_THRESHOLD || aLen > MERGE_THRESHOLD;

    if (needsMerge) {
        pendingCard = {
            question: question || '(No question)',
            answer: answer || '(No answer)'
        };
        
        const maxChars = Math.max(qLen, aLen);
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

// ===========================
// EDIT MODAL FUNCTIONS
// ===========================
function initializeEditModal() {
    editModal = document.getElementById('editModal');
    editCardNumber = document.getElementById('editCardNumber');
    editQuestionInput = document.getElementById('editQuestionInput');
    editAnswerInput = document.getElementById('editAnswerInput');
    editQuestionCharCount = document.getElementById('editQuestionCharCount');
    editAnswerCharCount = document.getElementById('editAnswerCharCount');
    saveEditBtn = document.getElementById('saveEditBtn');
    deleteFromEditBtn = document.getElementById('deleteFromEditBtn');
    cancelEditModalBtn = document.getElementById('cancelEditModalBtn');
    closeEditModal = document.getElementById('closeEditModal');

    // Event listeners
    saveEditBtn.addEventListener('click', saveCardEdit);
    deleteFromEditBtn.addEventListener('click', () => {
        if (editingCardId) {
            deleteCard(editingCardId);
            closeEditModalWindow();
        }
    });
    cancelEditModalBtn.addEventListener('click', closeEditModalWindow);
    closeEditModal.addEventListener('click', closeEditModalWindow);

    // Character counters
    editQuestionInput.addEventListener('input', updateEditCharCount);
    editAnswerInput.addEventListener('input', updateEditCharCount);

    // Initialize formatting previews
    initializeFormatting(); // ADD THIS LINE

    // Close modal when clicking outside
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModalWindow();
        }
    });

    // Keyboard shortcut - ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editModal.classList.contains('show')) {
            closeEditModalWindow();
        }
    });
}

function editCard(id) {
    const card = cards.find(c => c.id === id);
    if (!card) return;

    editingCardId = id;

    // Find card number (1-indexed position in array)
    const cardIndex = cards.indexOf(card) + 1;
    editCardNumber.textContent = `Card #${cardIndex}`;

    // Populate inputs with raw text (including HTML tags)
    editQuestionInput.value = card.question === '(No question)' ? '' : card.question;
    editAnswerInput.value = card.answer === '(No answer)' ? '' : card.answer;

    // Update character counts and previews
    updateEditCharCount();
    updatePreview('question');
    updatePreview('answer');

    // Show modal
    editModal.classList.add('show');
    editQuestionInput.focus();
}

function saveCardEdit() {
    if (!editingCardId) return;

    const question = editQuestionInput.value.trim();
    const answer = editAnswerInput.value.trim();

    if (!question && !answer) {
        alert('⚠️ Please enter at least a question or answer!');
        return;
    }

    const cardIndex = cards.findIndex(c => c.id === editingCardId);
    if (cardIndex !== -1) {
        cards[cardIndex].question = question || '(No question)';
        cards[cardIndex].answer = answer || '(No answer)';
        
        // Re-check merge requirement using text length without HTML
        const qLen = getTextLength(question);
        const aLen = getTextLength(answer);
        const needsMerge = qLen > MERGE_THRESHOLD || aLen > MERGE_THRESHOLD;
        
        if (!needsMerge) {
            cards[cardIndex].mergeType = null;
        } else if (!cards[cardIndex].mergeType) {
            // Auto-apply merge if needed
            cards[cardIndex].mergeType = 'down';
        }
        
        saveCards();
        renderCardList();
        renderGridPreview();
    }

    closeEditModalWindow();
}

function closeEditModalWindow() {
    editModal.classList.remove('show');
    editingCardId = null;
    editQuestionInput.value = '';
    editAnswerInput.value = '';
    updateEditCharCount();
}

function updateEditCharCount() {
    const qLen = getTextLength(editQuestionInput.value);
    const aLen = getTextLength(editAnswerInput.value);
    
    editQuestionCharCount.textContent = `${qLen} chars`;
    editAnswerCharCount.textContent = `${aLen} chars`;
    
    editQuestionCharCount.classList.toggle('warning', qLen > MERGE_THRESHOLD);
    editAnswerCharCount.classList.toggle('warning', aLen > MERGE_THRESHOLD);
}

// ===========================
// RICH TEXT FORMATTING
// ===========================

function formatText(field, command, value = null) {
    const textarea = field === 'question' ? editQuestionInput : editAnswerInput;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (!selectedText && command !== 'alignLeft' && command !== 'alignCenter' && command !== 'alignRight') {
        alert('⚠️ Please select text first!');
        return;
    }
    
    let formattedText = '';
    
    switch (command) {
        case 'bold':
            formattedText = `<b>${selectedText}</b>`;
            break;
        case 'italic':
            formattedText = `<i>${selectedText}</i>`;
            break;
        case 'underline':
            formattedText = `<u>${selectedText}</u>`;
            break;
        case 'alignLeft':
            formattedText = `<div class="align-left">${selectedText || textarea.value}</div>`;
            if (!selectedText) {
                textarea.value = formattedText;
                updatePreview(field);
                return;
            }
            break;
        case 'alignCenter':
            formattedText = `<div class="align-center">${selectedText || textarea.value}</div>`;
            if (!selectedText) {
                textarea.value = formattedText;
                updatePreview(field);
                return;
            }
            break;
        case 'alignRight':
            formattedText = `<div class="align-right">${selectedText || textarea.value}</div>`;
            if (!selectedText) {
                textarea.value = formattedText;
                updatePreview(field);
                return;
            }
            break;
        case 'bulletList':
            const bulletItems = selectedText.split('\n').filter(line => line.trim());
            formattedText = '<ul>\n' + bulletItems.map(item => `  <li>${item.trim()}</li>`).join('\n') + '\n</ul>';
            break;
        case 'numberList':
            const numberItems = selectedText.split('\n').filter(line => line.trim());
            formattedText = '<ol>\n' + numberItems.map(item => `  <li>${item.trim()}</li>`).join('\n') + '\n</ol>';
            break;
        case 'color':
            formattedText = `<span style="color: ${value}">${selectedText}</span>`;
            break;
        default:
            return;
    }
    
    // Replace selected text with formatted version
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    textarea.value = beforeText + formattedText + afterText;
    
    // Update cursor position
    const newPosition = start + formattedText.length;
    textarea.setSelectionRange(newPosition, newPosition);
    
    // Update preview and character count
    updatePreview(field);
    updateEditCharCount();
    
    textarea.focus();
}

function clearFormatting(field) {
    const textarea = field === 'question' ? editQuestionInput : editAnswerInput;
    
    if (!confirm('🧹 Remove all formatting from this field?')) {
        return;
    }
    
    // Strip all HTML tags
    let cleanText = textarea.value;
    cleanText = cleanText.replace(/<[^>]*>/g, '');
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    textarea.value = cleanText;
    updatePreview(field);
    updateEditCharCount();
}

function updatePreview(field) {
    const textarea = field === 'question' ? editQuestionInput : editAnswerInput;
    const preview = document.getElementById(field === 'question' ? 'questionPreview' : 'answerPreview');
    
    // Render HTML safely (basic sanitization)
    let html = textarea.value;
    
    // Allow only safe tags
    const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'div', 'span', 'br'];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    preview.innerHTML = html;
}

// Initialize preview updates
function initializeFormatting() {
    editQuestionInput.addEventListener('input', () => updatePreview('question'));
    editAnswerInput.addEventListener('input', () => updatePreview('answer'));
}

// ===========================
// RENDER CARD LIST
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

    cardList.innerHTML = cards.map((card, index) => {
        // Preview text with basic formatting
        const questionPreview = card.question.includes('<') 
            ? card.question.replace(/<[^>]*>/g, ' ').substring(0, 100)
            : card.question.substring(0, 100);
        
        const answerPreview = card.answer.includes('<')
            ? card.answer.replace(/<[^>]*>/g, ' ').substring(0, 100)
            : card.answer.substring(0, 100);
        
        return `
            <div class="card-item ${card.mergeType ? 'merged' : ''}">
                <div class="card-number">${index + 1}</div>
                <div class="card-preview">
                    <div class="card-preview-question">${escapeHtml(questionPreview)}</div>
                    <div class="card-preview-answer">${escapeHtml(answerPreview)}</div>
                </div>
                ${card.mergeType ? `<span class="card-badge">Merged ${card.mergeType}</span>` : ''}
                <div class="card-actions">
                    <button class="btn-edit" onclick="editCard(${card.id})">✏️ Edit</button>
                    <button class="btn-delete" onclick="deleteCard(${card.id})">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
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
            cell.textContent = item.cardIndex;
            
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
// PRINT FUNCTIONS
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

        // Side A (Questions)
        const sideA = createPrintPage(sheetCards, 'question', cardsPerSheet, false);
        printContainer.appendChild(sideA);

        // Side B (Answers - mirrored)
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
    
    // Build full position map for ALL positions
    const gridPositions = Array(cardsPerSheet).fill(null);
    
    let position = 1;
    for (let card of sheetCards) {
        const gridIndex = position - 1;
        gridPositions[gridIndex] = { card, type: 'main' };
        
        if (card.mergeType === 'down') {
            const mergeIndex = position + 1;
            if (mergeIndex < cardsPerSheet) {
                gridPositions[mergeIndex] = { card, type: 'merged' };
            }
            position += 1;
        } else if (card.mergeType === 'right') {
            const mergeIndex = position;
            if (mergeIndex < cardsPerSheet) {
                gridPositions[mergeIndex] = { card, type: 'merged' };
            }
            position += 2;
        } else {
            position += 1;
        }
    }

    // Render ALL positions in order
    for (let i = 0; i < cardsPerSheet; i++) {
        const item = gridPositions[i];
        const cardEl = document.createElement('div');
        
        if (!item) {
            cardEl.className = 'card card-empty';
            cardEl.style.border = 'none';
        } else if (item.type === 'merged') {
            cardEl.className = 'card card-hidden';
            cardEl.style.display = 'none';
        } else {
            const card = item.card;
            cardEl.className = 'card';
            
            const text = side === 'question' ? card.question : card.answer;
            
            // Use innerHTML to preserve formatting, but handle plain text too
            if (text.includes('<')) {
                // Text contains HTML tags
                cardEl.innerHTML = text;
            } else {
                // Plain text - convert line breaks to <br>
                const formattedText = text.replace(/\n/g, '<br>');
                cardEl.innerHTML = formattedText;
            }
            
            if (card.mergeType === 'down') {
                cardEl.classList.add('span-down');
            } else if (card.mergeType === 'right') {
                cardEl.classList.add('span-right');
            }
            
            setTimeout(() => autoResizeText(cardEl), 10);
        }
        
        grid.appendChild(cardEl);
    }
    
    if (isMirrored) {
        grid.classList.add('mirrored');
    }

    page.appendChild(grid);
    return page;
}

// ===========================
// AUTO-RESIZE TEXT
// ===========================
function autoResizeText(element) {
    // Get text length - handle both HTML and plain text
    const textContent = element.textContent || element.innerText;
    const text = textContent.trim();
    
    if (!text || text.startsWith('(No ')) {
        element.style.fontSize = '14pt';
        return;
    }

    // Check if element has formatted content
    const hasFormatting = element.querySelector('ul, ol, div, br');
    
    if (hasFormatting) {
        // Use smaller fixed size for formatted content to prevent overflow
        if (element.querySelector('ul, ol')) {
            element.style.fontSize = '11pt';
        } else {
            element.style.fontSize = '12pt';
        }
        return;
    }

    // Original auto-resize logic for plain text
    let fontSize = text.length < 50 ? 18 : text.length < 150 ? 14 : 11;
    const minFontSize = 8;
    const maxFontSize = 22;

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

// ===========================
// JSON IMPORT FUNCTIONS
// ===========================
function initializeJsonImport() {
    const jsonInput = document.getElementById('jsonInput');
    const importJsonBtn = document.getElementById('importJsonBtn');
    const jsonFileInput = document.getElementById('jsonFileInput');

    importJsonBtn.addEventListener('click', () => {
        const jsonText = jsonInput.value.trim();
        if (!jsonText) {
            alert('⚠️ Please paste JSON data first!');
            return;
        }
        importFromJson(jsonText);
    });

    jsonFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const jsonText = event.target.result;
            importFromJson(jsonText);
        };
        reader.onerror = () => {
            alert('❌ Error reading file!');
        };
        reader.readAsText(file);
    });
}

function importFromJson(jsonText) {
    try {
        const data = JSON.parse(jsonText);
        
        if (!Array.isArray(data)) {
            throw new Error('JSON must be an array of card objects');
        }

        if (data.length === 0) {
            alert('⚠️ JSON array is empty!');
            return;
        }

        const validCards = [];
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            
            if (!item.question && !item.answer) {
                console.warn(`Skipping card ${i + 1}: No question or answer`);
                continue;
            }

            const card = {
                id: Date.now() + i,
                question: item.question || '(No question)',
                answer: item.answer || '(No answer)',
                mergeType: item.mergeType || null,
                createdAt: new Date().toISOString()
            };

            if (!card.mergeType) {
                const qLen = getTextLength(card.question);
                const aLen = getTextLength(card.answer);
                const maxLength = Math.max(qLen, aLen);
                
                if (maxLength > MERGE_THRESHOLD) {
                    card.mergeType = 'down';
                }
            }

            validCards.push(card);
        }

        if (validCards.length === 0) {
            alert('⚠️ No valid cards found in JSON!');
            return;
        }

        const confirmMsg = `📥 Import ${validCards.length} card${validCards.length !== 1 ? 's' : ''}?\n\nThis will add to your existing cards.`;
        if (!confirm(confirmMsg)) {
            return;
        }

        cards.push(...validCards);
        
        saveCards();
        renderCardList();
        updateCardCount();
        renderGridPreview();

        document.getElementById('jsonInput').value = '';
        document.getElementById('jsonFileInput').value = '';

        alert(`✅ Successfully imported ${validCards.length} card${validCards.length !== 1 ? 's' : ''}!`);
        
        cardList.scrollTop = cardList.scrollHeight;

    } catch (error) {
        console.error('JSON Import Error:', error);
        alert(`❌ Invalid JSON format!\n\nError: ${error.message}\n\nPlease check the format guide below.`);
    }
}

// ===========================
// LOCALSTORAGE
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

// ===========================
// HELPER FUNCTIONS
// ===========================

function getTextLength(text) {
    // Strip HTML tags for accurate character count
    const temp = document.createElement('div');
    temp.innerHTML = text;
    return (temp.textContent || temp.innerText || '').length;
}

// Make functions globally accessible for onclick handlers
window.editCard = editCard;
window.deleteCard = deleteCard;

// Make formatting functions globally accessible
window.formatText = formatText;
window.clearFormatting = clearFormatting;