// MathEase Lesson 1 - Complete JavaScript
// Introduction to Polynomials

// ============================================
// LESSON DATA
// ============================================
const LESSON_ID = 1;
const LESSON_TITLE = 'Introduction to Polynomials';
const VIDEO_DURATION = 600; // 10 minutes in seconds

// API Base URL
const API_BASE_URL = 'https://backend-matheastest-production.up.railway.app';

// ============================================
// APP STATE
// ============================================
let authToken = localStorage.getItem('authToken') || null;

const AppState = {
    currentUser: null,
    currentPage: 'loading',
    isAuthenticated: false,
    previousPage: null
};

// ============================================
// LESSON PROGRESS TRACKING
// ============================================
let lessonProgress = {
    percentage: 0,
    currentTime: 0,
    completed: false,
    lastAccessed: new Date().toISOString()
};

// Load saved progress
function loadProgress() {
    const saved = localStorage.getItem(`lesson_${LESSON_ID}_progress`);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            lessonProgress = { ...lessonProgress, ...parsed };
            updateProgressDisplay();
        } catch (e) {
            console.log('No saved progress');
        }
    }
}

// Save progress
function saveProgress() {
    localStorage.setItem(`lesson_${LESSON_ID}_progress`, JSON.stringify(lessonProgress));
    console.log('Progress saved:', lessonProgress);
}

// Update progress display
function updateProgressDisplay() {
    const progressCircle = document.getElementById('progressCircle');
    const percentageSpan = document.getElementById('progressPercentage');
    
    if (progressCircle) {
        progressCircle.style.background = `conic-gradient(#27ae60 ${lessonProgress.percentage}%, rgba(255,255,255,0.2) ${lessonProgress.percentage}%)`;
    }
    
    if (percentageSpan) {
        percentageSpan.textContent = lessonProgress.percentage + '%';
    }
    
    const completeBtn = document.getElementById('completeLessonBtn');
    if (completeBtn) {
        if (lessonProgress.completed) {
            completeBtn.innerHTML = '<i class="fas fa-check"></i> Lesson Completed';
            completeBtn.classList.remove('btn-primary');
            completeBtn.classList.add('btn-success');
            completeBtn.disabled = true;
        } else {
            completeBtn.innerHTML = '<i class="fas fa-check-circle"></i> Mark Lesson Complete';
            completeBtn.classList.remove('btn-success');
            completeBtn.classList.add('btn-primary');
            completeBtn.disabled = false;
        }
    }
}

// ============================================
// VIDEO PLAYER
// ============================================
function initVideoPlayer() {
    const video = document.getElementById('lessonVideo');
    const currentTimeSpan = document.getElementById('currentTime');
    const durationSpan = document.getElementById('duration');
    const progressFill = document.getElementById('videoProgressFill');
    const restartBtn = document.getElementById('restartVideoBtn');
    const markCompleteBtn = document.getElementById('markCompleteBtn');
    
    if (!video) return;
    
    // Load saved time
    if (lessonProgress.currentTime > 0 && !lessonProgress.completed) {
        video.currentTime = lessonProgress.currentTime;
    }
    
    // Update time display
    video.addEventListener('timeupdate', function() {
        const current = video.currentTime;
        const duration = video.duration || VIDEO_DURATION;
        
        // Format time
        const currentMin = Math.floor(current / 60);
        const currentSec = Math.floor(current % 60);
        const durationMin = Math.floor(duration / 60);
        const durationSec = Math.floor(duration % 60);
        
        currentTimeSpan.textContent = `${currentMin}:${currentSec.toString().padStart(2,'0')}`;
        durationSpan.textContent = `${durationMin}:${durationSec.toString().padStart(2,'0')}`;
        
        // Update video time display in header
        const videoTime = document.getElementById('videoTime');
        if (videoTime) {
            videoTime.textContent = `${currentMin}:${currentSec.toString().padStart(2,'0')} / ${durationMin}:${durationSec.toString().padStart(2,'0')}`;
        }
        
        // Update progress bar
        const percentage = (current / duration) * 100;
        progressFill.style.width = percentage + '%';
        
        // Update lesson progress
        lessonProgress.currentTime = current;
        lessonProgress.percentage = Math.floor(percentage);
        
        updateProgressDisplay();
        
        // Auto-save every 5 seconds
        if (Math.floor(current) % 5 === 0) {
            saveProgress();
        }
    });
    
    // Video ended
    video.addEventListener('ended', function() {
        showNotification('Video completed! Mark the lesson as complete.', 'success');
    });
    
    // Restart button
    if (restartBtn) {
        restartBtn.addEventListener('click', function() {
            video.currentTime = 0;
            video.play();
        });
    }
    
    // Mark complete button
    if (markCompleteBtn) {
        markCompleteBtn.addEventListener('click', function() {
            if (video.duration) {
                video.currentTime = video.duration - 1;
            }
            showNotification('Lesson ready to be marked complete!', 'info');
        });
    }
}

// ============================================
// TOOL MANAGEMENT
// ============================================

// Open tool modal
function openToolModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Close tool modal
window.closeToolModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
};

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        e.target.style.display = 'none';
        document.body.style.overflow = '';
    }
});

// Close with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(function(modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
    }
});

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
        
        const buttonsHtml = buttons.map(function(row) {
            return row.map(function(btn) {
                let className = 'calc-btn';
                if (['+', '-', '×', '÷', '%'].includes(btn)) className += ' operator';
                if (btn === '=') className += ' equals';
                if (btn === 'C') className += ' clear';
                if (btn === '⌫') className += ' backspace';
                return `<button class="${className}" data-value="${btn}">${btn}</button>`;
            }).join('');
        }).join('');
        
        const container = document.getElementById('calcButtons');
        if (container) {
            container.innerHTML = buttonsHtml;
            
            container.querySelectorAll('button').forEach((btn) => {
                btn.addEventListener('click', () => {
                    this.handleButton(btn.getAttribute('data-value'));
                });
            });
        }
        
        this.updateDisplay();
    }
    
    handleButton(value) {
        switch(value) {
            case 'C':
                this.display = '0';
                this.expression = '';
                break;
            case '⌫':
                this.display = this.display.length > 1 ? this.display.slice(0, -1) : '0';
                break;
            case '=':
                this.calculate();
                break;
            case '÷':
                this.expression += '/';
                this.display += '÷';
                break;
            case '×':
                this.expression += '*';
                this.display += '×';
                break;
            default:
                if (this.display === '0' && !isNaN(value)) {
                    this.display = value;
                    this.expression = value;
                } else {
                    this.display += value;
                    this.expression += value;
                }
        }
        this.updateDisplay();
    }
    
    calculate() {
        try {
            let expr = this.expression;
            if (!expr) return;
            
            const result = eval(expr);
            
            this.history.unshift({
                expression: this.display,
                result: result,
                time: new Date().toLocaleTimeString()
            });
            
            if (this.history.length > 5) {
                this.history.pop();
            }
            
            this.display = result.toString();
            this.expression = result.toString();
            this.updateHistory();
            this.saveHistory();
            
        } catch (e) {
            this.display = 'Error';
            setTimeout(() => {
                this.display = '0';
                this.expression = '';
                this.updateDisplay();
            }, 1000);
        }
    }
    
    updateDisplay() {
        const displayEl = document.getElementById('calcDisplay');
        if (displayEl) displayEl.textContent = this.display;
    }
    
    updateHistory() {
        const historyEl = document.getElementById('calcHistory');
        if (!historyEl) return;
        
        if (this.history.length === 0) {
            historyEl.innerHTML = '<div class="history-empty">No calculations yet</div>';
            return;
        }
        
        historyEl.innerHTML = this.history.map(function(item) {
            return `
                <div class="history-item">
                    <span>${item.expression}</span>
                    <span style="font-weight: bold;">= ${item.result}</span>
                </div>
            `;
        }).join('');
    }
    
    loadHistory() {
        const saved = localStorage.getItem('calculator_history');
        if (saved) {
            try {
                this.history = JSON.parse(saved);
                this.updateHistory();
            } catch (e) {}
        }
    }
    
    saveHistory() {
        localStorage.setItem('calculator_history', JSON.stringify(this.history));
    }
}

// ============================================
// GRAPH TOOL
// ============================================
class GraphTool {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.expression = 'x^2 - 2x + 1';
    }
    
    onOpen() {
        setTimeout(() => {
            this.canvas = document.getElementById('graphCanvas');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.drawGrid();
                this.plotFunction();
                this.setupListeners();
            }
        }, 100);
    }
    
    setupListeners() {
        const plotBtn = document.getElementById('plotGraphBtn');
        const exprInput = document.getElementById('graphExpression');
        
        if (plotBtn) {
            plotBtn.addEventListener('click', () => {
                this.expression = exprInput?.value || 'x^2 - 2x + 1';
                this.plotFunction();
            });
        }
    }
    
    drawGrid() {
        if (!this.ctx || !this.canvas) return;
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.strokeStyle = '#ecf0f1';
        this.ctx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let x = 0; x <= w; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= h; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }
        
        // Draw axes
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, h/2);
        this.ctx.lineTo(w, h/2);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(w/2, 0);
        this.ctx.lineTo(w/2, h);
        this.ctx.stroke();
    }
    
    plotFunction() {
        if (!this.ctx || !this.canvas) return;
        
        this.drawGrid();
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        try {
            let expr = this.expression.replace(/\^/g, '**');
            
            const points = [];
            const steps = 100;
            
            for (let i = 0; i <= steps; i++) {
                const x = (i / steps) * 6 - 3;
                const y = this.evaluateFunction(x, expr);
                
                if (isFinite(y)) {
                    const px = (x + 3) * (w / 6);
                    const py = h/2 - (y * 30);
                    points.push({ x: px, y: py });
                }
            }
            
            this.ctx.strokeStyle = '#7a0000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            
            let first = true;
            points.forEach((point) => {
                if (point.y >= 0 && point.y <= h) {
                    if (first) {
                        this.ctx.moveTo(point.x, point.y);
                        first = false;
                    } else {
                        this.ctx.lineTo(point.x, point.y);
                    }
                } else {
                    first = true;
                }
            });
            
            this.ctx.stroke();
            
            this.findRoots(expr);
            
        } catch (e) {
            console.log('Error plotting:', e);
        }
    }
    
    evaluateFunction(x, expr) {
        try {
            const fn = new Function('x', 'return ' + expr);
            return fn(x);
        } catch (e) {
            return 0;
        }
    }
    
    findRoots(expr) {
        const rootsEl = document.getElementById('graphRoots');
        if (!rootsEl) return;
        
        let xIntercepts = [];
        let yIntercept = null;
        
        try {
            const yAtZero = this.evaluateFunction(0, expr);
            if (isFinite(yAtZero)) {
                yIntercept = yAtZero;
            }
        } catch (e) {}
        
        for (let x = -5; x <= 5; x += 0.1) {
            try {
                const y = this.evaluateFunction(x, expr);
                
                if (Math.abs(y) < 0.1) {
                    const roundedX = Math.round(x * 100) / 100;
                    if (!xIntercepts.includes(roundedX) && Math.abs(roundedX) <= 5) {
                        xIntercepts.push(roundedX);
                    }
                }
            } catch (e) {}
        }
        
        let html = '';
        
        if (xIntercepts.length > 0) {
            html += '<div class="roots-section"><h4>X-Intercepts:</h4><ul>';
            xIntercepts.sort((a,b) => a - b).forEach((root) => {
                html += `<li>x = ${root}</li>`;
            });
            html += '</ul></div>';
        }
        
        if (yIntercept !== null) {
            html += `<div class="roots-section"><h4>Y-Intercept:</h4><p>y = ${Math.round(yIntercept * 100) / 100}</p></div>`;
        }
        
        rootsEl.innerHTML = html || '<p>No intercepts found in visible range</p>';
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
        this.tool = 'pen';
        this.color = '#7a0000';
        this.lastX = 0;
        this.lastY = 0;
    }
    
    onOpen() {
        setTimeout(() => {
            this.canvas = document.getElementById('whiteboardCanvas');
            if (this.canvas) {
                this.setupCanvas();
                this.setupEventListeners();
            }
        }, 100);
    }
    
    setupCanvas() {
        this.ctx = this.canvas.getContext('2d');
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    setupEventListeners() {
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
                if (this.tool === 'pen') {
                    this.ctx.strokeStyle = this.color;
                }
            });
        }
    }
    
    startDrawing(e) {
        e.preventDefault();
        this.drawing = true;
        
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
    }
    
    draw(e) {
        e.preventDefault();
        if (!this.drawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        if (this.tool === 'pen') {
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();
        } else if (this.tool === 'eraser') {
            this.ctx.save();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 20;
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();
            this.ctx.restore();
        }
        
        this.lastX = currentX;
        this.lastY = currentY;
    }
    
    stopDrawing() {
        this.drawing = false;
        this.ctx.closePath();
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        this.drawing = true;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = touch.clientX - rect.left;
        this.lastY = touch.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.drawing) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;
        
        if (this.tool === 'pen') {
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();
        } else if (this.tool === 'eraser') {
            this.ctx.save();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 20;
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();
            this.ctx.restore();
        }
        
        this.lastX = currentX;
        this.lastY = currentY;
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.drawing = false;
        this.ctx.closePath();
    }
    
    setTool(tool) {
        this.tool = tool;
        if (tool === 'pen') {
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = 2;
        } else {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 20;
        }
    }
    
    clear() {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 2;
    }
}

// ============================================
// NOTEPAD TOOL
// ============================================
class Notepad {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes') || '[]');
    }
    
    onOpen() {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        if (notes.length > 0) {
            document.getElementById('noteTitle').value = notes[0].title || 'Polynomial Notes';
            document.getElementById('noteContent').value = notes[0].content || '';
        }
    }
    
    save() {
        const title = document.getElementById('noteTitle').value || 'Untitled';
        const content = document.getElementById('noteContent').value;
        
        if (!content) {
            alert('Please write something before saving');
            return;
        }
        
        const note = {
            id: Date.now(),
            title: title,
            content: content,
            lessonId: LESSON_ID,
            timestamp: new Date().toISOString()
        };
        
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        notes.unshift(note);
        
        if (notes.length > 10) notes.pop();
        
        localStorage.setItem('notes', JSON.stringify(notes));
        
        showNotification('Note saved successfully!', 'success');
    }
    
    clear() {
        document.getElementById('noteContent').value = '';
        document.getElementById('noteTitle').value = 'Polynomial Notes';
    }
}

// ============================================
// FORMULA SHEET TOOL
// ============================================
class FormulaSheet {
    constructor() {
        this.formulas = {
            polynomial: [
                { name: 'Quadratic Formula', formula: 'x = (-b ± √(b² - 4ac)) / 2a' },
                { name: 'Synthetic Division', formula: 'P(x) ÷ (x - r) = Q(x) + R/(x - r)' },
                { name: 'Factor Theorem', formula: 'If P(r) = 0, then (x - r) is a factor' },
                { name: 'Remainder Theorem', formula: 'P(r) = remainder when P(x) ÷ (x - r)' },
                { name: 'Degree of Polynomial', formula: 'deg(P(x)) = highest exponent' },
                { name: 'FOIL Method', formula: '(a + b)(c + d) = ac + ad + bc + bd' }
            ],
            algebra: [
                { name: 'FOIL Method', formula: '(a + b)(c + d) = ac + ad + bc + bd' },
                { name: 'Perfect Square', formula: '(a + b)² = a² + 2ab + b²' },
                { name: 'Difference of Squares', formula: 'a² - b² = (a - b)(a + b)' }
            ],
            quadratic: [
                { name: 'Quadratic Formula', formula: 'x = (-b ± √(b² - 4ac)) / 2a' },
                { name: 'Discriminant', formula: 'Δ = b² - 4ac' },
                { name: 'Sum of Roots', formula: 'x₁ + x₂ = -b/a' },
                { name: 'Product of Roots', formula: 'x₁ × x₂ = c/a' }
            ]
        };
    }
    
    onOpen() {
        this.showCategory('polynomial');
        this.setupCategoryButtons();
    }
    
    setupCategoryButtons() {
        const categoryBtns = document.querySelectorAll('.formula-category-btn');
        
        categoryBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const category = newBtn.textContent.toLowerCase();
                
                this.showCategory(category);
                
                document.querySelectorAll('.formula-category-btn').forEach(b => {
                    b.classList.remove('active');
                });
                newBtn.classList.add('active');
            });
        });
    }
    
    showCategory(category) {
        const listEl = document.getElementById('formulaList');
        if (!listEl) return;
        
        const categoryFormulas = this.formulas[category] || this.formulas.polynomial;
        
        listEl.innerHTML = categoryFormulas.map(f => `
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
        this.updateDisplay();
        this.setupListeners();
    }
    
    findTimerElement() {
        this.timerElement = document.getElementById('timerDisplay');
        if (!this.timerElement) {
            this.timerElement = document.querySelector('.timer-display');
        }
        return this.timerElement;
    }
    
    setupListeners() {
        document.getElementById('timerStartBtn')?.addEventListener('click', () => this.start());
        document.getElementById('timerPauseBtn')?.addEventListener('click', () => this.pause());
        document.getElementById('timerResetBtn')?.addEventListener('click', () => this.reset());
    }
    
    start() {
        if (!this.isRunning && this.timeLeft > 0) {
            this.isRunning = true;
            this.timerId = setInterval(() => {
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                    this.updateDisplay();
                    if (this.timeLeft === 0) {
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
        }
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
        
        document.querySelectorAll('.timer-preset').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.includes(minutes)) {
                btn.classList.add('active');
            }
        });
    }
    
    complete() {
        this.pause();
        showNotification('Study session complete! Great job! 🎉', 'success');
        this.reset();
    }
    
    updateDisplay() {
        if (!this.timerElement) this.findTimerElement();
        if (!this.timerElement) return;
        
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// ============================================
// TOOL MANAGER
// ============================================
class ToolManager {
    constructor() {
        this.tools = {};
        this.currentTool = null;
        this.init();
    }
    
    init() {
        this.initializeTools();
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
    
    startTimer() {
        if (this.tools.timer) this.tools.timer.start();
    }
    
    pauseTimer() {
        if (this.tools.timer) this.tools.timer.pause();
    }
    
    resetTimer() {
        if (this.tools.timer) this.tools.timer.reset();
    }
}

// Create global tool manager
window.toolManager = new ToolManager();

// Make tools globally available
window.Calculator = Calculator;
window.GraphTool = GraphTool;
window.Whiteboard = Whiteboard;
window.Notepad = Notepad;
window.FormulaSheet = FormulaSheet;
window.StudyTimer = StudyTimer;

// ============================================
// TOOL BUTTON CONNECTION
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
    
    tools.forEach(tool => {
        const btn = document.getElementById(tool.id);
        if (btn) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
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
                window.toolManager.openTool(toolName);
            });
        }
    });
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 100000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    notification.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ============================================
// HAMBURGER MENU
// ============================================
function initHamburgerMenu() {
    const hamburgerBtn = document.getElementById('footerHamburgerBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const menuOverlay = document.getElementById('mobileMenuOverlay');
    const menuPanel = document.getElementById('mobileMenuPanel');
    
    if (!hamburgerBtn || !menuOverlay || !menuPanel) return;
    
    const newBtn = hamburgerBtn.cloneNode(true);
    hamburgerBtn.parentNode.replaceChild(newBtn, hamburgerBtn);
    
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        menuOverlay.classList.add('active');
        menuPanel.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', function() {
            menuOverlay.classList.remove('active');
            menuPanel.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    menuOverlay.addEventListener('click', function() {
        menuOverlay.classList.remove('active');
        menuPanel.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    menuPanel.querySelectorAll('.mobile-menu-item').forEach(link => {
        link.addEventListener('click', function() {
            menuOverlay.classList.remove('active');
            menuPanel.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// ============================================
// COMPLETE LESSON BUTTON
// ============================================
function setupCompleteLessonButton() {
    const completeBtn = document.getElementById('completeLessonBtn');
    if (!completeBtn) return;
    
    const newBtn = completeBtn.cloneNode(true);
    completeBtn.parentNode.replaceChild(newBtn, completeBtn);
    
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (lessonProgress.completed) {
            showNotification('Lesson already completed!', 'info');
            return;
        }
        
        lessonProgress.completed = true;
        lessonProgress.percentage = 100;
        lessonProgress.currentTime = VIDEO_DURATION;
        
        saveProgress();
        updateProgressDisplay();
        
        showNotification('🎉 Congratulations! Lesson completed!', 'success');
        
        setTimeout(() => {
            document.getElementById('nextLessonBtn').disabled = false;
        }, 500);
    });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 MathEase Lesson 1 Initializing...');
    
    // Load progress
    loadProgress();
    
    // Initialize video player
    initVideoPlayer();
    
    // Initialize hamburger menu
    initHamburgerMenu();
    
    // Setup complete lesson button
    setupCompleteLessonButton();
    
    // Connect tool buttons
    setTimeout(connectToolButtons, 500);
    setTimeout(connectToolButtons, 1000);
    
    // Force show lesson dashboard
    setTimeout(() => {
        document.getElementById('loading-page')?.classList.add('hidden');
        document.getElementById('lesson-dashboard-page')?.classList.remove('hidden');
    }, 2000);
    
    // Skip loading button
    document.getElementById('skipLoading')?.addEventListener('click', function() {
        document.getElementById('loading-page')?.classList.add('hidden');
        document.getElementById('lesson-dashboard-page')?.classList.remove('hidden');
    });
    
    console.log('✅ MathEase Lesson 1 Ready!');
});

// ============================================
// NAVIGATION FUNCTIONS
// ============================================
window.showDashboard = function(e) {
    if (e) e.preventDefault();
    console.log('🏠 Showing lesson dashboard');
};

window.showPracticeDashboard = function(e) {
    if (e) e.preventDefault();
    showNotification('Practice coming soon!', 'info');
};

window.showProgressPage = function(e) {
    if (e) e.preventDefault();
    showNotification('Progress tracking coming soon!', 'info');
};

window.showFeedbackPage = function(e) {
    if (e) e.preventDefault();
    showNotification('Feedback coming soon!', 'info');
};

window.showSettingsPage = function(e) {
    if (e) e.preventDefault();
    showNotification('Settings coming soon!', 'info');
};

// ============================================
// LOGOUT FUNCTIONS
// ============================================
window.showLogoutConfirmation = function() {
    document.getElementById('logoutModal')?.classList.add('active');
    document.getElementById('logoutModal').style.display = 'flex';
};

window.closeLogoutModal = function() {
    document.getElementById('logoutModal')?.classList.remove('active');
    document.getElementById('logoutModal').style.display = 'none';
};

window.confirmLogout = function() {
    closeLogoutModal();
    showNotification('👋 See you next time!', 'info');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
};

// ============================================
// FORGOT PASSWORD FUNCTIONS
// ============================================
window.showForgotPasswordModal = function() {
    document.getElementById('forgotPasswordModal')?.classList.add('active');
    document.getElementById('forgotPasswordModal').style.display = 'flex';
    
    document.getElementById('forgotStep1').style.display = 'block';
    document.getElementById('forgotStep2').style.display = 'none';
};

window.closeForgotPasswordModal = function() {
    document.getElementById('forgotPasswordModal')?.classList.remove('active');
    document.getElementById('forgotPasswordModal').style.display = 'none';
};

window.requestPasswordReset = function() {
    const email = document.getElementById('resetEmail').value;
    if (!email) {
        document.getElementById('forgotError').style.display = 'block';
        document.getElementById('forgotError').textContent = 'Please enter your email';
        return;
    }
    
    document.getElementById('forgotStep1').style.display = 'none';
    document.getElementById('forgotStep2').style.display = 'block';
    document.getElementById('resetEmailDisplay').textContent = `Email: ${email}`;
    document.getElementById('resetLinkDisplay').textContent = `https://mathease.com/reset?token=${Date.now()}`;
};

window.copyResetLink = function() {
    const link = document.getElementById('resetLinkDisplay').textContent;
    navigator.clipboard.writeText(link);
    showNotification('Reset link copied!', 'success');
};

// ============================================
// LOGIN/SIGNUP SWITCH
// ============================================
document.getElementById('switchToSignup')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('signup-page').classList.remove('hidden');
});

document.getElementById('switchToLogin')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('signup-page').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
});

// Forgot password link
document.getElementById('forgotPasswordLink')?.addEventListener('click', function(e) {
    e.preventDefault();
    showForgotPasswordModal();
});

// ============================================
// END OF FILE
// ============================================
console.log('✨ MathEase Lesson 1 Script Loaded');
