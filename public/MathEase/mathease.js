// MathEase Lesson ID 1 - Complete JavaScript
// Introduction to Polynomials

// ============================================
// LESSON DATA
// ============================================
const LESSON_ID = 1;
const LESSON_TITLE = 'Introduction to Polynomials';
const VIDEO_DURATION = 600; // 10 minutes in seconds

// ============================================
// PROGRESS TRACKING
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
            completeBtn.disabled = true;
        } else {
            completeBtn.innerHTML = '<i class="fas fa-check-double"></i> Complete Lesson';
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
        document.body.style.overflow = 'hidden';
    }
}

// Close tool modal
window.closeToolModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Close with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(function(modal) {
            modal.classList.remove('active');
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
    
    init() {
        this.renderButtons();
        this.loadHistory();
    }
    
    renderButtons() {
        const buttons = [
            ['C', '⌫', '÷', '×'],
            ['7', '8', '9', '-'],
            ['4', '5', '6', '+'],
            ['1', '2', '3', '='],
            ['00', '0', '.', '%']
        ];
        
        const buttonsHtml = buttons.map(function(row) {
            return row.map(function(btn) {
                let className = 'calc-btn';
                if (['+', '-', '×', '÷', '%'].includes(btn)) className += ' operator';
                if (btn === '=') className += ' equals';
                if (btn === 'C') className += ' clear';
                return `<button class="${className}" data-value="${btn}">${btn}</button>`;
            }).join('');
        }).join('');
        
        const container = document.getElementById('calcButtons');
        if (container) {
            container.innerHTML = buttonsHtml;
            
            container.querySelectorAll('button').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    this.handleButton(btn.getAttribute('data-value'));
                }.bind(this));
            }.bind(this));
        }
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
            
            // Add to history
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
            setTimeout(function() {
                this.display = '0';
                this.expression = '';
                this.updateDisplay();
            }.bind(this), 1000);
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
    
    init() {
        this.canvas = document.getElementById('graphCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.drawGrid();
        this.plotFunction();
        this.setupListeners();
    }
    
    setupListeners() {
        const plotBtn = document.getElementById('plotGraphBtn');
        const exprInput = document.getElementById('graphExpression');
        
        if (plotBtn) {
            plotBtn.addEventListener('click', function() {
                this.expression = exprInput?.value || 'x^2 - 2x + 1';
                this.plotFunction();
            }.bind(this));
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
        
        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, h/2);
        this.ctx.lineTo(w, h/2);
        this.ctx.stroke();
        
        // Y-axis
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
            
            // Generate points
            const points = [];
            const steps = 100;
            
            for (let i = 0; i <= steps; i++) {
                const x = (i / steps) * 6 - 3; // -3 to 3
                const y = this.evaluateFunction(x, expr);
                
                if (isFinite(y)) {
                    const px = (x + 3) * (w / 6);
                    const py = h/2 - (y * 30);
                    points.push({ x: px, y: py });
                }
            }
            
            // Draw function
            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            
            let first = true;
            points.forEach(function(point) {
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
            }.bind(this));
            
            this.ctx.stroke();
            
            // Find and display roots
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
        
        // Find y-intercept (x=0)
        try {
            const yAtZero = this.evaluateFunction(0, expr);
            if (isFinite(yAtZero)) {
                yIntercept = yAtZero;
            }
        } catch (e) {}
        
        // Find x-intercepts (where y=0)
        for (let x = -5; x <= 5; x += 0.1) {
            try {
                const y = this.evaluateFunction(x, expr);
                const yNext = this.evaluateFunction(x + 0.1, expr);
                
                if (Math.abs(y) < 0.1) {
                    const roundedX = Math.round(x * 100) / 100;
                    if (!xIntercepts.includes(roundedX) && Math.abs(roundedX) <= 5) {
                        xIntercepts.push(roundedX);
                    }
                } else if (y * yNext < 0) {
                    // Root between x and x+0.1
                    const root = x - y * (0.1) / (yNext - y);
                    const roundedRoot = Math.round(root * 100) / 100;
                    if (!xIntercepts.includes(roundedRoot) && Math.abs(roundedRoot) <= 5) {
                        xIntercepts.push(roundedRoot);
                    }
                }
            } catch (e) {}
        }
        
        let html = '';
        
        if (xIntercepts.length > 0) {
            html += '<div class="roots-section"><h4>X-Intercepts:</h4><ul>';
            xIntercepts.sort(function(a,b) { return a - b; }).forEach(function(root) {
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
let whiteboard = {
    canvas: null,
    ctx: null,
    drawing: false,
    tool: 'pen',
    color: '#667eea',
    lastX: 0,
    lastY: 0
};

function initWhiteboard() {
    whiteboard.canvas = document.getElementById('whiteboardCanvas');
    if (!whiteboard.canvas) return;
    
    whiteboard.ctx = whiteboard.canvas.getContext('2d');
    whiteboard.ctx.strokeStyle = whiteboard.color;
    whiteboard.ctx.lineWidth = 2;
    whiteboard.ctx.lineCap = 'round';
    whiteboard.ctx.lineJoin = 'round';
    
    // Clear canvas
    whiteboard.ctx.fillStyle = '#ffffff';
    whiteboard.ctx.fillRect(0, 0, whiteboard.canvas.width, whiteboard.canvas.height);
    
    // Mouse events
    whiteboard.canvas.addEventListener('mousedown', startDrawing);
    whiteboard.canvas.addEventListener('mousemove', draw);
    whiteboard.canvas.addEventListener('mouseup', stopDrawing);
    whiteboard.canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    whiteboard.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    whiteboard.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    whiteboard.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Color picker
    const colorPicker = document.getElementById('colorPicker');
    if (colorPicker) {
        colorPicker.addEventListener('input', function(e) {
            whiteboard.color = e.target.value;
            if (whiteboard.ctx && whiteboard.tool === 'pen') {
                whiteboard.ctx.strokeStyle = whiteboard.color;
            }
        });
    }
}

function startDrawing(e) {
    e.preventDefault();
    whiteboard.drawing = true;
    
    const rect = whiteboard.canvas.getBoundingClientRect();
    whiteboard.lastX = e.clientX - rect.left;
    whiteboard.lastY = e.clientY - rect.top;
    
    whiteboard.ctx.beginPath();
    whiteboard.ctx.moveTo(whiteboard.lastX, whiteboard.lastY);
}

function draw(e) {
    e.preventDefault();
    if (!whiteboard.drawing) return;
    
    const rect = whiteboard.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    if (whiteboard.tool === 'pen') {
        whiteboard.ctx.lineTo(currentX, currentY);
        whiteboard.ctx.stroke();
    } else if (whiteboard.tool === 'eraser') {
        whiteboard.ctx.save();
        whiteboard.ctx.strokeStyle = '#ffffff';
        whiteboard.ctx.lineWidth = 20;
        whiteboard.ctx.lineTo(currentX, currentY);
        whiteboard.ctx.stroke();
        whiteboard.ctx.restore();
    }
    
    whiteboard.lastX = currentX;
    whiteboard.lastY = currentY;
}

function stopDrawing() {
    whiteboard.drawing = false;
    whiteboard.ctx.closePath();
}

function handleTouchStart(e) {
    e.preventDefault();
    whiteboard.drawing = true;
    
    const touch = e.touches[0];
    const rect = whiteboard.canvas.getBoundingClientRect();
    whiteboard.lastX = touch.clientX - rect.left;
    whiteboard.lastY = touch.clientY - rect.top;
    
    whiteboard.ctx.beginPath();
    whiteboard.ctx.moveTo(whiteboard.lastX, whiteboard.lastY);
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!whiteboard.drawing) return;
    
    const touch = e.touches[0];
    const rect = whiteboard.canvas.getBoundingClientRect();
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    
    if (whiteboard.tool === 'pen') {
        whiteboard.ctx.lineTo(currentX, currentY);
        whiteboard.ctx.stroke();
    } else if (whiteboard.tool === 'eraser') {
        whiteboard.ctx.save();
        whiteboard.ctx.strokeStyle = '#ffffff';
        whiteboard.ctx.lineWidth = 20;
        whiteboard.ctx.lineTo(currentX, currentY);
        whiteboard.ctx.stroke();
        whiteboard.ctx.restore();
    }
    
    whiteboard.lastX = currentX;
    whiteboard.lastY = currentY;
}

function handleTouchEnd(e) {
    e.preventDefault();
    whiteboard.drawing = false;
    whiteboard.ctx.closePath();
}

window.setWhiteboardTool = function(tool) {
    whiteboard.tool = tool;
    if (tool === 'pen') {
        whiteboard.ctx.strokeStyle = whiteboard.color;
        whiteboard.ctx.lineWidth = 2;
    } else {
        whiteboard.ctx.strokeStyle = '#ffffff';
        whiteboard.ctx.lineWidth = 20;
    }
};

window.clearWhiteboard = function() {
    if (whiteboard.ctx && whiteboard.canvas) {
        whiteboard.ctx.fillStyle = '#ffffff';
        whiteboard.ctx.fillRect(0, 0, whiteboard.canvas.width, whiteboard.canvas.height);
        whiteboard.ctx.strokeStyle = whiteboard.color;
        whiteboard.ctx.lineWidth = 2;
    }
};

// ============================================
// NOTEPAD TOOL
// ============================================
window.saveNote = function() {
    const title = document.getElementById('noteTitle')?.value || 'Untitled';
    const content = document.getElementById('noteContent')?.value;
    
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
    
    const notes = JSON.parse(localStorage.getItem('lesson_notes') || '[]');
    notes.unshift(note);
    
    if (notes.length > 10) notes.pop();
    
    localStorage.setItem('lesson_notes', JSON.stringify(notes));
    
    showNotification('Note saved successfully!', 'success');
    
    document.getElementById('noteContent').value = '';
    document.getElementById('noteTitle').value = 'Polynomial Notes';
};

// ============================================
// FORMULA SHEET
// ============================================
const formulas = {
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
        { name: 'Product of Roots', formula: 'x₁ × x₂ = c/a' },
        { name: 'Vertex Formula', formula: 'x = -b/(2a), y = f(-b/(2a))' }
    ]
};

window.showFormulaCategory = function(category) {
    const listEl = document.getElementById('formulaList');
    if (!listEl) return;
    
    const categoryFormulas = formulas[category] || formulas.polynomial;
    
    listEl.innerHTML = categoryFormulas.map(function(f) {
        return `
            <div class="formula-item">
                <div class="formula-name">${f.name}</div>
                <div class="formula-expression">${f.formula}</div>
            </div>
        `;
    }).join('');
    
    window.showFormulaCategory = function(category) {
    const listEl = document.getElementById('formulaList');
    if (!listEl) return;
    
    const categoryFormulas = formulas[category] || formulas.polynomial;
    
    listEl.innerHTML = categoryFormulas.map(function(f) {
        return `
            <div class="formula-item">
                <div class="formula-name">${f.name}</div>
                <div class="formula-expression">${f.formula}</div>
            </div>
        `;
    }).join('');
    
    // I-update ang active button
    document.querySelectorAll('.formula-categories button').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === category) {
            btn.classList.add('active');
        }
    });
};

// ============================================
// STUDY TIMER
// ============================================
class StudyTimer {
    constructor() {
        this.timeLeft = 25 * 60;
        this.initialTime = 25 * 60;
        this.timerId = null;
        this.isRunning = false;
    }
    
    init() {
        this.updateDisplay();
        this.setupListeners();
    }
    
    setupListeners() {
        document.getElementById('timerStartBtn')?.addEventListener('click', this.start.bind(this));
        document.getElementById('timerPauseBtn')?.addEventListener('click', this.pause.bind(this));
        document.getElementById('timerResetBtn')?.addEventListener('click', this.reset.bind(this));
        document.getElementById('timer15min')?.addEventListener('click', this.setTime.bind(this, 15));
        document.getElementById('timer25min')?.addEventListener('click', this.setTime.bind(this, 25));
        document.getElementById('timer50min')?.addEventListener('click', this.setTime.bind(this, 50));
    }
    
    start() {
        if (!this.isRunning && this.timeLeft > 0) {
            this.isRunning = true;
            this.timerId = setInterval(function() {
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                    this.updateDisplay();
                    if (this.timeLeft === 0) {
                        this.complete();
                    }
                }
            }.bind(this), 1000);
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
    
    document.querySelectorAll('.timer-presets button').forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    // I-check kung may event
    if (event && event.target) {
        event.target.classList.add('active');
    }
}
    
    complete() {
        this.pause();
        showNotification('Study session complete! Great job! 🎉', 'success');
        this.reset();
    }
    
    updateDisplay() {
        const timerEl = document.getElementById('timerDisplay');
        if (!timerEl) return;
        
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
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
    
    setTimeout(function() {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(function() { notification.remove(); }, 300);
    }, 3000);
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
    
    // Initialize tools
    const calculator = new Calculator();
    const graphTool = new GraphTool();
    const studyTimer = new StudyTimer();
    
    // Setup tool buttons
    document.getElementById('openCalculator').addEventListener('click', function() {
        openToolModal('calculatorModal');
        setTimeout(function() { calculator.init(); }, 100);
    });
    
    document.getElementById('openGraphTools').addEventListener('click', function() {
        openToolModal('graphModal');
        setTimeout(function() { graphTool.init(); }, 200);
    });
    
    document.getElementById('openWhiteboard').addEventListener('click', function() {
        openToolModal('whiteboardModal');
        setTimeout(initWhiteboard, 200);
    });
    
    document.getElementById('openNotepad').addEventListener('click', function() {
        openToolModal('notepadModal');
        // Load last note if exists
        const notes = JSON.parse(localStorage.getItem('lesson_notes') || '[]');
        if (notes.length > 0) {
            document.getElementById('noteTitle').value = notes[0].title;
            document.getElementById('noteContent').value = notes[0].content;
        }
    });
    
    document.getElementById('openFormulaSheet').addEventListener('click', function() {
        openToolModal('formulaModal');
        setTimeout(function() { showFormulaCategory('polynomial'); }, 100);
    });
    
    document.getElementById('openTimer').addEventListener('click', function() {
        openToolModal('timerModal');
        setTimeout(function() { studyTimer.init(); }, 100);
    });
    
    // Complete lesson button
    document.getElementById('completeLessonBtn').addEventListener('click', function() {
        if (!lessonProgress.completed) {
            lessonProgress.completed = true;
            lessonProgress.percentage = 100;
            lessonProgress.currentTime = VIDEO_DURATION;
            
            saveProgress();
            updateProgressDisplay();
            
            showNotification('🎉 Congratulations! Lesson completed!', 'success');
            
            // Unlock next lesson (simulated)
            setTimeout(function() {
                document.getElementById('nextLessonBtn').disabled = false;
            }, 500);
        }
    });
    
    // Navigation buttons
    document.getElementById('nextLessonBtn').addEventListener('click', function() {
        showNotification('Lesson 2 coming soon!', 'info');
    });
    
    // Show initial formula category
    setTimeout(function() { showFormulaCategory('polynomial'); }, 500);
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ MathEase Lesson 1 Ready!');
});
// ============================================
// 🚀 PERMANENT DASHBOARD FIX - Auto-show on load
// ============================================
(function permanentDashboardFix() {
    console.log('🔧 Applying permanent dashboard fix...');
    
    // Function to force show dashboard
    function forceShowDashboard() {
        const dashboard = document.getElementById('dashboard-page');
        if (!dashboard) {
            console.warn('Dashboard page not found yet, retrying...');
            return false;
        }
        
        // Hide ALL possible pages
        const allPossiblePages = [
            'dashboard-page', 'practice-exercises-page', 'quiz-dashboard-page',
            'progress-page', 'feedback-page', 'settings-page', 'module-dashboard-page',
            'app-selection-page', 'login-page', 'signup-page', 'loading-page',
            'landing-page'
        ];
        
        allPossiblePages.forEach(pageId => {
            const page = document.getElementById(pageId);
            if (page) {
                page.classList.add('hidden');
                page.style.display = 'none';
                page.style.visibility = 'hidden';
                page.style.opacity = '0';
            }
        });
        
        // Force show dashboard with highest priority
        dashboard.classList.remove('hidden');
        dashboard.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 1000 !important;
        `;
        
        // Remove any inline styles that might hide it
        dashboard.style.removeProperty('display');
        dashboard.style.removeProperty('visibility');
        dashboard.style.removeProperty('opacity');
        
        console.log('✅ Dashboard permanently shown!');
        return true;
    }
    
    // Run immediately
    forceShowDashboard();
    
    // Run after DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceShowDashboard);
    } else {
        forceShowDashboard();
    }
    
    // Run after everything is loaded
    window.addEventListener('load', forceShowDashboard);
    
    // Run repeatedly until it works (max 10 attempts)
    let attempts = 0;
    const interval = setInterval(function() {
        attempts++;
        const success = forceShowDashboard();
        
        if (success || attempts >= 10) {
            clearInterval(interval);
            if (success) {
                console.log(`✅ Dashboard fixed after ${attempts} attempts`);
            } else {
                console.warn('⚠️ Could not find dashboard after 10 attempts');
            }
        }
    }, 500); // Check every 500ms
    
    // Fix for navigation function
    if (typeof window.navigateTo === 'function') {
        const originalNavigate = window.navigateTo;
        window.navigateTo = function(page) {
            console.log(`🧭 Navigating to: ${page}`);
            
            // Call original function
            originalNavigate(page);
            
            // Ensure dashboard shows properly when navigated to
            if (page === 'dashboard') {
                setTimeout(forceShowDashboard, 100);
            }
        };
    }
    
    // Add mutation observer to watch for changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' || mutation.type === 'childList') {
                const dashboard = document.getElementById('dashboard-page');
                if (dashboard && dashboard.classList.contains('hidden')) {
                    console.log('🔄 Dashboard was hidden, forcing show...');
                    forceShowDashboard();
                }
            }
        });
    });
    
    // Start observing
    const dashboard = document.getElementById('dashboard-page');
    if (dashboard) {
        observer.observe(dashboard, { 
            attributes: true, 
            attributeFilter: ['class', 'style'] 
        });
    }
    
    // Also observe body for any class changes
    observer.observe(document.body, { 
        attributes: true,
        attributeFilter: ['class']
    });
    
})();

// ============================================
// 🛡️ BACKUP PROTECTION - Run every 2 seconds
// ============================================
setInterval(function() {
    const dashboard = document.getElementById('dashboard-page');
    if (dashboard && dashboard.classList.contains('hidden')) {
        console.log('⚠️ Backup protection: Dashboard was hidden, showing again...');
        dashboard.classList.remove('hidden');
        dashboard.style.display = 'block';
        dashboard.style.visibility = 'visible';
        dashboard.style.opacity = '1';
    }
}, 2000);
// ============================================
// 🚀 QUICK FIX - Idagdag sa dulo ng script
// ============================================

// Fix para sa showFormulaCategory error
window.showFormulaCategory = function(category) {
    const listEl = document.getElementById('formulaList');
    if (!listEl) return;
    
    const categoryFormulas = formulas[category] || formulas.polynomial;
    
    listEl.innerHTML = categoryFormulas.map(function(f) {
        return `
            <div class="formula-item">
                <div class="formula-name">${f.name}</div>
                <div class="formula-expression">${f.formula}</div>
            </div>
        `;
    }).join('');
    
    // I-FIX ITO - tanggalin ang event.target
    document.querySelectorAll('.formula-categories button').forEach(function(btn) {
        btn.classList.remove('active');
        // Gamitin ang category parameter imbes na event.target
        if (btn.textContent.toLowerCase() === category) {
            btn.classList.add('active');
        }
    });
};

// Permanent dashboard fix
(function() {
    function showDashboard() {
        const dashboard = document.getElementById('dashboard-page');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            dashboard.style.display = 'block';
            return true;
        }
        return false;
    }
    
    // Run agad
    showDashboard();
    
    // Run pag nag-load ang page
    document.addEventListener('DOMContentLoaded', showDashboard);
    window.addEventListener('load', showDashboard);
    
    // Run every second hanggang mag-appear
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        if (showDashboard() || attempts > 10) {
            clearInterval(interval);
        }
    }, 500);
})();
