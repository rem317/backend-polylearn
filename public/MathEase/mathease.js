// MathEase JavaScript - Lesson 1 Only
// Connected to MySQL Database (same as PolyLearn)
// An Interactive Learning Application on Basic Mathematical Operations and Introductory Statistics
// Alitagtag College Inc. - Grade 10

// ============================================
// MATHBASE CONSTANTS - FORCE LESSON_ID = 1
// ============================================
const MATHEASE_LESSON_ID = 1; // Fixed for MathEase only

// API Base URL - same as PolyLearn
const API_BASE_URL = 'https://backend-polylearn-production.up.railway.app';

// ============================================
// APPLICATION STATE
// ============================================
let authToken = localStorage.getItem('authToken') || null;

const AppState = {
    currentUser: null,
    currentPage: 'loading',
    isAuthenticated: false,
    previousPage: null
};

// Lesson 1 State - Fixed for Lesson 1 only
const LessonState = {
    lessons: [],
    currentLesson: null,
    userProgress: {},
    continueLearningLesson: null,
    currentTopic: null
};

// Practice Exercises State - For Lesson 1 only
const PracticeState = {
    currentTopic: null,
    currentExercise: null,
    exercises: [],
    timer: 300,
    timerInterval: null,
    isExerciseActive: false,
    isReviewMode: false,
    userPracticeProgress: {}
};

// Quiz System State
const QuizSystem = {
    currentQuiz: null,
    currentAttemptId: null,
    questions: [],
    currentIndex: 0,
    userAnswers: {},
    startTime: null,
    timerInterval: null,
    timeLeft: 0,
    totalTime: 0,
    stats: {
        correct: 0,
        wrong: 0,
        score: 0
    },
    submittedAnswers: {},
    answerResults: {}
};

// Progress State
const ProgressState = {
    dailyProgress: null,
    cumulativeProgress: null,
    topicMastery: {},
    activityLog: []
};

// ============================================
// LESSON 1 TOPICS DATA (For display when database is empty)
// ============================================
const LESSON_1_TOPICS = [
    { id: 1, name: 'Addition', description: 'Adding whole numbers and decimals', exercises: 3, icon: 'fa-plus-circle' },
    { id: 2, name: 'Subtraction', description: 'Subtraction techniques', exercises: 3, icon: 'fa-minus-circle' },
    { id: 3, name: 'Multiplication', description: 'Multiplication tables and methods', exercises: 3, icon: 'fa-times-circle' },
    { id: 4, name: 'Division', description: 'Division with remainders', exercises: 2, icon: 'fa-divide' },
    { id: 5, name: 'Order of Operations', description: 'PEMDAS', exercises: 1, icon: 'fa-sort-amount-up' }
];

// ============================================
// API HELPER FUNCTIONS (same as PolyLearn)
// ============================================
async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
    };
    
    const token = localStorage.getItem('authToken') || authToken;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, { ...options, headers });
        
        if (!response.ok) {
            const text = await response.text();
            console.error(`API Error (${response.status}):`, text.substring(0, 200));
            throw new Error(`API returned ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.warn('Non-JSON response:', text.substring(0, 100));
            return { success: true, data: text };
        }
        
        return await response.json();
        
    } catch (error) {
        console.error(`API Request Failed: ${url}`, error);
        return { success: false, error: error.message };
    }
}

// ============================================
// FILTER FUNCTIONS - FORCE LESSON_ID = 1
// ============================================

function getCurrentLessonId() {
    return MATHEASE_LESSON_ID; // Always 1 for MathEase
}

function addLessonFilterToUrl(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}lesson_id=${MATHEASE_LESSON_ID}`;
}

// ============================================
// TOOL MANAGER (same as PolyLearn)
// ============================================
class ToolManager {
    constructor() {
        this.tools = {};
        this.currentTool = null;
        this.modalsContainer = document.getElementById('toolModalsContainer');
        
        if (!this.modalsContainer) {
            this.modalsContainer = document.createElement('div');
            this.modalsContainer.id = 'toolModalsContainer';
            document.body.appendChild(this.modalsContainer);
        }
        
        this.init();
    }

    init() {
        this.initializeTools();
        this.setupEventListeners();
    }

    initializeTools() {
        this.tools = {
            calculator: new Calculator(),
            graph: new GraphTool(),
            whiteboard: new Whiteboard(),
            notepad: new Notepad(),
            formula: new FormulaSheet(),
            timer: new StudyTimer()
        };
    }

    setupEventListeners() {
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeTool();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTool();
            }
        });
    }

    openTool(toolName) {
        this.closeTool();
        
        const modal = document.getElementById(`${toolName}Modal`);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            this.currentTool = toolName;
            
            if (this.tools[toolName] && typeof this.tools[toolName].onOpen === 'function') {
                setTimeout(() => {
                    try {
                        this.tools[toolName].onOpen();
                    } catch (e) {
                        console.error(`Error opening ${toolName}:`, e);
                    }
                }, 100);
            }
            return true;
        }
        return false;
    }

    closeTool() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('active');
        });
        this.currentTool = null;
    }

    // Timer bridge methods
    startTimer() {
        if (this.tools && this.tools.timer) {
            this.tools.timer.start();
        }
    }

    pauseTimer() {
        if (this.tools && this.tools.timer) {
            this.tools.timer.pause();
        }
    }

    resetTimer() {
        if (this.tools && this.tools.timer) {
            this.tools.timer.reset();
        }
    }
}

// ============================================
// CALCULATOR TOOL
// ============================================
class Calculator {
    constructor() {
        this.display = '0';
        this.history = [];
        this.expression = '';
    }

    onOpen() {
        this.display = '0';
        this.expression = '';
        this.renderButtons();
        this.loadHistory();
    }

    renderButtons() {
        const buttons = [
            ['C', '⌫', '%', '÷'],
            ['7', '8', '9', '×'],
            ['4', '5', '6', '-'],
            ['1', '2', '3', '+'],
            ['00', '0', '.', '=']
        ];

        const buttonsHtml = buttons.map(row => 
            row.map(btn => {
                let className = 'calc-btn';
                if (['+', '-', '×', '÷', '%'].includes(btn)) className += ' operator';
                if (btn === '=') className += ' equals';
                if (btn === 'C') className += ' clear';
                
                return `<button class="${className}" data-value="${btn}">${btn}</button>`;
            }).join('')
        ).join('');

        const buttonsContainer = document.getElementById('calcButtons');
        if (buttonsContainer) {
            buttonsContainer.innerHTML = buttonsHtml;
            
            buttonsContainer.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = btn.getAttribute('data-value');
                    this.handleButton(value);
                });
            });
        }
        
        this.updateDisplay();
    }

    handleButton(btn) {
        switch(btn) {
            case 'C':
                this.display = '0';
                this.expression = '';
                break;
            case '⌫':
                if (this.display.length > 1) {
                    this.display = this.display.slice(0, -1);
                } else {
                    this.display = '0';
                }
                break;
            case '=':
                this.calculate();
                break;
            case '÷':
                this.addToExpression('/');
                break;
            case '×':
                this.addToExpression('*');
                break;
            default:
                this.addToExpression(btn);
        }
        this.updateDisplay();
    }

    addToExpression(value) {
        if (this.display === '0' && !isNaN(value)) {
            this.display = value;
        } else {
            this.display += value;
        }
    }

    calculate() {
        try {
            let expression = this.display
                .replace(/÷/g, '/')
                .replace(/×/g, '*');
            
            if (!expression || expression.match(/^[+\-*/]+$/)) {
                return;
            }
            
            let result = eval(expression);
            
            if (result.toString().includes('.')) {
                result = Math.round(result * 1000000) / 1000000;
            }
            
            this.history.unshift({
                expression: this.display,
                result: result,
                timestamp: new Date().toLocaleTimeString()
            });
            
            if (this.history.length > 10) {
                this.history.pop();
            }
            
            this.display = result.toString();
            this.updateHistory();
            
        } catch (error) {
            this.display = 'Error';
            setTimeout(() => {
                this.display = '0';
                this.updateDisplay();
            }, 1500);
        }
    }

    updateDisplay() {
        const displayEl = document.getElementById('calcDisplay');
        if (displayEl) {
            displayEl.textContent = this.display;
        }
    }

    loadHistory() {
        const saved = localStorage.getItem('mathEase_calcHistory');
        if (saved) {
            try {
                this.history = JSON.parse(saved);
            } catch (e) {}
        }
    }

    updateHistory() {
        const historyEl = document.getElementById('calcHistory');
        if (!historyEl) return;

        localStorage.setItem('mathEase_calcHistory', JSON.stringify(this.history));

        if (this.history.length === 0) {
            historyEl.innerHTML = '<div class="history-empty">No calculations yet</div>';
            return;
        }

        historyEl.innerHTML = this.history.map(item => `
            <div class="history-item" onclick="window.toolManager.tools.calculator.useHistory('${item.expression}')">
                <div class="history-expression">${item.expression} =</div>
                <div class="history-result">${item.result}</div>
                <div class="history-time">${item.timestamp}</div>
            </div>
        `).join('');
    }

    useHistory(expression) {
        this.display = expression;
        this.updateDisplay();
    }
}

// ============================================
// GRAPH TOOL
// ============================================
class GraphTool {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.expression = 'x^2';
        this.range = { min: -5, max: 5 };
        this.points = [];
    }

    onOpen() {
        setTimeout(() => {
            this.canvas = document.getElementById('graphCanvas');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.setupCanvas();
                this.drawGrid();
                this.plotFunction();
            }
        }, 100);
    }

    setupCanvas() {
        this.canvas.width = this.canvas.offsetWidth || 600;
        this.canvas.height = this.canvas.offsetHeight || 400;
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#8B0000';
    }

    drawGrid() {
        if (!this.ctx || !this.canvas) return;
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, w, h);
        
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= w; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= h; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(w/2, 0);
        this.ctx.lineTo(w/2, h);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, h/2);
        this.ctx.lineTo(w, h/2);
        this.ctx.stroke();
    }

    plotFunction() {
        if (!this.ctx || !this.canvas) return;
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        this.drawGrid();
        
        this.ctx.strokeStyle = '#8B0000';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        let first = true;
        for (let px = 0; px <= w; px++) {
            const x = (px - w/2) / 50;
            let y;
            try {
                y = eval(this.expression.replace(/\^/g, '**'));
            } catch (e) {
                continue;
            }
            const py = h/2 - y * 50;
            
            if (py >= 0 && py <= h) {
                if (first) {
                    this.ctx.moveTo(px, py);
                    first = false;
                } else {
                    this.ctx.lineTo(px, py);
                }
            } else {
                first = true;
            }
        }
        
        this.ctx.stroke();
    }

    clear() {
        this.drawGrid();
    }
}

// ============================================
// WHITEBOARD TOOL
// ============================================
class Whiteboard {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.drawing = false;
        this.currentTool = 'pen';
        this.color = '#8B0000';
        this.lineWidth = 2;
        this.lastX = 0;
        this.lastY = 0;
    }

    onOpen() {
        setTimeout(() => this.setupCanvas(), 100);
    }

    setupCanvas() {
        this.canvas = document.getElementById('whiteboardCanvas');
        
        if (this.canvas) {
            const container = this.canvas.parentElement;
            if (container) {
                this.canvas.width = container.clientWidth - 40;
                this.canvas.height = container.clientHeight - 100;
            } else {
                this.canvas.width = 600;
                this.canvas.height = 400;
            }
            
            this.ctx = this.canvas.getContext('2d');
            
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        if (!this.canvas || !this.ctx) return;
        
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                this.color = e.target.value;
                if (this.currentTool === 'pen' && this.ctx) {
                    this.ctx.strokeStyle = this.color;
                }
            });
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (!this.ctx || !this.canvas) return;
        
        const touch = e.touches[0];
        if (!touch) return;
        
        this.drawing = true;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.lastX = (touch.clientX - rect.left) * scaleX;
        this.lastY = (touch.clientY - rect.top) * scaleY;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.drawing || !this.ctx || !this.canvas) return;
        
        const touch = e.touches[0];
        if (!touch) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const currentX = (touch.clientX - rect.left) * scaleX;
        const currentY = (touch.clientY - rect.top) * scaleY;
        
        if (this.currentTool === 'pen') {
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();
        } else if (this.currentTool === 'eraser') {
            this.ctx.save();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 20;
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();
            this.ctx.restore();
            
            if (this.ctx) {
                this.ctx.strokeStyle = this.color;
                this.ctx.lineWidth = this.lineWidth;
            }
        }
        
        this.lastX = currentX;
        this.lastY = currentY;
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.drawing = false;
        if (this.ctx) {
            this.ctx.closePath();
        }
    }

    startDrawing(e) {
        if (!this.ctx || !this.canvas) return;
        
        this.drawing = true;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.lastX = (e.clientX - rect.left) * scaleX;
        this.lastY = (e.clientY - rect.top) * scaleY;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
    }

    draw(e) {
        if (!this.drawing || !this.ctx || !this.canvas) return;
        
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const currentX = (e.clientX - rect.left) * scaleX;
        const currentY = (e.clientY - rect.top) * scaleY;
        
        if (this.currentTool === 'pen') {
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();
        } else if (this.currentTool === 'eraser') {
            this.ctx.save();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 20;
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();
            this.ctx.restore();
            
            if (this.ctx) {
                this.ctx.strokeStyle = this.color;
                this.ctx.lineWidth = this.lineWidth;
            }
        }
        
        this.lastX = currentX;
        this.lastY = currentY;
    }

    stopDrawing() {
        this.drawing = false;
        if (this.ctx) {
            this.ctx.closePath();
        }
    }

    setTool(tool) {
        this.currentTool = tool;
        
        if (tool === 'pen') {
            this.lineWidth = 2;
            if (this.ctx) {
                this.ctx.strokeStyle = this.color;
                this.ctx.lineWidth = this.lineWidth;
            }
        } else if (tool === 'eraser') {
            this.lineWidth = 20;
            if (this.ctx) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = this.lineWidth;
            }
        }
    }

    clear() {
        if (!this.ctx || !this.canvas) return;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.drawing = false;
    }
}

// ============================================
// NOTEPAD TOOL
// ============================================
class Notepad {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('mathEase_notes') || '[]');
    }

    onOpen() {
        this.loadNotes();
    }

    save() {
        const title = document.getElementById('noteTitle').value || 'MathEase Note';
        const content = document.getElementById('noteContent').value;
        
        if (!content) {
            alert('Please write something before saving!');
            return;
        }

        const note = {
            id: Date.now(),
            title: title,
            content: content,
            created: new Date().toLocaleString()
        };

        this.notes.unshift(note);
        localStorage.setItem('mathEase_notes', JSON.stringify(this.notes));
        
        alert('Note saved!');
        this.clear();
    }

    loadNotes() {
        // Optional: Display recent notes
    }

    clear() {
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
    }
}

// ============================================
// FORMULA SHEET TOOL
// ============================================
class FormulaSheet {
    constructor() {
        this.formulas = {
            addition: [
                { name: 'Addition', formula: 'a + b = c' },
                { name: 'Commutative Property', formula: 'a + b = b + a' }
            ],
            subtraction: [
                { name: 'Subtraction', formula: 'a - b = c' },
                { name: 'Zero Property', formula: 'a - 0 = a' }
            ],
            multiplication: [
                { name: 'Multiplication', formula: 'a × b = c' },
                { name: 'Multiplication Table', formula: '7 × 8 = 56' }
            ],
            division: [
                { name: 'Division', formula: 'a ÷ b = c' },
                { name: 'Division with Remainder', formula: 'a = b × c + r' }
            ],
            pemdas: [
                { name: 'Order of Operations', formula: 'PEMDAS: Parentheses, Exponents, Multiplication, Division, Addition, Subtraction' }
            ]
        };
    }

    onOpen() {
        this.showCategory('addition');
    }

    showCategory(category) {
        const formulas = this.formulas[category] || [];
        const listEl = document.getElementById('formulaList');
        
        if (!listEl) return;
        
        listEl.innerHTML = formulas.map(f => `
            <div class="formula-item">
                <div class="formula-name">${f.name}</div>
                <div class="formula-expression">${f.formula}</div>
            </div>
        `).join('');
    }
}

// ============================================
// STUDY TIMER TOOL
// ============================================
class StudyTimer {
    constructor() {
        this.timeLeft = 25 * 60;
        this.initialTime = 25 * 60;
        this.timerId = null;
        this.isRunning = false;
        this.timerElement = null;
    }

    onOpen() {
        this.timeLeft = this.initialTime;
        this.isRunning = false;
        
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        
        this.findTimerElement();
    }

    findTimerElement() {
        this.timerElement = document.getElementById('timerDisplay');
        if (this.timerElement) {
            this.updateDisplay();
            this.attachEventListeners();
        } else {
            setTimeout(() => this.findTimerElement(), 100);
        }
    }

    updateDisplay() {
        if (!this.timerElement) {
            this.timerElement = document.getElementById('timerDisplay');
        }
        
        if (this.timerElement) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    attachEventListeners() {
        const startBtn = document.getElementById('timerStartBtn');
        const pauseBtn = document.getElementById('timerPauseBtn');
        const resetBtn = document.getElementById('timerResetBtn');
        
        if (startBtn) {
            startBtn.onclick = (e) => {
                e.preventDefault();
                this.start();
            };
        }
        
        if (pauseBtn) {
            pauseBtn.onclick = (e) => {
                e.preventDefault();
                this.pause();
            };
        }
        
        if (resetBtn) {
            resetBtn.onclick = (e) => {
                e.preventDefault();
                this.reset();
            };
        }
    }

    start() {
        if (!this.isRunning && this.timeLeft > 0) {
            this.isRunning = true;
            this.updateDisplay();
            
            this.timerId = setInterval(() => {
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                    this.updateDisplay();
                    
                    if (this.timeLeft <= 0) {
                        this.complete();
                    }
                }
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            clearInterval(this.timerId);
            this.isRunning = false;
            this.timerId = null;
        }
        this.updateDisplay();
    }

    reset() {
        this.pause();
        this.timeLeft = this.initialTime;
        this.updateDisplay();
    }

    setTime(minutes) {
        this.pause();
        this.initialTime = minutes * 60;
        this.timeLeft = this.initialTime;
        this.updateDisplay();
    }

    complete() {
        this.pause();
        alert('Study session complete! Great job!');
        this.reset();
    }
}

// ============================================
// INITIALIZE TOOL MANAGER
// ============================================
window.toolManager = new ToolManager();

// ============================================
// CONNECT TOOL BUTTONS
// ============================================
function connectToolButtons() {
    const tools = [
        { id: 'openCalculator', name: 'calculator' },
        { id: 'openGraphTools', name: 'graph' },
        { id: 'openNotepad', name: 'notepad' },
        { id: 'openFormulaSheet', name: 'formula' },
        { id: 'openWhiteboard', name: 'whiteboard' },
        { id: 'openTimer', name: 'timer' }
    ];
    
    if (!window.toolManager) {
        window.toolManager = new ToolManager();
    }
    
    tools.forEach(tool => {
        const btn = document.getElementById(tool.id);
        if (btn) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!window.toolManager) {
                    window.toolManager = new ToolManager();
                }
                
                window.toolManager.openTool(tool.name);
            });
        }
    });
    
    document.querySelectorAll('[data-tool]').forEach(btn => {
        const toolName = btn.getAttribute('data-tool');
        if (toolName) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!window.toolManager) {
                    window.toolManager = new ToolManager();
                }
                
                window.toolManager.openTool(toolName);
            });
        }
    });
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function initApp() {
    console.log('MathEase Application Initializing - Lesson 1 Only');
    
    localStorage.removeItem('mathEase_user');
    
    AppState.currentUser = null;
    AppState.isAuthenticated = false;
    authToken = null;
    
    setupLoginForm();
    setupSignupForm();
    
    document.getElementById('switchToSignup')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('signup');
    });
    
    document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('login');
    });
    
    initHamburgerMenu();
    simulateLoading();
}

function simulateLoading() {
    let progress = 0;
    const loadingProgress = document.getElementById('loadingProgress');
    const percentageElement = document.getElementById('percentage');
    const skipLoadingBtn = document.getElementById('skipLoading');
    
    hideFooterNavigation();
    
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            setTimeout(() => {
                const savedUser = localStorage.getItem('mathEase_user');
                
                if (savedUser) {
                    try {
                        const user = JSON.parse(savedUser);
                        AppState.currentUser = user;
                        AppState.isAuthenticated = true;
                        navigateTo('dashboard');
                    } catch (error) {
                        logoutAndRedirect();
                    }
                } else {
                    navigateTo('login');
                }
            }, 500);
        }
        
        if (loadingProgress) loadingProgress.style.width = `${progress}%`;
        if (percentageElement) percentageElement.textContent = `${Math.floor(progress)}%`;
    }, 300);
    
    if (skipLoadingBtn) {
        skipLoadingBtn.addEventListener('click', () => {
            clearInterval(loadingInterval);
            const savedUser = localStorage.getItem('mathEase_user');
            
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    AppState.currentUser = user;
                    AppState.isAuthenticated = true;
                    navigateTo('dashboard');
                } catch (error) {
                    logoutAndRedirect();
                }
            } else {
                navigateTo('login');
            }
        });
    }
}

async function login(email, password) {
    console.log('Logging in to MathEase...');
    
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password })
        });
        
        const data = await response.json();
        
        if (data.success && data.token) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('mathEase_user', JSON.stringify(data.user));
            
            AppState.currentUser = data.user;
            AppState.isAuthenticated = true;
            
            navigateTo('dashboard');
            
            return { success: true, user: data.user };
        } else {
            // Demo login as fallback
            const demoUser = {
                id: 1,
                username: email ? email.split('@')[0] : 'student',
                email: email || 'student@mathease.com',
                full_name: 'MathEase Student',
                role: 'student'
            };
            
            authToken = 'demo_token_' + Date.now();
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('mathEase_user', JSON.stringify(demoUser));
            
            AppState.currentUser = demoUser;
            AppState.isAuthenticated = true;
            
            navigateTo('dashboard');
            
            return { success: true, user: demoUser };
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // Demo login as fallback
        const demoUser = {
            id: 1,
            username: email ? email.split('@')[0] : 'student',
            email: email || 'student@mathease.com',
            full_name: 'MathEase Student',
            role: 'student'
        };
        
        authToken = 'demo_token_' + Date.now();
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('mathEase_user', JSON.stringify(demoUser));
        
        AppState.currentUser = demoUser;
        AppState.isAuthenticated = true;
        
        navigateTo('dashboard');
        
        return { success: true, user: demoUser };
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            submitBtn.disabled = false;
        }
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            await login(email, password);
        });
    }
}

function setupSignupForm() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('signupUsername')?.value.trim();
        const email = document.getElementById('signupEmail')?.value.trim();
        const password = document.getElementById('signupPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const fullName = document.getElementById('signupFullName')?.value.trim() || username;
        
        if (!username || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    full_name: fullName,
                    role: 'student'
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.token) {
                authToken = data.token;
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('mathEase_user', JSON.stringify(data.user));
                
                AppState.currentUser = data.user;
                AppState.isAuthenticated = true;
                
                navigateTo('dashboard');
            } else {
                // Demo signup as fallback
                const demoUser = {
                    id: Date.now(),
                    username,
                    email,
                    full_name: fullName,
                    role: 'student'
                };
                
                authToken = 'demo_token_' + Date.now();
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('mathEase_user', JSON.stringify(demoUser));
                
                AppState.currentUser = demoUser;
                AppState.isAuthenticated = true;
                
                navigateTo('dashboard');
            }
        } catch (error) {
            console.error('Signup error:', error);
            
            // Demo signup as fallback
            const demoUser = {
                id: Date.now(),
                username,
                email,
                full_name: fullName,
                role: 'student'
            };
            
            authToken = 'demo_token_' + Date.now();
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('mathEase_user', JSON.stringify(demoUser));
            
            AppState.currentUser = demoUser;
            AppState.isAuthenticated = true;
            
            navigateTo('dashboard');
        }
    });
}

function logoutAndRedirect() {
    console.log('Logging out...');
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('mathEase_user');
    
    AppState.currentUser = null;
    AppState.isAuthenticated = false;
    authToken = null;
    
    hideFooterNavigation();
    navigateTo('login');
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

function navigateTo(page) {
    const pages = {
        loading: document.getElementById('loading-page'),
        login: document.getElementById('login-page'),
        signup: document.getElementById('signup-page'),
        dashboard: document.getElementById('dashboard-page'),
        practice: document.getElementById('practice-exercises-page'),
        moduleDashboard: document.getElementById('module-dashboard-page'),
        quizDashboard: document.getElementById('quiz-dashboard-page'),
        progress: document.getElementById('progress-page'),
        feedback: document.getElementById('feedback-page'),
        settings: document.getElementById('settings-page')
    };
    
    Object.values(pages).forEach(p => {
        if (p) p.classList.add('hidden');
    });
    
    if (pages[page]) {
        pages[page].classList.remove('hidden');
        AppState.currentPage = page;
        window.location.hash = page;
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
    
    toggleFooterNavigation(page);
    
    switch(page) {
        case 'dashboard':
            if (AppState.currentUser) {
                updateDashboard();
                loadMathEaseContent();
            }
            break;
        case 'practice':
            if (AppState.currentUser) {
                initPracticePage();
            }
            break;
        case 'moduleDashboard':
            if (AppState.currentUser) {
                openLesson1();
            }
            break;
        case 'quizDashboard':
            if (AppState.currentUser) {
                initQuizDashboard();
            }
            break;
        case 'progress':
            if (AppState.currentUser) {
                updateProgressPage();
                loadProgressData();
            }
            break;
    }
}

function toggleFooterNavigation(page) {
    const navigation = document.querySelector('.footer-nav');
    if (!navigation) return;
    
    const hideNavPages = ['loading', 'login', 'signup'];
    
    if (hideNavPages.includes(page)) {
        navigation.style.display = 'none';
    } else if (AppState.isAuthenticated) {
        navigation.style.display = 'flex';
    } else {
        navigation.style.display = 'none';
    }
}

function hideFooterNavigation() {
    const navigation = document.querySelector('.footer-nav');
    if (navigation) {
        navigation.style.display = 'none';
    }
}

function initHamburgerMenu() {
    const hamburgerBtn = document.getElementById('footerHamburgerBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuPanel = document.getElementById('mobileMenuPanel');
    
    let isMenuOpen = false;
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            isMenuOpen = !isMenuOpen;
            
            if (isMenuOpen) {
                mobileMenuOverlay.classList.add('active');
                mobileMenuPanel.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                mobileMenuOverlay.classList.remove('active');
                mobileMenuPanel.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            isMenuOpen = false;
            mobileMenuOverlay.classList.remove('active');
            mobileMenuPanel.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', function(e) {
            isMenuOpen = false;
            this.classList.remove('active');
            mobileMenuPanel.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

function updateDashboard() {
    if (!AppState.currentUser) return;
    
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    updateUserInfo();
    updateProgressFromLocal();
    updateContinueLearning();
    connectToolButtons();
}

function updateUserInfo() {
    if (!AppState.currentUser) return;
    
    const welcomeTitle = document.getElementById('dashboardWelcomeTitle');
    if (welcomeTitle) {
        welcomeTitle.textContent = `Welcome to MathEase, ${AppState.currentUser.full_name || AppState.currentUser.username}!`;
    }
    
    const userInitial = document.getElementById('userInitial');
    if (userInitial) {
        const name = AppState.currentUser.full_name || AppState.currentUser.username || 'U';
        userInitial.textContent = name.charAt(0).toUpperCase();
    }
    
    const userNameSpan = document.querySelector('#dashboardUserName span');
    if (userNameSpan) {
        userNameSpan.textContent = `${AppState.currentUser.full_name || AppState.currentUser.username}!`;
    }
}

function updateProgressFromLocal() {
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    
    const lessonsCount = document.getElementById('lessonsCount');
    if (lessonsCount) {
        const completed = progress.completedTopics?.length || 0;
        lessonsCount.innerHTML = `${completed}<span class="item-unit">/5 topics</span>`;
    }
    
    const exercisesCount = document.getElementById('exercisesCount');
    if (exercisesCount) {
        const completed = progress.exercisesCompleted || 0;
        exercisesCount.innerHTML = `${completed}<span class="item-unit">/12 exercises</span>`;
    }
    
    const quizScore = document.getElementById('quizScore');
    if (quizScore) {
        const score = progress.quizScore || 0;
        quizScore.innerHTML = `${score}<span class="item-unit">points</span>`;
    }
    
    const avgTime = document.getElementById('avgTime');
    if (avgTime) {
        const time = progress.timeSpent || 0;
        avgTime.innerHTML = `${time}<span class="item-unit">minutes</span>`;
    }
}

// ============================================
// LOAD MATHEASE CONTENT FROM DATABASE
// ============================================

async function loadMathEaseContent() {
    console.log('Loading MathEase content from database (Lesson ID: 1)...');
    
    const continueContainer = document.getElementById('continueLearningContainer');
    if (continueContainer) {
        continueContainer.innerHTML = `
            <div class="loading-container">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading Lesson 1 content from database...</p>
            </div>
        `;
    }
    
    try {
        const token = localStorage.getItem('authToken') || authToken;
        
        // Try to fetch lessons from database
        const response = await fetch(addLessonFilterToUrl(`${API_BASE_URL}/api/lessons-db/complete`), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.lessons && data.lessons.length > 0) {
                LessonState.lessons = data.lessons;
                updateContinueLearning();
                return;
            }
        }
        
        // Fallback to local data
        updateContinueLearningWithLocal();
        
    } catch (error) {
        console.error('Error loading MathEase content:', error);
        updateContinueLearningWithLocal();
    }
}

function updateContinueLearningWithLocal() {
    const container = document.getElementById('continueLearningContainer');
    if (!container) return;
    
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    const currentTopic = progress.currentTopic || 1;
    const percentage = progress.lessonPercentage || 0;
    
    let topicsHTML = '<div class="module-lessons">';
    LESSON_1_TOPICS.forEach((topic, index) => {
        const isCompleted = progress.completedTopics && progress.completedTopics.includes(topic.id);
        const isCurrent = topic.id === currentTopic;
        
        let statusClass = 'locked';
        let buttonText = 'Start';
        let icon = 'fas fa-lock';
        
        if (isCompleted) {
            statusClass = 'completed';
            buttonText = 'Review';
            icon = 'fas fa-check';
        } else if (isCurrent || index === 0) {
            statusClass = 'current';
            buttonText = 'Start';
            icon = 'fas fa-play';
        }
        
        topicsHTML += `
            <div class="lesson-item ${statusClass}" data-topic-id="${topic.id}">
                <div class="lesson-info">
                    <div class="lesson-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div>
                        <div class="lesson-title">${topic.name}</div>
                        <div class="lesson-duration">
                            <i class="fas fa-pencil-alt"></i> ${topic.exercises} exercises
                        </div>
                    </div>
                </div>
                <div class="lesson-actions">
                    <button class="${isCompleted ? 'review-btn' : 'start-btn'}" data-topic-id="${topic.id}">
                        ${buttonText}
                    </button>
                </div>
            </div>
        `;
    });
    topicsHTML += '</div>';
    
    container.innerHTML = `
        <div class="module-header">
            <h3 class="module-title">
                <i class="fas fa-cube"></i> 
                Lesson 1: Basic Mathematical Operations
            </h3>
            <span class="module-status status-in-progress">
                ${percentage}% Complete
            </span>
        </div>
        
        <div class="module-progress">
            <div class="progress-label">
                <span>Overall Progress</span>
                <span>${percentage}%</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        </div>
        
        ${topicsHTML}
        
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn-primary" id="continueLessonBtn" data-topic-id="${currentTopic}">
                <i class="fas fa-play"></i> ${percentage === 0 ? 'Start Lesson 1' : 'Continue Lesson 1'}
            </button>
        </div>
    `;
    
    document.querySelectorAll('.lesson-item').forEach(item => {
        item.addEventListener('click', function() {
            const topicId = this.getAttribute('data-topic-id');
            openTopic(topicId);
        });
    });
    
    document.querySelectorAll('.start-btn, .review-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const topicId = this.getAttribute('data-topic-id');
            openTopic(topicId);
        });
    });
    
    document.getElementById('continueLessonBtn')?.addEventListener('click', function() {
        const topicId = this.getAttribute('data-topic-id');
        openTopic(topicId);
    });
}

function updateContinueLearning() {
    if (LessonState.lessons && LessonState.lessons.length > 0) {
        // Use database lessons
        const lesson = LessonState.lessons[0];
        const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
        const percentage = progress.lessonPercentage || 0;
        
        const container = document.getElementById('continueLearningContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="module-header">
                <h3 class="module-title">
                    <i class="fas fa-cube"></i> 
                    ${lesson.content_title || 'Lesson 1: Basic Mathematical Operations'}
                </h3>
                <span class="module-status status-in-progress">
                    ${percentage}% Complete
                </span>
            </div>
            
            <div class="module-progress">
                <div class="progress-label">
                    <span>Overall Progress</span>
                    <span>${percentage}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
            
            <p style="margin: 15px 0; color: var(--text-light);">
                ${lesson.content_description || 'Learn basic mathematical operations: addition, subtraction, multiplication, and division.'}
            </p>
            
            <div style="text-align: center; margin-top: 20px;">
                <button class="btn-primary" id="continueLessonBtn" data-lesson-id="${lesson.content_id}">
                    <i class="fas fa-play"></i> ${percentage === 0 ? 'Start Lesson 1' : 'Continue Lesson 1'}
                </button>
            </div>
        `;
        
        document.getElementById('continueLessonBtn')?.addEventListener('click', function() {
            const lessonId = this.getAttribute('data-lesson-id');
            openLesson(lessonId);
        });
    } else {
        updateContinueLearningWithLocal();
    }
}

// ============================================
// LESSON 1 FUNCTIONS
// ============================================

async function openLesson(lessonId) {
    console.log('Opening Lesson:', lessonId);
    
    navigateTo('moduleDashboard');
    
    setTimeout(() => {
        updateLessonUI();
        setupLessonVideo();
        updateLessonProgressDisplay();
    }, 300);
}

function openLesson1() {
    openLesson(1);
}

function openTopic(topicId) {
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    progress.currentTopic = parseInt(topicId);
    localStorage.setItem('mathEase_progress', JSON.stringify(progress));
    
    navigateTo('moduleDashboard');
    
    setTimeout(() => {
        updateLessonUI();
        updateLessonProgressDisplay();
    }, 300);
}

function updateLessonUI() {
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    const currentTopic = progress.currentTopic || 1;
    const topic = LESSON_1_TOPICS.find(t => t.id === currentTopic) || LESSON_1_TOPICS[0];
    
    document.getElementById('moduleTitle').textContent = `Lesson 1: ${topic.name}`;
    document.getElementById('moduleSubtitle').textContent = topic.description;
    
    const lessonContent = document.getElementById('lessonContent');
    if (lessonContent) {
        lessonContent.innerHTML = `
            <p>Welcome to ${topic.name}!</p>
            <p>${topic.description}</p>
            <div class="math-example">
                <p><strong>Example:</strong> Let's practice ${topic.name.toLowerCase()}.</p>
                ${getExampleForTopic(topic.id)}
            </div>
            <ul class="steps">
                <li>Watch the video lesson</li>
                <li>Take notes using the Notepad tool</li>
                <li>Complete practice exercises</li>
                <li>Take the quiz when ready</li>
            </ul>
        `;
    }
}

function getExampleForTopic(topicId) {
    const examples = {
        1: '<p>15 + 7 = 22</p><p>23 + 18 = 41</p>',
        2: '<p>25 - 9 = 16</p><p>42 - 18 = 24</p>',
        3: '<p>7 × 8 = 56</p><p>12 × 6 = 72</p>',
        4: '<p>56 ÷ 7 = 8</p><p>81 ÷ 9 = 9</p>',
        5: '<p>3 + 4 × 2 = 11 (multiplication first)</p><p>(5 + 3) × 2 = 16 (parentheses first)</p>'
    };
    return examples[topicId] || '<p>Practice makes perfect!</p>';
}

function setupLessonVideo() {
    const videoElement = document.getElementById('lessonVideo');
    const videoTimeDisplay = document.getElementById('videoTime');
    
    if (!videoElement) return;
    
    videoElement.addEventListener('loadedmetadata', function() {
        updateVideoTime();
        initVideoProgressTracking(videoElement);
    });
    
    videoElement.addEventListener('timeupdate', function() {
        updateVideoTime();
        updateLessonProgressFromVideo();
    });
    
    function updateVideoTime() {
        if (videoTimeDisplay && videoElement.duration) {
            const current = videoElement.currentTime;
            const duration = videoElement.duration;
            videoTimeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
        }
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

function initVideoProgressTracking(videoElement) {
    let lastSaveTime = 0;
    const SAVE_INTERVAL = 10000;
    
    videoElement.addEventListener('timeupdate', function() {
        const now = Date.now();
        if (now - lastSaveTime > SAVE_INTERVAL) {
            lastSaveTime = now;
            updateLessonProgressFromVideo();
        }
    });
    
    videoElement.addEventListener('ended', function() {
        markVideoCompleted();
    });
}

function updateLessonProgressFromVideo() {
    const videoElement = document.getElementById('lessonVideo');
    if (!videoElement || !videoElement.duration) return;
    
    const percentage = Math.floor((videoElement.currentTime / videoElement.duration) * 100);
    
    const lessonProgressFill = document.getElementById('lessonProgressFill');
    const progressPercentage = document.getElementById('progressPercentage');
    
    if (lessonProgressFill) {
        lessonProgressFill.style.width = `${percentage}%`;
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}% Complete`;
    }
    
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    progress.lessonPercentage = percentage;
    localStorage.setItem('mathEase_progress', JSON.stringify(progress));
}

function markVideoCompleted() {
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    const currentTopic = progress.currentTopic || 1;
    
    if (!progress.completedTopics) progress.completedTopics = [];
    if (!progress.completedTopics.includes(currentTopic)) {
        progress.completedTopics.push(currentTopic);
    }
    
    if (!progress.topicProgress) progress.topicProgress = {};
    progress.topicProgress[currentTopic] = {
        completed: true,
        percentage: 100,
        completedAt: new Date().toISOString()
    };
    
    progress.lessonsCompleted = progress.completedTopics.length;
    
    localStorage.setItem('mathEase_progress', JSON.stringify(progress));
    
    document.getElementById('completeLessonBtn').innerHTML = '<i class="fas fa-check"></i> Topic Completed!';
    document.getElementById('completeLessonBtn').disabled = true;
    
    updateDashboard();
}

function updateLessonProgressDisplay() {
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    const percentage = progress.lessonPercentage || 0;
    
    const lessonProgressFill = document.getElementById('lessonProgressFill');
    const progressPercentage = document.getElementById('progressPercentage');
    
    if (lessonProgressFill) {
        lessonProgressFill.style.width = `${percentage}%`;
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}% Complete`;
    }
}

// ============================================
// PRACTICE PAGE FUNCTIONS
// ============================================

function initPracticePage() {
    updatePracticeDate();
    loadTopics();
    loadPracticeStatistics();
}

function updatePracticeDate() {
    const practiceDate = document.getElementById('practiceDate');
    if (practiceDate) {
        practiceDate.textContent = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', month: 'short', day: 'numeric' 
        });
    }
}

function loadTopics() {
    const topicsContainer = document.getElementById('topicsContainer');
    if (!topicsContainer) return;
    
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    const completedTopics = progress.completedTopics || [];
    
    let html = '';
    
    LESSON_1_TOPICS.forEach(topic => {
        const isCompleted = completedTopics.includes(topic.id);
        const isUnlocked = topic.id === 1 || completedTopics.includes(topic.id - 1);
        
        html += `
            <div class="topic-card ${isUnlocked ? 'unlocked' : 'locked'}" data-topic-id="${topic.id}">
                <div class="topic-header">
                    <div class="topic-icon">
                        <i class="fas ${topic.icon}"></i>
                    </div>
                    <h3>${topic.name}</h3>
                </div>
                
                <p class="topic-description">${topic.description}</p>
                
                <div class="topic-actions">
                    ${isUnlocked ? 
                        `<button class="btn-topic-action btn-start-practice" data-topic-id="${topic.id}">
                            <i class="fas fa-play"></i> Practice
                        </button>` :
                        `<button class="btn-topic-action btn-unlock-topic" disabled>
                            <i class="fas fa-lock"></i> Complete Previous Topic
                        </button>`
                    }
                </div>
                
                ${isCompleted ? '<div style="color: #27ae60; margin-top: 10px;"><i class="fas fa-check-circle"></i> Completed</div>' : ''}
            </div>
        `;
    });
    
    topicsContainer.innerHTML = html;
    
    document.querySelectorAll('.btn-start-practice').forEach(btn => {
        btn.addEventListener('click', function() {
            const topicId = this.getAttribute('data-topic-id');
            startPracticeForTopic(topicId);
        });
    });
}

function startPracticeForTopic(topicId) {
    const topic = LESSON_1_TOPICS.find(t => t.id == topicId);
    if (!topic) return;
    
    const exerciseArea = document.getElementById('exerciseArea');
    if (!exerciseArea) return;
    
    exerciseArea.innerHTML = `
        <div class="exercise-header">
            <h3>${topic.name} Practice</h3>
            <span class="difficulty-badge difficulty-easy">Beginner</span>
        </div>
        
        <div class="exercise-body">
            <p>Practice your ${topic.name.toLowerCase()} skills with these exercises.</p>
            
            <div class="practice-question">
                <p><strong>Question 1:</strong> Practice ${topic.name.toLowerCase()} problems</p>
                <div class="options-list">
                    <label class="option">
                        <input type="radio" name="practice1" value="0"> Option A
                    </label>
                    <label class="option">
                        <input type="radio" name="practice1" value="1"> Option B
                    </label>
                </div>
            </div>
            
            <div class="practice-question">
                <p><strong>Question 2:</strong> Another ${topic.name.toLowerCase()} problem</p>
                <div class="options-list">
                    <label class="option">
                        <input type="radio" name="practice2" value="0"> Option A
                    </label>
                    <label class="option">
                        <input type="radio" name="practice2" value="1"> Option B
                    </label>
                </div>
            </div>
            
            <div class="exercise-actions">
                <button class="btn-primary" id="submitPracticeBtn">
                    <i class="fas fa-paper-plane"></i> Submit Answers
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('submitPracticeBtn')?.addEventListener('click', () => {
        const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
        progress.exercisesCompleted = (progress.exercisesCompleted || 0) + 1;
        localStorage.setItem('mathEase_progress', JSON.stringify(progress));
        
        alert('Practice completed! Keep up the good work!');
        
        updateDashboard();
        loadPracticeStatistics();
    });
}

function loadPracticeStatistics() {
    const statsContainer = document.getElementById('practiceStats');
    if (!statsContainer) return;
    
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    const completedTopics = progress.completedTopics?.length || 0;
    const exercisesCompleted = progress.exercisesCompleted || 0;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${completedTopics}</div>
            <div class="stat-label">TOPICS COMPLETED</div>
            <div class="stat-subtext">out of 5</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${exercisesCompleted}</div>
            <div class="stat-label">EXERCISES DONE</div>
            <div class="stat-subtext">total completed</div>
        </div>
    `;
}

// ============================================
// QUIZ FUNCTIONS
// ============================================

function initQuizDashboard() {
    updateQuizStats();
    loadQuizzes();
}

function updateQuizStats() {
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    const quizScore = progress.quizScore || 0;
    const quizAttempts = progress.quizAttempts || 0;
    
    document.getElementById('quizCurrentScore').textContent = quizScore + '%';
    document.getElementById('quizAccuracy').textContent = (quizAttempts > 0 ? quizScore : 0) + '%';
    document.getElementById('quizTimeSpent').textContent = '0m';
    document.getElementById('quizRank').textContent = quizAttempts > 0 ? '#12' : '#--';
    
    loadLeaderboard();
}

function loadQuizzes() {
    const container = document.getElementById('userQuizzesContainer');
    if (!container) return;
    
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    const completedTopics = progress.completedTopics?.length || 0;
    const canTakeQuiz = completedTopics >= 5;
    
    if (!canTakeQuiz) {
        container.innerHTML = `
            <div class="card" style="padding: 30px; text-align: center;">
                <i class="fas fa-lock" style="font-size: 50px; color: #ccc; margin-bottom: 15px;"></i>
                <h3>Quiz Locked</h3>
                <p>Complete all 5 topics to unlock the Lesson 1 Assessment.</p>
                <p>Topics completed: ${completedTopics}/5</p>
                <button class="btn-primary" onclick="navigateTo('practice')" style="margin-top: 15px;">
                    <i class="fas fa-pencil-alt"></i> Go to Practice
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="card full-width-card">
            <div class="card-header">
                <h2 class="card-title">
                    <i class="fas fa-question-circle"></i> Lesson 1 Assessment
                </h2>
                <p class="card-subtitle">Test your knowledge of basic mathematical operations</p>
            </div>
            
            <div style="padding: 20px 25px;">
                <div class="quiz-category-card">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div style="width: 60px; height: 60px; background: #8B0000; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 5px 0;">Lesson 1 Assessment</h3>
                            <p style="margin: 0; color: #666;">5 questions • 70% to pass</p>
                        </div>
                        <button class="btn-primary" id="startQuizBtn" style="width: auto; margin: 0;">
                            <i class="fas fa-play"></i> Start Quiz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('startQuizBtn')?.addEventListener('click', startQuiz);
}

function startQuiz() {
    const questions = [
        {
            text: 'What is 15 + 23?',
            options: ['38', '39', '37', '40'],
            correct: 0
        },
        {
            text: 'What is 45 - 18?',
            options: ['27', '28', '26', '29'],
            correct: 0
        },
        {
            text: 'What is 7 × 9?',
            options: ['63', '64', '62', '65'],
            correct: 0
        },
        {
            text: 'What is 56 ÷ 8?',
            options: ['7', '8', '6', '9'],
            correct: 0
        },
        {
            text: 'What is 4 + 3 × 2?',
            options: ['10', '14', '12', '8'],
            correct: 0
        }
    ];
    
    QuizSystem.currentQuiz = 1;
    QuizSystem.questions = questions;
    QuizSystem.currentIndex = 0;
    QuizSystem.userAnswers = {};
    QuizSystem.startTime = Date.now();
    QuizSystem.timeLeft = 600; // 10 minutes
    QuizSystem.stats = { correct: 0, wrong: 0, score: 0 };
    
    showQuizInterface();
}

function showQuizInterface() {
    const quizInterface = document.getElementById('quizInterfaceContainer');
    const quizCards = document.getElementById('userQuizzesContainer');
    const leaderboard = document.getElementById('leaderboardContainer');
    
    if (quizInterface) {
        quizInterface.classList.remove('hidden');
        quizInterface.style.display = 'block';
    }
    
    if (quizCards) {
        quizCards.classList.add('hidden');
        quizCards.style.display = 'none';
    }
    
    if (leaderboard) {
        leaderboard.classList.add('hidden');
        leaderboard.style.display = 'none';
    }
    
    loadQuizQuestion(0);
    startQuizTimer();
}

function loadQuizQuestion(index) {
    if (!QuizSystem.questions || QuizSystem.questions.length === 0) return;
    
    const question = QuizSystem.questions[index];
    QuizSystem.currentIndex = index;
    
    document.getElementById('currentQuestionNum').textContent = index + 1;
    document.getElementById('totalQuestions').textContent = QuizSystem.questions.length;
    document.getElementById('quizQuestionText').textContent = question.text;
    
    const optionsContainer = document.getElementById('quizOptionsContainer');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, i) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'quiz-option';
        optionDiv.setAttribute('data-option-index', i);
        
        optionDiv.innerHTML = `
            <div style="width: 30px; height: 30px; border: 2px solid #8B0000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                ${String.fromCharCode(65 + i)}
            </div>
            <div style="flex: 1;">${option}</div>
        `;
        
        optionDiv.addEventListener('click', function() {
            document.querySelectorAll('.quiz-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            
            const questionId = index;
            QuizSystem.userAnswers[questionId] = i;
            
            setTimeout(() => {
                if (index < QuizSystem.questions.length - 1) {
                    loadQuizQuestion(index + 1);
                } else {
                    document.getElementById('submitQuizBtn').style.display = 'block';
                }
            }, 500);
        });
        
        optionsContainer.appendChild(optionDiv);
    });
}

function startQuizTimer() {
    if (QuizSystem.timerInterval) {
        clearInterval(QuizSystem.timerInterval);
    }
    
    QuizSystem.timerInterval = setInterval(() => {
        if (QuizSystem.timeLeft > 0) {
            QuizSystem.timeLeft--;
            
            const minutes = Math.floor(QuizSystem.timeLeft / 60);
            const seconds = QuizSystem.timeLeft % 60;
            
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (QuizSystem.timeLeft <= 0) {
                clearInterval(QuizSystem.timerInterval);
                submitQuiz();
            }
        }
    }, 1000);
}

function submitQuiz() {
    const answeredCount = Object.keys(QuizSystem.userAnswers).length;
    
    let correctCount = 0;
    QuizSystem.questions.forEach((q, index) => {
        const userAnswer = QuizSystem.userAnswers[index];
        if (userAnswer !== undefined && userAnswer === q.correct) {
            correctCount++;
        }
    });
    
    const totalQuestions = QuizSystem.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const pointsEarned = correctCount * 10;
    
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    progress.quizScore = score;
    progress.quizAttempts = (progress.quizAttempts || 0) + 1;
    localStorage.setItem('mathEase_progress', JSON.stringify(progress));
    
    showQuizResults(correctCount, totalQuestions, score, pointsEarned);
    
    updateDashboard();
    updateQuizStats();
}

function showQuizResults(correct, total, score, points) {
    const quizInterface = document.getElementById('quizInterfaceContainer');
    const resultsContainer = document.getElementById('quizResults');
    
    if (quizInterface) {
        quizInterface.classList.add('hidden');
    }
    
    if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
        
        document.getElementById('finalScore').textContent = score + '%';
        document.getElementById('correctCount').textContent = correct;
        document.getElementById('totalQuestionsCount').textContent = total;
        document.getElementById('timeSpent').textContent = '10:00';
        document.getElementById('scorePoints').textContent = points;
    }
}

function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    
    leaderboardList.innerHTML = `
        <div class="leaderboard-item current-user">
            <div class="leaderboard-rank">1</div>
            <div class="leaderboard-user">
                <div class="leaderboard-user-name">${AppState.currentUser?.username || 'You'}</div>
                <div class="leaderboard-user-stats">
                    <span class="leaderboard-stat"><i class="fas fa-star"></i> 100 pts</span>
                    <span class="leaderboard-stat"><i class="fas fa-trophy"></i> 1 quiz</span>
                </div>
            </div>
            <div class="leaderboard-score">100%</div>
        </div>
        <div class="leaderboard-item">
            <div class="leaderboard-rank">2</div>
            <div class="leaderboard-user">
                <div class="leaderboard-user-name">Maria Santos</div>
                <div class="leaderboard-user-stats">
                    <span class="leaderboard-stat"><i class="fas fa-star"></i> 85 pts</span>
                    <span class="leaderboard-stat"><i class="fas fa-trophy"></i> 1 quiz</span>
                </div>
            </div>
            <div class="leaderboard-score">85%</div>
        </div>
        <div class="leaderboard-item">
            <div class="leaderboard-rank">3</div>
            <div class="leaderboard-user">
                <div class="leaderboard-user-name">Juan Dela Cruz</div>
                <div class="leaderboard-user-stats">
                    <span class="leaderboard-stat"><i class="fas fa-star"></i> 70 pts</span>
                    <span class="leaderboard-stat"><i class="fas fa-trophy"></i> 1 quiz</span>
                </div>
            </div>
            <div class="leaderboard-score">70%</div>
        </div>
    `;
}

// ============================================
// PROGRESS PAGE FUNCTIONS
// ============================================

async function loadProgressData() {
    console.log('Loading progress data from database (Lesson ID: 1)...');
    
    try {
        const token = localStorage.getItem('authToken') || authToken;
        
        const response = await fetch(addLessonFilterToUrl(`${API_BASE_URL}/api/progress/overall`), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.overall) {
                updateProgressPageWithData(data.overall);
                return;
            }
        }
    } catch (error) {
        console.error('Error loading progress data:', error);
    }
    
    updateProgressPage();
}

function updateProgressPage() {
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    
    const completedTopics = progress.completedTopics?.length || 0;
    const totalTopics = 5;
    const percentage = Math.round((completedTopics / totalTopics) * 100);
    
    document.getElementById('overallProgress').textContent = percentage + '%';
    document.getElementById('overallProgressBar').style.width = percentage + '%';
    
    document.getElementById('totalPointsProgress').textContent = progress.quizScore || 0;
    document.getElementById('pointsChange').textContent = `+${progress.quizScore || 0} this week`;
    
    const timeSpent = progress.timeSpent || 0;
    document.getElementById('totalTime').textContent = timeSpent + 'm';
    document.getElementById('timeChange').textContent = `${timeSpent} min this week`;
    
    const badgeCount = completedTopics;
    document.getElementById('totalBadges').textContent = `${badgeCount}/5`;
    document.getElementById('badgesChange').textContent = `+${badgeCount} this month`;
    
    updateTopicProgressDetailed(progress);
    updateAchievementTimeline(progress);
}

function updateProgressPageWithData(data) {
    const percentage = data.percentage || 0;
    
    document.getElementById('overallProgress').textContent = percentage + '%';
    document.getElementById('overallProgressBar').style.width = percentage + '%';
    
    document.getElementById('totalPointsProgress').textContent = data.total_points || 0;
    document.getElementById('totalTime').textContent = (data.total_time_minutes || 0) + 'm';
    
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    const completedTopics = progress.completedTopics?.length || 0;
    
    document.getElementById('totalBadges').textContent = `${completedTopics}/5`;
    
    updateTopicProgressDetailed(progress);
    updateAchievementTimeline(progress);
}

function updateTopicProgressDetailed(progress) {
    const container = document.getElementById('topicsProgressDetailed');
    if (!container) return;
    
    const completedTopics = progress.completedTopics || [];
    
    let html = '';
    
    LESSON_1_TOPICS.forEach(topic => {
        const isCompleted = completedTopics.includes(topic.id);
        const accuracy = isCompleted ? 85 : 0;
        
        html += `
            <div class="topic-item" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <h4 style="margin: 0;">${topic.name}</h4>
                    <span style="color: ${isCompleted ? '#27ae60' : '#95a5a6'};">
                        ${isCompleted ? 'Completed' : 'Not Started'}
                    </span>
                </div>
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <div style="font-size: 12px;">Completion</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${isCompleted ? 100 : 0}%;"></div>
                        </div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 12px;">Accuracy</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${accuracy}%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateAchievementTimeline(progress) {
    const timeline = document.getElementById('achievementTimeline');
    if (!timeline) return;
    
    const completedTopics = progress.completedTopics || [];
    const quizScore = progress.quizScore || 0;
    
    let html = '';
    
    if (completedTopics.length > 0) {
        html += `
            <div class="timeline-item">
                <div class="timeline-content">
                    <div class="timeline-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="timeline-text">
                        <h4>Completed ${completedTopics.length} Topics</h4>
                        <p>Great progress in Lesson 1!</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (quizScore > 0) {
        html += `
            <div class="timeline-item">
                <div class="timeline-content">
                    <div class="timeline-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="timeline-text">
                        <h4>Quiz Completed: ${quizScore}%</h4>
                        <p>Assessment score</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (html === '') {
        html = '<p style="text-align: center; color: #999;">Start learning to see achievements!</p>';
    }
    
    timeline.innerHTML = html;
}

// ============================================
// NAVIGATION HELPER FUNCTIONS
// ============================================

function showDashboard(e) {
    if (e) e.preventDefault();
    closeMobileMenu();
    navigateTo('dashboard');
}

function showPracticeDashboard(e) {
    if (e) e.preventDefault();
    closeMobileMenu();
    navigateTo('practice');
}

function showQuizDashboard(e) {
    if (e) e.preventDefault();
    closeMobileMenu();
    navigateTo('quizDashboard');
}

function showProgressPage(e) {
    if (e) e.preventDefault();
    closeMobileMenu();
    navigateTo('progress');
}

function showFeedbackPage(e) {
    if (e) e.preventDefault();
    closeMobileMenu();
    navigateTo('feedback');
}

function showSettingsPage(e) {
    if (e) e.preventDefault();
    closeMobileMenu();
    navigateTo('settings');
}

function goToLesson1(e) {
    if (e) e.preventDefault();
    closeMobileMenu();
    openLesson1();
}

function closeMobileMenu() {
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuPanel = document.getElementById('mobileMenuPanel');
    
    if (mobileMenuOverlay && mobileMenuPanel) {
        mobileMenuOverlay.classList.remove('active');
        mobileMenuPanel.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================
// LOGOUT CONFIRMATION
// ============================================

function showLogoutConfirmation() {
    // Close any open menus first
    closeMobileMenu();
    
    // Check if modal exists, create if not
    let modal = document.getElementById('logoutModal');
    
    if (!modal) {
        // Create modal if it doesn't exist
        modal = document.createElement('div');
        modal.id = 'logoutModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 380px;">
                <div class="modal-header" style="background: #8B0000; padding: 15px 20px; border-radius: 10px 10px 0 0;">
                    <h3 style="margin: 0; color: white;"><i class="fas fa-sign-out-alt"></i> Confirm Logout</h3>
                    <button class="modal-close" onclick="closeLogoutModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                
                <div class="modal-body" style="padding: 25px; text-align: center; background: white;">
                    <div style="width: 70px; height: 70px; background: #f8f9fa; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 35px; color: #8B0000;"></i>
                    </div>
                    
                    <h4 style="margin: 0 0 8px; color: #2c3e50;">Are you sure you want to logout?</h4>
                    <p style="color: #7f8c8d; margin-bottom: 20px;">Your progress is automatically saved.</p>
                    
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button onclick="closeLogoutModal()" class="btn-secondary" style="padding: 10px 20px; margin: 0; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button onclick="confirmLogout()" class="btn-primary" style="padding: 10px 20px; margin: 0; background: #8B0000; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Hide any other modals that might be showing
    document.querySelectorAll('.modal-overlay').forEach(m => {
        if (m.id !== 'logoutModal') {
            m.style.display = 'none';
        }
    });
    
    // Show logout modal
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.body.classList.remove('modal-open');
}

function confirmLogout() {
    closeLogoutModal();
    logoutAndRedirect();
}

function createLogoutModal() {
    const modalHTML = `
        <div id="logoutModal" class="modal-overlay" style="display: none;">
            <div class="modal-container" style="max-width: 380px;">
                <div class="modal-header" style="background: #8B0000;">
                    <h3 style="margin: 0;"><i class="fas fa-sign-out-alt"></i> Confirm Logout</h3>
                    <button class="modal-close" onclick="closeLogoutModal()" style="color: white;">&times;</button>
                </div>
                
                <div class="modal-body" style="padding: 25px; text-align: center;">
                    <div style="width: 70px; height: 70px; background: #f8f9fa; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 35px; color: #8B0000;"></i>
                    </div>
                    
                    <h4 style="margin: 0 0 8px;">Are you sure you want to logout?</h4>
                    <p style="color: #7f8c8d; margin-bottom: 20px;">Your progress is automatically saved.</p>
                    
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button onclick="closeLogoutModal()" class="btn-secondary" style="padding: 10px 20px; margin: 0;">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button onclick="confirmLogout()" class="btn-primary" style="padding: 10px 20px; margin: 0; background: #8B0000;">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    showLogoutConfirmation();
}

// ============================================
// SETTINGS FUNCTIONS
// ============================================

function showSection(sectionId) {
    const sections = document.querySelectorAll('.settings-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

function saveSettings() {
    const displayName = document.getElementById('displayName')?.value;
    const email = document.getElementById('userEmail')?.value;
    
    if (AppState.currentUser) {
        AppState.currentUser.full_name = displayName;
        AppState.currentUser.email = email;
        localStorage.setItem('mathEase_user', JSON.stringify(AppState.currentUser));
    }
    
    alert('Settings saved successfully!');
}

// ============================================
// FEEDBACK FUNCTIONS
// ============================================

let currentRating = 0;

function rate(rating) {
    currentRating = rating;
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
            star.innerHTML = '★';
        } else {
            star.classList.remove('active');
            star.innerHTML = '☆';
        }
    });
    document.getElementById('ratingValue').value = rating;
}

function toggleFAQ(element) {
    const faqItem = element.closest('.faq-item');
    if (!faqItem) return;
    
    faqItem.classList.toggle('active');
    
    const chevron = element.querySelector('.fas.fa-chevron-down');
    if (chevron) {
        chevron.style.transform = faqItem.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

function setupFeedbackForm() {
    console.log('📝 Setting up feedback form - FIXED VERSION');
    
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackSuccess = document.getElementById('feedbackSuccess');
    
    if (!feedbackForm) return;
    
    const newForm = feedbackForm.cloneNode(true);
    feedbackForm.parentNode.replaceChild(newForm, feedbackForm);
    
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const feedbackType = document.getElementById('feedbackType')?.value;
        const feedbackMessage = document.getElementById('feedbackMessage')?.value.trim();
        const rating = parseInt(document.getElementById('ratingValue')?.value) || 0;
        
        let userId = null;
        const userJson = localStorage.getItem('mathEase_user');
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                userId = user.id || user.user_id;
            } catch (e) {}
        }
        
        if (!feedbackMessage) {
            alert('Please enter your feedback message');
            return;
        }
        
        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
        
        try {
            const token = localStorage.getItem('authToken') || authToken;
            
            const feedbackData = {
                feedback_type: feedbackType || 'general',
                feedback_message: feedbackMessage,
                rating: rating,
                user_id: userId,
                page_url: window.location.href,
                user_agent: navigator.userAgent
            };
            
            const response = await fetch(`${API_BASE_URL}/feedback/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(feedbackData)
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    if (feedbackSuccess) {
                        feedbackSuccess.style.display = 'block';
                        feedbackSuccess.innerHTML = `<i class="fas fa-check-circle"></i> Thank you! Your feedback has been saved.`;
                        setTimeout(() => {
                            feedbackSuccess.style.display = 'none';
                        }, 3000);
                    }
                    
                    newForm.reset();
                    
                    const stars = document.querySelectorAll('.star');
                    stars.forEach(star => {
                        star.classList.remove('active');
                        star.innerHTML = '☆';
                    });
                    document.getElementById('ratingValue').value = 0;
                    
                    alert('Thank you for your feedback!');
                }
            } else {
                // Fallback local save
                saveFeedbackLocally(feedbackData);
                alert('Feedback saved locally!');
                newForm.reset();
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            saveFeedbackLocally({
                feedback_type: feedbackType,
                feedback_message: feedbackMessage,
                rating: rating,
                user_id: userId,
                page_url: window.location.href,
                user_agent: navigator.userAgent
            });
            alert('Feedback saved locally!');
            newForm.reset();
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}
function saveFeedbackLocally(feedbackData) {
    try {
        let existingFeedback = JSON.parse(localStorage.getItem('mathEase_feedback') || '[]');
        
        const newFeedback = {
            ...feedbackData,
            id: Date.now(),
            created_at: new Date().toISOString(),
            status: 'pending'
        };
        
        existingFeedback.push(newFeedback);
        
        if (existingFeedback.length > 50) {
            existingFeedback = existingFeedback.slice(-50);
        }
        
        localStorage.setItem('mathEase_feedback', JSON.stringify(existingFeedback));
        
        displayLocalFeedbackHistory();
    } catch (e) {}
}

function displayLocalFeedbackHistory() {
    const historyContainer = document.getElementById('feedbackHistory');
    if (!historyContainer) return;
    
    try {
        const localFeedback = JSON.parse(localStorage.getItem('mathEase_feedback') || '[]');
        
        if (!localFeedback || localFeedback.length === 0) {
            historyContainer.innerHTML = `
                <div class="no-feedback">
                    <i class="fas fa-comment-slash"></i>
                    <h4>No feedback submitted yet</h4>
                    <p>Your submitted feedback will appear here</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="feedback-history-list">';
        
        localFeedback.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        localFeedback.slice(0, 10).forEach(item => {
            const date = item.created_at ? new Date(item.created_at) : new Date();
            const formattedDate = !isNaN(date) ? date.toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }) : 'Unknown date';
            
            const ratingStars = '★'.repeat(item.rating || 0) + '☆'.repeat(5 - (item.rating || 0));
            
            html += `
                <div class="feedback-history-item status-pending">
                    <div class="feedback-history-header">
                        <div>
                            <span class="feedback-type-badge">${item.feedback_type || 'feedback'}</span>
                            <span class="local-badge">(Saved locally)</span>
                        </div>
                        <span class="feedback-date">${formattedDate}</span>
                    </div>
                    
                    <div class="feedback-history-body">
                        <p class="feedback-message">${escapeHtml(item.feedback_message || '')}</p>
                        
                        ${item.rating > 0 ? `
                            <div class="feedback-rating-display">
                                <span class="rating-stars">${ratingStars}</span>
                                <span class="rating-value">${item.rating}/5</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        historyContainer.innerHTML = html;
    } catch (e) {}
}
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// ============================================
// FORGOT PASSWORD FUNCTIONS
// ============================================
function createForgotPasswordModal() {
    const modalHTML = `
        <div id="forgotPasswordModal" class="modal-overlay">
            <div class="modal-container" style="max-width: 450px;">
                <div class="modal-header" style="background: #7a0000; color: white; padding: 15px 20px; border-radius: 10px 10px 0 0;">
                    <h3 style="margin: 0; font-size: 18px;"><i class="fas fa-key"></i> Reset Password</h3>
                    <button class="modal-close" onclick="closeForgotPasswordModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                
                <div class="modal-body" style="padding: 25px;">
                    <div id="forgotStep1" style="display: block;">
                        <p style="margin-bottom: 20px; color: #2c3e50;">Enter your email address and we'll send you a link to reset your password.</p>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
                                <i class="fas fa-envelope"></i> Email Address
                            </label>
                            <input type="email" id="resetEmail" class="form-control" 
                                   placeholder="your@email.com" 
                                   style="width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 6px;">
                        </div>
                        
                        <div id="forgotError" style="display: none; background: #fee9e7; color: #e74c3c; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 14px;"></div>
                        
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button class="btn-secondary" onclick="closeForgotPasswordModal()" style="padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; background: #95a5a6; color: white;">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button class="btn-primary" onclick="requestPasswordReset()" style="padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; background: #7a0000; color: white;">
                                <i class="fas fa-paper-plane"></i> Send Reset Link
                            </button>
                        </div>
                    </div>
                    
                    <div id="forgotStep2" style="display: none;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="width: 80px; height: 80px; background: #27ae60; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-check" style="font-size: 40px; color: white;"></i>
                            </div>
                            <h4 style="color: #2c3e50; margin-bottom: 10px;">Reset Link Generated!</h4>
                            <p style="color: #7f8c8d; margin-bottom: 5px;" id="resetEmailDisplay"></p>
                        </div>
                        
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px; border-left: 4px solid #7a0000;">
                            <p style="margin: 0 0 5px 0; font-weight: bold; color: #2c3e50;">
                                <i class="fas fa-info-circle"></i> DEMO MODE (No Email Configured)
                            </p>
                            <p style="margin: 5px 0; color: #34495e; font-size: 14px;">
                                Since email is not connected, use this reset link:
                            </p>
                            <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; margin: 10px 0;">
                                <code id="resetLinkDisplay" style="word-break: break-all; font-size: 12px;"></code>
                            </div>
                            <button class="btn-secondary" onclick="copyResetLink()" style="width: 100%; padding: 8px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                <i class="fas fa-copy"></i> Copy Reset Link
                            </button>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button class="btn-primary" onclick="closeForgotPasswordModal()" style="padding: 10px 20px; background: #7a0000; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-check"></i> OK, Got It
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showForgotPasswordModal() {
    console.log('🔑 Opening forgot password modal');
    
    const modal = document.getElementById('forgotPasswordModal');
    if (!modal) {
        createForgotPasswordModal();
        return;
    }
    
    const step1 = document.getElementById('forgotStep1');
    const step2 = document.getElementById('forgotStep2');
    const resetEmail = document.getElementById('resetEmail');
    const forgotError = document.getElementById('forgotError');
    
    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';
    if (resetEmail) resetEmail.value = '';
    if (forgotError) forgotError.style.display = 'none';
    
    modal.style.display = 'flex';
    modal.style.zIndex = '2147483647';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }
}

function requestPasswordReset() {
    const email = document.getElementById('resetEmail').value.trim();
    const errorDiv = document.getElementById('forgotError');
    
    if (!email) {
        errorDiv.textContent = 'Please enter your email address';
        errorDiv.style.display = 'block';
        return;
    }
    
    document.getElementById('forgotStep1').style.display = 'none';
    document.getElementById('forgotStep2').style.display = 'block';
    document.getElementById('resetEmailDisplay').textContent = `Email: ${email}`;
    document.getElementById('resetLinkDisplay').textContent = `https://mathease.app/reset-password?token=demo_${Date.now()}`;
}

function copyResetLink() {
    const linkText = document.getElementById('resetLinkDisplay').textContent;
    navigator.clipboard.writeText(linkText);
    alert('Reset link copied to clipboard!');
}

// ============================================
// ✅ ADD ENHANCED QUIZ SYSTEM FUNCTIONS
// ============================================

async function startQuizSystem(quizId) {
    console.log("🎯 Starting QUIZ ID:", quizId);
    
    try {
        const token = localStorage.getItem('authToken') || authToken;
        const userJson = localStorage.getItem('mathEase_user');
        
        if (!token || !userJson) {
            alert('Please login first');
            return;
        }
        
        const user = JSON.parse(userJson);
        
        // Get questions from database or use default
        let questions = [];
        try {
            const response = await fetch(`${API_BASE_URL}/api/quiz/${quizId}/questions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.questions) {
                    questions = data.questions;
                }
            }
        } catch (e) {
            console.log('Using default quiz questions');
        }
        
        // Default questions if none from database
        if (questions.length === 0) {
            questions = [
                {
                    question_id: 1,
                    question_text: 'What is 15 + 23?',
                    question_type: 'multiple_choice',
                    options: [
                        { id: 1, text: '38', is_correct: true },
                        { id: 2, text: '39', is_correct: false },
                        { id: 3, text: '37', is_correct: false },
                        { id: 4, text: '40', is_correct: false }
                    ]
                },
                {
                    question_id: 2,
                    question_text: 'What is 45 - 18?',
                    question_type: 'multiple_choice',
                    options: [
                        { id: 5, text: '27', is_correct: true },
                        { id: 6, text: '28', is_correct: false },
                        { id: 7, text: '26', is_correct: false },
                        { id: 8, text: '29', is_correct: false }
                    ]
                },
                {
                    question_id: 3,
                    question_text: 'What is 7 × 9?',
                    question_type: 'multiple_choice',
                    options: [
                        { id: 9, text: '63', is_correct: true },
                        { id: 10, text: '64', is_correct: false },
                        { id: 11, text: '62', is_correct: false },
                        { id: 12, text: '65', is_correct: false }
                    ]
                },
                {
                    question_id: 4,
                    question_text: 'What is 56 ÷ 8?',
                    question_type: 'multiple_choice',
                    options: [
                        { id: 13, text: '7', is_correct: true },
                        { id: 14, text: '8', is_correct: false },
                        { id: 15, text: '6', is_correct: false },
                        { id: 16, text: '9', is_correct: false }
                    ]
                },
                {
                    question_id: 5,
                    question_text: 'What is 4 + 3 × 2?',
                    question_type: 'multiple_choice',
                    options: [
                        { id: 17, text: '10', is_correct: true },
                        { id: 18, text: '14', is_correct: false },
                        { id: 19, text: '12', is_correct: false },
                        { id: 20, text: '8', is_correct: false }
                    ]
                }
            ];
        }
        
        // Create local attempt
        const attemptId = Date.now();
        
        QuizSystem.currentQuiz = quizId;
        QuizSystem.currentAttemptId = attemptId;
        QuizSystem.questions = questions;
        QuizSystem.currentIndex = 0;
        QuizSystem.userAnswers = {};
        QuizSystem.startTime = Date.now();
        QuizSystem.timeLeft = questions.length * 60;
        QuizSystem.totalTime = questions.length * 60;
        QuizSystem.stats = { correct: 0, wrong: 0, score: 0 };
        QuizSystem.submittedAnswers = {};
        QuizSystem.answerResults = {};
        
        // Save attempt to localStorage
        const attempts = JSON.parse(localStorage.getItem('mathEase_quiz_attempts') || '[]');
        attempts.push({
            attempt_id: attemptId,
            quiz_id: quizId,
            start_time: new Date().toISOString(),
            completion_status: 'in_progress'
        });
        localStorage.setItem('mathEase_quiz_attempts', JSON.stringify(attempts));
        
        showQuizSystemModal();
        loadQuizSystemQuestion(0);
        startQuizSystemTimer();
        
    } catch (error) {
        console.error('❌ Error starting quiz:', error);
        alert('Failed to start quiz: ' + error.message);
    }
}

function showQuizSystemModal() {
    const modal = document.getElementById('quizModal');
    if (!modal) return;
    
    document.getElementById('quizModalTitle').textContent = 'MathEase Quiz';
    
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    const optionsGrid = document.getElementById('quizOptionsGridModal');
    if (optionsGrid) {
        optionsGrid.style.overflowY = 'auto';
        optionsGrid.style.maxHeight = '450px';
        optionsGrid.style.padding = '10px';
    }
    
    document.getElementById('submitQuizBtn').style.display = 'none';
}

function loadQuizSystemQuestion(index) {
    if (!QuizSystem.questions || QuizSystem.questions.length === 0) return;
    
    const question = QuizSystem.questions[index];
    QuizSystem.currentIndex = index;
    
    document.getElementById('quizCurrentNum').textContent = index + 1;
    document.getElementById('quizTotalNum').textContent = QuizSystem.questions.length;
    document.getElementById('quizQuestionTextModal').textContent = question.question_text || 'Question text not available';
    
    updateQuizSystemProgressDots();
    
    const allAnswered = QuizSystem.questions.every((q, i) => 
        QuizSystem.userAnswers[q.question_id || i] !== undefined
    );
    
    const submitBtn = document.getElementById('submitQuizBtn');
    if (submitBtn) {
        if (index === QuizSystem.questions.length - 1 || allAnswered) {
            submitBtn.style.display = 'block';
        } else {
            submitBtn.style.display = 'none';
        }
    }
    
    const optionsGrid = document.getElementById('quizOptionsGridModal');
    if (!optionsGrid) return;
    
    optionsGrid.innerHTML = '';
    
    if (question.options && question.options.length > 0) {
        question.options.forEach((option, i) => {
            const optionId = option.id || i + 1;
            const optionText = option.text || option.option_text || `Option ${String.fromCharCode(65 + i)}`;
            const letter = String.fromCharCode(65 + i);
            const questionId = question.question_id || index;
            const isSelected = QuizSystem.userAnswers[questionId] == optionId;
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option-modal' + (isSelected ? ' selected' : '');
            optionDiv.setAttribute('data-option-id', optionId);
            optionDiv.setAttribute('data-question-id', questionId);
            
            optionDiv.innerHTML = `
                <div class="option-letter" style="
                    width: 30px; height: 30px; border: 2px solid #7a0000; border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center; font-weight: bold;
                    background: ${isSelected ? '#7a0000' : 'transparent'}; 
                    color: ${isSelected ? 'white' : '#7a0000'};
                ">
                    ${letter}
                </div>
                <div style="flex: 1; font-size: 16px;">${optionText}</div>
            `;
            
            optionDiv.addEventListener('click', function() {
                document.querySelectorAll('.quiz-option-modal').forEach(opt => {
                    opt.classList.remove('selected');
                    opt.querySelector('.option-letter').style.background = 'transparent';
                    opt.querySelector('.option-letter').style.color = '#7a0000';
                });
                
                this.classList.add('selected');
                this.querySelector('.option-letter').style.background = '#7a0000';
                this.querySelector('.option-letter').style.color = 'white';
                
                const questionId = question.question_id || index;
                const optionId = this.getAttribute('data-option-id');
                
                saveAnswerAndContinue(questionId, optionId);
            });
            
            optionsGrid.appendChild(optionDiv);
        });
    } else {
        optionsGrid.innerHTML = '<p class="no-options">No options available for this question.</p>';
    }
}

function updateQuizSystemProgressDots() {
    const dotsContainer = document.getElementById('quizProgressDotsModal');
    if (!dotsContainer || !QuizSystem.questions) return;
    
    let dotsHTML = '';
    QuizSystem.questions.forEach((q, i) => {
        const questionId = q.question_id || i;
        const isAnswered = QuizSystem.userAnswers[questionId] !== undefined;
        const isCurrent = i === QuizSystem.currentIndex;
        
        dotsHTML += `
            <div style="
                width: 12px; 
                height: 12px; 
                border-radius: 50%; 
                background: ${isAnswered ? '#7a0000' : (isCurrent ? '#ff6b6b' : '#ddd')};
                cursor: pointer;
                transition: all 0.3s;
                transform: ${isCurrent ? 'scale(1.2)' : 'scale(1)'};
            " onclick="jumpToQuizQuestion(${i})"></div>
        `;
    });
    
    dotsContainer.innerHTML = dotsHTML;
}

window.jumpToQuizQuestion = function(index) {
    if (index >= 0 && index < QuizSystem.questions.length) {
        loadQuizSystemQuestion(index);
    }
};

async function saveAnswerAndContinue(questionId, answer) {
    try {
        QuizSystem.userAnswers[questionId] = answer;
        
        QuizSystem.submittedAnswers = QuizSystem.submittedAnswers || {};
        QuizSystem.submittedAnswers[questionId] = true;
        
        updateQuizSystemProgressDots();
        
        if (QuizSystem.currentIndex < QuizSystem.questions.length - 1) {
            setTimeout(() => {
                loadQuizSystemQuestion(QuizSystem.currentIndex + 1);
            }, 300);
        } else {
            const submitBtn = document.getElementById('submitQuizBtn');
            if (submitBtn) submitBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('Error saving answer:', error);
    }
}

function startQuizSystemTimer() {
    if (QuizSystem.timerInterval) {
        clearInterval(QuizSystem.timerInterval);
    }
    
    QuizSystem.timerInterval = setInterval(() => {
        if (QuizSystem.timeLeft > 0) {
            QuizSystem.timeLeft--;
            
            const minutes = Math.floor(QuizSystem.timeLeft / 60);
            const seconds = QuizSystem.timeLeft % 60;
            
            const timerDisplay = document.getElementById('quizTimerDisplay');
            if (timerDisplay) {
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (QuizSystem.timeLeft <= 0) {
                clearInterval(QuizSystem.timerInterval);
                submitQuizSystem();
            }
        }
    }, 1000);
}

async function submitQuizSystem() {
    console.log('📝 Submitting quiz...');
    
    try {
        if (QuizSystem.timerInterval) {
            clearInterval(QuizSystem.timerInterval);
            QuizSystem.timerInterval = null;
        }
        
        const timeSpentSeconds = Math.floor((Date.now() - QuizSystem.startTime) / 1000);
        
        let correctCount = 0;
        let totalQuestions = QuizSystem.questions.length;
        
        QuizSystem.questions.forEach((q, index) => {
            const questionId = q.question_id || index;
            const userAnswer = QuizSystem.userAnswers[questionId];
            
            if (userAnswer !== undefined && q.options) {
                const correctOption = q.options.find(opt => opt.is_correct === true);
                if (correctOption && userAnswer == correctOption.id) {
                    correctCount++;
                }
            }
        });
        
        const wrongCount = totalQuestions - correctCount;
        const score = Math.round((correctCount / totalQuestions) * 100);
        const pointsEarned = correctCount * 10;
        
        // Save attempt to localStorage as completed
        const attempts = JSON.parse(localStorage.getItem('mathEase_quiz_attempts') || '[]');
        const attemptIndex = attempts.findIndex(a => a.attempt_id === QuizSystem.currentAttemptId);
        if (attemptIndex !== -1) {
            attempts[attemptIndex].completion_status = 'completed';
            attempts[attemptIndex].score = score;
            attempts[attemptIndex].correct_answers = correctCount;
            attempts[attemptIndex].time_spent_seconds = timeSpentSeconds;
            attempts[attemptIndex].end_time = new Date().toISOString();
            localStorage.setItem('mathEase_quiz_attempts', JSON.stringify(attempts));
        }
        
        // Update user progress
        const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
        progress.quizScore = Math.max(progress.quizScore || 0, score);
        progress.quizAttempts = (progress.quizAttempts || 0) + 1;
        localStorage.setItem('mathEase_progress', JSON.stringify(progress));
        
        const quizContainer = document.getElementById('quizContainer');
        const resultsContainer = document.getElementById('quizResultsContainer');
        
        if (quizContainer) quizContainer.style.display = 'none';
        if (resultsContainer) {
            resultsContainer.style.display = 'block';
            
            resultsContainer.innerHTML = `
                <div class="modal-body" style="padding: 20px; background: white; border-radius: 12px;">
                    <div style="text-align: center; max-width: 400px; margin: 0 auto;">
                        
                        <div style="
                            width: 80px;
                            height: 80px;
                            background: ${score >= 75 ? '#27ae60' : '#e74c3c'}20;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 15px;
                            border: 3px solid ${score >= 75 ? '#27ae60' : '#e74c3c'};
                        ">
                            <i class="fas ${score >= 75 ? 'fa-trophy' : 'fa-smile'}" style="font-size: 40px; color: ${score >= 75 ? '#27ae60' : '#e74c3c'};"></i>
                        </div>
                        
                        <h2 style="color: #2c3e50; margin-bottom: 10px;">Quiz Completed!</h2>
                        
                        <div style="position: relative; width: 150px; height: 150px; margin: 15px auto;">
                            <svg viewBox="0 0 36 36" style="width: 150px; height: 150px;">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                      fill="none" stroke="#e0e0e0" stroke-width="3"></path>
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                      fill="none" stroke="${score >= 75 ? '#27ae60' : '#e74c3c'}" stroke-width="3" 
                                      stroke-dasharray="${score}, 100" stroke-linecap="round"></path>
                            </svg>
                            <div style="
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                font-size: 36px;
                                font-weight: bold;
                                color: ${score >= 75 ? '#27ae60' : '#e74c3c'};
                            ">
                                ${score}%
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 10px; color: white;">
                                <div style="font-size: 28px; font-weight: bold;">${correctCount}</div>
                                <div style="font-size: 12px;">Correct</div>
                            </div>
                            <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 15px; border-radius: 10px; color: white;">
                                <div style="font-size: 28px; font-weight: bold;">${wrongCount}</div>
                                <div style="font-size: 12px;">Wrong</div>
                            </div>
                            <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 15px; border-radius: 10px; color: white;">
                                <div style="font-size: 28px; font-weight: bold;">${totalQuestions}</div>
                                <div style="font-size: 12px;">Total</div>
                            </div>
                            <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 15px; border-radius: 10px; color: white;">
                                <div style="font-size: 28px; font-weight: bold;">${Math.floor(timeSpentSeconds/60)}:${(timeSpentSeconds%60).toString().padStart(2,'0')}</div>
                                <div style="font-size: 12px;">Time</div>
                            </div>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 15px 0;">
                            <div style="font-size: 20px; font-weight: bold; color: #7a0000;">+${pointsEarned}</div>
                            <div style="font-size: 12px; color: #666;">Points Earned</div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                            <button onclick="closeQuizSystemModal()" class="btn-secondary" 
                                    style="padding: 10px 20px; border: 2px solid #7a0000; background: white; color: #7a0000; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-times"></i> Close
                            </button>
                            <button onclick="window.location.reload()" class="btn-primary" 
                                    style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-tachometer-alt"></i> Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        updateQuizStats();
        
    } catch (error) {
        console.error('❌ Error submitting quiz:', error);
        alert('Error submitting quiz. Please try again.');
    }
}

function closeQuizSystemModal() {
    const modal = document.getElementById('quizModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    
    if (QuizSystem.timerInterval) {
        clearInterval(QuizSystem.timerInterval);
        QuizSystem.timerInterval = null;
    }
    
    const quizInterface = document.getElementById('quizInterfaceContainer');
    const quizCards = document.getElementById('userQuizzesContainer');
    const leaderboardContainer = document.getElementById('leaderboardContainer');
    
    if (quizInterface) {
        quizInterface.classList.add('hidden');
        quizInterface.style.display = 'none';
    }
    
    if (quizCards) {
        quizCards.classList.remove('hidden');
        quizCards.style.display = 'block';
    }
    
    if (leaderboardContainer) {
        leaderboardContainer.classList.remove('hidden');
        leaderboardContainer.style.display = 'block';
    }
    
    QuizSystem.currentQuiz = null;
    QuizSystem.currentAttemptId = null;
    QuizSystem.questions = [];
    QuizSystem.currentIndex = 0;
    QuizSystem.userAnswers = {};
    QuizSystem.startTime = null;
    QuizSystem.timeLeft = 0;
    QuizSystem.stats = { correct: 0, wrong: 0, score: 0 };
}

window.exitQuiz = function() {
    closeQuizSystemModal();
};

// ============================================
// ✅ ADD LEADERBOARD FUNCTIONS
// ============================================

function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    
    // Get current user
    const userJson = localStorage.getItem('mathEase_user');
    let currentUser = null;
    if (userJson) {
        try {
            currentUser = JSON.parse(userJson);
        } catch (e) {}
    }
    
    // Get attempts from localStorage
    const attempts = JSON.parse(localStorage.getItem('mathEase_quiz_attempts') || '[]');
    const completedAttempts = attempts.filter(a => a.completion_status === 'completed');
    
    // Group by user (in localStorage, we only have one user)
    const userScores = [];
    
    if (completedAttempts.length > 0) {
        // Calculate best score
        const bestScore = Math.max(...completedAttempts.map(a => a.score || 0));
        
        userScores.push({
            user_id: currentUser?.id || 1,
            username: currentUser?.username || 'You',
            full_name: currentUser?.full_name || 'You',
            total_points: bestScore,
            quizzes_completed: completedAttempts.length,
            highest_score: bestScore,
            avg_score: bestScore
        });
    }
    
    // Add some sample data for demonstration
    if (userScores.length === 0) {
        userScores.push(
            {
                user_id: 1,
                username: 'Maria Santos',
                full_name: 'Maria Santos',
                total_points: 85,
                quizzes_completed: 1,
                highest_score: 85,
                avg_score: 85
            },
            {
                user_id: 2,
                username: 'Juan Dela Cruz',
                full_name: 'Juan Dela Cruz',
                total_points: 70,
                quizzes_completed: 1,
                highest_score: 70,
                avg_score: 70
            }
        );
        
        if (currentUser) {
            userScores.unshift({
                user_id: currentUser.id || 999,
                username: currentUser.username || 'You',
                full_name: currentUser.full_name || 'You',
                total_points: 0,
                quizzes_completed: 0,
                highest_score: 0,
                avg_score: 0
            });
        }
    }
    
    // Sort by highest score
    userScores.sort((a, b) => b.highest_score - a.highest_score);
    
    let html = '';
    
    userScores.forEach((entry, index) => {
        const isCurrentUser = entry.user_id === (currentUser?.id || 999);
        const rankClass = index === 0 ? 'first' : 
                        index === 1 ? 'second' : 
                        index === 2 ? 'third' : '';
        
        let rankDisplay = index + 1;
        if (index === 0) rankDisplay = '🥇';
        else if (index === 1) rankDisplay = '🥈';
        else if (index === 2) rankDisplay = '🥉';
        
        html += `
            <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                <div class="leaderboard-rank ${rankClass}">${rankDisplay}</div>
                <div class="leaderboard-user">
                    <div class="leaderboard-user-name">${entry.full_name || entry.username}</div>
                    <div class="leaderboard-user-stats">
                        <span class="leaderboard-stat">
                            <i class="fas fa-star"></i> ${entry.total_points} pts
                        </span>
                        <span class="leaderboard-stat">
                            <i class="fas fa-trophy"></i> ${entry.quizzes_completed} quizzes
                        </span>
                        <span class="leaderboard-stat">
                            <i class="fas fa-chart-line"></i> ${entry.avg_score}% avg
                        </span>
                    </div>
                </div>
                <div class="leaderboard-score">${entry.highest_score}%</div>
            </div>
        `;
    });
    
    leaderboardList.innerHTML = html;
}

// ============================================
// ✅ UPDATE QUIZ STATS FUNCTION
// ============================================

function updateQuizStats() {
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    const quizScore = progress.quizScore || 0;
    const quizAttempts = progress.quizAttempts || 0;
    
    document.getElementById('quizCurrentScore').textContent = quizScore + '%';
    document.getElementById('quizAccuracy').textContent = (quizAttempts > 0 ? quizScore : 0) + '%';
    document.getElementById('quizTimeSpent').textContent = '0m';
    document.getElementById('quizRank').textContent = quizAttempts > 0 ? '#12' : '#--';
}

// ============================================
// ✅ UPDATE LOAD QUIZZES FUNCTION
// ============================================

function loadQuizzes() {
    const container = document.getElementById('userQuizzesContainer');
    if (!container) return;
    
    const progress = JSON.parse(localStorage.getItem('mathEase_progress') || '{}');
    const completedTopics = progress.completedTopics?.length || 0;
    const canTakeQuiz = completedTopics >= 5;
    
    if (!canTakeQuiz) {
        container.innerHTML = `
            <div class="card" style="padding: 30px; text-align: center;">
                <i class="fas fa-lock" style="font-size: 50px; color: #ccc; margin-bottom: 15px;"></i>
                <h3>Quiz Locked</h3>
                <p>Complete all 5 topics to unlock the Lesson 1 Assessment.</p>
                <p>Topics completed: ${completedTopics}/5</p>
                <button class="btn-primary" onclick="navigateTo('practice')" style="margin-top: 15px;">
                    <i class="fas fa-pencil-alt"></i> Go to Practice
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="card full-width-card">
            <div class="card-header">
                <h2 class="card-title">
                    <i class="fas fa-question-circle"></i> Lesson 1 Assessment
                </h2>
                <p class="card-subtitle">Test your knowledge of basic mathematical operations</p>
            </div>
            
            <div style="padding: 20px 25px;">
                <div class="quiz-category-card" style="display: flex; align-items: center; gap: 20px; background: #f8f9fa; border-radius: 12px; padding: 20px;">
                    <div style="width: 60px; height: 60px; background: #8B0000; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 5px 0;">Lesson 1 Assessment</h3>
                        <p style="margin: 0; color: #666;">5 questions • 70% to pass</p>
                    </div>
                    <button class="btn-primary" id="startQuizBtn" style="width: auto; margin: 0; padding: 12px 25px;">
                        <i class="fas fa-play"></i> Start Quiz
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('startQuizBtn')?.addEventListener('click', () => {
        startQuizSystem(1);
    });
}
// ============================================
// INITIALIZATION
// ============================================
// ============================================
// COMPLETE DOMContentLoaded FUNCTION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('MathEase DOM Content Loaded - Applying fixes...');
    
    // Initialize the main app
    initApp();
    
    // ============================================
    // Setup App Selection to prevent login loop
    // ============================================
    function setupAppSelection() {
        const appCards = document.querySelectorAll('.app-card');
        appCards.forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            newCard.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const app = this.getAttribute('data-app');
                console.log('App selected:', app);
                
                if (app === 'mathease') {
                    const savedUser = localStorage.getItem('mathEase_user');
                    const token = localStorage.getItem('authToken');
                    
                    if (savedUser && token) {
                        try {
                            AppState.currentUser = JSON.parse(savedUser);
                            AppState.isAuthenticated = true;
                            authToken = token;
                            navigateTo('dashboard');
                        } catch (error) {
                            navigateTo('login');
                        }
                    } else {
                        navigateTo('login');
                    }
                } else if (app === 'polylearn') {
                    window.location.href = '../index.html';
                } else if (app === 'factolearn') {
                    window.location.href = '../FactoLearn/factolearn.html';
                }
            });
        });
    }
    
    setupAppSelection();
    
    // ============================================
    // Clean up any stray modals on page load
    // ============================================
    function cleanupModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            const allowedModals = ['logoutModal', 'forgotPasswordModal', 'resetPasswordModal', 'quizModal'];
            
            if (!modal.id || !allowedModals.includes(modal.id)) {
                modal.style.display = 'none';
            } else {
                modal.style.display = 'none';
            }
        });
        document.body.classList.remove('modal-open');
    }
    
    cleanupModals();
    
    // ============================================
    // Ensure footer buttons are responsive
    // ============================================
    function fixFooterButtons() {
        const hamburgerBtn = document.getElementById('footerHamburgerBtn');
        if (hamburgerBtn) {
            const newHamburger = hamburgerBtn.cloneNode(true);
            hamburgerBtn.parentNode.replaceChild(newHamburger, hamburgerBtn);
            
            newHamburger.addEventListener('click', function(e) {
                e.preventDefault();
                
                const overlay = document.getElementById('mobileMenuOverlay');
                const panel = document.getElementById('mobileMenuPanel');
                
                if (overlay && panel) {
                    overlay.classList.toggle('active');
                    panel.classList.toggle('active');
                    document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
                }
            });
        }
        
        document.querySelectorAll('.footer-nav-item').forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', function(e) {
                e.preventDefault();
                
                const page = this.getAttribute('data-page');
                
                if (page) {
                    switch(page) {
                        case 'dashboard':
                            showDashboard(e);
                            break;
                        case 'practice':
                            showPracticeDashboard(e);
                            break;
                        case 'quiz':
                            showQuizDashboard(e);
                            break;
                        case 'settings':
                            showSettingsPage(e);
                            break;
                        default:
                            navigateTo(page);
                    }
                }
            });
        });
    }
    
    fixFooterButtons();
    
    // ============================================
    // Enhanced Logout Modal Functions
    // ============================================
    window.showLogoutConfirmation = function() {
        const overlay = document.getElementById('mobileMenuOverlay');
        const panel = document.getElementById('mobileMenuPanel');
        if (overlay && panel) {
            overlay.classList.remove('active');
            panel.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        let modal = document.getElementById('logoutModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'logoutModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-container" style="max-width: 380px; width: 90%; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div class="modal-header" style="background: #8B0000; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: white; font-size: 18px;"><i class="fas fa-sign-out-alt"></i> Confirm Logout</h3>
                        <button class="modal-close" onclick="closeLogoutModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                    </div>
                    
                    <div class="modal-body" style="padding: 25px; text-align: center;">
                        <div style="width: 70px; height: 70px; background: #f8f9fa; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 35px; color: #8B0000;"></i>
                        </div>
                        
                        <h4 style="margin: 0 0 8px; color: #2c3e50;">Are you sure you want to logout?</h4>
                        <p style="color: #7f8c8d; margin-bottom: 20px;">Your progress is automatically saved.</p>
                        
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button onclick="closeLogoutModal()" class="btn-secondary" style="padding: 10px 20px; margin: 0; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button onclick="confirmLogout()" class="btn-primary" style="padding: 10px 20px; margin: 0; background: #8B0000; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        document.querySelectorAll('.modal-overlay').forEach(m => {
            if (m.id !== 'logoutModal') {
                m.style.display = 'none';
            }
        });
        
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    };
    
    window.closeLogoutModal = function() {
        const modal = document.getElementById('logoutModal');
        if (modal) {
            modal.style.display = 'none';
        }
        document.body.classList.remove('modal-open');
    };
    
    window.confirmLogout = function() {
        closeLogoutModal();
        logoutAndRedirect();
    };
    
    // ============================================
    // Escape key handling
    // ============================================
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const logoutModal = document.getElementById('logoutModal');
            if (logoutModal && logoutModal.style.display === 'flex') {
                closeLogoutModal();
            }
            
            const forgotModal = document.getElementById('forgotPasswordModal');
            if (forgotModal && forgotModal.style.display === 'flex') {
                closeForgotPasswordModal();
            }
            
            const quizModal = document.getElementById('quizModal');
            if (quizModal && quizModal.style.display === 'flex') {
                closeQuizSystemModal();
            }
        }
    });
    
    // ============================================
    // Ensure tool buttons work properly
    // ============================================
    setTimeout(connectToolButtons, 500);
    setTimeout(connectToolButtons, 1000);
    
    // ============================================
    // Setup feedback form
    // ============================================
    setupFeedbackForm();
    
    // ============================================
    // Fix for mobile menu items
    // ============================================
    document.querySelectorAll('.mobile-menu-item').forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            
            const onclick = this.getAttribute('onclick');
            if (onclick) {
                const overlay = document.getElementById('mobileMenuOverlay');
                const panel = document.getElementById('mobileMenuPanel');
                if (overlay && panel) {
                    overlay.classList.remove('active');
                    panel.classList.remove('active');
                    document.body.style.overflow = '';
                }
                
                if (onclick.includes('showLogoutConfirmation')) {
                    showLogoutConfirmation();
                } else if (onclick.includes('showDashboard')) {
                    showDashboard(e);
                } else if (onclick.includes('showPracticeDashboard')) {
                    showPracticeDashboard(e);
                } else if (onclick.includes('showQuizDashboard')) {
                    showQuizDashboard(e);
                } else if (onclick.includes('showProgressPage')) {
                    showProgressPage(e);
                } else if (onclick.includes('showFeedbackPage')) {
                    showFeedbackPage(e);
                } else if (onclick.includes('showSettingsPage')) {
                    showSettingsPage(e);
                } else if (onclick.includes('goToModuleDashboard')) {
                    goToLesson1(e);
                }
            }
        });
    });
    
    // ============================================
    // Handle forgot password links
    // ============================================
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        const newLink = forgotPasswordLink.cloneNode(true);
        forgotPasswordLink.parentNode.replaceChild(newLink, forgotPasswordLink);
        
        newLink.addEventListener('click', function(e) {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }
    
    // ============================================
    // Expose necessary functions to window
    // ============================================
    window.showDashboard = showDashboard;
    window.showPracticeDashboard = showPracticeDashboard;
    window.showQuizDashboard = showQuizDashboard;
    window.showProgressPage = showProgressPage;
    window.showFeedbackPage = showFeedbackPage;
    window.showSettingsPage = showSettingsPage;
    window.goToLesson1 = goToLesson1;
    
    window.showSection = showSection;
    window.saveSettings = saveSettings;
    window.rate = rate;
    window.toggleFAQ = toggleFAQ;
    
    window.showForgotPasswordModal = showForgotPasswordModal;
    window.closeForgotPasswordModal = closeForgotPasswordModal;
    window.requestPasswordReset = requestPasswordReset;
    window.copyResetLink = copyResetLink;
    
    window.submitQuizSystem = submitQuizSystem;
    window.exitQuiz = exitQuiz;
    window.closeQuizSystemModal = closeQuizSystemModal;
    
    window.restartQuiz = function() {
        document.getElementById('quizResults')?.classList.add('hidden');
        startQuizSystem(1);
    };
    
    window.closeQuizPopup = function() {
        document.getElementById('quizPopup')?.classList.add('hidden');
    };
    
    console.log('MathEase DOMContentLoaded fixes applied successfully');
});
