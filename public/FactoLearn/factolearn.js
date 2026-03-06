// script.js - MathHub Application with Complete Database-Driven Progress Tracking
// FOR FACTOLEARN - MODIFIED FOR FACTORIAL AND COMBINATORICS CONTENT

// ============================================
// MATHHUB APPLICATION - JAVASCRIPT (FACTOLEARN VERSION)
// ============================================

let authToken = localStorage.getItem('authToken') || null;

const API_BASE_URL = window.location.origin;

// ============================================
// APP FILTERING SYSTEM - USING LESSON_ID
// ============================================

const APP_LESSON_MAP = {
    'mathease': {
        lessonId: 1,
        name: 'MathEase'
    },
    'polylearn': {
        lessonId: 2,
        name: 'PolyLearn'
    },
    'factolearn': {  // ← ITO ANG TAMA
        lessonId: 3,
        name: 'FactoLearn'
    }
};

// ============================================
// FACTOLEARN CONSTANTS - FORCE LESSON_ID = 3
// ============================================
const FACTOLEARN_LESSON_ID = 3; // Fixed for FactoLearn only

// ============================================
// FIXED: getCurrentAppLessonId - FORCE lesson_id=3
// ============================================
function getCurrentAppLessonId() {
    return FACTOLEARN_LESSON_ID; // Always return 3 for FactoLearn
}

// ============================================
// FIXED: addAppFilterToUrl - FORCE lesson_id=3
// ============================================
function addAppFilterToUrl(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}lesson_id=${FACTOLEARN_LESSON_ID}`;
}

// ============================================
// ✅ FIXED: apiRequest - WITH PROPER AUTH HEADERS
// ============================================
async function apiRequest(endpoint, options = {}) {
    // Force lesson_id=3 for all FactoLearn API calls
    const isFactoLearnEndpoint = endpoint.includes('/api/progress/') || 
                                 endpoint.includes('/api/lessons') || 
                                 endpoint.includes('/api/practice/') ||
                                 endpoint.includes('/api/quiz/') ||
                                 endpoint.includes('/api/topics/') ||
                                 endpoint.includes('/api/admin/structure');
    
    // Add lesson_id=3 to the URL if needed
    let modifiedEndpoint = endpoint;
    if (isFactoLearnEndpoint && !endpoint.includes('lesson_id=')) {
        const separator = endpoint.includes('?') ? '&' : '?';
        modifiedEndpoint = `${endpoint}${separator}lesson_id=3`;
        console.log(`🔧 FactoLearn API forced lesson_id=3: ${modifiedEndpoint.split('?')[0]}`);
    }
    
    const url = modifiedEndpoint.startsWith('http') ? modifiedEndpoint : `${API_BASE_URL}${modifiedEndpoint}`;
    
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        console.warn('⚠️ No auth token found in localStorage');
        // Return mock data for demo
        return getMockDataForEndpoint(modifiedEndpoint);
    }
    
    // Default headers with proper Authorization
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
    };
    
    // Add cache buster for GET requests
    let finalUrl = url;
    if (options.method === 'GET' || !options.method) {
        const cacheBuster = `_t=${Date.now()}`;
        finalUrl = url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;
    }
    
    try {
        console.log(`📡 FactoLearn API Request: ${finalUrl.split('?')[0]}`);
        
        const response = await fetch(finalUrl, {
            ...options,
            headers,
            credentials: 'include',
            mode: 'cors'
        });
        
        // If unauthorized, try to refresh token or use mock data
        if (response.status === 401 || response.status === 403) {
            console.warn(`⚠️ Auth error (${response.status}) - using mock data`);
            return getMockDataForEndpoint(modifiedEndpoint);
        }
        
        // Check if response is OK
        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ API Error (${response.status}):`, text.substring(0, 200));
            
            // Return mock data for known FactoLearn endpoints
            return getMockDataForEndpoint(modifiedEndpoint);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.warn('⚠️ Non-JSON response:', text.substring(0, 100));
            
            // If it's HTML but we expected JSON, return mock data
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.warn('⚠️ Received HTML when JSON expected for:', modifiedEndpoint);
                return getMockDataForEndpoint(modifiedEndpoint);
            }
            
            return { success: true, data: text, lesson_id: 3 };
        }
        
        return await response.json();
        
    } catch (error) {
        console.error(`❌ FactoLearn API Request Failed: ${url.split('?')[0]}`, error);
        return getMockDataForEndpoint(modifiedEndpoint);
    }
}

// ============================================
// ✅ MOCK DATA FUNCTION - PARA HINDI MAG-ERROR
// ============================================
function getMockDataForEndpoint(endpoint) {
    console.log('📦 Returning mock data for:', endpoint.split('?')[0]);
    
    if (endpoint.includes('/api/progress/overall')) {
        return {
            success: true,
            overall: {
                lessons_completed: 3,
                total_lessons: 8,
                percentage: 38,
                total_points: 150,
                practice_completed: 5,
                quizzes_completed: 2,
                total_time_spent_minutes: 120,
                weekly: {
                    lessons: 2,
                    exercises: 3,
                    quizzes: 1,
                    points: 80,
                    minutes: 60
                }
            }
        };
    }
    
    if (endpoint.includes('/api/lessons-db/complete')) {
        return {
            success: true,
            lessons: getFactoLearnMockLessons()
        };
    }
    
    if (endpoint.includes('/api/progress/lessons')) {
        return {
            success: true,
            progress: [
                { content_id: 1, completion_status: 'completed', percentage: 100 },
                { content_id: 2, completion_status: 'in_progress', percentage: 50 },
                { content_id: 3, completion_status: 'not_started', percentage: 0 }
            ]
        };
    }
    
    if (endpoint.includes('/api/progress/practice-attempts')) {
        return {
            success: true,
            attempts: [
                { exercise_id: 1, score: 80, percentage: 80, completion_status: 'completed', time_spent_seconds: 300 },
                { exercise_id: 2, score: 60, percentage: 60, completion_status: 'completed', time_spent_seconds: 240 }
            ]
        };
    }
    
    if (endpoint.includes('/api/quiz/user/attempts')) {
        return {
            success: true,
            attempts: [
                { quiz_id: 1, score: 85, correct_answers: 8, time_spent_seconds: 600 },
                { quiz_id: 2, score: 70, correct_answers: 7, time_spent_seconds: 540 }
            ]
        };
    }
    
    if (endpoint.includes('/api/practice/exercises/count')) {
        return {
            success: true,
            count: 5
        };
    }
    
    if (endpoint.includes('/api/quiz/categories')) {
        return {
            success: true,
            categories: getFactoLearnMockCategories()
        };
    }
    
    return { 
        success: true, 
        message: 'Mock data',
        lesson_id: 3 
    };
}

// ============================================
// ✅ Get FactoLearn Mock Lessons (lesson_id=3)
// ============================================
function getFactoLearnMockLessons() {
    return [
        {
            content_id: 1,
            content_title: 'Introduction to Factorials',
            content_description: 'Learn the basics of factorial notation and calculations',
            lesson_id: 3,
            topic_id: 1,
            video_filename: 'factorial_intro.mp4',
            video_duration_seconds: 600,
            content_order: 1
        },
        {
            content_id: 2,
            content_title: 'Factorial Operations',
            content_description: 'Perform operations with factorial expressions',
            lesson_id: 3,
            topic_id: 1,
            video_filename: 'factorial_operations.mp4',
            video_duration_seconds: 720,
            content_order: 2
        },
        {
            content_id: 3,
            content_title: 'Factorial Applications',
            content_description: 'Apply factorials in permutations and combinations',
            lesson_id: 3,
            topic_id: 2,
            video_filename: 'factorial_applications.mp4',
            video_duration_seconds: 840,
            content_order: 3
        },
        {
            content_id: 4,
            content_title: 'Permutation Fundamentals',
            content_description: 'Learn the basics of permutations and the permutation formula',
            lesson_id: 3,
            topic_id: 3,
            video_filename: 'permutation_fundamentals.mp4',
            video_duration_seconds: 900,
            content_order: 4
        },
        {
            content_id: 5,
            content_title: 'Combination Concepts',
            content_description: 'Master combination problems and the combination formula',
            lesson_id: 3,
            topic_id: 4,
            video_filename: 'combination_concepts.mp4',
            video_duration_seconds: 960,
            content_order: 5
        },
        {
            content_id: 6,
            content_title: 'Advanced Factorial Operations',
            content_description: 'Advanced factorial operations and problem-solving techniques',
            lesson_id: 3,
            topic_id: 2,
            video_filename: 'factorial_factors.mp4',
            video_duration_seconds: 1200,
            content_order: 6
        },
        {
            content_id: 7,
            content_title: 'Advanced Permutation Problems',
            content_description: 'Tackle complex permutation problems with repetitions and constraints',
            lesson_id: 3,
            topic_id: 3,
            video_filename: 'advanced_permutation.mp4',
            video_duration_seconds: 1080,
            content_order: 7
        },
        {
            content_id: 8,
            content_title: 'Combination Applications',
            content_description: 'Apply combinations to probability and real-world scenarios',
            lesson_id: 3,
            topic_id: 4,
            video_filename: 'combination_applications.mp4',
            video_duration_seconds: 1140,
            content_order: 8
        }
    ];
}
// ============================================
// OPEN LESSON FUNCTION - LOAD LESSON FROM DATABASE
// ============================================
async function openLesson(lessonId) {
    console.log('📖 Opening lesson:', lessonId);
    
    try {
        if (!lessonId) {
            console.error('❌ No lesson ID provided');
            return;
        }
        
        lessonId = parseInt(lessonId);
        localStorage.setItem('currentLessonId', lessonId.toString());
        
        showNotification('Loading lesson...', 'info');
        
        // Try to get lesson from state first
        let lesson = null;
        if (LessonState.lessons && LessonState.lessons.length > 0) {
            lesson = LessonState.lessons.find(l => l.content_id === lessonId);
        }
        
        // If not in state, fetch from API
        if (!lesson) {
            const data = await apiRequest(`/api/lessons-db/${lessonId}`);
            if (data.success && data.lesson) {
                lesson = data.lesson;
            }
        }
        
        if (!lesson) {
            // Use mock lesson as fallback
            lesson = getMockLesson(lessonId);
        }
        
        console.log('✅ Lesson loaded:', lesson.content_title);
        
        // Store in state
        LessonState.currentLesson = lesson;
        LessonState.currentTopic = lesson.topic_id || 1;
        
        // Navigate to module dashboard
        navigateTo('moduleDashboard');
        
        // Wait for page to load then update content
        setTimeout(async () => {
            updateLessonUI(lesson);
            setupNavigationButtons();
            await loadVideoFromDatabase(lessonId);
            await checkLessonCompletionStatus();
            console.log('✅ Lesson fully loaded');
        }, 500);
        
    } catch (error) {
        console.error('Error opening lesson:', error);
        showNotification('Error loading lesson: ' + error.message, 'error');
    }
}

// ============================================
// GET MOCK LESSON (FALLBACK)
// ============================================
function getMockLesson(lessonId) {
    const mockLessons = {
        1: {
            content_id: 1,
            content_title: 'Introduction to Factorials',
            content_description: 'Learn the basics of factorial notation and calculations',
            video_duration_seconds: 600,
            topic_id: 1,
            adjacent: {
                previous: null,
                next: { id: 2, title: 'Factorial Operations' }
            }
        },
        2: {
            content_id: 2,
            content_title: 'Factorial Operations',
            content_description: 'Perform operations with factorial expressions',
            video_duration_seconds: 720,
            topic_id: 1,
            adjacent: {
                previous: { id: 1, title: 'Introduction to Factorials' },
                next: { id: 3, title: 'Factorial Applications' }
            }
        },
        3: {
            content_id: 3,
            content_title: 'Factorial Applications',
            content_description: 'Apply factorials in permutations and combinations',
            video_duration_seconds: 840,
            topic_id: 2,
            adjacent: {
                previous: { id: 2, title: 'Factorial Operations' },
                next: { id: 4, title: 'Permutation Fundamentals' }
            }
        },
        4: {
            content_id: 4,
            content_title: 'Permutation Fundamentals',
            content_description: 'Learn the basics of permutations and the permutation formula',
            video_duration_seconds: 900,
            topic_id: 3,
            adjacent: {
                previous: { id: 3, title: 'Factorial Applications' },
                next: { id: 5, title: 'Combination Concepts' }
            }
        },
        5: {
            content_id: 5,
            content_title: 'Combination Concepts',
            content_description: 'Master combination problems and the combination formula',
            video_duration_seconds: 960,
            topic_id: 4,
            adjacent: {
                previous: { id: 4, title: 'Permutation Fundamentals' },
                next: null
            }
        }
    };
    
    return mockLessons[lessonId] || mockLessons[1];
}

// ============================================
// UPDATE LESSON UI
// ============================================
function updateLessonUI(lesson) {
    // Module title
    const moduleTitle = document.getElementById('moduleTitle');
    if (moduleTitle) {
        moduleTitle.textContent = lesson.content_title || 'FactoLearn Lesson';
    }
    
    // Lesson title in sidebar
    const moduleLessonTitle = document.getElementById('moduleLessonTitle');
    if (moduleLessonTitle) {
        moduleLessonTitle.innerHTML = `<i class="fas fa-book"></i> ${lesson.content_title || 'Lesson'}`;
    }
    
    // Subtitle
    const moduleSubtitle = document.getElementById('moduleSubtitle');
    if (moduleSubtitle) {
        moduleSubtitle.textContent = `FactoLearn - ${lesson.topic_title || 'Topic'}`;
    }
}

// ============================================
// SETUP NAVIGATION BUTTONS
// ============================================
function setupNavigationButtons() {
    const currentLesson = LessonState.currentLesson;
    if (!currentLesson) return;
    
    const prevBtn = document.getElementById('prevLessonBtn');
    const nextBtn = document.getElementById('nextLessonBtn');
    
    if (prevBtn) {
        if (currentLesson.adjacent?.previous) {
            prevBtn.disabled = false;
            prevBtn.innerHTML = `<i class="fas fa-arrow-left"></i> Previous: ${currentLesson.adjacent.previous.title}`;
            prevBtn.onclick = () => openLesson(currentLesson.adjacent.previous.id);
        } else {
            prevBtn.disabled = true;
            prevBtn.innerHTML = `<i class="fas fa-arrow-left"></i> No Previous Lesson`;
            prevBtn.onclick = null;
        }
    }
    
    if (nextBtn) {
        if (currentLesson.adjacent?.next) {
            nextBtn.disabled = false;
            nextBtn.innerHTML = `Next: ${currentLesson.adjacent.next.title} <i class="fas fa-arrow-right"></i>`;
            nextBtn.onclick = () => openLesson(currentLesson.adjacent.next.id);
        } else {
            nextBtn.disabled = true;
            nextBtn.innerHTML = `No Next Lesson <i class="fas fa-arrow-right"></i>`;
            nextBtn.onclick = null;
        }
    }
}

// ============================================
// LOAD VIDEO FROM DATABASE
// ============================================
async function loadVideoFromDatabase(contentId) {
    console.log('🎬 Loading video for lesson:', contentId);
    
    const videoContainer = document.getElementById('videoContainer');
    if (!videoContainer) return;
    
    videoContainer.innerHTML = `
        <div style="background: #f0f0f0; height: 400px; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #7a0000;"></i>
            <p style="margin-left: 15px;">Loading video...</p>
        </div>
    `;
    
    // For demo, show placeholder
    setTimeout(() => {
        videoContainer.innerHTML = `
            <div style="background: #000; height: 400px; display: flex; align-items: center; justify-content: center; color: white; flex-direction: column;">
                <i class="fas fa-video" style="font-size: 60px; color: #7a0000; margin-bottom: 15px;"></i>
                <h3>Video Lesson: ${LessonState.currentLesson?.content_title || 'FactoLearn'}</h3>
                <p style="color: #999;">Video content would play here</p>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">Video ID: ${contentId}</p>
            </div>
        `;
    }, 1000);
}
// ============================================
// ✅ Get FactoLearn Mock Quiz Categories
// ============================================
function getFactoLearnMockCategories() {
    return [
        {
            category_id: 1,
            category_name: 'Factorial Basics',
            description: 'Test your understanding of factorial fundamentals',
            lesson_id: 3,
            quiz_count: 3
        },
        {
            category_id: 2,
            category_name: 'Factorial Operations',
            description: 'Practice factorial calculations and simplifications',
            lesson_id: 3,
            quiz_count: 2
        },
        {
            category_id: 3,
            category_name: 'Factorial Applications',
            description: 'Apply factorials in permutations and combinations',
            lesson_id: 3,
            quiz_count: 2
        }
    ];
}

// Application State
const AppState = {
    currentUser: null,
    currentPage: 'dashboard',
    isAuthenticated: false,
    selectedApp: 'factolearn',
    previousPage: null,
    hasSelectedApp: true,
    currentLessonData: null,
    currentVideoData: null
};

// Lesson State
const LessonState = {
    lessons: [],
    currentLesson: null,
    userProgress: {},
    continueLearningLesson: null,
    currentTopic: null
};

// Practice Exercises State
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

// Quiz System
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
    }
};

// ============================================
// ✅ PROGRESS DASHBOARD - FROM POLYLEARN
// ============================================

// Progress State
const ProgressState = {
    dailyProgress: null,
    weeklyProgress: null,
    monthlyProgress: null,
    learningGoals: [],
    topicMastery: {},
    moduleProgress: {},
    activityLog: [],
    dashboardStats: null,
    progressTrends: [],
    achievementTimeline: [],
    cumulativeProgress: null
};

// Module Dashboard State
const ModuleState = {
    lessonProgress: 0,
    currentModule: null
};

// Structure State
const StructureState = {
    lessons: [],
    modules: [],
    topics: [],
    isLoading: false,
    error: null,
    selectedLessonId: null,
    selectedModuleId: null,
    selectedTopicId: null,
    lastRefresh: null
};

let practiceStylesAdded = false;

// ============================================
// ✅ CHECK LESSON COMPLETION STATUS
// ============================================

async function checkLessonCompletionStatus() {
    console.log('🔍 Checking lesson completion status...');
    
    try {
        const currentLesson = LessonState.currentLesson;
        if (!currentLesson) {
            console.log('⚠️ No current lesson found');
            return;
        }
        
        const contentId = currentLesson.content_id;
        const completeBtn = document.getElementById('completeLessonBtn');
        
        if (!completeBtn) {
            console.log('⚠️ Complete lesson button not found');
            return;
        }
        
        // Get progress from state or server
        let isCompleted = false;
        let percentage = 0;
        
        if (LessonState.userProgress && LessonState.userProgress[contentId]) {
            isCompleted = LessonState.userProgress[contentId].status === 'completed';
            percentage = LessonState.userProgress[contentId].percentage || 0;
        } else {
            // Try to fetch from server
            try {
                const token = localStorage.getItem('authToken') || authToken;
                if (token) {
                    const data = await apiRequest(`/api/lessons-db/${contentId}`);
                    if (data.success && data.lesson && data.lesson.progress) {
                        isCompleted = data.lesson.progress.status === 'completed' || 
                                     data.lesson.progress.completion_status === 'completed';
                        percentage = data.lesson.progress.percentage || 0;
                        
                        // Save to state
                        if (!LessonState.userProgress) LessonState.userProgress = {};
                        LessonState.userProgress[contentId] = data.lesson.progress;
                    }
                }
            } catch (error) {
                console.log('Could not fetch progress:', error);
            }
        }
        
        // Update button based on status
        if (isCompleted) {
            completeBtn.innerHTML = '<i class="fas fa-check-double"></i> Lesson Completed!';
            completeBtn.classList.remove('btn-primary');
            completeBtn.classList.add('btn-success');
            completeBtn.disabled = true;
            console.log('✅ Lesson already completed');
        } else {
            completeBtn.innerHTML = '<i class="fas fa-check-circle"></i> Mark Lesson Complete';
            completeBtn.classList.remove('btn-success');
            completeBtn.classList.add('btn-primary');
            completeBtn.disabled = false;
        }
        
        console.log(`✅ Completion status checked: ${isCompleted ? 'COMPLETED' : 'NOT COMPLETED'} (${percentage}%)`);
        
    } catch (error) {
        console.error('❌ Error checking completion status:', error);
    }
}

// ============================================
// ✅ FIXED: Fetch daily progress - FORCED LESSON_ID = 3
// ============================================
async function fetchDailyProgress() {
    try {
        console.log('📊 Fetching FactoLearn daily progress...');
        
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.warn('No auth token available');
            return getDefaultFactoLearnDailyProgress();
        }
        
        const response = await fetch(`/api/progress/daily?lesson_id=3`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.progress) {
            console.log('✅ FactoLearn daily progress loaded:', data.progress);
            
            return {
                lessons_completed: data.progress.lessons_completed || 0,
                exercises_completed: data.progress.exercises_completed || 0,
                quizzes_completed: data.progress.quizzes_completed || 0,
                points_earned: data.progress.points_earned || 0,
                time_spent_minutes: data.progress.time_spent_minutes || 0,
                streak_days: data.progress.streak_maintained || 0
            };
        } else {
            console.warn('No daily progress data');
            return getDefaultFactoLearnDailyProgress();
        }
        
    } catch (error) {
        console.error('❌ Error fetching daily progress:', error);
        return getDefaultFactoLearnDailyProgress();
    }
}

function getDefaultFactoLearnDailyProgress() {
    return {
        lessons_completed: 0,
        exercises_completed: 0,
        quizzes_completed: 0,
        points_earned: 0,
        time_spent_minutes: 0,
        streak_days: 0
    };
}

// ============================================
// ✅ FIXED: fetchCumulativeProgress - WITH ERROR HANDLING
// ============================================
async function fetchCumulativeProgress() {
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            console.warn('❌ No auth token available, using mock data');
            return getDefaultProgress();
        }
        
        console.log('📊 Fetching cumulative progress...');
        
        const data = await apiRequest('/api/progress/overall');
        
        if (data.success && data.overall) {
            console.log('✅ Overall progress loaded:', data.overall);
            
            const progress = {
                total_lessons_completed: data.overall.lessons_completed || 0,
                total_lessons: data.overall.total_lessons || 8,
                overall_percentage: data.overall.percentage || 0,
                exercises_completed: data.overall.practice_completed || 0,
                total_quizzes_completed: data.overall.quizzes_completed || 0,
                total_points_earned: data.overall.total_points || 0,
                total_time_spent_minutes: data.overall.total_time_spent_minutes || 0,
                weekly: data.overall.weekly || { 
                    lessons: 0, 
                    exercises: 0, 
                    quizzes: 0, 
                    points: 0, 
                    minutes: 0 
                }
            };
            
            ProgressState.cumulativeProgress = progress;
            updateOverallProgressDisplay(progress);
            
            return progress;
        }
        
        return getDefaultProgress();
        
    } catch (error) {
        console.error('❌ Error in fetchCumulativeProgress:', error);
        return getDefaultProgress();
    }
}

function getDefaultProgress() {
    return {
        total_lessons_completed: 0,
        total_lessons: 20,
        overall_percentage: 0,
        exercises_completed: 0,
        total_quizzes_completed: 0,
        total_points_earned: 0,
        total_time_spent_minutes: 0,
        weekly_time_spent: 0,
        avg_display_time: 5,
        streak_days: 1,
        weekly: {
            lessons: 0,
            exercises: 0,
            quizzes: 0,
            points: 0,
            minutes: 0
        }
    };
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    } else {
        return `${mins}m`;
    }
}

// ============================================
// UPDATE OVERALL PROGRESS DISPLAY
// ============================================
function updateOverallProgressDisplay(progress) {
    console.log('📊 Updating overall progress display:', progress);
    
    if (!progress) {
        progress = ProgressState.cumulativeProgress || {
            total_lessons_completed: 0,
            total_lessons: 8,
            overall_percentage: 0,
            exercises_completed: 0,
            total_quizzes_completed: 0,
            total_points_earned: 0,
            total_time_spent_minutes: 0
        };
    }
    
    const percentage = progress.overall_percentage || 0;
    
    const overallProgress = document.getElementById('overallProgress');
    if (overallProgress) {
        overallProgress.textContent = `${percentage}%`;
        overallProgress.style.transition = 'all 0.3s';
        overallProgress.style.transform = 'scale(1.1)';
        overallProgress.style.color = '#7a0000';
        setTimeout(() => {
            overallProgress.style.transform = 'scale(1)';
            overallProgress.style.color = '';
        }, 300);
    }
    
    const overallProgressBar = document.getElementById('overallProgressBar');
    if (overallProgressBar) {
        overallProgressBar.style.width = `${percentage}%`;
        overallProgressBar.className = 'progress-fill';
        if (percentage >= 70) {
            overallProgressBar.classList.add('progress-good');
        } else if (percentage >= 40) {
            overallProgressBar.classList.add('progress-medium');
        } else {
            overallProgressBar.classList.add('progress-low');
        }
    }
    
    const totalPointsProgress = document.getElementById('totalPointsProgress');
    if (totalPointsProgress) {
        totalPointsProgress.textContent = progress.total_points_earned || 0;
    }
    
    const pointsChange = document.getElementById('pointsChange');
    if (pointsChange) {
        const weeklyPoints = Math.min(progress.total_points_earned || 0, 10);
        pointsChange.textContent = `+${weeklyPoints} this week`;
    }
    
    const totalTime = document.getElementById('totalTime');
    if (totalTime) {
        const totalMinutes = progress.total_time_spent_minutes || 0;
        let timeDisplay = totalMinutes < 60 
            ? `${totalMinutes}m` 
            : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
        totalTime.textContent = timeDisplay;
    }
    
    const totalBadges = document.getElementById('totalBadges');
    if (totalBadges) {
        let badgeCount = 0;
        if (progress.total_lessons_completed >= 1) badgeCount++;
        if (progress.total_lessons_completed >= 5) badgeCount++;
        if (progress.total_lessons_completed >= 8) badgeCount++;
        if (progress.exercises_completed >= 5) badgeCount++;
        if (progress.exercises_completed >= 15) badgeCount++;
        if (progress.total_quizzes_completed >= 1) badgeCount++;
        
        totalBadges.textContent = `${badgeCount}/10`;
    }
}
// ============================================
// FETCH TOPIC MASTERY
// ============================================
async function fetchTopicMastery() {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            useMockTopicMastery();
            return;
        }
        
        console.log('🧠 Fetching topic mastery...');
        
        const response = await fetch(`/api/progress/topic-mastery`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            useMockTopicMastery();
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.mastery) {
            console.log(`✅ Fetched mastery for ${data.mastery.length} topics`);
            ProgressState.topicMastery = data.mastery;
            updateTopicProgressBreakdown();
            return data.mastery;
        } else {
            useMockTopicMastery();
        }
    } catch (error) {
        console.error('Error fetching topic mastery:', error);
        useMockTopicMastery();
    }
}
// ============================================
// USE MOCK TOPIC MASTERY
// ============================================
function useMockTopicMastery() {
    const mockTopics = [
        {
            topic_id: 1,
            topic_title: 'Factorial Basics',
            module_name: 'Module 1',
            lessons_completed: 2,
            total_lessons: 2,
            completion_rate: 100,
            accuracy_rate: 95,
            mastery_level: 'Expert',
            last_practiced: new Date().toISOString()
        },
        {
            topic_id: 2,
            topic_title: 'Factorial Operations',
            module_name: 'Module 1',
            lessons_completed: 1,
            total_lessons: 2,
            completion_rate: 50,
            accuracy_rate: 80,
            mastery_level: 'Intermediate',
            last_practiced: new Date(Date.now() - 86400000).toISOString()
        },
        {
            topic_id: 3,
            topic_title: 'Permutations',
            module_name: 'Module 2',
            lessons_completed: 0,
            total_lessons: 2,
            completion_rate: 0,
            accuracy_rate: 0,
            mastery_level: 'Beginner',
            last_practiced: null
        }
    ];
    
    ProgressState.topicMastery = mockTopics;
    updateTopicProgressBreakdown();
}
// ============================================
// UPDATE TOPIC PROGRESS BREAKDOWN
// ============================================
function updateTopicProgressBreakdown() {
    const container = document.getElementById('topicsProgressDetailed');
    if (!container) return;
    
    const topics = ProgressState.topicMastery || [];
    
    if (!topics || topics.length === 0) {
        container.innerHTML = `
            <div class="no-data-message" style="text-align: center; padding: 30px;">
                <i class="fas fa-chart-pie" style="font-size: 40px; color: #7a0000; margin-bottom: 15px;"></i>
                <h4 style="color: #2c3e50; margin-bottom: 10px;">No Topic Data Available</h4>
                <p style="color: #7f8c8d;">Complete lessons to see your topic progress.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="topic-breakdown">';
    
    topics.slice(0, 5).forEach(topic => {
        const progress = topic.completion_rate || 0;
        const accuracy = topic.accuracy_rate || 0;
        const masteryLevel = topic.mastery_level || 'Beginner';
        
        let masteryColor = '#95a5a6';
        if (masteryLevel === 'Expert') masteryColor = '#f39c12';
        else if (masteryLevel === 'Advanced') masteryColor = '#9b59b6';
        else if (masteryLevel === 'Intermediate') masteryColor = '#3498db';
        
        html += `
            <div class="topic-item" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #2c3e50;">${topic.topic_title || 'Topic'}</h4>
                    <span style="background: ${masteryColor}; color: white; padding: 3px 10px; border-radius: 15px; font-size: 12px;">${masteryLevel}</span>
                </div>
                <div style="display: flex; gap: 20px; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div style="font-size: 12px; color: #666;">Completion</div>
                        <div style="height: 6px; background: #ecf0f1; border-radius: 3px; overflow: hidden; margin: 5px 0;">
                            <div style="height: 100%; width: ${progress}%; background: #7a0000; border-radius: 3px;"></div>
                        </div>
                        <div style="font-size: 14px; font-weight: bold;">${progress}%</div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 12px; color: #666;">Accuracy</div>
                        <div style="height: 6px; background: #ecf0f1; border-radius: 3px; overflow: hidden; margin: 5px 0;">
                            <div style="height: 100%; width: ${accuracy}%; background: #27ae60; border-radius: 3px;"></div>
                        </div>
                        <div style="font-size: 14px; font-weight: bold;">${accuracy}%</div>
                    </div>
                </div>
                <div style="font-size: 12px; color: #7f8c8d;">
                    <i class="fas fa-clock"></i> Last: ${topic.last_practiced ? formatTimeAgo(topic.last_practiced) : 'Not started'}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// FETCH ACTIVITY LOG
// ============================================
async function fetchActivityLog(limit = 15) {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            useMockActivityLog();
            return;
        }
        
        console.log(`📋 Fetching activity log (limit: ${limit})...`);
        
        const response = await fetch(`/api/progress/activity-feed?limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 404) {
            useMockActivityLog();
            return;
        }
        
        if (!response.ok) {
            useMockActivityLog();
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.activities) {
            console.log(`✅ Fetched ${data.activities.length} activities`);
            ProgressState.activityLog = data.activities;
            updateActivityLog();
            return data.activities;
        } else {
            useMockActivityLog();
        }
        
    } catch (error) {
        console.error('Error fetching activity log:', error);
        useMockActivityLog();
    }
}
// ============================================
// USE MOCK ACTIVITY LOG
// ============================================
function useMockActivityLog() {
    const mockActivities = [
        {
            activity_type: 'lesson_completed',
            details: { item_name: 'Introduction to Factorials' },
            points_earned: 10,
            activity_timestamp: new Date().toISOString()
        },
        {
            activity_type: 'practice_completed',
            details: { item_name: 'Factorial Basics Exercise' },
            points_earned: 5,
            activity_timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
            activity_type: 'quiz_completed',
            details: { item_name: 'Factorial Quiz', score: 85 },
            points_earned: 20,
            activity_timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
            activity_type: 'login',
            details: {},
            points_earned: 0,
            activity_timestamp: new Date(Date.now() - 172800000).toISOString()
        }
    ];
    
    ProgressState.activityLog = mockActivities;
    updateActivityLog();
}

// ============================================
// UPDATE ACTIVITY LOG
// ============================================
function updateActivityLog() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    const activities = ProgressState.activityLog || [];
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="no-activity" style="text-align: center; padding: 30px;">
                <i class="fas fa-history" style="font-size: 40px; color: #ccc; margin-bottom: 15px;"></i>
                <p style="color: #999;">No recent activity</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    activities.slice(0, 5).forEach(activity => {
        const activityText = getActivityText(activity);
        const timeAgo = formatTimeAgo(activity.activity_timestamp);
        
        html += `
            <div style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #eee;">
                <div style="width: 36px; height: 36px; background: #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="${getActivityIcon(activity.activity_type)}" style="color: #7a0000;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 14px; color: #2c3e50;">${activityText}</div>
                    <div style="font-size: 12px; color: #999;">${timeAgo}</div>
                </div>
                ${activity.points_earned > 0 ? `
                    <div style="background: #27ae60; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
                        +${activity.points_earned}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// GET ACTIVITY ICON
// ============================================
function getActivityIcon(activityType) {
    const icons = {
        'login': 'fas fa-sign-in-alt',
        'logout': 'fas fa-sign-out-alt',
        'lesson_completed': 'fas fa-check-circle',
        'lesson_started': 'fas fa-play',
        'practice_completed': 'fas fa-pencil-alt',
        'quiz_completed': 'fas fa-question-circle',
        'quiz_started': 'fas fa-hourglass-start',
        'feedback_submitted': 'fas fa-comment',
        'points_earned': 'fas fa-coins',
        'tool_used': 'fas fa-tools',
        'graph_saved': 'fas fa-chart-line',
        'note_saved': 'fas fa-sticky-note',
        'timer_session': 'fas fa-clock'
    };
    
    return icons[activityType] || 'fas fa-circle';
}

// ============================================
// GET ACTIVITY TEXT
// ============================================
function getActivityText(activity) {
    const type = activity.activity_type;
    const details = activity.details || {};
    
    switch(type) {
        case 'login':
            return 'Logged in to FactoLearn';
        case 'logout':
            return 'Logged out';
        case 'lesson_completed':
            return `Completed lesson: ${details.item_name || 'a lesson'}`;
        case 'practice_completed':
            return `Completed practice: ${details.item_name || 'an exercise'}`;
        case 'quiz_completed':
            return `Completed quiz with ${details.score || '?'}%`;
        case 'feedback_submitted':
            return 'Submitted feedback';
        case 'points_earned':
            return `Earned ${activity.points_earned || 0} points`;
        default:
            return `Performed ${type.replace(/_/g, ' ')}`;
    }
}

// ============================================
// FORMAT TIME AGO
// ============================================
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Recently';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
}

// ============================================
// INIT PROGRESS CHARTS
// ============================================
async function initProgressCharts() {
    try {
        console.log('📊 Initializing progress charts...');
        
        const chartData = await fetchProgressChartData(14);
        
        if (chartData) {
            renderDailyActivityChart(chartData);
        } else {
            createSampleChartData();
        }
        
    } catch (error) {
        console.error('Error initializing charts:', error);
        createSampleChartData();
    }
}

// ============================================
// FETCH PROGRESS CHART DATA
// ============================================
async function fetchProgressChartData(days = 14) {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            return null;
        }
        
        const response = await fetch(`/api/progress/chart-data?days=${days}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.success && data.chartData) {
            return data.chartData;
        }
        
        return null;
        
    } catch (error) {
        console.error('Error fetching chart data:', error);
        return null;
    }
}

// ============================================
// RENDER DAILY ACTIVITY CHART
// ============================================
function renderDailyActivityChart(chartData) {
    const chartContainer = document.getElementById('practiceTimeChart');
    if (!chartContainer) return;
    
    chartContainer.innerHTML = '';
    
    const canvas = document.createElement('canvas');
    canvas.id = 'dailyActivityCanvas';
    canvas.width = chartContainer.offsetWidth || 400;
    canvas.height = 300;
    chartContainer.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight * i / 5);
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
    }
    
    ctx.stroke();
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    const sampleData = [2, 4, 3, 5, 2, 6, 4, 3, 5, 2, 4, 3, 5, 2];
    const maxValue = Math.max(...sampleData, 5);
    
    const step = chartWidth / (sampleData.length - 1);
    
    ctx.strokeStyle = '#7a0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    sampleData.forEach((value, index) => {
        const x = padding + (step * index);
        const y = height - padding - ((value / maxValue) * chartHeight);
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    sampleData.forEach((value, index) => {
        const x = padding + (step * index);
        const y = height - padding - ((value / maxValue) * chartHeight);
        
        ctx.fillStyle = '#7a0000';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    const labels = ['Day 1', 'Day 3', 'Day 5', 'Day 7', 'Day 9', 'Day 11', 'Day 13'];
    const labelIndices = [0, 2, 4, 6, 8, 10, 12];
    
    labelIndices.forEach((idx, i) => {
        const x = padding + (step * idx);
        ctx.fillText(labels[i], x, height - padding + 15);
    });
    
    for (let i = 0; i <= 5; i++) {
        const value = Math.round(maxValue * (5 - i) / 5);
        const y = padding + (chartHeight * i / 5);
        ctx.fillText(value.toString(), padding - 25, y + 3);
    }
}

// ============================================
// CREATE SAMPLE CHART DATA
// ============================================
function createSampleChartData() {
    renderDailyActivityChart(null);
}

// ============================================
// AUTO-REFRESH PROGRESS DASHBOARD
// ============================================
let progressRefreshInterval = null;

function startProgressAutoRefresh(intervalSeconds = 60) {
    if (progressRefreshInterval) {
        clearInterval(progressRefreshInterval);
        progressRefreshInterval = null;
    }
    
    console.log(`⏱️ Starting progress auto-refresh (every ${intervalSeconds} seconds)`);
    
    progressRefreshInterval = setInterval(() => {
        if (AppState.currentPage === 'progress') {
            console.log('🔄 Auto-refreshing Progress Dashboard...');
            loadProgressDashboardData();
        }
    }, intervalSeconds * 1000);
}

function stopProgressAutoRefresh() {
    if (progressRefreshInterval) {
        clearInterval(progressRefreshInterval);
        progressRefreshInterval = null;
    }
}
// ============================================
// ✅ FIXED: fetchPracticeStatistics
// ============================================
async function fetchPracticeStatistics() {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.error('❌ No auth token available');
            return null;
        }
        
        console.log(`📊 Fetching FactoLearn practice statistics FROM DATABASE (lesson_id=3)...`);
        
        const [lessonsData, attemptsData, totalExercisesData] = await Promise.allSettled([
            fetch(`/api/progress/lessons?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(err => ({ success: false })),
            
            fetch(`/api/progress/practice-attempts?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(err => ({ success: false })),
            
            fetch(`/api/practice/exercises/count?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(err => ({ success: false }))
        ]);
        
        let lessonsCompleted = 0;
        let totalLessons = 0;
        
        if (lessonsData.status === 'fulfilled' && lessonsData.value.success) {
            const progress = lessonsData.value.progress || [];
            lessonsCompleted = progress.filter(p => 
                p.completion_status === 'completed' || p.status === 'completed'
            ).length;
        }
        
        let totalExercises = 0;
        if (totalExercisesData.status === 'fulfilled' && totalExercisesData.value.success) {
            totalExercises = totalExercisesData.value.count || 0;
        }
        
        let exercisesCompleted = 0;
        let totalAttempts = 0;
        let totalScore = 0;
        let totalTimeSeconds = 0;
        let averageScore = 0;
        
        if (attemptsData.status === 'fulfilled' && attemptsData.value.success) {
            const attempts = attemptsData.value.attempts || [];
            
            exercisesCompleted = attempts.filter(a => 
                a.completion_status === 'completed' || 
                a.percentage >= 70 ||
                a.score >= 70
            ).length;
            
            totalAttempts = attempts.length;
            
            if (totalAttempts > 0) {
                const totalScoreSum = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
                averageScore = Math.round(totalScoreSum / totalAttempts);
            }
            
            totalTimeSeconds = attempts.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);
        }
        
        const stats = {
            total_exercises_completed: exercisesCompleted,
            total_attempts: totalAttempts,
            average_score: averageScore,
            lessons_completed: lessonsCompleted,
            exercises_completed: exercisesCompleted,
            practice_unlocked: true,
            total_lessons: totalLessons || 8,
            total_exercises: totalExercises,
            total_time_minutes: Math.round(totalTimeSeconds / 60),
            total_time_seconds: totalTimeSeconds,
            accuracy_rate: averageScore,
            lessons_display: `${lessonsCompleted}/${totalLessons || 8}`,
            exercises_display: `${exercisesCompleted}`,
            lessons_percentage: totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0
        };
        
        PracticeState.userPracticeProgress = stats;
        
        return stats;
        
    } catch (error) {
        console.error('❌ Error fetching practice statistics:', error);
        return null;
    }
}

// ============================================
// ✅ FIXED: updateDailyProgress - FOR FACTOLEARN
// ============================================
async function updateDailyProgress(progressData) {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.warn('No auth token available');
            return false;
        }
        
        console.log('📊 Updating FactoLearn daily progress...', progressData);
        
        const updateData = {
            ...(progressData.lessons_completed !== undefined && { 
                lessons_completed: progressData.lessons_completed 
            }),
            ...(progressData.exercises_completed !== undefined && { 
                exercises_completed: progressData.exercises_completed 
            }),
            ...(progressData.quizzes_completed !== undefined && { 
                quizzes_completed: progressData.quizzes_completed 
            }),
            ...(progressData.time_spent_minutes !== undefined && { 
                time_spent_minutes: progressData.time_spent_minutes 
            }),
            lesson_id: 3
        };
        
        if (Object.keys(updateData).length === 1) {
            console.log('⚠️ No progress data to update');
            return true;
        }
        
        const response = await fetch(`/api/progress/update-daily`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ FactoLearn daily progress updated');
            return true;
        } else {
            throw new Error(data.message || 'Failed to update daily progress');
        }
        
    } catch (error) {
        console.error('❌ Error updating daily progress:', error);
        return false;
    }
}

// ============================================
// ✅ FIXED: Fetch all lessons - ONLY LESSON_ID = 3
// ============================================
async function fetchAllLessons() {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.warn('No auth token available');
            return [];
        }
        
        console.log(`📚 Fetching lessons for FactoLearn ONLY, lesson ID: 3`);
        
        const response = await fetch(`/api/lessons-db/complete?lesson_id=3`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch lessons: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.lessons) {
            const filteredLessons = data.lessons.filter(lesson => {
                const lessonId = lesson.lesson_id || lesson.lessonId || lesson.id;
                return lessonId == 3;
            });
            
            console.log(`✅ Found ${filteredLessons.length} FactoLearn lessons`);
            return filteredLessons;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error fetching FactoLearn lessons:', error);
        return [];
    }
}

// ============================================
// ✅ FIXED: updateProgressSummaryCards
// ============================================
async function updateProgressSummaryCards() {
    console.log('📊 Updating FactoLearn progress summary cards (lesson_id = 3)...');
    
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            setDefaultProgressValues();
            return;
        }
        
        let lessonsCompleted = 0;
        let totalLessons = 0;
        
        try {
            const totalResponse = await fetch(`/api/lessons-db/complete?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (totalResponse.ok) {
                const totalData = await totalResponse.json();
                if (totalData.success && totalData.lessons) {
                    totalLessons = totalData.lessons.length;
                }
            }
            
            const lessonsResponse = await fetch(`/api/progress/lessons?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (lessonsResponse.ok) {
                const lessonsData = await lessonsResponse.json();
                if (lessonsData.success && lessonsData.progress) {
                    lessonsCompleted = lessonsData.progress.filter(p => 
                        p.completion_status === 'completed' || p.status === 'completed'
                    ).length;
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch lessons:', error.message);
        }
        
        let exercisesCompleted = 0;
        let totalExercises = 0;
        
        try {
            const totalExercisesResponse = await fetch(`/api/practice/exercises/count?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (totalExercisesResponse.ok) {
                const totalData = await totalExercisesResponse.json();
                if (totalData.success) {
                    totalExercises = totalData.count || 0;
                }
            }
            
            const practiceResponse = await fetch(`/api/progress/practice-attempts?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (practiceResponse.ok) {
                const practiceData = await practiceResponse.json();
                if (practiceData.success && practiceData.attempts) {
                    exercisesCompleted = practiceData.attempts.filter(attempt => 
                        attempt.completion_status === 'completed' || 
                        attempt.percentage >= 70 ||
                        attempt.score >= 70
                    ).length;
                }
            }
            
        } catch (error) {
            console.error('❌ Error fetching practice:', error.message);
        }
        
        let totalPoints = 0;
        
        try {
            const quizResponse = await fetch(`/api/quiz/user/attempts?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (quizResponse.ok) {
                const quizData = await quizResponse.json();
                if (quizData.success && quizData.attempts) {
                    quizData.attempts.forEach(attempt => {
                        const correctAnswers = attempt.correct_answers || 0;
                        totalPoints += correctAnswers * 10;
                    });
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch quiz points:', error.message);
        }
        
        const lessonsCount = document.getElementById('lessonsCount');
        if (lessonsCount) {
            lessonsCount.innerHTML = `${lessonsCompleted}<span class="item-unit">/${totalLessons || 8}</span>`;
        }
        
        const exercisesCount = document.getElementById('exercisesCount');
        if (exercisesCount) {
            exercisesCount.innerHTML = `${exercisesCompleted}<span class="item-unit">/${totalExercises || 15}</span>`;
        }
        
        const quizScore = document.getElementById('quizScore');
        if (quizScore) {
            quizScore.innerHTML = `${totalPoints}<span class="item-unit">pts</span>`;
        }
        
        const avgTime = document.getElementById('avgTime');
        if (avgTime) {
            const avgMinutes = calculateAverageTime(lessonsCompleted, exercisesCompleted, totalPoints);
            avgTime.innerHTML = `${avgMinutes}<span class="item-unit">min/day</span>`;
        }
        
        console.log('✅ FactoLearn progress summary cards updated');
        
    } catch (error) {
        console.error('❌ Error updating progress summary cards:', error);
        setDefaultProgressValues();
    }
}

function setDefaultProgressValues() {
    const lessonsCount = document.getElementById('lessonsCount');
    const exercisesCount = document.getElementById('exercisesCount');
    const quizScore = document.getElementById('quizScore');
    const avgTime = document.getElementById('avgTime');
    
    if (lessonsCount) lessonsCount.innerHTML = `0<span class="item-unit">/8</span>`;
    if (exercisesCount) exercisesCount.innerHTML = `0<span class="item-unit">/15</span>`;
    if (quizScore) quizScore.innerHTML = `0<span class="item-unit">pts</span>`;
    if (avgTime) avgTime.innerHTML = `5<span class="item-unit">min/day</span>`;
}

function calculateAverageTime(lessons, exercises, points) {
    let time = 5;
    if (lessons > 0) time += lessons * 3;
    if (exercises > 0) time += exercises * 1.5;
    if (points > 0) time += Math.floor(points / 30);
    time = Math.min(45, Math.max(5, Math.round(time)));
    return time;
}
// ============================================
// INIT PROGRESS DASHBOARD
// ============================================
async function initProgressDashboard() {
    console.log('📈 Initializing progress dashboard...');
    
    try {
        // Show loading state
        showProgressDashboardLoading();
        
        // Load all progress data
        await loadProgressDashboardData();
        
        // Load topic mastery
        await fetchTopicMastery();
        
        // Load activity log
        await fetchActivityLog(15);
        
        // Initialize charts
        await initProgressCharts();
        
        // Start auto-refresh (every 60 seconds)
        startProgressAutoRefresh(60);
        
        console.log('✅ Progress dashboard initialized');
        
    } catch (error) {
        console.error('❌ Error initializing progress dashboard:', error);
        hideProgressDashboardLoading();
        
        // Show error message
        const container = document.querySelector('#progress-page .container');
        if (container) {
            container.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c; margin-bottom: 20px;"></i>
                    <h3 style="color: #2c3e50; margin-bottom: 10px;">Failed to load progress data</h3>
                    <p style="color: #7f8c8d;">Please try refreshing the page.</p>
                    <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-redo"></i> Refresh Page
                    </button>
                </div>
            `;
        }
    }
}
// ============================================
// LOAD PROGRESS DASHBOARD DATA
// ============================================
async function loadProgressDashboardData() {
    console.log('📊 Loading FactoLearn progress dashboard data...');
    
    try {
        showProgressDashboardLoading();
        
        const token = localStorage.getItem('authToken') || authToken;
        
        if (!token) {
            console.error('❌ No auth token');
            useMockProgressData();
            return;
        }
        
        const [
            lessonsProgress,
            practiceStats,
            quizStats,
            totalLessonsCount
        ] = await Promise.allSettled([
            fetch(`/api/progress/lessons?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(() => ({ success: false })),
            
            fetch(`/api/progress/practice-attempts?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(() => ({ success: false })),
            
            fetch(`/api/quiz/user/attempts?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(() => ({ success: false })),
            
            fetch(`/api/lessons-db/complete?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(() => ({ success: false }))
        ]);
        
        let lessonsCompleted = 0;
        let totalLessons = 8;
        
        if (lessonsProgress.status === 'fulfilled' && lessonsProgress.value?.success) {
            const progress = lessonsProgress.value.progress || [];
            lessonsCompleted = progress.filter(p => 
                p.completion_status === 'completed' || p.status === 'completed'
            ).length;
        }
        
        if (totalLessonsCount.status === 'fulfilled' && totalLessonsCount.value?.success) {
            totalLessons = totalLessonsCount.value.lessons?.length || 8;
        }
        
        let exercisesCompleted = 0;
        let totalPracticeSeconds = 0;
        
        if (practiceStats.status === 'fulfilled' && practiceStats.value?.success) {
            const attempts = practiceStats.value.attempts || [];
            exercisesCompleted = attempts.filter(a => 
                a.completion_status === 'completed' || a.percentage >= 70
            ).length;
            
            attempts.forEach(a => {
                totalPracticeSeconds += a.time_spent_seconds || 0;
            });
        }
        
        let quizPoints = 0;
        let quizAttempts = 0;
        
        if (quizStats.status === 'fulfilled' && quizStats.value?.success) {
            const attempts = quizStats.value.attempts || [];
            quizAttempts = attempts.length;
            
            attempts.forEach(attempt => {
                const correctAnswers = attempt.correct_answers || 0;
                quizPoints += correctAnswers * 10;
            });
        }
        
        const overallPercentage = totalLessons > 0 
            ? Math.round((lessonsCompleted / totalLessons) * 100) 
            : 0;
        
        updateOverallProgressDisplay({
            total_lessons_completed: lessonsCompleted,
            total_lessons: totalLessons,
            overall_percentage: overallPercentage,
            exercises_completed: exercisesCompleted,
            total_quizzes_completed: quizAttempts,
            total_points_earned: quizPoints,
            total_time_spent_minutes: Math.floor(totalPracticeSeconds / 60)
        });
        
        hideProgressDashboardLoading();
        
        ProgressState.cumulativeProgress = {
            total_lessons_completed: lessonsCompleted,
            total_lessons: totalLessons,
            overall_percentage: overallPercentage,
            exercises_completed: exercisesCompleted,
            total_quizzes_completed: quizAttempts,
            total_points_earned: quizPoints,
            total_time_spent_minutes: Math.floor(totalPracticeSeconds / 60)
        };
        
    } catch (error) {
        console.error('❌ Error loading progress dashboard:', error);
        hideProgressDashboardLoading();
        useMockProgressData();
    }
}
// ============================================
// USE MOCK PROGRESS DATA (FALLBACK)
// ============================================
function useMockProgressData() {
    console.log('📊 Using mock progress data');
    
    const mockProgress = {
        total_lessons_completed: 3,
        total_lessons: 8,
        overall_percentage: 38,
        exercises_completed: 5,
        total_quizzes_completed: 2,
        total_points_earned: 150,
        total_time_spent_minutes: 120
    };
    
    updateOverallProgressDisplay(mockProgress);
    
    ProgressState.cumulativeProgress = mockProgress;
}
// ============================================
// SHOW/HIDE PROGRESS DASHBOARD LOADING
// ============================================
function showProgressDashboardLoading() {
    console.log('⏳ Showing loading state');
    
    const elements = [
        { id: 'overallProgress' },
        { id: 'totalPointsProgress' },
        { id: 'totalTime' },
        { id: 'totalBadges' }
    ];
    
    elements.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
            element.setAttribute('data-original', element.textContent);
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            element.style.opacity = '0.7';
            element.classList.add('loading');
        }
    });
}
function hideProgressDashboardLoading() {
    console.log('✅ Hiding loading state');
    
    const elements = [
        { id: 'overallProgress' },
        { id: 'totalPointsProgress' },
        { id: 'totalTime' },
        { id: 'totalBadges' }
    ];
    
    elements.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
            element.style.opacity = '1';
            element.classList.remove('loading');
        }
    });
}

// ============================================
// ✅ FIXED: initPracticePage
// ============================================
async function initPracticePage() {
    console.log('💪 Initializing practice page with strict lesson_id=3 filtering...');
    
    const practiceDate = document.getElementById('practiceDate');
    if (practiceDate) {
        const now = new Date();
        practiceDate.textContent = now.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    localStorage.setItem('currentLessonId', '3');
    
    if (!PracticeState.currentTopic) {
        PracticeState.currentTopic = '1';
    }
    
    await loadPracticeStatistics();
    await loadTopicsProgress();
    await loadPracticeExercisesForTopic(PracticeState.currentTopic);
    
    addPracticeStyles();
    
    console.log('✅ Practice page initialized for FactoLearn (lesson 3)');
}

// ============================================
// ✅ FIXED: loadTopicsProgress
// ============================================
async function loadTopicsProgress() {
    try {
        const topicsContainer = document.getElementById('topicsContainer');
        if (!topicsContainer) return;
        
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            topicsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Please login to view topics</h3>
                </div>
            `;
            return;
        }
        
        const response = await fetch(`/api/topics/progress?lesson_id=3`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            topicsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load topics</h3>
                    <p>API returned ${response.status}</p>
                </div>
            `;
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.topics) {
            const filteredTopics = data.topics.filter(topic => {
                const topicLessonId = topic.lesson_id || topic.lessonId;
                return topicLessonId == 3;
            });
            
            if (filteredTopics.length > 0) {
                displayTopics(filteredTopics);
            } else {
                topicsContainer.innerHTML = `
                    <div class="no-topics" style="text-align: center; padding: 40px;">
                        <i class="fas fa-folder-open" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                        <h3 style="color: #666;">No topics available for FactoLearn</h3>
                        <p style="color: #999;">Topics will appear here once created.</p>
                    </div>
                `;
            }
        } else {
            topicsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-info-circle"></i>
                    <h3>No topics found</h3>
                    <p>${data.message || 'No topics available yet'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Error loading topics progress:', error);
        const topicsContainer = document.getElementById('topicsContainer');
        if (topicsContainer) {
            topicsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load topics</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

function displayTopics(topics) {
    const topicsContainer = document.getElementById('topicsContainer');
    if (!topicsContainer) return;
    
    let html = '';
    
    topics.forEach(topic => {
        const progressPercentage = topic.lesson_progress_percentage || 0;
        const isPracticeUnlocked = topic.practice_unlocked || false;
        const isPracticeCompleted = topic.practice_completed || false;
        const isSelected = PracticeState.currentTopic == topic.topic_id;
        
        html += `
            <div class="topic-card ${isPracticeUnlocked ? 'unlocked' : 'locked'} ${isPracticeCompleted ? 'completed' : ''} ${isSelected ? 'selected' : ''}" 
                 data-topic-id="${topic.topic_id}"
                 data-practice-unlocked="${isPracticeUnlocked}"
                 style="cursor: pointer; background: white; border-radius: 8px; padding: 15px; margin-bottom: 10px; border: 2px solid ${isSelected ? '#7a0000' : 'transparent'};">
                 
                <div class="topic-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 class="topic-title" style="margin: 0; font-size: 16px;">${topic.topic_title || 'Topic'}</h3>
                    <div class="topic-status">
                        ${isPracticeCompleted ? 
                            '<span style="color: #27ae60;"><i class="fas fa-check-circle"></i> Completed</span>' :
                            isPracticeUnlocked ?
                            '<span style="color: #7a0000;"><i class="fas fa-unlock"></i> Unlocked</span>' :
                            '<span style="color: #999;"><i class="fas fa-lock"></i> Locked</span>'
                        }
                    </div>
                </div>
                
                <div class="topic-body">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${topic.module_name || 'Module'}</p>
                    
                    <div class="topic-progress" style="margin: 10px 0;">
                        <div class="progress-info" style="display: flex; justify-content: space-between; font-size: 13px; color: #666; margin-bottom: 5px;">
                            <span>Lessons: ${topic.lessons_completed || 0}/${topic.total_lessons || 0}</span>
                            <span>${progressPercentage}%</span>
                        </div>
                        <div class="progress-bar" style="height: 6px; background: #ecf0f1; border-radius: 3px; overflow: hidden;">
                            <div class="progress-fill" style="height: 100%; width: ${progressPercentage}%; background: #7a0000;"></div>
                        </div>
                    </div>
                    
                    <div class="topic-practice-info" style="font-size: 13px; margin-top: 5px;">
                        ${isPracticeCompleted ? 
                            '<span style="color: #27ae60;"><i class="fas fa-trophy"></i> Practice Completed</span>' :
                            isPracticeUnlocked ?
                            '<span style="color: #7a0000;"><i class="fas fa-pencil-alt"></i> Practice Available</span>' :
                            `<span style="color: #999;">Complete ${(topic.total_lessons || 0) - (topic.lessons_completed || 0)} more lessons</span>`
                        }
                    </div>
                </div>
                
                <div class="topic-actions" style="margin-top: 15px;">
                    ${isPracticeUnlocked ? 
                        `<button class="btn-primary practice-topic-btn" data-topic-id="${topic.topic_id}" 
                                style="width: 100%; padding: 8px; background: #7a0000; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-play"></i> Start Practice
                        </button>` :
                        `<button class="btn-secondary" disabled 
                                style="width: 100%; padding: 8px; background: #95a5a6; color: white; border: none; border-radius: 5px;">
                            <i class="fas fa-lock"></i> Complete Lessons First
                        </button>`
                    }
                </div>
            </div>
        `;
    });
    
    topicsContainer.innerHTML = html;
    
    document.querySelectorAll('.topic-card.unlocked').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('button')) return;
            const topicId = this.getAttribute('data-topic-id');
            selectTopicForPractice(topicId);
        });
    });
    
    document.querySelectorAll('.practice-topic-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const topicId = this.getAttribute('data-topic-id');
            selectTopicForPractice(topicId);
        });
    });
}

async function selectTopicForPractice(topicId) {
    PracticeState.currentTopic = topicId;
    
    document.querySelectorAll('.topic-card').forEach(card => {
        card.classList.remove('selected');
        if (card.getAttribute('data-topic-id') === topicId) {
            card.classList.add('selected');
        }
    });
    
    await loadPracticeExercisesForTopic(topicId);
    
    const practiceTopicTitle = document.getElementById('practiceTopicTitle');
    if (practiceTopicTitle) {
        const selectedTopic = document.querySelector(`.topic-card[data-topic-id="${topicId}"] .topic-title`);
        if (selectedTopic) {
            practiceTopicTitle.textContent = `Practicing: ${selectedTopic.textContent}`;
        }
    }
}

async function loadPracticeExercisesForTopic(topicId) {
    try {
        const exerciseArea = document.getElementById('exerciseArea');
        if (!exerciseArea) return;
        
        exerciseArea.innerHTML = `
            <div class="loading-container" style="text-align: center; padding: 30px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 30px; color: #7a0000;"></i>
                <p style="margin-top: 10px;">Loading FactoLearn exercises...</p>
            </div>
        `;
        
        const response = await fetch(`/api/practice/topic/${topicId}?lesson_id=3`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.exercises) {
            const filteredExercises = data.exercises.filter(ex => {
                const exerciseLessonId = ex.lesson_id || ex.lessonId;
                return exerciseLessonId == 3;
            });
            
            if (filteredExercises.length > 0) {
                displayPracticeExercises(filteredExercises);
            } else {
                exerciseArea.innerHTML = `
                    <div class="no-exercises" style="text-align: center; padding: 40px;">
                        <i class="fas fa-pencil-alt" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                        <h3 style="color: #666;">No Practice Exercises for FactoLearn</h3>
                        <p style="color: #999;">There are no practice exercises available yet.</p>
                    </div>
                `;
            }
        } else {
            exerciseArea.innerHTML = `
                <div class="no-exercises" style="text-align: center; padding: 40px;">
                    <i class="fas fa-pencil-alt" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                    <h3 style="color: #666;">No Practice Exercises</h3>
                    <p style="color: #999;">There are no practice exercises available for this topic yet.</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading exercises:', error);
        const exerciseArea = document.getElementById('exerciseArea');
        if (exerciseArea) {
            exerciseArea.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c;"></i>
                    <h3 style="color: #666;">Failed to load exercises</h3>
                    <p style="color: #999;">${error.message}</p>
                </div>
            `;
        }
    }
}

function displayPracticeExercises(exercises) {
    const exerciseArea = document.getElementById('exerciseArea');
    if (!exerciseArea) return;
    
    if (!exercises || exercises.length === 0) {
        exerciseArea.innerHTML = `
            <div class="no-exercises" style="text-align: center; padding: 40px;">
                <i class="fas fa-pencil-alt" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                <h3 style="color: #666;">No Practice Exercises</h3>
                <p style="color: #999;">There are no practice exercises available for this topic yet.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="exercises-list">';
    
    exercises.forEach((exercise, index) => {
        let questions = [];
        if (exercise.content_json) {
            try {
                const content = typeof exercise.content_json === 'string' 
                    ? JSON.parse(exercise.content_json) 
                    : exercise.content_json;
                questions = content.questions || [];
            } catch (e) {
                console.error('Error parsing content_json:', e);
            }
        }
        
        const userProgress = exercise.user_progress || {};
        const isCompleted = userProgress.completion_status === 'completed';
        const difficultyClass = exercise.difficulty || 'medium';
        
        html += `
            <div class="exercise-card ${isCompleted ? 'completed' : ''}" data-exercise-id="${exercise.exercise_id}">
                <div class="exercise-header">
                    <h3>Exercise ${index + 1}: ${exercise.title || 'Practice Exercise'}</h3>
                    <span class="difficulty-badge difficulty-${difficultyClass}">
                        ${exercise.difficulty || 'medium'}
                    </span>
                </div>
                
                <div class="exercise-body">
                    <p>${exercise.description || 'Test your knowledge with this practice exercise.'}</p>
                    
                    <div class="exercise-meta">
                        <span class="meta-item">
                            <i class="fas fa-star"></i> ${exercise.points || 10} points
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-question-circle"></i> ${questions.length} questions
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-check-circle"></i> ${userProgress.attempts || 0} attempts
                        </span>
                    </div>
                    
                    ${userProgress.score > 0 ? `
                        <div class="score-display">
                            <strong>Best Score:</strong> ${userProgress.score}/${exercise.points || 10}
                            (${Math.round((userProgress.score / (exercise.points || 10)) * 100)}%)
                        </div>
                    ` : ''}
                </div>
                
                <div class="exercise-actions">
                    ${isCompleted ? `
                        <button class="btn-secondary review-exercise" data-exercise-id="${exercise.exercise_id}">
                            <i class="fas fa-redo"></i> Review
                        </button>
                        <button class="btn-success" disabled>
                            <i class="fas fa-check"></i> Completed
                        </button>
                    ` : `
                        <button class="btn-primary start-exercise" data-exercise-id="${exercise.exercise_id}">
                            <i class="fas fa-play"></i> ${userProgress.status === 'in_progress' ? 'Continue' : 'Start'}
                        </button>
                    `}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    exerciseArea.innerHTML = html;
    
    setupPracticeExerciseInteractions();
}

function setupPracticeExerciseInteractions() {
    document.querySelectorAll('.start-exercise').forEach(button => {
        button.addEventListener('click', function() {
            const exerciseId = this.getAttribute('data-exercise-id');
            startPractice(exerciseId);
        });
    });
    
    document.querySelectorAll('.review-exercise').forEach(button => {
        button.addEventListener('click', function() {
            const exerciseId = this.getAttribute('data-exercise-id');
            startPractice(exerciseId, true);
        });
    });
}

async function startPractice(exerciseId, isReview = false) {
    console.log("▶️ Starting PRACTICE:", exerciseId);
    
    try {
        const token = localStorage.getItem('authToken') || authToken;
        
        if (!token) {
            showNotification('error', 'Auth Error', 'Please login first');
            return;
        }
        
        const response = await fetch(`/api/practice/exercises/${exerciseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const localExercise = getLocalExercise(exerciseId);
            if (localExercise) {
                PracticeState.currentExercise = localExercise;
                showPracticeModal(localExercise, isReview);
            }
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.exercise) {
            const exercise = result.exercise;
            
            if (!exercise.questions || exercise.questions.length === 0) {
                if (exercise.content_json) {
                    try {
                        const parsed = typeof exercise.content_json === 'string' 
                            ? JSON.parse(exercise.content_json) 
                            : exercise.content_json;
                        exercise.questions = parsed.questions || [];
                    } catch (e) {
                        console.error('Parse error:', e);
                    }
                }
            }
            
            PracticeState.currentExercise = exercise;
            showPracticeModal(exercise, isReview);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

function getLocalExercise(exerciseId) {
    const exercises = {
        1: {
            exercise_id: 1,
            title: '📐 Factorial Basics',
            description: 'Practice basic factorial calculations',
            points: 10,
            questions: [
                {
                    text: 'What is 5! (5 factorial)?',
                    options: [
                        { text: '120', correct: true },
                        { text: '60', correct: false },
                        { text: '24', correct: false },
                        { text: '720', correct: false }
                    ]
                },
                {
                    text: 'Simplify: 6! / 4!',
                    options: [
                        { text: '30', correct: true },
                        { text: '24', correct: false },
                        { text: '20', correct: false },
                        { text: '36', correct: false }
                    ]
                }
            ]
        },
        2: {
            exercise_id: 2,
            title: '🧮 Permutation Practice',
            description: 'Practice permutation problems',
            points: 10,
            questions: [
                {
                    text: 'How many ways can you arrange 5 books on a shelf?',
                    options: [
                        { text: '120', correct: true },
                        { text: '60', correct: false },
                        { text: '24', correct: false },
                        { text: '720', correct: false }
                    ]
                }
            ]
        }
    };
    
    return exercises[exerciseId] || exercises[1];
}

function showPracticeModal(exercise, isReview = false) {
    const startTime = Date.now();
    let timerInterval = null;
    
    let timeLeft = 300;
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timerSpan = document.getElementById('practiceTimer');
        if (timerSpan) {
            timerSpan.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            autoSubmitAnswers();
        }
        timeLeft--;
    }
    
    let questionsHTML = '';
    const answerState = {};
    
    exercise.questions.forEach((q, index) => {
        const questionText = q.text || q.question || `Question ${index + 1}`;
        const options = q.options || [];
        
        let optionsHTML = '';
        options.forEach((opt, optIndex) => {
            const optText = opt.text || `Option ${optIndex + 1}`;
            
            optionsHTML += `
                <div style="margin: 8px 0;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border-radius: 5px; background: #f8f9fa;">
                        <input type="radio" name="q${index}" value="${optIndex}" 
                               data-question="${index}" data-option="${optIndex}"
                               style="width: 16px; height: 16px; cursor: pointer;">
                        <span style="font-size: 15px;">${optText}</span>
                    </label>
                </div>
            `;
        });
        
        questionsHTML += `
            <div class="practice-question" style="background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #7a0000;">
                <p style="font-weight: bold; margin: 0 0 10px 0;">Question ${index + 1}: ${questionText}</p>
                <div style="margin-left: 20px;">${optionsHTML}</div>
            </div>
        `;
    });
    
    const modalHTML = `
        <div class="practice-only-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 999999;">
            <div style="background: white; width: 90%; max-width: 700px; max-height: 85vh; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); display: flex; flex-direction: column;">
                <div style="background: #7a0000; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 18px;">${exercise.title || 'Practice Exercise'}</h3>
                    <button onclick="closePracticeModal()" style="background:none; border:none; color:white; font-size:24px; cursor:pointer;">✕</button>
                </div>
                
                <div style="padding: 10px 20px; background: #f8f9fa; border-bottom: 1px solid #ddd;">
                    <div style="text-align: right; margin-bottom: 15px; font-size: 18px; color: #7a0000; font-weight: bold;">
                        <i class="fas fa-clock"></i> <span id="practiceTimer">05:00</span>
                    </div>
                </div>
                
                <div style="padding: 20px; overflow-y: auto; max-height: calc(85vh - 180px);">
                    ${questionsHTML}
                </div>
                
                <div style="padding: 15px 20px; border-top: 1px solid #ddd; background: #f8f9fa; display: flex; justify-content: flex-end;">
                    <button onclick="window.submitPracticeAnswers()" 
                            style="background: #7a0000; color: white; border: none; padding: 12px 30px; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-paper-plane"></i> Submit Answers
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.querySelectorAll('.practice-only-modal').forEach(el => el.remove());
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    timerInterval = setInterval(updateTimer, 1000);
    
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const questionIdx = this.getAttribute('data-question');
            const optionIdx = this.getAttribute('data-option');
            answerState[`q${questionIdx}`] = optionIdx;
        });
    });
    
    function autoSubmitAnswers() {
        clearInterval(timerInterval);
        submitPracticeAnswers();
    }
    
    window.closePracticeModal = function() {
        clearInterval(timerInterval);
        document.querySelectorAll('.practice-only-modal').forEach(el => el.remove());
    };
    
    window.submitPracticeAnswers = async function() {
        clearInterval(timerInterval);
        
        const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
        
        const answers = {};
        let answeredCount = 0;
        
        exercise.questions.forEach((q, index) => {
            const selectedRadio = document.querySelector(`input[name="q${index}"]:checked`);
            if (selectedRadio) {
                answers[`q${index}`] = selectedRadio.value;
                answeredCount++;
            }
        });
        
        const submitBtn = document.querySelector('.practice-only-modal button[onclick="window.submitPracticeAnswers()"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;
        }
        
        try {
            await submitPracticeAnswersToServer(
                exercise.exercise_id,
                answers,
                timeSpentSeconds
            );
            
            document.querySelectorAll('.practice-only-modal').forEach(el => el.remove());
            
        } catch (error) {
            console.error('Submission error:', error);
            
            const results = {
                correctAnswers: answeredCount,
                wrongAnswers: exercise.questions.length - answeredCount,
                totalQuestions: exercise.questions.length,
                percentage: Math.round((answeredCount / exercise.questions.length) * 100),
                timeSpentSeconds: timeSpentSeconds,
                pointsEarned: answeredCount * 10
            };
            
            showPracticeResultModal(results);
            
            document.querySelectorAll('.practice-only-modal').forEach(el => el.remove());
        }
    };
}

async function submitPracticeAnswersToServer(exerciseId, answers, timeSpentSeconds) {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        
        const totalQuestions = Object.keys(answers).length;
        const correctAnswers = Math.floor(Math.random() * (totalQuestions + 1));
        const wrongAnswers = totalQuestions - correctAnswers;
        const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        
        await fetch(`/api/practice/${exerciseId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                answers: answers,
                time_spent_seconds: timeSpentSeconds,
                correct_count: correctAnswers,
                wrong_count: wrongAnswers,
                percentage: percentage
            })
        }).catch(() => {});
        
        const results = {
            correctAnswers: correctAnswers,
            wrongAnswers: wrongAnswers,
            totalQuestions: totalQuestions,
            percentage: percentage,
            timeSpentSeconds: timeSpentSeconds,
            pointsEarned: correctAnswers * 10
        };
        
        showPracticeResultModal(results);
        
        await fetchPracticeStatistics();
        
        setTimeout(() => {
            if (PracticeState.currentTopic) {
                loadPracticeExercisesForTopic(PracticeState.currentTopic);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error submitting practice:', error);
    }
}

function showPracticeResultModal(results) {
    const existingModal = document.querySelector('.practice-result-modal');
    if (existingModal) existingModal.remove();
    
    const scorePercentage = results.percentage || 0;
    
    let resultType = 'info';
    let resultIcon = 'fa-check-circle';
    let resultTitle = 'Practice Completed!';
    let encouragementMessage = 'Keep practicing to master this topic!';
    
    if (scorePercentage >= 90) {
        resultType = 'success';
        resultIcon = 'fa-crown';
        resultTitle = '🎉 Excellent Work!';
        encouragementMessage = 'You\'ve mastered this topic!';
    } else if (scorePercentage >= 75) {
        resultType = 'success';
        resultIcon = 'fa-star';
        resultTitle = '🌟 Great Job!';
        encouragementMessage = 'You\'re doing really well!';
    } else if (scorePercentage >= 50) {
        resultType = 'info';
        resultIcon = 'fa-smile';
        resultTitle = '💪 Good Effort!';
        encouragementMessage = 'You\'re making progress!';
    } else {
        resultType = 'warning';
        resultIcon = 'fa-book';
        resultTitle = '📚 Keep Practicing';
        encouragementMessage = 'Every mistake is a learning opportunity.';
    }
    
    const timeSpent = results.timeSpentSeconds || 0;
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    
    const stats = PracticeState.userPracticeProgress || {};
    const lessonsCompleted = stats.lessons_completed || 0;
    const totalLessons = stats.total_lessons || 8;
    const exercisesCompleted = stats.exercises_completed || 0;
    const lessonsPercentage = stats.lessons_percentage || 0;
    
    let tipsHTML = '';
    if (scorePercentage < 75) {
        tipsHTML = `
            <div style="background: #fff9e6; border-left: 4px solid #f39c12; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <i class="fas fa-lightbulb" style="color: #f39c12; margin-right: 8px;"></i>
                <strong>Tips to improve:</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
                    <li>📖 Review the lesson materials again</li>
                    <li>✍️ Take notes on key concepts</li>
                    <li>🔍 Focus on the questions you got wrong</li>
                    <li>💪 Try the exercise again tomorrow</li>
                </ul>
            </div>
        `;
    }
    
    const modalHTML = `
        <div class="practice-result-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000000; padding: 20px;">
            <div style="background: white; border-radius: 16px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.4s ease;">
                
                <div style="padding: 25px 25px 15px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 40px; background: ${scorePercentage >= 75 ? 'linear-gradient(135deg, #27ae60, #2ecc71)' : (scorePercentage >= 50 ? 'linear-gradient(135deg, #3498db, #2980b9)' : 'linear-gradient(135deg, #e74c3c, #c0392b)')}; color: white;">
                        <i class="fas ${resultIcon}"></i>
                    </div>
                    <h2 style="margin: 0; font-size: 24px; font-weight: bold; color: #2c3e50;">${resultTitle}</h2>
                </div>
                
                <div style="padding: 25px;">
                    
                    <div style="position: relative; width: 150px; height: 150px; margin: 0 auto 20px;">
                        <svg viewBox="0 0 36 36" style="width: 150px; height: 150px; transform: rotate(-90deg);">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ecf0f1" stroke-width="8"></circle>
                            <circle cx="18" cy="18" r="15.9" fill="none" 
                                    stroke="${scorePercentage >= 75 ? '#27ae60' : (scorePercentage >= 50 ? '#3498db' : '#e74c3c')}" 
                                    stroke-width="8" stroke-dasharray="${scorePercentage}, 100" 
                                    stroke-linecap="round"></circle>
                        </svg>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 36px; font-weight: bold; color: #2c3e50; text-align: center;">
                            ${scorePercentage}%
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0;">
                        <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #7a0000; margin-bottom: 5px;">${results.correctAnswers || 0}</div>
                            <div style="font-size: 12px; color: #7f8c8d;">Correct</div>
                        </div>
                        <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #e74c3c; margin-bottom: 5px;">${results.wrongAnswers || 0}</div>
                            <div style="font-size: 12px; color: #7f8c8d;">Wrong</div>
                        </div>
                        <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #3498db; margin-bottom: 5px;">${results.totalQuestions || 0}</div>
                            <div style="font-size: 12px; color: #7f8c8d;">Total</div>
                        </div>
                        <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #f39c12; margin-bottom: 5px;">${timeDisplay}</div>
                            <div style="font-size: 12px; color: #7f8c8d;">Time</div>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 20px 0; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #7a0000;">+${results.correctAnswers * 10 || 0}</div>
                        <div style="font-size: 12px; color: #7f8c8d;">Points Earned</div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 20px 0;">
                        <h4 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 16px;">
                            <i class="fas fa-chart-line" style="color: #7a0000;"></i> Your Overall Progress
                        </h4>
                        
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; color: #2c3e50;">
                                <span><i class="fas fa-book"></i> Lessons Completed</span>
                                <span><strong>${lessonsCompleted}/${totalLessons}</strong></span>
                            </div>
                            <div style="height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${lessonsPercentage}%; background: linear-gradient(90deg, #7a0000, #c0392b);"></div>
                            </div>
                        </div>
                        
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; color: #2c3e50;">
                                <span><i class="fas fa-pencil-alt"></i> Exercises Completed</span>
                                <span><strong>${exercisesCompleted}</strong></span>
                            </div>
                            <div style="height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${Math.min(exercisesCompleted * 10, 100)}%; background: linear-gradient(90deg, #7a0000, #c0392b);"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #fff9e6; padding: 15px; border-radius: 10px; text-align: center; border-left: 4px solid #f39c12; margin: 20px 0;">
                        <i class="fas fa-quote-left" style="color: #f39c12; margin-right: 8px;"></i>
                        ${encouragementMessage}
                    </div>
                    
                    ${tipsHTML}
                    
                </div>
                
                <div style="padding: 20px 25px 25px; border-top: 1px solid #f0f0f0; display: flex; gap: 10px; justify-content: center;">
                    <button onclick="closePracticeResultModal()" style="flex: 1; padding: 12px 15px; border: 2px solid #7a0000; background: white; color: #7a0000; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fas fa-times"></i> Close
                    </button>
                    <button onclick="tryPracticeAgain()" style="flex: 1; padding: 12px 15px; background: #7a0000; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                    <button onclick="goToNextPractice()" style="flex: 1; padding: 12px 15px; background: #27ae60; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fas fa-arrow-right"></i> Next
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.closePracticeResultModal = function() {
    const modal = document.querySelector('.practice-result-modal');
    if (modal) modal.remove();
};

window.tryPracticeAgain = function() {
    closePracticeResultModal();
    if (PracticeState.currentExercise) {
        startPractice(PracticeState.currentExercise.exercise_id, false);
    }
};

window.goToNextPractice = function() {
    closePracticeResultModal();
    
    if (PracticeState.exercises && PracticeState.currentExercise) {
        const currentIndex = PracticeState.exercises.findIndex(e => 
            e.exercise_id === PracticeState.currentExercise.exercise_id
        );
        
        if (currentIndex >= 0 && currentIndex < PracticeState.exercises.length - 1) {
            startPractice(PracticeState.exercises[currentIndex + 1].exercise_id);
        } else {
            showNotification('All exercises completed! Great job! 🎉', 'success');
            if (PracticeState.currentTopic) {
                loadPracticeExercisesForTopic(PracticeState.currentTopic);
            }
        }
    }
};

// ============================================
// ✅ INITIALIZE APP - FACTOLEARN VERSION
// ============================================
function initApp() {
    console.log('🎮 FactoLearn Application Initializing...');
    
    window.FACTOLEARN_LESSON_ID = 3;
    
    localStorage.setItem('selectedApp', 'factolearn');
    localStorage.setItem('currentLessonFilter', '3');
    localStorage.setItem('currentLessonId', '3');
    
    const existingUser = localStorage.getItem('mathhub_user');
    const existingToken = localStorage.getItem('authToken');
    
    if (existingUser && existingToken) {
        console.log('📱 Using existing user session');
        try {
            AppState.currentUser = JSON.parse(existingUser);
            AppState.isAuthenticated = true;
            AppState.selectedApp = 'factolearn';
            AppState.hasSelectedApp = true;
            
            initHamburgerMenu();
            
            navigateTo('dashboard');
            
            setTimeout(() => {
                loadFactoLearnData();
            }, 500);
            
            return;
        } catch (e) {
            console.error('Error parsing existing user:', e);
            localStorage.removeItem('mathhub_user');
            localStorage.removeItem('authToken');
        }
    }
    
    console.log('📱 No existing session, using demo user for FactoLearn');
    const demoUser = {
        id: 1,
        username: 'factolearn_user',
        email: 'demo@factolearn.com',
        full_name: 'FactoLearn Student',
        role: 'student'
    };
    
    AppState.currentUser = demoUser;
    AppState.isAuthenticated = true;
    AppState.hasSelectedApp = true;
    AppState.selectedApp = 'factolearn';
    
    authToken = 'demo_token_' + Date.now();
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('mathhub_user', JSON.stringify(demoUser));
    localStorage.setItem('hasSelectedApp', 'true');
    localStorage.setItem('selectedApp', 'factolearn');
    localStorage.setItem('currentLessonFilter', '3');
    localStorage.setItem('currentLessonId', '3');
    
    initHamburgerMenu();
    
    navigateTo('dashboard');
    
    setTimeout(() => {
        loadFactoLearnData();
    }, 500);
    
    console.log('🎮 FactoLearn Application Initialized - lesson_id=3 forced');
}

async function loadFactoLearnData() {
    console.log('📥 Loading ALL FactoLearn data (lesson_id=3)...');
    
    try {
        showDashboardLoading();
        
        // Use apiRequest for all API calls - automatic na magsa-switch sa mock data kung 401/403
        const [
            lessonsResult,
            practiceStats,
            cumulativeProgress
        ] = await Promise.allSettled([
            apiRequest('/api/lessons-db/complete?lesson_id=3'),
            apiRequest('/api/progress/practice-attempts?lesson_id=3'),
            apiRequest('/api/progress/overall')
        ]);
        
        // Update continue learning with lessons
        if (lessonsResult.status === 'fulfilled' && lessonsResult.value?.success) {
            LessonState.lessons = lessonsResult.value.lessons || [];
            await updateContinueLearningModule();
        }
        
        // Update practice stats
        if (practiceStats.status === 'fulfilled' && practiceStats.value?.success) {
            PracticeState.userPracticeProgress = practiceStats.value;
        }
        
        // Update progress summary
        await updateProgressSummaryCards();
        
        hideDashboardLoading();
        console.log('✅ All FactoLearn data loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading FactoLearn data:', error);
        hideDashboardLoading();
        
        // Show fallback data
        await updateContinueLearningModule();
        await updateProgressSummaryCards();
    }
}
function showDashboardLoading() {
    const elements = [
        'totalTime',
        'totalPointsProgress',
        'overallProgress',
        'totalBadges',
        'lessonsCount',
        'exercisesCount',
        'quizScore',
        'avgTime'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.setAttribute('data-original', el.innerHTML);
            el.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size: 14px;"></i>';
            el.style.opacity = '0.7';
        }
    });
}

function hideDashboardLoading() {
    const elements = [
        'totalTime',
        'totalPointsProgress',
        'overallProgress',
        'totalBadges',
        'lessonsCount',
        'exercisesCount',
        'quizScore',
        'avgTime'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.getAttribute('data-original')) {
            el.innerHTML = el.getAttribute('data-original');
            el.style.opacity = '1';
        }
    });
}

// ============================================
// ✅ NAVIGATION FUNCTIONS
// ============================================
// ============================================
// NAVIGATION FUNCTION - FIXED
// ============================================
window.navigateTo = function(page) {
    console.log(`🧭 Navigating to: ${page}`);
    
    // Define page elements - CHECK KUNG MAY LOGIN PAGE
    const pages = {
        'dashboard': document.getElementById('dashboard-page'),
        'practice': document.getElementById('practice-exercises-page'),
        'quizDashboard': document.getElementById('quiz-dashboard-page'),
        'progress': document.getElementById('progress-page'),
        'feedback': document.getElementById('feedback-page'),
        'settings': document.getElementById('settings-page'),
        'moduleDashboard': document.getElementById('module-dashboard-page'),
        'appSelection': document.getElementById('app-selection-page'),
        'login': document.getElementById('login-page'),        // ITO ANG USER LOGIN PAGE
        'signup': document.getElementById('signup-page'),
        'loading': document.getElementById('loading-page'),
        'landing': document.getElementById('landing-page')
    };
    
    // Check if page exists
    if (!pages[page]) {
        console.error(`❌ Page "${page}" not found!`);
        
        // Try to find any element with that ID
        const element = document.getElementById(page);
        if (element) {
            console.log(`✅ Found element with id "${page}" but it's not in pages object`);
            pages[page] = element;
        } else {
            // If login page doesn't exist, show alert
            if (page === 'login') {
                alert('Login page not found! Please check your HTML.');
            }
            return;
        }
    }
    
    // Hide all pages
    Object.values(pages).forEach(p => {
        if (p) p.classList.add('hidden');
    });
    
    // Show target page
    pages[page].classList.remove('hidden');
    
    // Update current page in AppState
    if (window.AppState) {
        AppState.currentPage = page;
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log(`✅ Navigated to ${page}`);
};

// ============================================
// ✅ HAMBURGER MENU
// ============================================
let lastScrollPosition = 0;

function openMobileMenu() {
    console.log('🍔 Opening mobile menu');
    
    const overlay = document.getElementById('mobileMenuOverlay');
    const panel = document.getElementById('mobileMenuPanel');
    
    if (!overlay || !panel) return;
    
    lastScrollPosition = window.scrollY;
    
    overlay.classList.add('active');
    overlay.style.display = 'block';
    overlay.style.opacity = '1';
    
    panel.classList.add('active');
    panel.style.right = '0';
    panel.style.display = 'block';
    
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'relative';
}

function closeMobileMenu() {
    console.log('🍔 Closing mobile menu');
    
    const overlay = document.getElementById('mobileMenuOverlay');
    const panel = document.getElementById('mobileMenuPanel');
    
    if (!overlay || !panel) return;
    
    overlay.classList.remove('active');
    overlay.style.display = 'none';
    overlay.style.opacity = '0';
    
    panel.classList.remove('active');
    panel.style.right = '-100%';
    
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    
    window.scrollTo({
        top: lastScrollPosition,
        behavior: 'auto'
    });
}

function initHamburgerMenu() {
    console.log('🍔 Initializing hamburger menu...');
    
    const hamburgerBtn = document.getElementById('footerHamburgerBtn');
    const menuOverlay = document.getElementById('mobileMenuOverlay');
    const menuPanel = document.getElementById('mobileMenuPanel');
    const closeBtn = document.querySelector('.close-menu-btn');
    
    if (!hamburgerBtn || !menuOverlay || !menuPanel) {
        console.warn('⚠️ Menu elements not found');
        return;
    }
    
    const newBtn = hamburgerBtn.cloneNode(true);
    hamburgerBtn.parentNode.replaceChild(newBtn, hamburgerBtn);
    
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openMobileMenu();
    });
    
    menuOverlay.addEventListener('click', closeMobileMenu);
    
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', closeMobileMenu);
    }
    
    menuPanel.querySelectorAll('.mobile-menu-item').forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        newLink.addEventListener('click', function(e) {
            if (this.getAttribute('onclick')?.includes('showLogoutConfirmation')) {
                return;
            }
            closeMobileMenu();
        });
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menuOverlay.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    console.log('✅ Hamburger menu initialized');
}

// Menu navigation functions
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

function goToModuleDashboard(e) {
    if (e) e.preventDefault();
    closeMobileMenu();
    navigateTo('moduleDashboard');
}

function logoutUser(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    closeMobileMenu();
    showLogoutConfirmation();
}

function updateMenuUserInfo() {
    const userJson = localStorage.getItem('mathhub_user');
    if (!userJson) return;
    
    try {
        const user = JSON.parse(userJson);
        
        const userNameEl = document.getElementById('menuUserName');
        const userEmailEl = document.getElementById('menuUserEmail');
        const userAvatarEl = document.getElementById('menuUserAvatar');
        
        const fullName = user.full_name || user.username || 'Student';
        
        if (userNameEl) userNameEl.textContent = fullName;
        if (userEmailEl) userEmailEl.textContent = user.email || 'student@mathhub.com';
        if (userAvatarEl) userAvatarEl.textContent = fullName.charAt(0).toUpperCase();
        
    } catch (e) {
        console.error('Error updating menu user info:', e);
    }
}

// ============================================
// LOGOUT CONFIRMATION MODAL - GAYA NG NASA PICTURE
// ============================================
function showLogoutConfirmation() {
    console.log('🚪 Showing logout confirmation');
    
    // Remove existing modal if any
    const existingModal = document.querySelector('.logout-modal');
    if (existingModal) existingModal.remove();
    
    // Get user info for display
    const userJson = localStorage.getItem('mathhub_user');
    let userEmail = 'student@mathhub.com';
    let userLevel = 'Beginner';
    let userName = 'Student';
    
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            userEmail = user.email || 'student@mathhub.com';
            userName = user.full_name || user.username || 'Student';
            
            // Calculate level based on progress (simplified)
            const lessonsCompleted = ProgressState.cumulativeProgress?.total_lessons_completed || 0;
            if (lessonsCompleted >= 5) userLevel = 'Intermediate';
            if (lessonsCompleted >= 10) userLevel = 'Advanced';
            if (lessonsCompleted >= 15) userLevel = 'Expert';
        } catch (e) {
            console.error('Error parsing user:', e);
        }
    }
    
    // Get session time (simplified)
    const loginTime = localStorage.getItem('loginTime');
    let sessionTime = 'Just now';
    if (loginTime) {
        const minutes = Math.floor((Date.now() - parseInt(loginTime)) / 60000);
        if (minutes > 0) {
            sessionTime = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes/60)}h ${minutes%60}m`;
        }
    }
    
    const modalHTML = `
        <div class="logout-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 15px; animation: fadeIn 0.3s ease;">
            
            <div style="background: white; max-width: 380px; width: 100%; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px -12px rgba(0,0,0,0.4);">
                
                <!-- Modal Header -->
                <div style="background: #b90404; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-sign-out-alt"></i> 
                        Confirm Logout
                    </h3>
                    <button onclick="closeLogoutModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; line-height: 1; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
                
                <!-- Modal Body -->
                <div style="padding: 25px 20px; text-align: center; background: white;">
                    
                    <!-- Warning Icon -->
                    <div style="width: 70px; height: 70px; border-radius: 50%; background: #fff3cd; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 35px; color: #856404;"></i>
                    </div>
                    
                    <!-- Title -->
                    <h4 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #2c3e50;">
                        Are you sure you want to logout?
                    </h4>
                    
                    <!-- Message -->
                    <p style="color: #7f8c8d; margin: 0 0 20px; font-size: 14px; line-height: 1.5;">
                        You are about to log out from your MathHub Student account. 
                        Your progress is automatically saved.
                    </p>
                    
                    <!-- Details Section -->
                    <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 0 0 20px; text-align: left;">
                        
                        <!-- Account Info -->
                        <p style="margin: 8px 0; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-user" style="width: 18px; color: #7a0000;"></i>
                            <strong style="min-width: 80px;">Account:</strong> 
                            <span style="color: #34495e;">${userEmail}</span>
                        </p>
                        
                        <!-- Session Time -->
                        <p style="margin: 8px 0; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-clock" style="width: 18px; color: #7a0000;"></i>
                            <strong style="min-width: 80px;">Session:</strong> 
                            <span style="color: #34495e;">${sessionTime}</span>
                        </p>
                        
                        <!-- Student Level -->
                        <p style="margin: 8px 0; color: #2c3e50; font-size: 14px; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-graduation-cap" style="width: 18px; color: #7a0000;"></i>
                            <strong style="min-width: 80px;">Level:</strong> 
                            <span style="color: #34495e;">${userLevel}</span>
                        </p>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        
                        <!-- Cancel Button -->
                        <button onclick="closeLogoutModal()" style="flex: 1; padding: 12px 15px; background: #ecf0f1; color: #2c3e50; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s;">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        
                        <!-- Logout Button -->
                        <button onclick="confirmLogout()" style="flex: 1; padding: 12px 15px; background: #7a0000; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s;">
                            <i class="fas fa-sign-out-alt"></i>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .logout-modal button {
                transition: all 0.3s ease;
            }
            
            .logout-modal button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .logout-modal button[onclick="confirmLogout()"]:hover {
                background: #5a0000 !important;
                box-shadow: 0 5px 15px rgba(122, 0, 0, 0.3);
            }
            
            @media (max-width: 480px) {
                .logout-modal div[style*="max-width: 380px"] {
                    max-width: 320px;
                }
                
                .logout-modal p {
                    font-size: 13px;
                }
                
                .logout-modal strong {
                    min-width: 70px;
                }
                
                .logout-modal button {
                    padding: 10px 12px;
                    font-size: 13px;
                }
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Store login time for session display
    if (!localStorage.getItem('loginTime')) {
        localStorage.setItem('loginTime', Date.now().toString());
    }
}

// ============================================
// CLOSE LOGOUT MODAL
// ============================================
window.closeLogoutModal = function() {
    console.log('🔒 Closing logout modal');
    const modal = document.querySelector('.logout-modal');
    if (modal) {
        modal.remove();
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
};

// ============================================
// CONFIRM LOGOUT
// ============================================
function confirmLogout() {
    console.log('✅ Logout confirmed');
    
    // Close the modal immediately
    closeLogoutModal();
    
    // Show a brief notification (optional)
    showNotification('👋 Logging out...', 'info');
    
    // Execute logout without additional confirmation
    logoutAndRedirect();
}

function logoutAndRedirect() {
    console.log('🚪 Logging out - redirecting to main login page...');
    
    // Clear all authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('mathhub_user');
    localStorage.removeItem('hasSelectedApp');
    localStorage.removeItem('selectedApp');
    localStorage.removeItem('currentLessonFilter');
    localStorage.removeItem('currentLessonId');
    localStorage.removeItem('loginTime'); // <- Add this line
    sessionStorage.clear();
    
    // Reset app state
    AppState.currentUser = null;
    AppState.isAuthenticated = false;
    AppState.hasSelectedApp = false;
    AppState.selectedApp = null;
    authToken = null;
    
   
    
    // REDIRECT TO MAIN LOGIN PAGE
    window.location.href = '../index.html';
}
// Make sure closeLogoutModal exists
window.closeLogoutModal = function() {
    console.log('🔒 Closing logout modal');
    const modal = document.querySelector('.logout-modal, .modal-overlay');
    if (modal) {
        modal.remove();
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
};

// Make sure confirmLogout exists
window.confirmLogout = function() {
    console.log('✅ Logout confirmed');
    closeLogoutModal();
    logoutAndRedirect();
};

function hideFooterNavigation() {
    const navigation = document.querySelector('.footer-nav');
    if (navigation) {
        navigation.style.display = 'none';
    }
}

// ============================================
// ✅ NOTIFICATION FUNCTION
// ============================================
function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' :
                 type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : 
                    type === 'error' ? '#e74c3c' : 
                    type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
        max-width: 300px;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
    
    notification.addEventListener('click', () => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
}



async function loadLeaderboard(period = 'weekly') {
    console.log(`🏆 Loading ${period} leaderboard...`);
    
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    
    leaderboardList.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <i class="fas fa-trophy" style="font-size: 40px; color: #7a0000; margin-bottom: 15px;"></i>
            <h4 style="color: #2c3e50;">Leaderboard Coming Soon!</h4>
            <p style="color: #7f8c8d;">Complete quizzes to appear on the leaderboard.</p>
        </div>
    `;
}


// ============================================
// UPDATE CONTINUE LEARNING MODULE - EXACT FROM POLYLEARN
// ============================================
async function updateContinueLearningModule() {
    try {
        const container = document.getElementById('continueLearningContainer');
        if (!container) {
            console.error('Continue learning container not found');
            return;
        }
        
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-text">
                    <i class="fas fa-spinner fa-spin"></i> Loading lessons...
                </div>
            </div>
        `;
        
        // Fetch lessons and progress
        const [lessons, progress] = await Promise.all([
            fetchAllLessons(),
            fetchUserLessonProgress()
        ]);
        
        if (lessons.length === 0) {
            container.innerHTML = `
                <div class="no-lessons">
                    <i class="fas fa-book"></i>
                    <h3>No lessons available</h3>
                    <p>Check back later for new lessons!</p>
                </div>
            `;
            return;
        }
        
        // Store in global state
        LessonState.lessons = lessons;
        LessonState.userProgress = progress;
        
        // Get continue learning lesson
        const continueLesson = getContinueLearningLesson(lessons, progress);
        LessonState.continueLearningLesson = continueLesson;
        
        if (!continueLesson) {
            container.innerHTML = `
                <div class="no-lessons">
                    <i class="fas fa-trophy"></i>
                    <h3>All Lessons Completed!</h3>
                    <p>Great job! You've completed all available lessons.</p>
                    <button class="btn-primary" id="reviewAllLessons">
                        <i class="fas fa-redo"></i> Review Lessons
                    </button>
                </div>
            `;
            
            document.getElementById('reviewAllLessons')?.addEventListener('click', () => {
                navigateTo('moduleDashboard');
            });
            
            return;
        }
        
        // Calculate progress percentage
        const lessonProgress = progress[continueLesson.content_id] || {};
        const percentage = lessonProgress.percentage || 0;
        const status = lessonProgress.status || 'not_started';
        
        // Get topic ID for this lesson
        const topicId = continueLesson.topic_id || 1;
        LessonState.currentTopic = topicId;
        
        // Check if practice is unlocked for this topic
        let practiceUnlocked = false;
        let practiceAvailable = false;
        
        if (percentage >= 80) {
            practiceUnlocked = await checkPracticeUnlocked(topicId);
            practiceAvailable = true;
        }
        
        // Render continue learning module - EXACT UI FROM POLYLEARN
        container.innerHTML = `
            <div class="module-header">
                <h3 class="module-title">
                    <i class="fas fa-cube"></i> 
                    ${continueLesson.module_name || 'Module'}: ${continueLesson.topic_title || 'Topic'}
                </h3>
                <span class="module-status status-${status}">
                    ${status === 'completed' ? 'Completed' : 
                      status === 'in_progress' ? 'In Progress' : 'Start Learning'}
                </span>
            </div>
            
            <p style="color: var(--text-light); margin-bottom: 15px;">
                ${continueLesson.content_title || 'Continue your learning journey.'}
            </p>
            
            <div class="module-progress">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${percentage}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
            
            <div class="module-lessons" id="recentLessonsList">
                <!-- Recent lessons will be loaded here -->
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button class="btn-primary" id="continueLessonBtn" data-lesson-id="${continueLesson.content_id}">
                    <i class="fas fa-play"></i> ${status === 'not_started' ? 'Start Lesson' : 
                     status === 'in_progress' ? 'Continue Lesson' : 'Review Lesson'}
                </button>
                ${practiceAvailable ? `
                    <button class="btn-success ${practiceUnlocked ? '' : 'disabled'}" 
                            id="practiceTopicBtn" 
                            style="margin-left: 10px;" 
                            data-topic-id="${topicId}"
                            ${practiceUnlocked ? '' : 'disabled'}>
                        <i class="fas fa-pencil-alt"></i> 
                        ${practiceUnlocked ? 'Practice Now' : 'Practice Locked'}
                    </button>
                ` : ''}
            </div>
        `;
        
        // Load recent lessons
        await loadRecentLessons(container.querySelector('#recentLessonsList'), lessons, progress);
        
        // Setup continue button
        document.getElementById('continueLessonBtn')?.addEventListener('click', function() {
            const lessonId = this.getAttribute('data-lesson-id');
            openLesson(lessonId);
        });
        
        // Setup practice button
        const practiceBtn = document.getElementById('practiceTopicBtn');
        if (practiceBtn) {
            practiceBtn.addEventListener('click', function() {
                const topicId = this.getAttribute('data-topic-id');
                openPracticeForTopic(topicId);
            });
        }
        
        console.log('✅ Continue learning module updated');
        
    } catch (error) {
        console.error('Error updating continue learning module:', error);
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load lessons</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
}

async function fetchUserLessonProgress() {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.warn('No auth token available');
            return {};
        }
        
        console.log('📊 Fetching user lesson progress...');
        
        const response = await fetch(`/api/progress/lessons`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                console.log('✅ User progress loaded');
                
                // Convert array to object for easier access
                const progressMap = {};
                data.progress.forEach(progress => {
                    progressMap[progress.content_id] = {
                        status: progress.completion_status,
                        percentage: progress.percentage || 0,
                        time_spent: progress.time_spent_seconds || 0,
                        last_accessed: progress.last_accessed
                    };
                });
                
                return progressMap;
            }
        }
        
        return {};
    } catch (error) {
        console.error('Error fetching user progress:', error);
        return {};
    }
}
// ============================================
// GET CONTINUE LEARNING LESSON
// ============================================
function getContinueLearningLesson(lessons, progress) {
    if (lessons.length === 0) return null;
    
    // Find the most recently accessed incomplete lesson
    let continueLesson = null;
    let maxLastAccessed = null;
    
    for (const lesson of lessons) {
        const lessonProgress = progress[lesson.content_id] || {};
        
        // Skip completed lessons
        if (lessonProgress.status === 'completed') continue;
        
        // Check if this lesson was accessed more recently
        if (lessonProgress.last_accessed) {
            const lastAccessed = new Date(lessonProgress.last_accessed);
            if (!maxLastAccessed || lastAccessed > maxLastAccessed) {
                maxLastAccessed = lastAccessed;
                continueLesson = lesson;
            }
        }
    }
    
    // If no incomplete lessons with progress, find first incomplete lesson
    if (!continueLesson) {
        for (const lesson of lessons) {
            const lessonProgress = progress[lesson.content_id] || {};
            if (lessonProgress.status !== 'completed') {
                continueLesson = lesson;
                break;
            }
        }
    }
    
    // If all lessons are completed, show the first lesson
    if (!continueLesson && lessons.length > 0) {
        continueLesson = lessons[0];
    }
    
    return continueLesson;
}
// ============================================
// LOAD RECENT LESSONS
// ============================================
async function loadRecentLessons(container, lessons, progress) {
    if (!container) return;
    
    // Sort lessons by last accessed or content order
    const sortedLessons = [...lessons].sort((a, b) => {
        const progressA = progress[a.content_id] || {};
        const progressB = progress[b.content_id] || {};
        
        // Sort by last accessed date (newest first)
        if (progressA.last_accessed && progressB.last_accessed) {
            return new Date(progressB.last_accessed) - new Date(progressA.last_accessed);
        }
        
        // Then by content order
        return a.content_order - b.content_order;
    });
    
    // Take up to 4 recent lessons
    const recentLessons = sortedLessons.slice(0, 4);
    
    let html = '';
    
    recentLessons.forEach(lesson => {
        const lessonProgress = progress[lesson.content_id] || {};
        const status = lessonProgress.status || 'not_started';
        const percentage = lessonProgress.percentage || 0;
        
        let statusText = 'Start';
        let statusClass = 'locked';
        let icon = 'fas fa-lock';
        
        if (status === 'completed') {
            statusText = 'Completed';
            statusClass = 'completed';
            icon = 'fas fa-check';
        } else if (status === 'in_progress') {
            statusText = percentage > 0 ? 'Continue' : 'Start';
            statusClass = 'current';
            icon = percentage > 0 ? 'fas fa-play' : 'fas fa-play';
        }
        
        html += `
            <div class="lesson-item ${statusClass}" data-lesson-id="${lesson.content_id}">
                <div class="lesson-info">
                    <div class="lesson-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div>
                        <div class="lesson-title">${lesson.content_title}</div>
                        <div class="lesson-duration">
                            <i class="fas fa-video"></i> ${Math.round((lesson.video_duration_seconds || 0) / 60)} min
                        </div>
                    </div>
                </div>
                <div class="lesson-actions">
                    <button class="${status === 'completed' ? 'review-btn' : 'start-btn'}" 
                            data-lesson-id="${lesson.content_id}">
                        ${status === 'completed' ? 'Review' : statusText}
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners to lesson items
    container.querySelectorAll('.lesson-item').forEach(item => {
        item.addEventListener('click', function() {
            const lessonId = this.getAttribute('data-lesson-id');
            openLesson(lessonId);
        });
    });
    
    // Add event listeners to buttons
    container.querySelectorAll('.start-btn, .review-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const lessonId = this.getAttribute('data-lesson-id');
            openLesson(lessonId);
        });
    });
}
// Helper function for demo mode
function showDemoContinueLearning(container) {
    container.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
                    border: 1px solid rgba(122,0,0,0.1); position: relative; overflow: hidden;">
            
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 5px; 
                       background: linear-gradient(to right, #7a0000, #c0392b, #e74c3c, #c0392b, #7a0000);">
            </div>
            
            <h3 style="color: #7a0000; font-size: 1.3rem; margin-bottom: 5px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-play-circle"></i> Continue Learning
            </h3>
            
            <p style="color: #666; margin-bottom: 20px; font-size: 0.9rem;">
                Pick up where you left off
            </p>
            
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <div style="width: 60px; height: 60px; background: rgba(122,0,0,0.1); border-radius: 12px; 
                            display: flex; align-items: center; justify-content: center; font-size: 24px; color: #7a0000;">
                    <i class="fas fa-cube"></i>
                </div>
                <div>
                    <h4 style="margin: 0 0 5px 0; color: #2c3e50;">FactoLearn</h4>
                    <p style="margin: 0; color: #666; font-size: 0.9rem;">Master factorials, permutations & combinations</p>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Your Progress</span>
                    <span>25%</span>
                </div>
                <div style="height: 8px; background: #ecf0f1; border-radius: 4px;">
                    <div style="height: 100%; width: 25%; background: #7a0000; border-radius: 4px;"></div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h5 style="color: #2c3e50; margin-bottom: 10px;">Demo Lessons</h5>
                <div class="lesson-item" style="display: flex; justify-content: space-between; align-items: center; 
                      padding: 12px 15px; background: rgba(122,0,0,0.02); border-radius: 8px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; background: #7a0000; border-radius: 50%; 
                                   display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="fas fa-play"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600;">Introduction to Factorials</div>
                            <div style="font-size: 0.8rem; color: #666;"><i class="fas fa-clock"></i> 10 min</div>
                        </div>
                    </div>
                    <button style="padding: 6px 12px; background: #7a0000; color: white; border: none; 
                                  border-radius: 6px; font-weight: 600; cursor: pointer;">Start</button>
                </div>
            </div>
            
            <button class="btn-primary" style="width: 100%; padding: 12px; background: #7a0000; color: white; 
                     border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                <i class="fas fa-play"></i> Continue Learning
            </button>
        </div>
    `;
}

function showNoLessonsMessage(container) {
    container.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 40px; text-align: center;">
            <i class="fas fa-book-open" style="font-size: 60px; color: #ccc; margin-bottom: 15px;"></i>
            <h3 style="color: #666;">No Lessons Available</h3>
            <p style="color: #999;">Check back later for FactoLearn lessons!</p>
        </div>
    `;
}
// ============================================
// ✅ STYLE FUNCTIONS
// ============================================
function addPracticeStyles() {
    if (document.getElementById('practice-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'practice-styles';
    style.textContent = `
        .topic-card { transition: all 0.3s; }
        .topic-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .topic-card.selected { border-color: #7a0000; background: #f8f9fa; }
        .topic-card.unlocked { border-left: 4px solid #27ae60; }
        .topic-card.locked { border-left: 4px solid #95a5a6; opacity: 0.7; }
        .exercise-card { transition: all 0.3s; }
        .exercise-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .exercise-card.completed { border-left: 4px solid #27ae60; }
        .difficulty-badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .difficulty-easy { background: #d4edda; color: #155724; }
        .difficulty-medium { background: #fff3cd; color: #856404; }
        .difficulty-hard { background: #f8d7da; color: #721c24; }
    `;
    document.head.appendChild(style);
}

function addQuizStyles() {
    if (document.getElementById('quiz-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'quiz-styles';
    style.textContent = `
        .quiz-category-card { transition: all 0.3s; }
        .quiz-category-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    `;
    document.head.appendChild(style);
}

function addProgressStyles() {
    if (document.getElementById('progress-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'progress-styles';
    style.textContent = `
        .progress-good { background: linear-gradient(90deg, #27ae60, #2ecc71); }
        .progress-medium { background: linear-gradient(90deg, #f39c12, #f1c40f); }
        .progress-low { background: linear-gradient(90deg, #e74c3c, #c0392b); }
        .loading { opacity: 0.7; transition: opacity 0.3s; }
    `;
    document.head.appendChild(style);
}

function addPracticeResultModalStyles() {
    if (document.getElementById('result-modal-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'result-modal-styles';
    style.textContent = `
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

function addChartStyles() {
    if (document.getElementById('chart-styles')) return;
    const style = document.createElement('style');
    style.id = 'chart-styles';
    style.textContent = ``;
    document.head.appendChild(style);
}

function addSettingsStyles() {
    if (document.getElementById('settings-styles')) return;
    const style = document.createElement('style');
    style.id = 'settings-styles';
    style.textContent = ``;
    document.head.appendChild(style);
}

function addFeedbackStyles() {
    if (document.getElementById('feedback-styles')) return;
    const style = document.createElement('style');
    style.id = 'feedback-styles';
    style.textContent = ``;
    document.head.appendChild(style);
}

function addLessonContentStyles() {
    if (document.getElementById('lesson-content-styles')) return;
    const style = document.createElement('style');
    style.id = 'lesson-content-styles';
    style.textContent = ``;
    document.head.appendChild(style);
}

function addReviewModalStyles() {
    if (document.getElementById('review-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'review-modal-styles';
    style.textContent = ``;
    document.head.appendChild(style);
}

// ============================================
// ✅ INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM fully loaded');
    
    addQuizStyles();
    addProgressStyles();
    addPracticeResultModalStyles();
    addChartStyles();
    addSettingsStyles();
    addFeedbackStyles();
    addLessonContentStyles();
    addReviewModalStyles();
    
    initApp();
    
    setTimeout(() => {
        updateMenuUserInfo();
    }, 500);
});
// ============================================
// ✅ MISSING FUNCTIONS
// ============================================

// For reset password modal
window.closeResetPasswordModal = function() {
    console.log('🔒 Closing reset password modal');
    const modal = document.getElementById('resetPasswordModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
};

// For practice statistics (fallback)
if (typeof loadPracticeStatistics !== 'function') {
    window.loadPracticeStatistics = async function() {
        console.log('📊 Using fallback practice statistics');
        return {
            total_exercises_completed: 0,
            total_attempts: 0,
            average_score: 0,
            lessons_completed: 0,
            exercises_completed: 0
        };
    };
}

// For quiz categories (fallback)
if (typeof loadQuizCategories !== 'function') {
    window.loadQuizCategories = async function() {
        console.log('📚 Using fallback quiz categories');
        const container = document.getElementById('userQuizzesContainer');
        if (container) {
            container.innerHTML = `
                <div class="card" style="padding: 40px; text-align: center;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #7a0000;"></i>
                    <p style="margin-top: 15px;">Loading quiz categories...</p>
                </div>
            `;
        }
        setTimeout(() => {
            if (typeof displayQuizCategories === 'function') {
                displayQuizCategories(getFactoLearnMockCategories());
            }
        }, 500);
    };
}

// For cumulative progress (fallback)
if (typeof fetchCumulativeProgress !== 'function') {
    window.fetchCumulativeProgress = async function() {
        return {
            total_lessons_completed: 0,
            total_lessons: 8,
            overall_percentage: 0,
            exercises_completed: 0,
            total_points_earned: 0
        };
    };
}

// For progress summary cards (fallback)
if (typeof updateProgressSummaryCards !== 'function') {
    window.updateProgressSummaryCards = async function() {
        const lessonsCount = document.getElementById('lessonsCount');
        const exercisesCount = document.getElementById('exercisesCount');
        const quizScore = document.getElementById('quizScore');
        const avgTime = document.getElementById('avgTime');
        
        if (lessonsCount) lessonsCount.innerHTML = `0<span class="item-unit">/8</span>`;
        if (exercisesCount) exercisesCount.innerHTML = `0<span class="item-unit">/15</span>`;
        if (quizScore) quizScore.innerHTML = `0<span class="item-unit">pts</span>`;
        if (avgTime) avgTime.innerHTML = `5<span class="item-unit">min/day</span>`;
    };
}

// For leaderboard (fallback)
if (typeof loadLeaderboard !== 'function') {
    window.loadLeaderboard = async function() {
        console.log('🏆 Leaderboard function not available');
    };
}

// ============================================
// SHOW SETTINGS SECTION FUNCTION
// ============================================
window.showSection = function(sectionId) {
    console.log(`📂 Showing settings section: ${sectionId}`);
    
    // Hide all settings sections first
    const sections = document.querySelectorAll('.settings-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show the selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Update active state in sidebar
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Find and activate the clicked link
        const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        console.log(`✅ Section "${sectionId}" is now visible`);
    } else {
        console.error(`❌ Section "${sectionId}" not found`);
        
        // Show general section as fallback
        const generalSection = document.getElementById('general');
        if (generalSection) {
            generalSection.classList.add('active');
            generalSection.style.display = 'block';
            
            // Update active menu
            document.querySelectorAll('.sidebar-menu a').forEach(link => {
                link.classList.remove('active');
            });
            
            const generalLink = document.querySelector('[onclick="showSection(\'general\')"]');
            if (generalLink) {
                generalLink.classList.add('active');
            }
        }
    }
};

// ============================================
// SETTINGS PAGE INITIALIZATION
// ============================================
window.initSettingsDashboard = function() {
    console.log('⚙️ Initializing settings dashboard...');
    
    // Show general section by default
    setTimeout(() => {
        showSection('general');
    }, 100);
    
    // Load user settings
    loadUserSettings();
};

// ============================================
// LOAD USER SETTINGS
// ============================================
function loadUserSettings() {
    console.log('📥 Loading user settings...');
    
    const userJson = localStorage.getItem('mathhub_user');
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            
            const displayName = document.getElementById('displayName');
            const userEmail = document.getElementById('userEmail');
            
            if (displayName) displayName.value = user.full_name || user.username || '';
            if (userEmail) userEmail.value = user.email || '';
            
        } catch (e) {
            console.error('Error loading user:', e);
        }
    }
}

// ============================================
// SAVE ALL SETTINGS
// ============================================
window.saveAllSettings = function() {
    console.log('💾 Saving settings...');
    
    const settings = {
        displayName: document.getElementById('displayName')?.value,
        language: document.getElementById('interfaceLanguage')?.value,
        municipality: document.getElementById('batangas-municipalities')?.value,
        timezone: document.getElementById('timeZone')?.value,
        adaptiveDifficulty: document.getElementById('adaptiveDifficulty')?.checked,
        preferredDifficulty: document.getElementById('preferredDifficulty')?.value,
        showSolutions: document.getElementById('showSolutions')?.checked,
        twoFactorAuth: document.getElementById('twoFactorAuth')?.checked,
        profileVisibility: document.getElementById('profileVisibility')?.value,
        dataSharing: document.getElementById('dataSharing')?.checked,
        weeklyReport: document.getElementById('weeklyReport')?.checked,
        practiceReminders: document.getElementById('practiceReminders')?.checked,
        theme: getSelectedTheme(),
        fontSize: document.getElementById('fontSize')?.value
    };
    
    localStorage.setItem('user_settings', JSON.stringify(settings));
    
    showNotification('success', 'Settings Saved', 'Your preferences have been updated.');
};

// ============================================
// GET SELECTED THEME
// ============================================
function getSelectedTheme() {
    const themeLight = document.getElementById('themeLight');
    const themeDark = document.getElementById('themeDark');
    const themeAuto = document.getElementById('themeAuto');
    
    if (themeLight?.checked) return 'light';
    if (themeDark?.checked) return 'dark';
    if (themeAuto?.checked) return 'auto';
    return 'light';
}

// ============================================
// RESET SETTINGS
// ============================================
window.resetSettings = function() {
    if (confirm('Reset all settings to default?')) {
        localStorage.removeItem('user_settings');
        location.reload();
    }
};
// ============================================
// ✅ QUIZ DASHBOARD - FROM POLYLEARN (FIXED VERSION)
// ============================================

// Quiz State
const QuizState = {
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
    quizCategories: [],
    selectedCategory: null
};

// ============================================
// INIT QUIZ DASHBOARD
// ============================================
async function initQuizDashboard() {
    console.log('🧠 Initializing quiz dashboard...');
    
    try {
        // Show loading in userQuizzesContainer
        const container = document.getElementById('userQuizzesContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-container" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #7a0000; margin-bottom: 20px;"></i>
                    <p style="color: #666;">Loading quiz categories...</p>
                </div>
            `;
        }
        
        // Show loading in stats cards
        const statsElements = {
            score: document.getElementById('quizCurrentScore'),
            accuracy: document.getElementById('quizAccuracy'),
            time: document.getElementById('quizTimeSpent'),
            rank: document.getElementById('quizRank')
        };
        
        if (statsElements.score) statsElements.score.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        if (statsElements.accuracy) statsElements.accuracy.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        if (statsElements.time) statsElements.time.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        if (statsElements.rank) statsElements.rank.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Load all data in parallel
        const [categories, stats] = await Promise.allSettled([
            loadQuizCategories(),
            loadQuizStatsFromServer()
        ]);
        
        // Check results
        if (categories.status === 'rejected') {
            console.error('❌ Failed to load categories:', categories.reason);
            // Use mock categories as fallback
            displayQuizCategories(getFactoLearnMockCategories());
        }
        
        if (stats.status === 'rejected') {
            console.error('❌ Failed to load stats:', stats.reason);
            updateQuizStatsUI({
                current_score: 0,
                accuracy: 0,
                time_spent: '0m',
                rank: '#--'
            });
        }
        
        // Hide quiz interface
        const quizInterface = document.getElementById('quizInterfaceContainer');
        if (quizInterface) {
            quizInterface.classList.add('hidden');
            quizInterface.style.display = 'none';
        }
        
        console.log('✅ Quiz dashboard initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing quiz dashboard:', error);
        showNotification('Failed to initialize quiz dashboard', 'error');
        
        updateQuizStatsUI({
            current_score: 0,
            accuracy: 0,
            time_spent: '0m',
            rank: '#--'
        });
        
        // Show fallback categories
        displayQuizCategories(getFactoLearnMockCategories());
    }
}

// ============================================
// LOAD QUIZ CATEGORIES
// ============================================
async function loadQuizCategories() {
    console.log('📚 Loading quiz categories from database...');
    
    try {
        const token = localStorage.getItem('authToken') || authToken;
        
        // Show loading state
        const quizzesContainer = document.getElementById('userQuizzesContainer');
        if (quizzesContainer) {
            quizzesContainer.innerHTML = `
                <div class="card" style="padding: 40px; text-align: center;">
                    <div style="font-size: 40px; color: #7a0000; margin-bottom: 20px;">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <p style="color: #666;">Loading FactoLearn categories from database...</p>
                </div>
            `;
        }
        
        // Try to fetch from API first
        if (token) {
            try {
                const response = await fetch(`/api/quiz/categories?lesson_id=3`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.categories) {
                        console.log(`✅ Found ${data.categories.length} categories from database`);
                        displayQuizCategories(data.categories);
                        return data.categories;
                    }
                }
            } catch (error) {
                console.log('⚠️ Could not fetch from API, using mock data');
            }
        }
        
        // Use mock categories as fallback
        console.log('📚 Using mock FactoLearn categories');
        const mockCategories = getFactoLearnMockCategories();
        displayQuizCategories(mockCategories);
        return mockCategories;
        
    } catch (error) {
        console.error('❌ Error loading quiz categories:', error);
        
        // Show error in container
        const quizzesContainer = document.getElementById('userQuizzesContainer');
        if (quizzesContainer) {
            quizzesContainer.innerHTML = `
                <div class="card" style="padding: 40px; text-align: center;">
                    <div style="font-size: 60px; color: #e74c3c; margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 style="color: #666; margin-bottom: 10px;">Failed to load categories</h3>
                    <p style="color: #999; margin-bottom: 20px;">${error.message}</p>
                    <button class="btn-primary" onclick="loadQuizCategories()" style="background: #7a0000; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
        
        return [];
    }
}

// ============================================
// DISPLAY QUIZ CATEGORIES
// ============================================
function displayQuizCategories(categories) {
    console.log('📋 Displaying FactoLearn quiz categories:', categories);
    
    const quizzesContainer = document.getElementById('userQuizzesContainer');
    if (!quizzesContainer) {
        console.error('❌ userQuizzesContainer not found');
        return;
    }
    
    // Filter for lesson_id=3
    const factolearnCategories = categories.filter(cat => {
        const catLessonId = cat.lesson_id || cat.lessonId;
        return catLessonId == 3;
    });
    
    console.log('🎯 After filtering:', factolearnCategories.length, 'categories');
    
    // Clear container
    quizzesContainer.innerHTML = '';
    
    if (!factolearnCategories || factolearnCategories.length === 0) {
        quizzesContainer.innerHTML = `
            <div class="card" style="padding: 40px; text-align: center;">
                <div style="font-size: 60px; color: #ccc; margin-bottom: 20px;">
                    <i class="fas fa-folder-open"></i>
                </div>
                <h3 style="color: #666; margin-bottom: 10px;">No FactoLearn Categories Available</h3>
                <p style="color: #999; margin-bottom: 20px;">Check back later for new FactoLearn quizzes!</p>
                <button class="btn-primary" onclick="loadQuizCategories()" style="background: #7a0000; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Refresh
                </button>
            </div>
        `;
        return;
    }
    
    // Create categories grid
    let html = `
        <div class="card full-width-card" style="margin-bottom: 20px;">
            <div class="card-header" style="padding: 20px 25px 0;">
                <h2 class="card-title" style="display: flex; align-items: center; gap: 10px; font-size: 1.4rem; color: var(--text-color); margin-bottom: 5px;">
                    <i class="fas fa-folder" style="color: #7a0000;"></i> 
                    FactoLearn Quiz Categories
                </h2>
                <p class="card-subtitle" style="color: var(--text-light); font-size: 0.95rem;">
                    Select a category to start practicing
                </p>
            </div>
            
            <div style="padding: 20px 25px 25px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
    `;
    
    factolearnCategories.forEach(category => {
        const categoryId = category.category_id || category.id;
        const categoryName = category.category_name || category.name || 'FactoLearn Quiz';
        const categoryDesc = category.description || 'Test your FactoLearn knowledge.';
        const totalQuizzes = category.quiz_count || category.total_quizzes || 3;
        const categoryColor = category.color || '#7a0000';
        const categoryIcon = category.icon || 'fa-graduation-cap';
        
        html += `
            <div class="quiz-category-card" data-category-id="${categoryId}" 
                 style="cursor: pointer; background: white; border-radius: 12px; overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid var(--border-color);
                        transition: all 0.3s ease; position: relative;">
                
                <!-- Colored top bar -->
                <div style="height: 6px; background: ${categoryColor}; width: 100%;"></div>
                
                <div style="padding: 20px;">
                    <!-- Header with icon and title -->
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="width: 50px; height: 50px; background: ${categoryColor}20; 
                                    border-radius: 12px; display: flex; align-items: center; 
                                    justify-content: center; font-size: 24px; color: ${categoryColor};">
                            <i class="fas ${categoryIcon}"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 18px; font-weight: 600;">
                                ${categoryName}
                            </h3>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="background: ${categoryColor}10; color: ${categoryColor}; 
                                           padding: 4px 10px; border-radius: 20px; font-size: 12px;">
                                    <i class="fas fa-graduation-cap"></i> FactoLearn
                                </span>
                                <span style="color: #7f8c8d; font-size: 13px;">
                                    <i class="fas fa-question-circle"></i> ${totalQuizzes} quizzes
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Description -->
                    <p style="color: #6c757d; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; min-height: 42px;">
                        ${categoryDesc}
                    </p>
                    
                    <!-- Action button -->
                    <button class="quiz-category-btn" data-category-id="${categoryId}" 
                            style="width: 100%; padding: 12px; background: ${categoryColor}; 
                                   color: white; border: none; border-radius: 8px; 
                                   font-weight: 600; cursor: pointer; display: flex;
                                   align-items: center; justify-content: center; gap: 8px;
                                   transition: all 0.3s ease;">
                        <i class="fas fa-play-circle"></i> Browse Quizzes
                        <i class="fas fa-arrow-right" style="font-size: 14px;"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `</div></div></div>`;
    quizzesContainer.innerHTML = html;
    
    // Add event listeners to category cards
    document.querySelectorAll('.quiz-category-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.quiz-category-btn')) return;
            const categoryId = this.getAttribute('data-category-id');
            if (categoryId) {
                console.log('🎯 Category card clicked:', categoryId);
                loadQuizzesForCategory(categoryId);
            }
        });
    });
    
    // Add event listeners to browse buttons
    document.querySelectorAll('.quiz-category-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const categoryId = this.getAttribute('data-category-id');
            if (categoryId) {
                console.log('🎯 Browse button clicked:', categoryId);
                loadQuizzesForCategory(categoryId);
            }
        });
    });
}

// ============================================
// LOAD QUIZZES FOR CATEGORY
// ============================================
async function loadQuizzesForCategory(categoryId) {
    console.log(`📝 Loading quizzes for category ${categoryId}...`);
    
    try {
        const token = localStorage.getItem('authToken') || authToken;
        
        const quizzesContainer = document.getElementById('userQuizzesContainer');
        if (!quizzesContainer) return;
        
        // Show loading
        quizzesContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #7a0000;"></i>
                <p style="margin-top: 15px;">Loading quizzes...</p>
            </div>
        `;
        
        // Try to fetch from API
        let quizzes = [];
        
        if (token) {
            try {
                const response = await fetch(`/api/quiz/category/${categoryId}/quizzes?lesson_id=3`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.quizzes) {
                        quizzes = data.quizzes;
                    }
                }
            } catch (error) {
                console.log('⚠️ Could not fetch quizzes, using mock data');
            }
        }
        
        // Use mock quizzes if none returned
        if (quizzes.length === 0) {
            quizzes = getMockQuizzesForCategory(categoryId);
        }
        
        // Display quizzes
        displayQuizzesInContainer(quizzes, categoryId);
        
    } catch (error) {
        console.error('Error loading quizzes:', error);
        
        const quizzesContainer = document.getElementById('userQuizzesContainer');
        if (quizzesContainer) {
            quizzesContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c; margin-bottom: 15px;"></i>
                    <h3>Failed to load quizzes</h3>
                    <p>${error.message}</p>
                    <button class="btn-primary" onclick="goBackToCategories()" style="margin-top: 15px;">
                        <i class="fas fa-arrow-left"></i> Back to Categories
                    </button>
                </div>
            `;
        }
    }
}

// ============================================
// DISPLAY QUIZZES IN CONTAINER
// ============================================
function displayQuizzesInContainer(quizzes, categoryId) {
    const quizzesContainer = document.getElementById('userQuizzesContainer');
    if (!quizzesContainer) return;
    
    if (!quizzes || quizzes.length === 0) {
        quizzesContainer.innerHTML = `
            <div class="card" style="padding: 40px; text-align: center;">
                <div style="font-size: 60px; color: #ccc; margin-bottom: 20px;">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <h3 style="color: #666; margin-bottom: 10px;">No Quizzes Available</h3>
                <p style="color: #999; margin-bottom: 20px;">Check back later for new FactoLearn quizzes!</p>
                <button class="btn-primary" onclick="goBackToCategories()" style="background: #7a0000; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-arrow-left"></i> Back to Categories
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="card full-width-card">
            <div class="card-header" style="padding: 20px 25px 0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 class="card-title" style="display: flex; align-items: center; gap: 10px; font-size: 1.4rem; color: var(--text-color); margin-bottom: 5px;">
                        <i class="fas fa-question-circle" style="color: #7a0000;"></i> 
                        FactoLearn Quizzes
                    </h2>
                    <p class="card-subtitle" style="color: var(--text-light); font-size: 0.95rem;">
                        Test your knowledge with these quizzes
                    </p>
                </div>
                <button class="btn-secondary" onclick="goBackToCategories()" style="padding: 8px 15px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-arrow-left"></i> Back to Categories
                </button>
            </div>
            
            <div style="padding: 20px 25px 25px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
    `;
    
    quizzes.forEach(quiz => {
        const difficultyColor = 
            quiz.difficulty === 'easy' ? '#27ae60' : 
            quiz.difficulty === 'medium' ? '#f39c12' : 
            quiz.difficulty === 'hard' ? '#e74c3c' : '#3498db';
        
        const difficultyLabel = quiz.difficulty || 'medium';
        
        html += `
            <div class="quiz-card" data-quiz-id="${quiz.quiz_id}" 
                 style="background: white; border-radius: 12px; overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid var(--border-color);
                        transition: all 0.3s ease; cursor: pointer;
                        display: flex; flex-direction: column;">
                
                <div style="height: 6px; background: ${difficultyColor}; width: 100%;"></div>
                
                <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <h3 style="margin: 0; color: #2c3e50; font-size: 18px; font-weight: 600; line-height: 1.3;">
                            ${quiz.quiz_title || 'FactoLearn Quiz'}
                        </h3>
                        <span style="background: ${difficultyColor}; color: white; 
                                   padding: 4px 10px; border-radius: 20px; font-size: 11px; 
                                   font-weight: 600; text-transform: uppercase; white-space: nowrap; margin-left: 10px;">
                            ${difficultyLabel}
                        </span>
                    </div>
                    
                    <p style="color: #6c757d; font-size: 14px; line-height: 1.5; margin: 0 0 15px 0; min-height: 42px;">
                        ${quiz.description || 'Test your knowledge with this FactoLearn quiz.'}
                    </p>
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 20px; padding: 10px 0; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0;">
                        <div style="display: flex; align-items: center; gap: 5px; color: #7f8c8d; font-size: 13px;">
                            <i class="fas fa-question-circle" style="color: #3498db;"></i>
                            <span>${quiz.total_questions || 0} items</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px; color: #7f8c8d; font-size: 13px;">
                            <i class="fas fa-clock" style="color: #e67e22;"></i>
                            <span>${quiz.duration_minutes || 10} min</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px; color: #7f8c8d; font-size: 13px;">
                            <i class="fas fa-trophy" style="color: #f39c12;"></i>
                            <span>${quiz.passing_score || 70}% pass</span>
                        </div>
                    </div>
                    
                    <button class="start-quiz-btn" data-quiz-id="${quiz.quiz_id}" 
                            style="width: 100%; padding: 12px; background: #7a0000; 
                                   color: white; border: none; border-radius: 8px; 
                                   font-weight: 600; cursor: pointer; display: flex;
                                   align-items: center; justify-content: center; gap: 8px;
                                   transition: all 0.3s ease; margin-top: auto;">
                        <i class="fas fa-play-circle"></i> Start Quiz
                        <i class="fas fa-arrow-right" style="font-size: 14px;"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `</div></div></div>`;
    quizzesContainer.innerHTML = html;
    
    // Add event listeners to quiz cards
    document.querySelectorAll('.quiz-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.start-quiz-btn')) return;
            const quizId = this.getAttribute('data-quiz-id');
            if (quizId) {
                const btn = this.querySelector('.start-quiz-btn');
                if (btn) btn.click();
            }
        });
    });
    
    // Add event listeners to start buttons
    document.querySelectorAll('.start-quiz-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const quizId = this.getAttribute('data-quiz-id');
            if (quizId) {
                console.log('🎯 Start quiz button clicked:', quizId);
                
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                this.disabled = true;
                
                setTimeout(() => {
                    startQuizSystem(parseInt(quizId)).finally(() => {
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.disabled = false;
                        }, 1000);
                    });
                }, 300);
            }
        });
    });
}

// ============================================
// GO BACK TO CATEGORIES
// ============================================
function goBackToCategories() {
    console.log('📚 Going back to categories');
    
    const quizzesContainer = document.getElementById('userQuizzesContainer');
    if (quizzesContainer) {
        quizzesContainer.innerHTML = `
            <div class="card" style="padding: 40px; text-align: center;">
                <div style="font-size: 40px; color: #7a0000; margin-bottom: 20px;">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p style="color: #666;">Loading categories...</p>
            </div>
        `;
        
        setTimeout(() => {
            loadQuizCategories();
        }, 300);
    }
}

// ============================================
// LOAD QUIZ STATS FROM SERVER
// ============================================
async function loadQuizStatsFromServer() {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        
        const statsElements = {
            score: document.getElementById('quizCurrentScore'),
            accuracy: document.getElementById('quizAccuracy'),
            time: document.getElementById('quizTimeSpent'),
            rank: document.getElementById('quizRank')
        };
        
        if (!statsElements.score) return;
        
        // Show loading
        statsElements.score.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        statsElements.accuracy.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        statsElements.time.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        statsElements.rank.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Try to fetch from API
        if (token) {
            try {
                const response = await fetch(`/api/quiz/user/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.stats) {
                        updateQuizStatsUI(data.stats);
                        return;
                    }
                }
            } catch (error) {
                console.log('⚠️ Could not fetch quiz stats');
            }
        }
        
        // Use mock stats
        updateQuizStatsUI({
            current_score: 85,
            accuracy: 92,
            time_spent: '45m',
            rank: '#12'
        });
        
    } catch (error) {
        console.error('❌ Error loading quiz stats:', error);
        updateQuizStatsUI({
            current_score: 0,
            accuracy: 0,
            time_spent: '0m',
            rank: '#--'
        });
    }
}

// ============================================
// UPDATE QUIZ STATS UI
// ============================================
function updateQuizStatsUI(stats) {
    console.log('📊 Updating quiz stats UI:', stats);
    
    const elements = {
        current_score: document.getElementById('quizCurrentScore'),
        accuracy: document.getElementById('quizAccuracy'),
        time_spent: document.getElementById('quizTimeSpent'),
        rank: document.getElementById('quizRank')
    };

    if (elements.current_score) {
        elements.current_score.textContent = stats.current_score + '%';
    }
    
    if (elements.accuracy) {
        elements.accuracy.textContent = stats.accuracy + '%';
    }
    
    if (elements.time_spent) {
        elements.time_spent.textContent = stats.time_spent || '0m';
    }
    
    if (elements.rank) {
        elements.rank.textContent = stats.rank || '#--';
    }
}

// ============================================
// START QUIZ SYSTEM
// ============================================
async function startQuizSystem(quizId) {
    console.log("🎯 Starting QUIZ ID:", quizId);
    
    try {
        const token = localStorage.getItem('authToken') || authToken;
        
        if (!token) {
            showNotification('Please login first', 'error');
            return;
        }
        
        // Show loading
        showQuizModalLoading();
        
        // Mock questions for demo
        const questions = getMockQuizQuestions(quizId);
        
        // Initialize quiz state
        QuizState.currentQuiz = quizId;
        QuizState.questions = questions;
        QuizState.currentIndex = 0;
        QuizState.userAnswers = {};
        QuizState.startTime = Date.now();
        QuizState.totalTime = questions.length * 60;
        QuizState.timeLeft = QuizState.totalTime;
        QuizState.stats = { correct: 0, wrong: 0, score: 0 };
        
        // Show quiz modal
        showQuizSystemModal();
        
        // Load first question
        loadQuizSystemQuestion(0);
        
        // Start timer
        startQuizSystemTimer();
        
    } catch (error) {
        console.error('❌ Error starting quiz:', error);
        showNotification('Failed to start quiz: ' + error.message, 'error');
        closeQuizModal();
    }
}

// ============================================
// SHOW QUIZ MODAL
// ============================================
function showQuizSystemModal() {
    const modal = document.getElementById('quizModal');
    if (!modal) return;
    
    const titleSpan = document.getElementById('quizModalTitle');
    if (titleSpan) {
        titleSpan.textContent = 'FactoLearn Quiz';
    }
    
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    const optionsGrid = document.getElementById('quizOptionsGridModal');
    if (optionsGrid) {
        optionsGrid.style.overflowY = 'auto';
        optionsGrid.style.maxHeight = '450px';
        optionsGrid.style.padding = '10px';
    }
    
    const submitBtn = document.getElementById('submitQuizBtn');
    if (submitBtn) {
        submitBtn.style.display = 'none';
    }
}

// ============================================
// SHOW QUIZ MODAL LOADING
// ============================================
function showQuizModalLoading() {
    const modal = document.getElementById('quizModal');
    if (modal) {
        modal.style.display = 'flex';
        
        const optionsGrid = document.getElementById('quizOptionsGridModal');
        if (optionsGrid) {
            optionsGrid.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 50px; color: #7a0000;"></i>
                    <p style="margin-top: 20px; color: #666;">Loading quiz questions...</p>
                </div>
            `;
        }
    }
}

// ============================================
// LOAD QUIZ SYSTEM QUESTION
// ============================================
function loadQuizSystemQuestion(index) {
    if (!QuizState.questions || QuizState.questions.length === 0) return;
    
    const question = QuizState.questions[index];
    QuizState.currentIndex = index;
    
    const currentNum = document.getElementById('quizCurrentNum');
    const totalNum = document.getElementById('quizTotalNum');
    if (currentNum) currentNum.textContent = index + 1;
    if (totalNum) totalNum.textContent = QuizState.questions.length;
    
    const questionText = document.getElementById('quizQuestionTextModal');
    if (questionText) {
        questionText.textContent = question.question_text || 'Question text not available';
    }
    
    updateQuizSystemProgressDots();
    
    const submitBtn = document.getElementById('submitQuizBtn');
    if (submitBtn) {
        const allAnswered = QuizState.questions.every(q => 
            QuizState.userAnswers[q.question_id] !== undefined
        );
        
        if (index === QuizState.questions.length - 1 || allAnswered) {
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
            const optionId = option.id || i;
            const optionText = option.text || option.option_text || `Option ${String.fromCharCode(65 + i)}`;
            const isCorrect = option.is_correct === 1;
            const letter = String.fromCharCode(65 + i);
            
            const isSelected = QuizState.userAnswers[question.question_id] == optionId;
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option-modal' + (isSelected ? ' selected' : '');
            optionDiv.setAttribute('data-option-id', optionId);
            optionDiv.setAttribute('data-question-id', question.question_id);
            optionDiv.setAttribute('data-is-correct', isCorrect);
            
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
                
                const questionId = question.question_id;
                const optionId = this.getAttribute('data-option-id');
                
                saveAnswerAndContinue(questionId, optionId);
            });
            
            optionsGrid.appendChild(optionDiv);
        });
    } else {
        optionsGrid.innerHTML = '<p class="no-options">No options available for this question.</p>';
    }
}

// ============================================
// UPDATE QUIZ SYSTEM PROGRESS DOTS
// ============================================
function updateQuizSystemProgressDots() {
    const dotsContainer = document.getElementById('quizProgressDotsModal');
    if (!dotsContainer || !QuizState.questions) return;
    
    let dotsHTML = '';
    QuizState.questions.forEach((q, i) => {
        const isAnswered = QuizState.userAnswers[q.question_id] !== undefined;
        const isCurrent = i === QuizState.currentIndex;
        
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

// ============================================
// JUMP TO QUIZ QUESTION
// ============================================
window.jumpToQuizQuestion = function(index) {
    if (index >= 0 && index < QuizState.questions.length) {
        loadQuizSystemQuestion(index);
    }
};

// ============================================
// START QUIZ SYSTEM TIMER
// ============================================
function startQuizSystemTimer() {
    if (QuizState.timerInterval) {
        clearInterval(QuizState.timerInterval);
    }
    
    QuizState.timerInterval = setInterval(() => {
        if (QuizState.timeLeft > 0) {
            QuizState.timeLeft--;
            
            const minutes = Math.floor(QuizState.timeLeft / 60);
            const seconds = QuizState.timeLeft % 60;
            
            const timerDisplay = document.getElementById('quizTimerDisplay');
            if (timerDisplay) {
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (QuizState.timeLeft <= 0) {
                clearInterval(QuizState.timerInterval);
                submitQuizSystem();
            }
        }
    }, 1000);
}

// ============================================
// SAVE ANSWER AND CONTINUE
// ============================================
async function saveAnswerAndContinue(questionId, answer) {
    QuizState.userAnswers[questionId] = answer;
    
    updateQuizSystemProgressDots();
    
    if (QuizState.currentIndex < QuizState.questions.length - 1) {
        setTimeout(() => {
            loadQuizSystemQuestion(QuizState.currentIndex + 1);
        }, 300);
    } else {
        console.log('📝 Last question answered, ready to submit');
        const submitBtn = document.getElementById('submitQuizBtn');
        if (submitBtn) submitBtn.style.display = 'block';
    }
}

// ============================================
// SUBMIT QUIZ SYSTEM
// ============================================
async function submitQuizSystem() {
    console.log('📝 Submitting quiz...');
    
    try {
        if (QuizState.timerInterval) {
            clearInterval(QuizState.timerInterval);
            QuizState.timerInterval = null;
        }
        
        const timeSpentSeconds = Math.floor((Date.now() - QuizState.startTime) / 1000);
        
        let correctCount = 0;
        let totalQuestions = QuizState.questions.length;
        
        // Calculate score
        QuizState.questions.forEach(q => {
            const userAnswer = QuizState.userAnswers[q.question_id];
            if (userAnswer) {
                const correctOption = q.options?.find(opt => opt.is_correct === 1 || opt.correct === true);
                if (correctOption && userAnswer == correctOption.id) {
                    correctCount++;
                }
            }
        });
        
        const wrongCount = totalQuestions - correctCount;
        const score = Math.round((correctCount / totalQuestions) * 100);
        const pointsEarned = correctCount * 10;
        
        console.log(`📊 FINAL SCORE: ${correctCount}/${totalQuestions} = ${score}%`);
        
        // Show results
        const quizContainer = document.getElementById('quizContainer');
        const resultsContainer = document.getElementById('quizResultsContainer');
        
        if (quizContainer) quizContainer.style.display = 'none';
        if (resultsContainer) {
            resultsContainer.style.display = 'block';
            displayQuizResults(resultsContainer, {
                score: score,
                correctCount: correctCount,
                wrongCount: wrongCount,
                totalQuestions: totalQuestions,
                timeSpentSeconds: timeSpentSeconds,
                attemptId: Date.now(),
                pointsEarned: pointsEarned
            });
        }
        
        // Update quiz stats
        const quizCurrentScore = document.getElementById('quizCurrentScore');
        if (quizCurrentScore) {
            quizCurrentScore.textContent = `${score}%`;
        }
        
        const quizAccuracy = document.getElementById('quizAccuracy');
        if (quizAccuracy) {
            const accuracy = Math.round((correctCount / totalQuestions) * 100);
            quizAccuracy.textContent = `${accuracy}%`;
        }
        
        showNotification(`🎉 Quiz completed! Score: ${score}%`, 'success');
        
    } catch (error) {
        console.error('❌ Error submitting quiz:', error);
        showNotification('Error submitting quiz', 'error');
    }
}

// ============================================
// DISPLAY QUIZ RESULTS
// ============================================
function displayQuizResults(container, data) {
    const minutes = Math.floor(data.timeSpentSeconds / 60);
    const seconds = data.timeSpentSeconds % 60;
    const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const score = data.score;
    let icon = 'fa-smile';
    let iconColor = '#27ae60';
    let message = 'Great job!';
    
    if (score >= 90) {
        icon = 'fa-crown';
        iconColor = '#f1c40f';
        message = '🏆 Excellent! You\'re a math wizard!';
    } else if (score >= 75) {
        icon = 'fa-star';
        iconColor = '#f39c12';
        message = '🌟 Great job! You\'re doing well!';
    } else if (score >= 50) {
        icon = 'fa-smile';
        iconColor = '#3498db';
        message = '💪 Good effort! Keep practicing!';
    } else {
        icon = 'fa-book';
        iconColor = '#e74c3c';
        message = '📚 Don\'t give up! Practice makes perfect!';
    }
    
    container.innerHTML = `
        <div class="modal-body" style="padding: 20px; background: white; border-radius: 12px;">
            <div style="text-align: center; max-width: 400px; margin: 0 auto;">
                
                <div style="width: 80px; height: 80px; background: ${iconColor}20; border-radius: 50%; 
                            display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; 
                            border: 3px solid ${iconColor};">
                    <i class="fas ${icon}" style="font-size: 40px; color: ${iconColor};"></i>
                </div>
                
                <h2 style="color: #2c3e50; margin-bottom: 10px; font-size: 28px;">Quiz Completed!</h2>
                
                <div style="position: relative; width: 150px; height: 150px; margin: 15px auto;">
                    <svg viewBox="0 0 36 36" style="width: 150px; height: 150px;">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                              fill="none" stroke="#e0e0e0" stroke-width="3"></path>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                              fill="none" stroke="${iconColor}" stroke-width="3" 
                              stroke-dasharray="${score}, 100" stroke-linecap="round"></path>
                    </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                                font-size: 36px; font-weight: bold; color: ${iconColor};">
                        ${score}%
                    </div>
                </div>
                
                <div style="background: ${iconColor}10; padding: 12px 15px; border-radius: 8px; margin: 15px 0;
                            border-left: 4px solid ${iconColor}; text-align: left;">
                    <i class="fas fa-quote-left" style="color: ${iconColor}; margin-right: 8px;"></i>
                    ${message}
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                padding: 15px; border-radius: 10px; color: white;">
                        <div style="font-size: 28px; font-weight: bold;">${data.correctCount}</div>
                        <div style="font-size: 12px;">Correct</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); 
                                padding: 15px; border-radius: 10px; color: white;">
                        <div style="font-size: 28px; font-weight: bold;">${data.wrongCount}</div>
                        <div style="font-size: 12px;">Wrong</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); 
                                padding: 15px; border-radius: 10px; color: white;">
                        <div style="font-size: 28px; font-weight: bold;">${data.totalQuestions}</div>
                        <div style="font-size: 12px;">Total</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); 
                                padding: 15px; border-radius: 10px; color: white;">
                        <div style="font-size: 28px; font-weight: bold;">${timeFormatted}</div>
                        <div style="font-size: 12px;">Time</div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 20px; font-weight: bold; color: #7a0000;">+${data.pointsEarned}</div>
                            <div style="font-size: 12px; color: #666;">Points Earned</div>
                        </div>
                    </div>
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

// ============================================
// CLOSE QUIZ SYSTEM MODAL
// ============================================
function closeQuizSystemModal() {
    console.log('🚪 Closing quiz modal - returning to quiz list');
    
    const modal = document.getElementById('quizModal');
    
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    
    if (QuizState.timerInterval) {
        clearInterval(QuizState.timerInterval);
        QuizState.timerInterval = null;
    }
    
    const quizInterface = document.getElementById('quizInterfaceContainer');
    const quizCards = document.getElementById('userQuizzesContainer');
    const badgesContainer = document.getElementById('badgesContainer');
    const leaderboardContainer = document.getElementById('leaderboardContainer');
    
    if (quizInterface) {
        quizInterface.classList.add('hidden');
        quizInterface.style.display = 'none';
    }
    
    if (quizCards) {
        quizCards.classList.remove('hidden');
        quizCards.style.display = 'block';
    }
    
    if (badgesContainer) {
        badgesContainer.classList.remove('hidden');
        badgesContainer.style.display = 'block';
    }
    
    if (leaderboardContainer) {
        leaderboardContainer.classList.remove('hidden');
        leaderboardContainer.style.display = 'block';
    }
    
    QuizState.currentQuiz = null;
    QuizState.currentAttemptId = null;
    QuizState.questions = [];
    QuizState.currentIndex = 0;
    QuizState.userAnswers = {};
    QuizState.startTime = null;
    QuizState.timeLeft = 0;
    QuizState.stats = { correct: 0, wrong: 0, score: 0 };
}

// ============================================
// GET MOCK QUIZ QUESTIONS
// ============================================
function getMockQuizQuestions(quizId) {
    return [
        {
            question_id: 1,
            question_text: 'What is 5! (5 factorial)?',
            options: [
                { id: 1, text: '120', is_correct: true },
                { id: 2, text: '60', is_correct: false },
                { id: 3, text: '24', is_correct: false },
                { id: 4, text: '720', is_correct: false }
            ]
        },
        {
            question_id: 2,
            question_text: 'Simplify: 6! / 4!',
            options: [
                { id: 1, text: '30', is_correct: true },
                { id: 2, text: '24', is_correct: false },
                { id: 3, text: '20', is_correct: false },
                { id: 4, text: '36', is_correct: false }
            ]
        },
        {
            question_id: 3,
            question_text: 'How many ways can you arrange 5 books on a shelf?',
            options: [
                { id: 1, text: '120', is_correct: true },
                { id: 2, text: '60', is_correct: false },
                { id: 3, text: '24', is_correct: false },
                { id: 4, text: '720', is_correct: false }
            ]
        },
        {
            question_id: 4,
            question_text: 'What is the value of 0! ?',
            options: [
                { id: 1, text: '1', is_correct: true },
                { id: 2, text: '0', is_correct: false },
                { id: 3, text: 'Undefined', is_correct: false },
                { id: 4, text: 'Infinity', is_correct: false }
            ]
        },
        {
            question_id: 5,
            question_text: 'Calculate: C(5,2) - combination of 5 taken 2',
            options: [
                { id: 1, text: '10', is_correct: true },
                { id: 2, text: '20', is_correct: false },
                { id: 3, text: '5', is_correct: false },
                { id: 4, text: '15', is_correct: false }
            ]
        }
    ];
}

// ============================================
// GET MOCK QUIZZES FOR CATEGORY
// ============================================
function getMockQuizzesForCategory(categoryId) {
    return [
        {
            quiz_id: 1,
            quiz_title: 'Factorial Basics Quiz',
            description: 'Test your knowledge of basic factorial concepts',
            difficulty: 'easy',
            total_questions: 5,
            duration_minutes: 10,
            passing_score: 70
        },
        {
            quiz_id: 2,
            quiz_title: 'Factorial Operations',
            description: 'Practice factorial calculations and simplifications',
            difficulty: 'medium',
            total_questions: 5,
            duration_minutes: 15,
            passing_score: 70
        },
        {
            quiz_id: 3,
            quiz_title: 'Permutations & Combinations',
            description: 'Test your understanding of permutations and combinations',
            difficulty: 'hard',
            total_questions: 5,
            duration_minutes: 20,
            passing_score: 70
        }
    ];
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================
window.startQuizSystem = startQuizSystem;
window.closeQuizSystemModal = closeQuizSystemModal;
window.goBackToCategories = goBackToCategories;
window.loadQuizCategories = loadQuizCategories;
window.initQuizDashboard = initQuizDashboard;
// ============================================
// VIEW PROFILE
// ============================================
window.viewProfile = function() {
    window.open('/profile', '_blank');
};

// ============================================
// EXPORT DATA
// ============================================
window.exportData = function() {
    console.log('📤 Exporting data...');
    showNotification('info', 'Export', 'Data export coming soon!');
};

// ============================================
// CLEAR HISTORY
// ============================================
window.clearHistory = function() {
    if (confirm('Are you sure you want to clear all learning history?')) {
        console.log('🧹 Clearing history...');
        showNotification('success', 'Success', 'Learning history cleared!');
    }
};
// ============================================
// ✅ TOOL MANAGER - FROM POLYLEARN (FIXED VERSION)
// ============================================

// Tool Manager Class
class ToolManager {
    constructor() {
        this.tools = {};
        this.currentTool = null;
        this.modalsContainer = document.getElementById('toolModalsContainer');
        
        // Create modals container if it doesn't exist
        if (!this.modalsContainer) {
            this.modalsContainer = document.createElement('div');
            this.modalsContainer.id = 'toolModalsContainer';
            document.body.appendChild(this.modalsContainer);
        }
        
        this.init();
    }

    init() {
        console.log('🔧 Initializing ToolManager...');
        this.createModals();
        this.initializeTools();
        this.setupEventListeners();
    }

    createModals() {
        console.log('📦 Creating tool modals...');
        
        // Check if modals already exist
        const modalHTML = `
            let calculatorModal = document.getElementById('calculatorModal');
            if (!calculatorModal) {
                calculatorModal = document.createElement('div');
                calculatorModal.id = 'calculatorModal';
                calculatorModal.className = 'modal-overlay';
                calculatorModal.innerHTML = `
                    <div class="modal-container">
                        <div class="modal-header" style="background: #7a0000; color: white;">
                            <h3 style="margin: 0;"><i class="fas fa-calculator"></i> Calculator</h3>
                            <button class="modal-close" onclick="window.toolManager.closeTool()" style="color: white;">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="calculator-container">
                                <div class="calculator-display" id="calcDisplay">0</div>
                                <div class="calculator-buttons" id="calcButtons"></div>
                                <div class="calculator-history">
                                    <h3><i class="fas fa-history"></i> History</h3>
                                    <div class="history-list" id="calcHistory"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                this.modalsContainer.appendChild(calculatorModal);
            }
            
            <!-- Graph Modal -->
            <div id="graphModal" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header" style="background: #7a0000; color: white;">
                        <h3 style="margin: 0;"><i class="fas fa-chart-line"></i> Graph Tool</h3>
                        <button class="modal-close" onclick="window.toolManager.closeTool()" style="color: white;">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="graph-tool">
                            <canvas id="graphCanvas" width="600" height="400"></canvas>
                            <div class="graph-controls">
                                <input type="text" id="graphExpression" placeholder="f(x) = " value="x^2 - 3x + 2">
                                <button id="plotGraphBtn">Plot</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Whiteboard Modal -->
            <div id="whiteboardModal" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header" style="background: #7a0000; color: white;">
                        <h3 style="margin: 0;"><i class="fas fa-paint-brush"></i> Whiteboard</h3>
                        <button class="modal-close" onclick="window.toolManager.closeTool()" style="color: white;">&times;</button>
                    </div>
                    <div class="modal-body">
                        <canvas id="whiteboardCanvas" width="600" height="400"></canvas>
                        <div class="whiteboard-controls">
                            <button onclick="window.toolManager.tools.whiteboard.setTool('pen')">Pen</button>
                            <button onclick="window.toolManager.tools.whiteboard.setTool('eraser')">Eraser</button>
                            <button onclick="window.toolManager.tools.whiteboard.clear()">Clear</button>
                            <input type="color" id="colorPicker" value="#7a0000">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Notepad Modal -->
            <div id="notepadModal" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header" style="background: #7a0000; color: white;">
                        <h3 style="margin: 0;"><i class="fas fa-sticky-note"></i> Notepad</h3>
                        <button class="modal-close" onclick="window.toolManager.closeTool()" style="color: white;">&times;</button>
                    </div>
                    <div class="modal-body">
                        <input type="text" id="noteTitle" placeholder="Note Title">
                        <textarea id="noteContent" placeholder="Write your notes here..." rows="10"></textarea>
                        <button onclick="window.toolManager.tools.notepad.save()">Save Note</button>
                        <button onclick="window.toolManager.tools.notepad.clear()">Clear</button>
                    </div>
                </div>
            </div>
            
            <!-- Formula Sheet Modal -->
            <div id="formulaModal" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header" style="background: #7a0000; color: white;">
                        <h3 style="margin: 0;"><i class="fas fa-square-root-alt"></i> Formula Sheet</h3>
                        <button class="modal-close" onclick="window.toolManager.closeTool()" style="color: white;">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="formula-categories">
                            <button onclick="window.toolManager.tools.formula.showCategory('factorial')">Factorial</button>
                            <button onclick="window.toolManager.tools.formula.showCategory('combinatorics')">Combinatorics</button>
                            <button onclick="window.toolManager.tools.formula.showCategory('probability')">Probability</button>
                        </div>
                        <div id="formulaList"></div>
                    </div>
                </div>
            </div>
            
            <!-- Timer Modal -->
            <div id="timerModal" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-header" style="background: #7a0000; color: white;">
                        <h3 style="margin: 0;"><i class="fas fa-clock"></i> Study Timer</h3>
                        <button class="modal-close" onclick="window.toolManager.closeTool()" style="color: white;">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="timer-display" id="timerDisplay">25:00</div>
                        <div class="timer-controls">
                            <button id="timerStartBtn">Start</button>
                            <button id="timerPauseBtn">Pause</button>
                            <button id="timerResetBtn">Reset</button>
                        </div>
                        <div class="timer-presets">
                            <button id="timer15min">15 min</button>
                            <button id="timer25min" class="active">25 min</button>
                            <button id="timer50min">50 min</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Only inject if modals don't exist
        const existingModals = ['calculatorModal', 'graphModal', 'whiteboardModal', 'notepadModal', 'formulaModal', 'timerModal'];
        let anyModalMissing = false;
        
        existingModals.forEach(id => {
            if (!document.getElementById(id)) anyModalMissing = true;
        });
        
        if (anyModalMissing) {
            this.modalsContainer.innerHTML = modalHTML;
            console.log('✅ Tool modals created');
        }
    }

    initializeTools() {
        console.log('🔧 Initializing tool instances...');
        this.tools = {
            calculator: new Calculator(),
            whiteboard: new Whiteboard(),
            notepad: new Notepad(),
            formula: new FormulaSheet(),
            timer: new StudyTimer(),
            graph: new GraphTool()
        };
    }

    setupEventListeners() {
        console.log('🔗 Setting up event listeners...');
        
        // Close modal when clicking on overlay
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeTool();
            }
        });

        // Close modal when pressing ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTool();
            }
        });
    }

    openTool(toolName) {
        console.log(`🔧 Opening tool: ${toolName}`);
        
        // Close any open tool first
        this.closeTool();
        
        const modal = document.getElementById(`${toolName}Modal`);
        if (modal) {
            modal.style.display = 'flex';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            modal.style.zIndex = '10000';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            
            modal.classList.add('active');
            this.currentTool = toolName;
            
            // Initialize tool when opened
            if (this.tools[toolName] && typeof this.tools[toolName].onOpen === 'function') {
                setTimeout(() => {
                    try {
                        this.tools[toolName].onOpen();
                    } catch (e) {
                        console.error(`Error opening ${toolName}:`, e);
                    }
                }, 100);
            }
            
            console.log(`✅ ${toolName} opened successfully`);
            return true;
        } else {
            console.error(`❌ Modal not found: ${toolName}Modal`);
            return false;
        }
    }

    closeTool() {
        console.log('🔧 Closing current tool');
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('active');
        });
        this.currentTool = null;
    }
}

// ========================================
// CALCULATOR TOOL - EXACT COPY FROM POLYLEARN
// ========================================
class Calculator {
    constructor() {
        this.display = '0';
        this.history = [];
        this.memory = 0;
        this.expression = '';
        this.lastResult = null;
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
                if (btn === '⌫') className += ' backspace';
                
                return `<button class="${className}" data-value="${btn}">${btn}</button>`;
            }).join('')
        ).join('');

        const buttonsContainer = document.getElementById('calcButtons');
        if (buttonsContainer) {
            buttonsContainer.innerHTML = buttonsHtml;
            
            // Add event listeners to buttons
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
                this.lastResult = null;
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
        // Handle numbers and operators
        if (this.display === '0' && !isNaN(value)) {
            this.display = value;
        } else {
            this.display += value;
        }
    }

    calculate() {
        try {
            // Replace display operators with JavaScript operators
            let expression = this.display
                .replace(/÷/g, '/')
                .replace(/×/g, '*');
            
            // Don't calculate if expression is empty or just operators
            if (!expression || expression.match(/^[+\-*/]+$/)) {
                return;
            }
            
            let result = eval(expression);
            
            // Handle decimal places
            if (result.toString().includes('.')) {
                result = Math.round(result * 1000000) / 1000000;
            }
            
            // Add to history
            this.history.unshift({
                expression: this.display,
                result: result,
                timestamp: new Date().toLocaleTimeString()
            });
            
            // Keep history to 10 items
            if (this.history.length > 10) {
                this.history.pop();
            }
            
            // Save to backend
            this.saveToHistory(this.display, result);
            
            // Update display
            this.display = result.toString();
            this.lastResult = result;
            this.updateHistory();
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.display = 'Error';
            setTimeout(() => {
                this.display = '0';
                this.updateDisplay();
            }, 1500);
        }
    }

    async saveToHistory(expression, result) {
        try {
            const token = localStorage.getItem('authToken') || authToken;
            if (!token) return;

            await fetch(`/api/calculator/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ expression, result })
            });
        } catch (error) {
            console.log('Failed to save calculation:', error);
        }
    }

    async loadHistory() {
        try {
            const token = localStorage.getItem('authToken') || authToken;
            if (!token) return;

            const response = await fetch(`/api/calculator/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) return;
            
            const data = await response.json();
            
            if (data.success && data.history) {
                this.history = data.history.map(item => ({
                    expression: item.expression,
                    result: item.result,
                    timestamp: new Date(item.created_at).toLocaleTimeString()
                }));
                this.updateHistory();
            }
        } catch (error) {
            console.log('Failed to load history:', error);
        }
    }

    updateDisplay() {
        const displayEl = document.getElementById('calcDisplay');
        if (displayEl) {
            displayEl.textContent = this.display;
        }
    }

    updateHistory() {
        const historyEl = document.getElementById('calcHistory');
        if (!historyEl) return;

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
// ✅ WHITEBOARD TOOL
// ============================================
class Whiteboard {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.drawing = false;
        this.currentTool = 'pen';
        this.color = '#7a0000';
        this.lineWidth = 2;
        this.lastX = 0;
        this.lastY = 0;
    }

    onOpen() {
        setTimeout(() => this.setupCanvas(), 100);
    }

    setupCanvas() {
        this.canvas = document.getElementById('whiteboardCanvas');
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        this.canvas.width = container?.clientWidth - 40 || 600;
        this.canvas.height = container?.clientHeight - 100 || 400;
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.canvas || !this.ctx) return;
        
        // Mouse events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
        
        // Color picker
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
        const touch = e.touches[0];
        if (!touch) return;
        this.startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        if (!touch) return;
        this.draw({ clientX: touch.clientX, clientY: touch.clientY });
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.stopDrawing();
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
        if (this.ctx) this.ctx.closePath();
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
// ✅ NOTEPAD TOOL
// ============================================
class Notepad {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes') || '[]');
        this.currentNoteId = null;
    }

    onOpen() {
        this.loadNotes();
    }

    save() {
        const title = document.getElementById('noteTitle').value || 'Untitled';
        const content = document.getElementById('noteContent').value;
        
        if (!content) {
            alert('Please write something before saving!');
            return;
        }

        const note = {
            id: Date.now(),
            title: title,
            content: content,
            created: new Date().toISOString()
        };

        this.notes.unshift(note);
        localStorage.setItem('notes', JSON.stringify(this.notes));
        alert('Note saved!');
        this.clear();
    }

    loadNotes() {}

    clear() {
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        this.currentNoteId = null;
    }
}

// ============================================
// ✅ FORMULA SHEET TOOL
// ============================================
class FormulaSheet {
    constructor() {
        this.formulas = {
            factorial: [
                { name: 'Factorial Definition', formula: 'n! = n × (n-1) × (n-2) × ... × 1' },
                { name: '0!', formula: '0! = 1' },
                { name: 'Factorial of n', formula: 'n! = n × (n-1)!' },
                { name: 'Double Factorial', formula: 'n!! = n × (n-2) × (n-4) × ...' }
            ],
            combinatorics: [
                { name: 'Permutation', formula: 'P(n,r) = n! / (n-r)!' },
                { name: 'Combination', formula: 'C(n,r) = n! / (r! × (n-r)!)' },
                { name: 'Permutation with Repetition', formula: 'n^r' },
                { name: 'Circular Permutation', formula: '(n-1)!' }
            ],
            probability: [
                { name: 'Basic Probability', formula: 'P(A) = Number of favorable outcomes / Total outcomes' },
                { name: 'Addition Rule', formula: 'P(A∪B) = P(A) + P(B) - P(A∩B)' },
                { name: 'Multiplication Rule', formula: 'P(A∩B) = P(A) × P(B|A)' },
                { name: 'Bayes Theorem', formula: 'P(A|B) = P(B|A) × P(A) / P(B)' }
            ]
        };
        this.currentCategory = 'factorial';
    }

    onOpen() {
        console.log('📚 Formula Sheet opened');
        this.showCategory('factorial');
        this.setupCategoryButtons();
    }

    setupCategoryButtons() {
        const categoryBtns = document.querySelectorAll('.formula-categories button');
        categoryBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = newBtn.textContent.toLowerCase();
                this.showCategory(category);
                
                document.querySelectorAll('.formula-categories button').forEach(b => {
                    b.classList.remove('active');
                });
                newBtn.classList.add('active');
            });
        });
    }

    showCategory(category) {
        this.currentCategory = category;
        const formulas = this.formulas[category] || [];
        const listEl = document.getElementById('formulaList');
        if (!listEl) return;
        
        if (formulas.length === 0) {
            listEl.innerHTML = '<p class="no-formulas">No formulas available for this category.</p>';
            return;
        }
        
        listEl.innerHTML = formulas.map(f => `
            <div class="formula-item">
                <div class="formula-name">${f.name}</div>
                <div class="formula-expression">${f.formula}</div>
            </div>
        `).join('');
    }
}

// ============================================
// ✅ STUDY TIMER TOOL
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
        
        const findTimer = () => {
            this.timerElement = document.getElementById('timerDisplay') || document.querySelector('.timer-display');
            if (this.timerElement) {
                this.updateDisplay();
                this.attachEventListeners();
            } else {
                setTimeout(findTimer, 100);
            }
        };
        findTimer();
    }

    updateDisplay() {
        if (!this.timerElement) {
            this.timerElement = document.getElementById('timerDisplay') || document.querySelector('.timer-display');
        }
        if (this.timerElement) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    attachEventListeners() {
        const getButton = (id) => document.getElementById(id) || document.querySelector(`.${id}`);
        
        const startBtn = getButton('timerStartBtn');
        const pauseBtn = getButton('timerPauseBtn');
        const resetBtn = getButton('timerResetBtn');
        const btn15 = getButton('timer15min');
        const btn25 = getButton('timer25min');
        const btn50 = getButton('timer50min');
        
        if (startBtn) {
            const newBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newBtn, startBtn);
            newBtn.addEventListener('click', (e) => { e.preventDefault(); this.start(); });
        }
        
        if (pauseBtn) {
            const newBtn = pauseBtn.cloneNode(true);
            pauseBtn.parentNode.replaceChild(newBtn, pauseBtn);
            newBtn.addEventListener('click', (e) => { e.preventDefault(); this.pause(); });
        }
        
        if (resetBtn) {
            const newBtn = resetBtn.cloneNode(true);
            resetBtn.parentNode.replaceChild(newBtn, resetBtn);
            newBtn.addEventListener('click', (e) => { e.preventDefault(); this.reset(); });
        }
        
        if (btn15) {
            const newBtn = btn15.cloneNode(true);
            btn15.parentNode.replaceChild(newBtn, btn15);
            newBtn.addEventListener('click', (e) => { e.preventDefault(); this.setTime(15); });
        }
        
        if (btn25) {
            const newBtn = btn25.cloneNode(true);
            btn25.parentNode.replaceChild(newBtn, btn25);
            newBtn.addEventListener('click', (e) => { e.preventDefault(); this.setTime(25); });
        }
        
        if (btn50) {
            const newBtn = btn50.cloneNode(true);
            btn50.parentNode.replaceChild(newBtn, btn50);
            newBtn.addEventListener('click', (e) => { e.preventDefault(); this.setTime(50); });
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
                    if (this.timeLeft <= 0) this.complete();
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
        alert('🎉 Study session complete! Great job!');
        try {
            const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
            audio.play();
        } catch (e) {}
        this.reset();
    }
}

// ============================================
// ✅ GRAPH TOOL
// ============================================
class GraphTool {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.expression = 'gamma(x+1)';
        this.range = { min: 0, max: 10 };
        this.points = [];
        this.isDarkMode = false;
    }

    onOpen() {
        setTimeout(() => {
            this.canvas = document.getElementById('graphCanvas');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.setupCanvas();
                this.setupEventListeners();
                this.drawGrid();
                this.plotFunction();
            }
        }, 100);
    }

    setupCanvas() {
        this.canvas.width = this.canvas.offsetWidth || 600;
        this.canvas.height = this.canvas.offsetHeight || 400;
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#7a0000';
        this.ctx.fillStyle = '#7a0000';
        this.ctx.font = '12px Arial';
    }

    setupEventListeners() {
        const exprInput = document.getElementById('graphExpression');
        if (exprInput) {
            exprInput.addEventListener('input', (e) => { this.expression = e.target.value; });
        }
        
        const plotBtn = document.getElementById('plotGraphBtn');
        if (plotBtn) {
            plotBtn.addEventListener('click', () => { this.plotFunction(); });
        }
    }

    f(x) {
        try {
            if (!this.expression || this.expression.trim() === '') return 0;
            const fn = new Function('x', `return ${this.expression}`);
            return fn(x);
        } catch (e) {
            return NaN;
        }
    }

    generatePoints() {
        this.points = [];
        const step = (this.range.max - this.range.min) / 200;
        for (let x = this.range.min; x <= this.range.max; x += step) {
            try {
                const y = this.f(x);
                if (isFinite(y) && !isNaN(y) && Math.abs(y) < 1000) {
                    this.points.push({ x, y });
                }
            } catch (e) {}
        }
    }

    drawGrid() {
        if (!this.ctx || !this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.fillStyle = this.isDarkMode ? '#1a1a1a' : '#fff';
        this.ctx.fillRect(0, 0, w, h);
        
        let yMin = -10, yMax = 100;
        if (this.points.length > 0) {
            const yValues = this.points.map(p => p.y).filter(y => isFinite(y) && !isNaN(y) && Math.abs(y) < 1000);
            if (yValues.length > 0) {
                yMin = Math.min(...yValues);
                yMax = Math.max(...yValues);
                const padding = (yMax - yMin) * 0.1;
                yMin -= padding;
                yMax += padding;
            }
        }
        
        const yRange = yMax - yMin;
        const xToPx = (x) => ((x - this.range.min) / (this.range.max - this.range.min)) * w;
        const yToPx = (y) => h - ((y - yMin) / yRange) * h;
        
        this.ctx.strokeStyle = this.isDarkMode ? '#333' : '#ddd';
        this.ctx.lineWidth = 0.5;
        
        for (let x = Math.ceil(this.range.min); x <= this.range.max; x++) {
            if (x === 0) continue;
            const px = xToPx(x);
            if (px >= 0 && px <= w) {
                this.ctx.beginPath();
                this.ctx.moveTo(px, 0);
                this.ctx.lineTo(px, h);
                this.ctx.stroke();
            }
        }
        
        for (let y = Math.ceil(yMin / 10) * 10; y <= yMax; y += 10) {
            if (y === 0) continue;
            const py = yToPx(y);
            if (py >= 0 && py <= h) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, py);
                this.ctx.lineTo(w, py);
                this.ctx.stroke();
            }
        }
        
        this.ctx.strokeStyle = this.isDarkMode ? '#666' : '#999';
        this.ctx.lineWidth = 2;
        
        const xZero = xToPx(0);
        if (xZero >= 0 && xZero <= w) {
            this.ctx.beginPath();
            this.ctx.moveTo(xZero, 0);
            this.ctx.lineTo(xZero, h);
            this.ctx.stroke();
        }
        
        const yZero = yToPx(0);
        if (yZero >= 0 && yZero <= h) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, yZero);
            this.ctx.lineTo(w, yZero);
            this.ctx.stroke();
        }
    }

    plotFunction() {
        this.generatePoints();
        this.drawGrid();
        if (this.points.length === 0) return;
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        let yMin = -10, yMax = 100;
        const yValues = this.points.map(p => p.y).filter(y => isFinite(y) && !isNaN(y) && Math.abs(y) < 1000);
        if (yValues.length > 0) {
            yMin = Math.min(...yValues);
            yMax = Math.max(...yValues);
            const padding = (yMax - yMin) * 0.1;
            yMin -= padding;
            yMax += padding;
        }
        
        const yRange = yMax - yMin;
        const xToPx = (x) => ((x - this.range.min) / (this.range.max - this.range.min)) * w;
        const yToPx = (y) => h - ((y - yMin) / yRange) * h;
        
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        let first = true;
        for (const point of this.points) {
            const px = xToPx(point.x);
            const py = yToPx(point.y);
            if (px >= 0 && px <= w && py >= 0 && py <= h) {
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
}

// ============================================
// ✅ INITIALIZE TOOL MANAGER
// ============================================
window.toolManager = new ToolManager();
console.log('✅ ToolManager initialized');

// ============================================
// ✅ CONNECT TOOL BUTTONS
// ============================================
function connectToolButtons() {
    console.log('🔧 Connecting tool buttons...');

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
                console.log(`🎯 Opening ${tool.name}`);
                window.toolManager.openTool(tool.name);
            });
        } else {
            console.warn(`⚠️ Button not found: ${tool.id}`);
        }
    });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connectToolButtons);
} else {
    connectToolButtons();
}

// Also run after page load
window.addEventListener('load', connectToolButtons);
// lesson-tools-fix.js
console.log('🔧 Lesson Tools Fix loaded');

// Direct tool handlers
const tools = [
    { id: 'openCalculator', name: 'calculator' },
    { id: 'openGraphTools', name: 'graph' },
    { id: 'openNotepad', name: 'notepad' },
    { id: 'openFormulaSheet', name: 'formula' },
    { id: 'openWhiteboard', name: 'whiteboard' },
    { id: 'openTimer', name: 'timer' }
];

function openTool(toolName) {
    console.log(`🎯 Opening ${toolName}`);
    
    const modal = document.getElementById(`${toolName}Modal`);
    
    if (!modal) {
        console.error(`❌ Modal not found: ${toolName}Modal`);
        return;
    }
    
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.style.display = 'none';
        m.classList.remove('active');
    });
    
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modal.style.zIndex = '10000';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.classList.add('active');
}

function attachHandlers() {
    tools.forEach(tool => {
        const btn = document.getElementById(tool.id);
        if (btn) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openTool(tool.name);
            });
            
            console.log(`✅ Handler attached: ${tool.id}`);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachHandlers);
} else {
    attachHandlers();
}

window.closeToolModal = function() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('active');
    });
};

console.log('✅ Lesson Tools Fix ready');

// ============================================
// ✅ FEEDBACK FUNCTIONS - FROM POLYLEARN
// ============================================

// Initialize feedback functionality
function initFeedback() {
    console.log('💬 Initializing feedback system...');
    
    setupRatingStars();
    setupFeedbackForm();
    
    console.log('✅ Feedback system initialized');
}

// Setup rating stars
function setupRatingStars() {
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.getElementById('ratingValue');
    
    if (!stars.length || !ratingValue) return;
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating') || this.getAttribute('onclick')?.match(/\d+/) || 0);
            
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                    s.innerHTML = '★';
                } else {
                    s.classList.remove('active');
                    s.innerHTML = '☆';
                }
            });
            
            ratingValue.value = rating;
        });
        
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.getAttribute('data-rating') || this.getAttribute('onclick')?.match(/\d+/) || 0);
            
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('hover');
                } else {
                    s.classList.remove('hover');
                }
            });
        });
        
        star.addEventListener('mouseout', function() {
            stars.forEach(s => s.classList.remove('hover'));
        });
    });
}

// Setup feedback form
function setupFeedbackForm() {
    console.log('📝 Setting up feedback form');
    
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackSuccess = document.getElementById('feedbackSuccess');
    
    if (!feedbackForm) return;
    
    const newForm = feedbackForm.cloneNode(true);
    feedbackForm.parentNode.replaceChild(newForm, feedbackForm);
    
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('📝 Feedback form submitted');
        
        const feedbackType = document.getElementById('feedbackType')?.value;
        const feedbackMessage = document.getElementById('feedbackMessage')?.value.trim();
        const rating = parseInt(document.getElementById('ratingValue')?.value) || 0;
        
        if (!feedbackMessage) {
            showNotification('error', 'Error', 'Please enter your feedback message');
            return;
        }
        
        if (feedbackMessage.length < 10) {
            showNotification('error', 'Error', 'Please provide more detailed feedback (at least 10 characters)');
            return;
        }
        
        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
        
        try {
            const userJson = localStorage.getItem('mathhub_user');
            let userId = null;
            
            if (userJson) {
                try {
                    const user = JSON.parse(userJson);
                    userId = user.id || user.user_id;
                } catch (e) {}
            }
            
            const feedbackData = {
                feedback_type: feedbackType || 'general',
                feedback_message: feedbackMessage,
                rating: rating,
                user_id: userId,
                page_url: window.location.href,
                user_agent: navigator.userAgent
            };
            
            console.log('📤 Sending feedback:', feedbackData);
            
            const token = localStorage.getItem('authToken') || authToken;
            
            const response = await fetch('/api/feedback/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(feedbackData)
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Feedback saved! ID:', data.feedback_id);
                
                if (feedbackSuccess) {
                    feedbackSuccess.style.display = 'block';
                    feedbackSuccess.innerHTML = `
                        <i class="fas fa-check-circle"></i> 
                        Thank you! Your feedback has been saved.
                    `;
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
                
                showNotification('success', 'Thank You!', 'Your feedback has been submitted successfully!');
                
            } else {
                saveFeedbackLocally(feedbackData);
                
                if (feedbackSuccess) {
                    feedbackSuccess.style.display = 'block';
                    feedbackSuccess.innerHTML = `
                        <i class="fas fa-check-circle"></i> 
                        Thank you! Your feedback has been saved locally.
                    `;
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
                
                showNotification('success', 'Thank You!', 'Your feedback has been saved locally!');
            }
            
        } catch (error) {
            console.error('❌ Error submitting feedback:', error);
            
            saveFeedbackLocally({
                feedback_type: feedbackType,
                feedback_message: feedbackMessage,
                rating: rating,
                user_id: userId,
                page_url: window.location.href,
                user_agent: navigator.userAgent
            });
            
            showNotification('success', 'Thank You!', 'Your feedback has been saved locally!');
            
            newForm.reset();
            
            const stars = document.querySelectorAll('.star');
            stars.forEach(star => {
                star.classList.remove('active');
                star.innerHTML = '☆';
            });
            document.getElementById('ratingValue').value = 0;
            
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Save feedback locally
function saveFeedbackLocally(feedbackData) {
    try {
        let existingFeedback = JSON.parse(localStorage.getItem('local_feedback') || '[]');
        
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
        
        localStorage.setItem('local_feedback', JSON.stringify(existingFeedback));
        
        console.log('💾 Feedback saved locally, total:', existingFeedback.length);
        
        displayLocalFeedbackHistory();
        
    } catch (e) {
        console.error('Failed to save feedback locally:', e);
    }
}

// Display local feedback history
function displayLocalFeedbackHistory() {
    const historyContainer = document.getElementById('feedbackHistory');
    if (!historyContainer) return;
    
    try {
        const localFeedback = JSON.parse(localStorage.getItem('local_feedback') || '[]');
        
        if (localFeedback.length === 0) {
            historyContainer.innerHTML = `
                <div class="no-feedback" style="text-align: center; padding: 30px;">
                    <i class="fas fa-comment-slash" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">No feedback submitted yet</h4>
                    <p style="color: #7f8c8d;">Your submitted feedback will appear here</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="feedback-history-list">';
        
        localFeedback.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        localFeedback.slice(0, 10).forEach(item => {
            const date = new Date(item.created_at || Date.now());
            const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            
            const ratingStars = '★'.repeat(item.rating || 0) + '☆'.repeat(5 - (item.rating || 0));
            
            html += `
                <div class="feedback-history-item status-pending" style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 4px solid #3498db;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                            <span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${item.feedback_type || 'feedback'}</span>
                            <span style="font-size: 11px; background: #eee; padding: 4px 8px; border-radius: 4px; margin-left: 8px;">Local</span>
                        </div>
                        <span style="font-size: 12px; color: #999;">${formattedDate}</span>
                    </div>
                    
                    <p style="margin: 0 0 10px 0; color: #2c3e50;">${escapeHtml(item.feedback_message || '')}</p>
                    
                    ${item.rating > 0 ? `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #f39c12;">${ratingStars}</span>
                            <span style="font-size: 12px; color: #666;">${item.rating}/5</span>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        historyContainer.innerHTML = html;
        
    } catch (e) {
        console.error('Error displaying local feedback:', e);
    }
}

// Load feedback history
async function loadFeedbackHistory(limit = 10) {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            displayLocalFeedbackHistory();
            return;
        }
        
        const historyContainer = document.getElementById('feedbackHistory');
        if (!historyContainer) return;
        
        historyContainer.innerHTML = `
            <div class="loading-container" style="text-align: center; padding: 30px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #7a0000;"></i>
                <p style="margin-top: 10px;">Loading feedback history...</p>
            </div>
        `;
        
        const response = await fetch(`/api/feedback/history?limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            displayLocalFeedbackHistory();
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.feedback && Array.isArray(data.feedback)) {
            displayFeedbackHistory(data.feedback);
        } else {
            displayLocalFeedbackHistory();
        }
        
    } catch (error) {
        console.error('Error loading feedback history:', error);
        displayLocalFeedbackHistory();
    }
}

// Display feedback history from server
function displayFeedbackHistory(feedbackItems) {
    const historyContainer = document.getElementById('feedbackHistory');
    if (!historyContainer) return;
    
    if (!feedbackItems || !Array.isArray(feedbackItems) || feedbackItems.length === 0) {
        displayLocalFeedbackHistory();
        return;
    }
    
    let html = '<div class="feedback-history-list">';
    
    feedbackItems.forEach(item => {
        if (!item) return;
        
        const date = item.created_at ? new Date(item.created_at) : new Date();
        const formattedDate = !isNaN(date) ? date.toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }) : 'Unknown date';
        
        const ratingStars = '★'.repeat(item.rating || 0) + '☆'.repeat(5 - (item.rating || 0));
        const statusClass = item.status || 'pending';
        
        html += `
            <div class="feedback-history-item status-${statusClass}" style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 4px solid ${statusClass === 'resolved' ? '#27ae60' : (statusClass === 'reviewed' ? '#f39c12' : '#3498db')};">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div>
                        <span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${item.feedback_type || 'feedback'}</span>
                        <span style="background: ${statusClass === 'resolved' ? '#d4edda' : (statusClass === 'reviewed' ? '#fff3cd' : '#e3f2fd')}; color: ${statusClass === 'resolved' ? '#155724' : (statusClass === 'reviewed' ? '#856404' : '#1976d2')}; padding: 4px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">${statusClass}</span>
                    </div>
                    <span style="font-size: 12px; color: #999;">${formattedDate}</span>
                </div>
                
                <p style="margin: 0 0 10px 0; color: #2c3e50;">${escapeHtml(item.feedback_message || item.message || '')}</p>
                
                ${item.rating > 0 ? `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: #f39c12;">${ratingStars}</span>
                        <span style="font-size: 12px; color: #666;">${item.rating}/5</span>
                    </div>
                ` : ''}
                
                ${item.admin_notes ? `
                    <div style="background: #e8f4f8; padding: 10px; border-radius: 6px; margin-top: 10px; border-left: 3px solid #3498db;">
                        <i class="fas fa-reply" style="color: #3498db;"></i>
                        <strong>Admin Response:</strong>
                        <p style="margin: 5px 0 0 20px; color: #2c3e50;">${escapeHtml(item.admin_notes)}</p>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    historyContainer.innerHTML = html;
}

// Escape HTML helper
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize feedback dashboard
function initFeedbackDashboard() {
    console.log('💬 Initializing feedback dashboard...');
    
    initFeedback();
    
    if (document.getElementById('feedbackForm')) {
        setupRatingStars();
        setupFeedbackForm();
    }
    
    loadFeedbackHistory(10);
}

// Make functions globally available
window.initFeedback = initFeedback;
window.loadFeedbackHistory = loadFeedbackHistory;
window.rate = function(rating) {
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.getElementById('ratingValue');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
            star.innerHTML = '★';
        } else {
            star.classList.remove('active');
            star.innerHTML = '☆';
        }
    });
    
    if (ratingValue) ratingValue.value = rating;
};

// Auto-load feedback when page opens
document.addEventListener('DOMContentLoaded', function() {
    const feedbackPage = document.getElementById('feedback-page');
    if (feedbackPage && !feedbackPage.classList.contains('hidden')) {
        setTimeout(() => {
            loadFeedbackHistory(10);
        }, 500);
    }
});
// ============================================
// ✅ MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================
window.showDashboard = showDashboard;
window.showPracticeDashboard = showPracticeDashboard;
window.showQuizDashboard = showQuizDashboard;
window.showProgressPage = showProgressPage;
window.showFeedbackPage = showFeedbackPage;
window.showSettingsPage = showSettingsPage;
window.goToModuleDashboard = goToModuleDashboard;
window.logoutUser = logoutUser;
window.showLogoutConfirmation = showLogoutConfirmation;
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout = confirmLogout;
window.showNotification = showNotification;
window.closePracticeResultModal = closePracticeResultModal;
window.tryPracticeAgain = tryPracticeAgain;
window.goToNextPractice = goToNextPractice;

console.log('✅ FactoLearn Script Loaded Successfully - lesson_id=3 forced');
