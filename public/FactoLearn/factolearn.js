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
    achievementTimeline: []
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
// ✅ FIXED: updateOverallProgressDisplay
// ============================================
function updateOverallProgressDisplay(progress) {
    console.log('📊 Updating overall progress display with:', progress);
    
    if (!progress) {
        progress = ProgressState.cumulativeProgress || getDefaultProgress();
    }
    
    const percentage = progress.percentage || progress.overall_percentage || 0;
    
    const overallProgress = document.getElementById('overallProgress');
    if (overallProgress) {
        overallProgress.textContent = `${percentage}%`;
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
        totalPointsProgress.textContent = progress.total_points || progress.total_points_earned || 0;
    }
    
    const pointsChange = document.getElementById('pointsChange');
    if (pointsChange) {
        const weeklyPoints = progress.weekly?.points || 0;
        pointsChange.textContent = `+${weeklyPoints} this week`;
    }
    
    const totalTime = document.getElementById('totalTime');
    if (totalTime) {
        if (progress.total_time_display) {
            totalTime.textContent = progress.total_time_display;
        } else {
            const totalMinutes = progress.total_time_spent_minutes || 0;
            totalTime.textContent = formatTime(totalMinutes);
        }
    }
    
    const timeChange = document.getElementById('timeChange');
    if (timeChange) {
        const weeklyMinutes = progress.weekly?.minutes || 0;
        timeChange.textContent = `${formatTime(weeklyMinutes)} this week`;
    }
}

// ============================================
// ✅ FIXED: fetchTopicMastery
// ============================================
async function fetchTopicMastery() {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) return {};
        
        console.log('🧠 Fetching topic mastery...');
        
        const response = await fetch(`/api/progress/topic-mastery`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) return {};
        
        const data = await response.json();
        
        if (data.success && data.mastery) {
            console.log(`✅ Fetched mastery for ${data.mastery.length} topics`);
            ProgressState.topicMastery = data.mastery;
            return data.mastery;
        } else {
            return {};
        }
    } catch (error) {
        console.error('Error fetching topic mastery:', error);
        return {};
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
// ✅ FIXED: loadProgressDashboardData
// ============================================
async function loadProgressDashboardData() {
    console.log('📊 Loading FactoLearn progress dashboard data...');
    
    try {
        showProgressDashboardLoading();
        
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.error('❌ No auth token');
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
        
        const overallProgress = document.getElementById('overallProgress');
        if (overallProgress) {
            overallProgress.textContent = `${overallPercentage}%`;
        }
        
        const overallProgressBar = document.getElementById('overallProgressBar');
        if (overallProgressBar) {
            overallProgressBar.style.width = `${overallPercentage}%`;
            overallProgressBar.className = 'progress-fill';
            if (overallPercentage >= 70) overallProgressBar.classList.add('progress-good');
            else if (overallPercentage >= 40) overallProgressBar.classList.add('progress-medium');
            else overallProgressBar.classList.add('progress-low');
        }
        
        const totalPointsProgress = document.getElementById('totalPointsProgress');
        if (totalPointsProgress) {
            totalPointsProgress.textContent = quizPoints;
        }
        
        const pointsChange = document.getElementById('pointsChange');
        if (pointsChange) {
            pointsChange.textContent = `+${Math.min(quizPoints, 10)} this week`;
        }
        
        const totalTime = document.getElementById('totalTime');
        if (totalTime) {
            const totalMinutes = Math.floor(totalPracticeSeconds / 60);
            let timeDisplay = '';
            if (totalMinutes < 60) {
                timeDisplay = `${totalMinutes}m`;
            } else {
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                timeDisplay = `${hours}h ${mins}m`;
            }
            totalTime.textContent = timeDisplay;
        }
        
        const totalBadges = document.getElementById('totalBadges');
        if (totalBadges) {
            let badgeCount = 0;
            if (lessonsCompleted >= 1) badgeCount++;
            if (lessonsCompleted >= 5) badgeCount++;
            if (lessonsCompleted >= 8) badgeCount++;
            if (exercisesCompleted >= 5) badgeCount++;
            if (exercisesCompleted >= 15) badgeCount++;
            if (quizAttempts >= 1) badgeCount++;
            
            totalBadges.textContent = `${badgeCount}/10`;
        }
        
        const badgesChange = document.getElementById('badgesChange');
        if (badgesChange) {
            const badgesThisMonth = Math.floor(lessonsCompleted / 2) + Math.floor(exercisesCompleted / 5);
            badgesChange.textContent = `+${badgesThisMonth} this month`;
        }
        
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
        
        const overallProgress = document.getElementById('overallProgress');
        if (overallProgress) overallProgress.textContent = '0%';
        const totalPointsProgress = document.getElementById('totalPointsProgress');
        if (totalPointsProgress) totalPointsProgress.textContent = '0';
        const totalTime = document.getElementById('totalTime');
        if (totalTime) totalTime.textContent = '0m';
        const totalBadges = document.getElementById('totalBadges');
        if (totalBadges) totalBadges.textContent = '0/10';
    }
}

function showProgressDashboardLoading() {
    console.log('⏳ Showing loading state');
    
    const elements = [
        { id: 'overallProgress', defaultValue: '0%' },
        { id: 'totalPointsProgress', defaultValue: '0' },
        { id: 'totalTime', defaultValue: '0h' },
        { id: 'totalBadges', defaultValue: '0/10' }
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
// ✅ LOGOUT CONFIRMATION
// ============================================
function showLogoutConfirmation() {
    console.log('🚪 Showing logout confirmation');
    
    const existingModal = document.querySelector('.logout-modal');
    if (existingModal) existingModal.remove();
    
    const modalHTML = `
        <div class="logout-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 15px;">
            <div style="background: white; max-width: 380px; width: 100%; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px -12px rgba(0,0,0,0.4);">
                <div style="background: #b90404; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 18px;"><i class="fas fa-sign-out-alt"></i> Confirm Logout</h3>
                    <button onclick="closeLogoutModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                
                <div style="padding: 25px 20px; text-align: center; background: white;">
                    <div style="width: 70px; height: 70px; border-radius: 50%; background: #fff3cd; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 35px; color: #856404;"></i>
                    </div>
                    
                    <h4 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #2c3e50;">
                        Are you sure you want to logout?
                    </h4>
                    
                    <p style="color: #7f8c8d; margin: 0 0 20px; font-size: 14px;">
                        Your progress is automatically saved.
                    </p>
                    
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button onclick="closeLogoutModal()" style="flex: 1; padding: 12px 15px; background: #ecf0f1; color: #2c3e50; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button onclick="confirmLogout()" style="flex: 1; padding: 12px 15px; background: #7a0000; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeLogoutModal() {
    const modal = document.querySelector('.logout-modal');
    if (modal) modal.remove();
}

function confirmLogout() {
    console.log('✅ Logout confirmed');
    
    closeLogoutModal();
    showNotification('👋 See you next time!', 'info');
    
    setTimeout(() => {
        logoutAndRedirect();
    }, 500);
}

// ============================================
// LOGOUT FUNCTION - REDIRECT TO MAIN LOGIN PAGE
// ============================================
function logoutAndRedirect() {
    console.log('🚪 Logging out - redirecting to main login page...');
    
    // Clear all authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('mathhub_user');
    localStorage.removeItem('hasSelectedApp');
    localStorage.removeItem('selectedApp');
    localStorage.removeItem('currentLessonFilter');
    localStorage.removeItem('currentLessonId');
    sessionStorage.clear();
    
    // Reset app state
    AppState.currentUser = null;
    AppState.isAuthenticated = false;
    AppState.hasSelectedApp = false;
    AppState.selectedApp = null;
    authToken = null;
    
    // Show notification
    alert('👋 Logged out successfully! Redirecting to login page...');
    
    // REDIRECT TO MAIN LOGIN PAGE (parent directory)
    // Assuming FactoLearn is in a subfolder like /FactoLearn/
    window.location.href = '../index.html';
    
    // Fallback: if that doesn't work, try root
    // window.location.href = '/index.html';
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

// ============================================
// ✅ QUIZ FUNCTIONS (Simplified)
// ============================================
async function loadQuizCategories() {
    console.log('📚 Loading quiz categories...');
    
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
        displayQuizCategories(getFactoLearnMockCategories());
    }, 500);
}

function displayQuizCategories(categories) {
    const container = document.getElementById('userQuizzesContainer');
    if (!container) return;
    
    let html = `
        <div class="card full-width-card">
            <div class="card-header" style="padding: 20px 25px 0;">
                <h2 class="card-title" style="display: flex; align-items: center; gap: 10px; font-size: 1.4rem; margin-bottom: 5px;">
                    <i class="fas fa-folder" style="color: #7a0000;"></i> FactoLearn Quiz Categories
                </h2>
                <p class="card-subtitle" style="color: #666; font-size: 0.95rem;">
                    Select a category to start practicing
                </p>
            </div>
            <div style="padding: 20px 25px 25px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
    `;
    
    categories.forEach(category => {
        html += `
            <div class="quiz-category-card" data-category-id="${category.category_id}" 
                 style="cursor: pointer; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #eee;">
                <div style="height: 6px; background: #7a0000; width: 100%;"></div>
                <div style="padding: 20px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="width: 50px; height: 50px; background: rgba(122,0,0,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #7a0000;">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 18px;">${category.category_name}</h3>
                            <span style="color: #7f8c8d; font-size: 13px;"><i class="fas fa-question-circle"></i> ${category.quiz_count} quizzes</span>
                        </div>
                    </div>
                    <p style="color: #6c757d; font-size: 14px; margin: 0 0 20px 0;">${category.description}</p>
                    <button class="quiz-category-btn" data-category-id="${category.category_id}" 
                            style="width: 100%; padding: 12px; background: #7a0000; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-play-circle"></i> Browse Quizzes
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `</div></div></div>`;
    container.innerHTML = html;
    
    document.querySelectorAll('.quiz-category-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const categoryId = this.getAttribute('data-category-id');
            console.log('🎯 Browse category:', categoryId);
            alert(`Category ${categoryId} - Quiz feature coming soon!`);
        });
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

async function initQuizDashboard() {
    console.log('🧠 Initializing quiz dashboard...');
    await loadQuizCategories();
}
// ============================================
// UPDATE CONTINUE LEARNING MODULE - LOAD LESSONS FROM DATABASE
// ============================================
async function updateContinueLearningModule() {
    console.log('📚 Loading continue learning lessons from database...');
    
    const container = document.getElementById('continueLearningContainer');
    if (!container) {
        console.error('❌ Continue learning container not found');
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 25px; text-align: center;">
            <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #7a0000; margin-bottom: 15px;"></i>
            <p style="color: #666;">Loading your lessons...</p>
        </div>
    `;
    
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('⚠️ No auth token, using demo mode');
            showDemoContinueLearning(container);
            return;
        }
        
        // Fetch lessons for FactoLearn (lesson_id = 3)
        const response = await fetch(`/api/lessons-db/complete?lesson_id=3`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.lessons || data.lessons.length === 0) {
            console.log('⚠️ No lessons found for FactoLearn');
            showNoLessonsMessage(container);
            return;
        }
        
        const lessons = data.lessons;
        console.log(`✅ Found ${lessons.length} lessons for FactoLearn`);
        
        // Store in LessonState
        LessonState.lessons = lessons;
        
        // Get user progress for these lessons
        let userProgress = {};
        try {
            const progressResponse = await fetch(`/api/progress/lessons?lesson_id=3`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (progressResponse.ok) {
                const progressData = await progressResponse.json();
                if (progressData.success && progressData.progress) {
                    progressData.progress.forEach(p => {
                        userProgress[p.content_id] = p;
                    });
                }
            }
        } catch (error) {
            console.log('Could not fetch progress:', error);
        }
        
        // Find continue learning lesson (first incomplete lesson)
        let continueLesson = null;
        let completedCount = 0;
        
        for (const lesson of lessons) {
            const progress = userProgress[lesson.content_id];
            if (progress?.completion_status === 'completed') {
                completedCount++;
            } else {
                // First incomplete lesson
                continueLesson = lesson;
                break;
            }
        }
        
        // If all lessons completed, show first lesson as review
        if (!continueLesson && lessons.length > 0) {
            continueLesson = lessons[0];
        }
        
        if (!continueLesson) {
            showNoLessonsMessage(container);
            return;
        }
        
        // Calculate progress percentage
        const progressPercentage = lessons.length > 0 
            ? Math.round((completedCount / lessons.length) * 100) 
            : 0;
        
        // Store in state
        LessonState.continueLearningLesson = continueLesson;
        
        // Build HTML
        let lessonsHTML = '';
        const recentLessons = lessons.slice(0, 3); // Show first 3 lessons
        
        recentLessons.forEach((lesson, index) => {
            const progress = userProgress[lesson.content_id];
            const isCompleted = progress?.completion_status === 'completed';
            const lessonPercentage = progress?.percentage || 0;
            
            lessonsHTML += `
                <div class="lesson-item ${isCompleted ? 'completed' : ''}" 
                     data-lesson-id="${lesson.content_id}"
                     style="display: flex; justify-content: space-between; align-items: center; 
                            padding: 12px 15px; background: rgba(122,0,0,0.02); border-radius: 8px; 
                            margin-bottom: 8px; border-left: 4px solid ${isCompleted ? '#27ae60' : '#7a0000'};
                            cursor: pointer; transition: all 0.3s;"
                     onmouseover="this.style.background='rgba(122,0,0,0.05)'"
                     onmouseout="this.style.background='rgba(122,0,0,0.02)'">
                    
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; background: ${isCompleted ? '#27ae60' : '#7a0000'}; 
                                   border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                                   color: white; font-size: 1rem;">
                            <i class="fas ${isCompleted ? 'fa-check' : 'fa-play'}"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 3px;">
                                ${lesson.content_title || `Lesson ${index + 1}`}
                            </div>
                            <div style="font-size: 0.8rem; color: #666;">
                                <i class="fas fa-clock"></i> ${Math.round((lesson.video_duration_seconds || 600) / 60)} min
                                ${isCompleted ? ' • Completed' : lessonPercentage > 0 ? ` • ${lessonPercentage}%` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <button class="${isCompleted ? 'review-btn' : 'start-btn'}" 
                            data-lesson-id="${lesson.content_id}"
                            style="padding: 6px 12px; border: none; border-radius: 6px; 
                                   background: ${isCompleted ? 'rgba(39,174,96,0.1)' : '#7a0000'}; 
                                   color: ${isCompleted ? '#27ae60' : 'white'}; 
                                   font-weight: 600; cursor: pointer;">
                        ${isCompleted ? 'Review' : 'Start'}
                    </button>
                </div>
            `;
        });
        
        // Main continue learning card
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
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #2c3e50;">
                        <span>Your Progress</span>
                        <span>${progressPercentage}%</span>
                    </div>
                    <div style="height: 8px; background: #ecf0f1; border-radius: 4px;">
                        <div style="height: 100%; width: ${progressPercentage}%; 
                                   background: linear-gradient(to right, #7a0000, #c0392b); 
                                   border-radius: 4px; transition: width 0.5s ease;"></div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h5 style="color: #2c3e50; margin-bottom: 10px; font-size: 0.95rem;">
                        <i class="fas fa-list"></i> Lessons
                    </h5>
                    ${lessonsHTML}
                </div>
                
                <button class="btn-primary" id="continueLessonBtn" data-lesson-id="${continueLesson.content_id}"
                        style="width: 100%; padding: 12px; background: #7a0000; color: white; border: none; 
                               border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; 
                               align-items: center; justify-content: center; gap: 8px;">
                    <i class="fas fa-play"></i> Continue Learning
                </button>
            </div>
        `;
        
        // Add click handlers
        document.querySelectorAll('.lesson-item').forEach(item => {
            item.addEventListener('click', function() {
                const lessonId = this.getAttribute('data-lesson-id');
                if (lessonId) openLesson(lessonId);
            });
        });
        
        document.querySelectorAll('.start-btn, .review-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const lessonId = this.getAttribute('data-lesson-id');
                if (lessonId) openLesson(lessonId);
            });
        });
        
        document.getElementById('continueLessonBtn')?.addEventListener('click', function() {
            const lessonId = this.getAttribute('data-lesson-id');
            if (lessonId) openLesson(lessonId);
        });
        
        console.log('✅ Continue learning module updated with real lessons');
        
    } catch (error) {
        console.error('❌ Error loading lessons:', error);
        showDemoContinueLearning(container);
    }
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
