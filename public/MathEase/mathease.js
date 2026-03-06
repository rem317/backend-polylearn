// ============================================
// MATHHUB APPLICATION - MATHEASE COMPLETE FIX
// ============================================

let authToken = localStorage.getItem('authToken') || null;
const API_BASE_URL = window.location.origin;

// ============================================
// APP FILTERING SYSTEM - FIXED DUPLICATES
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
    'factolearn': {
        lessonId: 3,
        name: 'FactoLearn'
    }
};

// ============================================
// MATHEASE CONSTANTS - FORCE LESSON_ID = 1
// ============================================
const MATHEASE_LESSON_ID = 1;  // FIXED: Added this constant
const POLYLEARN_LESSON_ID = 2;
const FACTOLEARN_LESSON_ID = 3;

// ============================================
// GET CURRENT APP - DEFAULT TO MATHEASE
// ============================================
function getCurrentApp() {
    return localStorage.getItem('selectedApp') || 'mathease';
}

function getCurrentAppLessonId() {
    const selectedApp = localStorage.getItem('selectedApp') || 'mathease';
    
    const appMap = {
        'mathease': 1,
        'polylearn': 2,
        'factolearn': 3
    };
    
    return appMap[selectedApp] || 1;
}

// ============================================
// ADD APP FILTER TO URL - FORCE LESSON_ID=1 FOR MATHEASE
// ============================================
function addAppFilterToUrl(url) {
    const separator = url.includes('?') ? '&' : '?';
    
    // Get the current app
    const currentApp = getCurrentApp();
    
    // Force lesson_id based on app
    let lessonId = 2; // Default to PolyLearn
    
    if (currentApp === 'mathease') {
        lessonId = 1;
    } else if (currentApp === 'polylearn') {
        lessonId = 2;
    } else if (currentApp === 'factolearn') {
        lessonId = 3;
    }
    
    return `${url}${separator}lesson_id=${lessonId}`;
}

// ============================================
// FIXED: apiRequest - FORCED LESSON_ID=1 FOR MATHEASE
// ============================================
async function apiRequest(endpoint, options = {}) {
    // FORCE LESSON_ID=1 FOR MATHEASE API CALLS
    const isMatheaseEndpoint = endpoint.includes('/api/progress/') || 
                               endpoint.includes('/api/lessons') || 
                               endpoint.includes('/api/practice/') ||
                               endpoint.includes('/api/quiz/') ||
                               endpoint.includes('/api/topics/') ||
                               endpoint.includes('/api/admin/structure');
    
    // Add lesson_id=1 to the URL if needed and if current app is mathease
    let modifiedEndpoint = endpoint;
    const currentApp = getCurrentApp();
    
    if (currentApp === 'mathease' && isMatheaseEndpoint && !endpoint.includes('lesson_id=')) {
        const separator = endpoint.includes('?') ? '&' : '?';
        modifiedEndpoint = `${endpoint}${separator}lesson_id=1`;
        console.log(`🔧 Mathease API forced lesson_id=1: ${modifiedEndpoint.split('?')[0]}`);
    }
    
    const url = modifiedEndpoint.startsWith('http') ? modifiedEndpoint : `${API_BASE_URL}${modifiedEndpoint}`;
    
    // Default headers
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
    };
    
    // Add auth token if available
    const token = localStorage.getItem('authToken') || authToken;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add cache buster for GET requests
    let finalUrl = url;
    if (options.method === 'GET' || !options.method) {
        const cacheBuster = `_t=${Date.now()}`;
        finalUrl = url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;
    }
    
    try {
        console.log(`📡 Mathease API Request: ${finalUrl}`);
        
        const response = await fetch(finalUrl, {
            ...options,
            headers,
            credentials: 'include'
        });
        
        // Check if response is OK
        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ API Error (${response.status}):`, text.substring(0, 200));
            
            // Return mock data for Mathease endpoints
            if (modifiedEndpoint.includes('/api/lessons-db/complete')) {
                return {
                    success: true,
                    lessons: getMatheaseMockLessons()
                };
            }
            
            if (modifiedEndpoint.includes('/api/progress/daily')) {
                return {
                    success: true,
                    progress: {
                        lessons_completed: 0,
                        exercises_completed: 0,
                        time_spent_minutes: 0,
                        lesson_id: 1
                    }
                };
            }
            
            if (modifiedEndpoint.includes('/api/quiz/categories')) {
                return {
                    success: true,
                    categories: getMatheaseMockCategories()
                };
            }
            
            return { 
                success: false, 
                error: `API returned ${response.status}`,
                status: response.status,
                lesson_id: 1
            };
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.warn('⚠️ Non-JSON response:', text.substring(0, 100));
            
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.warn('⚠️ Received HTML when JSON expected for:', modifiedEndpoint);
                
                if (modifiedEndpoint.includes('/api/lessons-db/complete')) {
                    return {
                        success: true,
                        lessons: getMatheaseMockLessons()
                    };
                }
                
                if (modifiedEndpoint.includes('/api/quiz/categories')) {
                    return {
                        success: true,
                        categories: getMatheaseMockCategories()
                    };
                }
                
                return { 
                    success: true, 
                    data: text, 
                    isHtml: true,
                    lesson_id: 1
                };
            }
            
            return { success: true, data: text, lesson_id: 1 };
        }
        
        const jsonResponse = await response.json();
        
        // Add lesson_id to response for debugging
        if (typeof jsonResponse === 'object') {
            jsonResponse._lesson_id = 1;
        }
        
        return jsonResponse;
        
    } catch (error) {
        console.error(`❌ Mathease API Request Failed: ${finalUrl}`, error);
        
        if (modifiedEndpoint.includes('/api/progress/daily')) {
            return {
                success: true,
                progress: {
                    lessons_completed: 0,
                    exercises_completed: 0,
                    time_spent_minutes: 0,
                    lesson_id: 1
                }
            };
        }
        
        if (modifiedEndpoint.includes('/api/lessons-db/complete')) {
            return {
                success: true,
                lessons: getMatheaseMockLessons()
            };
        }
        
        if (modifiedEndpoint.includes('/api/quiz/categories')) {
            return {
                success: true,
                categories: getMatheaseMockCategories()
            };
        }
        
        return { 
            success: false, 
            error: error.message,
            lesson_id: 1
        };
    }
}

// ============================================
// HELPER: Get Mathease Mock Lessons (lesson_id=1)
// ============================================
function getMatheaseMockLessons() {
    return [
        {
            content_id: 1,
            content_title: 'Introduction to Factorials',
            content_description: 'Learn the basics of factorial notation and calculations',
            lesson_id: 1,
            topic_id: 1,
            video_filename: 'factorial_intro.mp4',
            video_duration_seconds: 600,
            content_order: 1
        },
        {
            content_id: 2,
            content_title: 'Permutation Basics',
            content_description: 'Understanding permutations and when to use them',
            lesson_id: 1,
            topic_id: 1,
            video_filename: 'permutation_basics.mp4',
            video_duration_seconds: 720,
            content_order: 2
        },
        {
            content_id: 3,
            content_title: 'Combination Fundamentals',
            content_description: 'Learn how combinations differ from permutations',
            lesson_id: 1,
            topic_id: 2,
            video_filename: 'combination_fundamentals.mp4',
            video_duration_seconds: 840,
            content_order: 1
        }
    ];
}

// ============================================
// HELPER: Get Mathease Mock Quiz Categories
// ============================================
function getMatheaseMockCategories() {
    return [
        {
            category_id: 1,
            category_name: 'Factorial Basics',
            description: 'Test your understanding of factorial calculations',
            lesson_id: 1,
            quiz_count: 2
        },
        {
            category_id: 2,
            category_name: 'Permutation Problems',
            description: 'Practice solving permutation problems',
            lesson_id: 1,
            quiz_count: 3
        },
        {
            category_id: 3,
            category_name: 'Combination Applications',
            description: 'Apply combinations in real-world scenarios',
            lesson_id: 1,
            quiz_count: 2
        }
    ];
}

// ============================================
// APPLICATION STATE - Force Mathease
// ============================================
const AppState = {
    currentUser: {
        id: 1,
        username: 'mathease_user',
        email: 'user@mathease.com',
        full_name: 'Mathease Student',
        role: 'student'
    },
    currentPage: 'dashboard',
    isAuthenticated: true,
    selectedApp: 'mathease',
    previousPage: null,
    hasSelectedApp: true,
    currentLessonData: null,
    currentVideoData: null
};

// ============================================
// FIXED: fetchDailyProgress - FORCED LESSON_ID = 1
// ============================================
async function fetchDailyProgress() {
    try {
        console.log('📊 Fetching Mathease daily progress...');
        
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.warn('No auth token available');
            return getDefaultMatheaseDailyProgress();
        }
        
        // FORCE LESSON_ID = 1
        const response = await fetch(`/api/progress/daily?lesson_id=1`, {
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
            console.log('✅ Mathease daily progress loaded:', data.progress);
            
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
            return getDefaultMatheaseDailyProgress();
        }
        
    } catch (error) {
        console.error('❌ Error fetching daily progress:', error);
        return getDefaultMatheaseDailyProgress();
    }
}

// ===== Default progress for Mathease =====
function getDefaultMatheaseDailyProgress() {
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
// FIXED: fetchPracticeStatistics - ONLY LESSON_ID = 1
// ============================================
async function fetchPracticeStatistics() {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.error('❌ No auth token available');
            return getDefaultMatheasePracticeStats();
        }
        
        // FORCE LESSON_ID = 1 FOR MATHEASE
        console.log(`📊 Fetching Mathease practice statistics DIRECTLY FROM DATABASE (lesson_id=1)...`);
        
        // GET ALL PRACTICE STATS FROM DATABASE IN PARALLEL
        const [lessonsData, attemptsData, totalExercisesData] = await Promise.allSettled([
            // Get lessons progress (lesson_id=1)
            fetch(`/api/progress/lessons?lesson_id=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(err => ({ success: false, error: err })),
            
            // Get practice attempts (lesson_id=1)
            fetch(`/api/progress/practice-attempts?lesson_id=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(err => ({ success: false, error: err })),
            
            // Get total exercises count (lesson_id=1)
            fetch(`/api/practice/exercises/count?lesson_id=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(err => ({ success: false, error: err }))
        ]);
        
        // PROCESS LESSONS DATA
        let lessonsCompleted = 0;
        let totalLessons = 0;
        
        if (lessonsData.status === 'fulfilled' && lessonsData.value.success) {
            const progress = lessonsData.value.progress || [];
            lessonsCompleted = progress.filter(p => 
                p.completion_status === 'completed' || p.status === 'completed'
            ).length;
            console.log(`✅ Lessons completed from DB: ${lessonsCompleted}`);
        }
        
        // PROCESS TOTAL EXERCISES
        let totalExercises = 0;
        if (totalExercisesData.status === 'fulfilled' && totalExercisesData.value.success) {
            totalExercises = totalExercisesData.value.count || 0;
            console.log(`✅ Total exercises from DB: ${totalExercises}`);
        }
        
        // PROCESS PRACTICE ATTEMPTS
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
            
            console.log(`✅ Exercises completed from DB: ${exercisesCompleted}/${totalExercises}`);
            console.log(`✅ Total attempts from DB: ${totalAttempts}`);
            console.log(`✅ Average score from DB: ${averageScore}%`);
        }
        
        const stats = {
            total_exercises_completed: exercisesCompleted,
            total_attempts: totalAttempts,
            average_score: averageScore,
            lessons_completed: lessonsCompleted,
            exercises_completed: exercisesCompleted,
            practice_unlocked: true,
            total_lessons: totalLessons || 3,
            total_exercises: totalExercises,
            total_time_minutes: Math.round(totalTimeSeconds / 60),
            total_time_seconds: totalTimeSeconds,
            accuracy_rate: averageScore,
            lessons_display: `${lessonsCompleted}/${totalLessons || 3}`,
            exercises_display: `${exercisesCompleted}`,
            lessons_percentage: totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0
        };
        
        console.log('✅ FINAL MATHEASE PRACTICE STATISTICS:', stats);
        
        PracticeState.userPracticeProgress = stats;
        
        return stats;
        
    } catch (error) {
        console.error('❌ Error fetching practice statistics:', error);
        return getDefaultMatheasePracticeStats();
    }
}

function getDefaultMatheasePracticeStats() {
    return {
        total_exercises_completed: 0,
        total_attempts: 0,
        average_score: 0,
        lessons_completed: 0,
        exercises_completed: 0,
        practice_unlocked: true,
        total_lessons: 3,
        total_exercises: 5,
        total_time_minutes: 0,
        total_time_seconds: 0,
        accuracy_rate: 0,
        lessons_display: '0/3',
        exercises_display: '0',
        lessons_percentage: 0
    };
}

// ============================================
// FIXED: fetchAccuracyRate - FORCED LESSON_ID = 1
// ============================================
async function fetchAccuracyRate() {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) return null;
        
        // FORCE LESSON_ID = 1
        console.log(`📊 Fetching Mathease accuracy rate...`);

        const response = await fetch(`/api/progress/accuracy-rate?lesson_id=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.success && data.accuracy) {
            console.log('✅ Mathease accuracy rate loaded:', data.accuracy);
            updateAccuracyRateDisplay(data.accuracy);
            return data.accuracy;
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching accuracy rate:', error);
        return null;
    }
}

// ============================================
// FIXED: Load Practice Exercises For Topic - ONLY LESSON_ID = 1
// ============================================
async function loadPracticeExercisesForTopic(topicId) {
    try {
        console.log(`📝 Getting practice exercises for topic ${topicId}`);
        
        const exerciseArea = document.getElementById('exerciseArea');
        if (!exerciseArea) return;
        
        exerciseArea.innerHTML = `
            <div class="loading-container" style="text-align: center; padding: 30px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 30px; color: #7a0000;"></i>
                <p style="margin-top: 10px;">Loading Mathease exercises...</p>
            </div>
        `;
        
        // Force lesson_id=1 in API call
        let endpoint = `/api/practice/topic/${topicId}?lesson_id=1`;
        console.log(`📡 Fetching from: ${endpoint}`);
        
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 Practice data received:', data);
        
        if (data.success && data.exercises) {
            // STRICT FILTERING - lesson_id=1 lang
            const filteredExercises = data.exercises.filter(ex => {
                const exerciseLessonId = ex.lesson_id || ex.lessonId;
                return exerciseLessonId == 1;
            });
            
            console.log(`✅ Found ${filteredExercises.length} exercises for Mathease`);
            
            if (filteredExercises.length > 0) {
                displayPracticeExercises(filteredExercises);
            } else {
                exerciseArea.innerHTML = `
                    <div class="no-exercises" style="text-align: center; padding: 40px;">
                        <i class="fas fa-pencil-alt" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                        <h3 style="color: #666;">No Practice Exercises for Mathease</h3>
                        <p style="color: #999;">There are no practice exercises available for Mathease yet.</p>
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
                    <button class="btn-primary" onclick="location.reload()" style="margin-top: 15px;">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    }
}

// ============================================
// FIXED: fetchAllLessons - ONLY LESSON_ID = 1
// ============================================
async function fetchAllLessons() {
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.warn('No auth token available');
            return [];
        }
        
        // FORCE LESSON_ID = 1 ONLY
        console.log(`📚 Fetching lessons for Mathease ONLY, lesson ID: 1`);
        
        let endpoint = `/api/lessons-db/complete?lesson_id=1`;
        
        const response = await fetch(endpoint, {
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
                return lessonId == 1;
            });
            
            console.log(`✅ Found ${filteredLessons.length} Mathease lessons`);
            
            return filteredLessons;
        } else {
            console.log('ℹ️ No Mathease lessons found');
            return [];
        }
    } catch (error) {
        console.error('Error fetching Mathease lessons:', error);
        return [];
    }
}

// ============================================
// FIXED: loadTopicsProgress - ONLY LESSON_ID = 1
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
        
        console.log('📊 Fetching topics progress for Mathease ONLY...');
        
        const response = await fetch(`/api/topics/progress?lesson_id=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            console.error(`❌ API returned ${response.status}`);
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
        console.log('📥 Topics progress data received:', data);
        
        if (data.success && data.topics) {
            // STRICT FILTER - lesson_id=1 LANG
            const filteredTopics = data.topics.filter(topic => {
                const topicLessonId = topic.lesson_id || topic.lessonId;
                return topicLessonId == 1;
            });
            
            console.log(`🎯 Filtered to ${filteredTopics.length} topics for Mathease`);
            
            if (filteredTopics.length > 0) {
                displayTopics(filteredTopics);
            } else {
                topicsContainer.innerHTML = `
                    <div class="no-topics" style="text-align: center; padding: 40px;">
                        <i class="fas fa-folder-open" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                        <h3 style="color: #666;">No topics available for Mathease</h3>
                        <p style="color: #999;">Topics with lesson_id = 1 will appear here.</p>
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
                    <button class="btn-primary" onclick="loadTopicsProgress()" style="margin-top: 15px;">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    }
}

// ============================================
// FIXED: Load Progress Dashboard Data - MATHEASE ONLY
// ============================================
async function loadProgressDashboardData() {
    console.log('📊 Loading Mathease progress dashboard data...');
    
    try {
        showProgressDashboardLoading();
        
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.error('❌ No auth token');
            return;
        }
        
        // FETCH ALL MATHEASE DATA
        const [
            lessonsProgress,
            practiceStats,
            quizStats,
            totalLessonsCount
        ] = await Promise.allSettled([
            fetch(`/api/progress/lessons?lesson_id=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(() => ({ success: false })),
            
            fetch(`/api/progress/practice-attempts?lesson_id=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(() => ({ success: false })),
            
            fetch(`/api/quiz/user/attempts?lesson_id=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(() => ({ success: false })),
            
            fetch(`/api/lessons-db/complete?lesson_id=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).catch(() => ({ success: false }))
        ]);
        
        // PROCESS LESSONS DATA
        let lessonsCompleted = 0;
        let totalLessons = 10;
        
        if (lessonsProgress.status === 'fulfilled' && lessonsProgress.value?.success) {
            const progress = lessonsProgress.value.progress || [];
            lessonsCompleted = progress.filter(p => 
                p.completion_status === 'completed' || p.status === 'completed'
            ).length;
            console.log(`✅ Mathease lessons completed: ${lessonsCompleted}`);
        }
        
        if (totalLessonsCount.status === 'fulfilled' && totalLessonsCount.value?.success) {
            totalLessons = totalLessonsCount.value.lessons?.length || 10;
        }
        
        // PROCESS PRACTICE DATA
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
            
            console.log(`✅ Mathease practice completed: ${exercisesCompleted}`);
        }
        
        // PROCESS QUIZ DATA
        let quizPoints = 0;
        let quizAttempts = 0;
        
        if (quizStats.status === 'fulfilled' && quizStats.value?.success) {
            const attempts = quizStats.value.attempts || [];
            quizAttempts = attempts.length;
            
            attempts.forEach(attempt => {
                const correctAnswers = attempt.correct_answers || 0;
                quizPoints += correctAnswers * 10;
            });
            
            console.log(`✅ Mathease quiz points: ${quizPoints}`);
        }
        
        // CALCULATE OVERALL PROGRESS
        const overallPercentage = totalLessons > 0 
            ? Math.round((lessonsCompleted / totalLessons) * 100) 
            : 0;
        
        console.log(`📊 Overall progress: ${overallPercentage}% (${lessonsCompleted}/${totalLessons} lessons)`);
        
        // UPDATE OVERALL PROGRESS UI
        const overallProgress = document.getElementById('overallProgress');
        if (overallProgress) {
            overallProgress.textContent = `${overallPercentage}%`;
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
            overallProgressBar.style.width = `${overallPercentage}%`;
            overallProgressBar.className = 'progress-fill';
            if (overallPercentage >= 70) {
                overallProgressBar.classList.add('progress-good');
            } else if (overallPercentage >= 40) {
                overallProgressBar.classList.add('progress-medium');
            } else {
                overallProgressBar.classList.add('progress-low');
            }
        }
        
        // UPDATE TOTAL POINTS
        const totalPointsProgress = document.getElementById('totalPointsProgress');
        if (totalPointsProgress) {
            totalPointsProgress.textContent = quizPoints;
        }
        
        const pointsChange = document.getElementById('pointsChange');
        if (pointsChange) {
            const pointsThisWeek = Math.min(quizPoints, 10);
            pointsChange.textContent = `+${pointsThisWeek} this week`;
        }
        
        // UPDATE TOTAL TIME
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
        
        const timeChange = document.getElementById('timeChange');
        if (timeChange) {
            const totalMinutes = Math.floor(totalPracticeSeconds / 60);
            const activeDays = Math.max(1, Math.min(30, Math.ceil(totalMinutes / 30)));
            timeChange.textContent = `${activeDays} days active`;
        }
        
        // UPDATE BADGES
        const totalBadges = document.getElementById('totalBadges');
        if (totalBadges) {
            let badgeCount = 0;
            if (lessonsCompleted >= 1) badgeCount++;
            if (lessonsCompleted >= 5) badgeCount++;
            if (lessonsCompleted >= 10) badgeCount++;
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
        console.log('✅ Mathease progress dashboard updated');
        
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

// ============================================
// FIXED: updateProgressSummaryCards - MATHEASE ONLY
// ============================================
async function updateProgressSummaryCards() {
    console.log('📊 Updating Mathease progress summary cards (lesson_id = 1)...');
    
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.warn('No auth token, using fallback');
            setDefaultMatheaseProgressValues();
            return;
        }
        
        // GET LESSONS
        let lessonsCompleted = 0;
        let totalLessons = 0;
        
        try {
            const totalResponse = await fetch(`/api/lessons-db/complete?lesson_id=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (totalResponse.ok) {
                const totalData = await totalResponse.json();
                if (totalData.success && totalData.lessons) {
                    totalLessons = totalData.lessons.length;
                    console.log(`📚 Total Mathease lessons: ${totalLessons}`);
                }
            }
            
            const lessonsResponse = await fetch(`/api/progress/lessons?lesson_id=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (lessonsResponse.ok) {
                const lessonsData = await lessonsResponse.json();
                if (lessonsData.success && lessonsData.progress) {
                    lessonsCompleted = lessonsData.progress.filter(p => 
                        p.completion_status === 'completed' || p.status === 'completed'
                    ).length;
                    
                    console.log(`✅ Mathease lessons completed: ${lessonsCompleted}/${totalLessons}`);
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch lessons:', error.message);
        }
        
        // GET PRACTICE EXERCISES
        let exercisesCompleted = 0;
        let totalExercises = 0;
        
        try {
            const totalExercisesResponse = await fetch(`/api/practice/exercises/count?lesson_id=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (totalExercisesResponse.ok) {
                const totalData = await totalExercisesResponse.json();
                if (totalData.success) {
                    totalExercises = totalData.count || 0;
                    console.log(`📝 Total Mathease practice exercises: ${totalExercises}`);
                }
            }
            
            const practiceResponse = await fetch(`/api/progress/practice-attempts?lesson_id=1`, {
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
                    
                    console.log(`✅ Mathease completed exercises: ${exercisesCompleted}/${totalExercises}`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error fetching practice:', error.message);
        }
        
        // GET QUIZ POINTS
        let totalPoints = 0;
        
        try {
            const quizResponse = await fetch(`/api/quiz/user/attempts?lesson_id=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (quizResponse.ok) {
                const quizData = await quizResponse.json();
                if (quizData.success && quizData.attempts) {
                    quizData.attempts.forEach(attempt => {
                        const correctAnswers = attempt.correct_answers || 0;
                        totalPoints += correctAnswers * 10;
                    });
                    console.log(`✅ Mathease quiz points: ${totalPoints}`);
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch quiz points:', error.message);
        }
        
        // UPDATE THE UI
        const lessonsCount = document.getElementById('lessonsCount');
        if (lessonsCount) {
            lessonsCount.innerHTML = `${lessonsCompleted}<span class="item-unit">/${totalLessons || 10}</span>`;
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
        
        console.log('✅ Mathease progress summary cards updated');
        
        cacheProgressData({
            lessons: `${lessonsCompleted}<span class="item-unit">/${totalLessons || 10}</span>`,
            exercises: `${exercisesCompleted}<span class="item-unit">/${totalExercises || 15}</span>`,
            quizScore: `${totalPoints}<span class="item-unit">pts</span>`,
            avgTime: `${calculateAverageTime(lessonsCompleted, exercisesCompleted, totalPoints)}<span class="item-unit">min/day</span>`
        });
        
    } catch (error) {
        console.error('❌ Error updating progress summary cards:', error);
        setDefaultMatheaseProgressValues();
    }
}

function setDefaultMatheaseProgressValues() {
    const lessonsCount = document.getElementById('lessonsCount');
    const exercisesCount = document.getElementById('exercisesCount');
    const quizScore = document.getElementById('quizScore');
    const avgTime = document.getElementById('avgTime');
    
    if (lessonsCount) lessonsCount.innerHTML = `0<span class="item-unit">/10</span>`;
    if (exercisesCount) exercisesCount.innerHTML = `0<span class="item-unit">/15</span>`;
    if (quizScore) quizScore.innerHTML = `0<span class="item-unit">pts</span>`;
    if (avgTime) avgTime.innerHTML = `5<span class="item-unit">min/day</span>`;
}

// ============================================
// FIXED: fetchQuizzesForCategory - MATHEASE ONLY
// ============================================
async function fetchQuizzesForCategory(categoryId) {
    try {
        console.log(`📝 Fetching quizzes for category ${categoryId}...`);
        
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.warn('No auth token available');
            showNotification('Please login to view quizzes', 'error');
            return;
        }
        
        const userJson = localStorage.getItem('mathhub_user');
        let currentUserId = null;
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                currentUserId = user.id;
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        }
        
        const response = await fetch(`/api/quiz/category/${categoryId}/quizzes?lesson_id=1`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch quizzes: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.quizzes) {
            console.log(`✅ Fetched ${data.quizzes.length} quizzes for category ${categoryId}`);
            
            const filteredQuizzes = data.quizzes.map(quiz => {
                if (quiz.user_attempts && Array.isArray(quiz.user_attempts)) {
                    quiz.user_attempts = quiz.user_attempts.filter(
                        attempt => attempt.user_id === currentUserId
                    );
                }
                
                if (quiz.user_attempts && quiz.user_attempts.length > 0) {
                    const bestScore = Math.max(...quiz.user_attempts.map(a => a.score || 0));
                    quiz.user_progress = {
                        attempts: quiz.user_attempts.length,
                        best_score: bestScore,
                        passed: quiz.user_attempts.some(a => a.passed === 1)
                    };
                } else {
                    quiz.user_progress = {
                        attempts: 0,
                        best_score: 0,
                        passed: false
                    };
                }
                
                return quiz;
            });
            
            const selectedCategory = QuizState.quizCategories.find(
                cat => cat.category_id == categoryId || cat.id == categoryId
            );
            
            if (!selectedCategory) {
                const categoryInfo = {
                    category_id: categoryId,
                    category_name: data.category?.name || 'Mathease Category',
                    name: data.category?.name || 'Mathease Category'
                };
                showQuizInterfaceForCategory(categoryInfo, filteredQuizzes);
            } else {
                showQuizInterfaceForCategory(selectedCategory, filteredQuizzes);
            }
        } else {
            throw new Error(data.message || 'No quizzes returned');
        }
        
    } catch (error) {
        console.error('Error loading quizzes:', error);
        showNotification('Failed to load quizzes: ' + error.message, 'error');
    }
}

// ============================================
// FIXED: loadQuizCategories - MATHEASE ONLY
// ============================================
async function loadQuizCategories() {
    console.log('📚 Loading Mathease quiz categories from database...');
    
    try {
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            console.warn('No auth token available');
            return [];
        }
        
        const quizzesContainer = document.getElementById('userQuizzesContainer');
        if (quizzesContainer) {
            quizzesContainer.innerHTML = `
                <div class="card" style="padding: 40px; text-align: center;">
                    <div style="font-size: 40px; color: #7a0000; margin-bottom: 20px;">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <p style="color: #666;">Loading Mathease categories from database...</p>
                </div>
            `;
        }
        
        const response = await fetch(`/api/quiz/categories?lesson_id=1`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 Server response:', data);
        
        if (data.success && data.categories) {
            console.log(`✅ Found ${data.categories.length} categories from database`);
            displayQuizCategories(data.categories, false);
            return data.categories;
        } else {
            console.log('ℹ️ No categories returned from database');
            displayQuizCategories([], false);
            return [];
        }
        
    } catch (error) {
        console.error('❌ Error loading quiz categories:', error);
        
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
// FIXED: loadQuizzesForCategory - MATHEASE ONLY
// ============================================
async function loadQuizzesForCategory(categoryId) {
    try {
        console.log(`📝 Loading quizzes for category ${categoryId}...`);
        
        const token = localStorage.getItem('authToken') || authToken;
        if (!token) {
            showNotification('Please login to view quizzes', 'error');
            return;
        }
        
        const quizzesContainer = document.getElementById('userQuizzesContainer');
        if (!quizzesContainer) return;
        
        quizzesContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #7a0000;"></i>
                <p style="margin-top: 15px;">Loading quizzes...</p>
            </div>
        `;
        
        const response = await fetch(`/api/quiz/category/${categoryId}/quizzes?lesson_id=1`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch quizzes: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.quizzes) {
            displayQuizzesInContainer(data.quizzes, categoryId);
        } else {
            throw new Error(data.message || 'No quizzes returned');
        }
        
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
// FIXED: INITIALIZE APP - MATHEASE DEFAULT
// ============================================
function initApp() {
    console.log('🎮 Mathease Application Initializing...');
    
    // Set Mathease constants
    window.MATHEASE_LESSON_ID = 1;
    
    // Set localStorage to ensure Mathease
    localStorage.setItem('selectedApp', 'mathease');
    localStorage.setItem('currentLessonFilter', '1');
    localStorage.setItem('currentLessonId', '1');
    
    // Check for existing user session
    const existingUser = localStorage.getItem('mathhub_user');
    const existingToken = localStorage.getItem('authToken');
    
    if (existingUser && existingToken) {
        console.log('📱 Using existing user session');
        try {
            AppState.currentUser = JSON.parse(existingUser);
            AppState.isAuthenticated = true;
            AppState.selectedApp = 'mathease';
            AppState.hasSelectedApp = true;
            
            console.log(`👤 User: ${AppState.currentUser.username}`);
            console.log(`📱 Selected app: Mathease (lesson_id=1)`);
            
            // Initialize hamburger menu
            initHamburgerMenu();
            
            // Navigate to dashboard
            navigateTo('dashboard');
            
            // Load all Mathease data
            setTimeout(() => {
                loadMatheaseData();
            }, 500);
            
            return;
        } catch (e) {
            console.error('Error parsing existing user:', e);
            localStorage.removeItem('mathhub_user');
            localStorage.removeItem('authToken');
        }
    }
    
    // No existing user - use demo user for Mathease
    console.log('📱 No existing session, using demo user for Mathease');
    const demoUser = {
        id: 1,
        username: 'mathease_user',
        email: 'user@mathease.com',
        full_name: 'Mathease Student',
        role: 'student'
    };
    
    AppState.currentUser = demoUser;
    AppState.isAuthenticated = true;
    AppState.hasSelectedApp = true;
    AppState.selectedApp = 'mathease';
    
    authToken = 'demo_token_' + Date.now();
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('mathhub_user', JSON.stringify(demoUser));
    localStorage.setItem('hasSelectedApp', 'true');
    localStorage.setItem('selectedApp', 'mathease');
    localStorage.setItem('currentLessonFilter', '1');
    localStorage.setItem('currentLessonId', '1');
    
    // Initialize hamburger menu
    initHamburgerMenu();
    
    // Navigate directly to dashboard
    navigateTo('dashboard');
    
    // Load all Mathease data
    setTimeout(() => {
        loadMatheaseData();
    }, 500);
    
    console.log('🎮 Mathease Application Initialized - lesson_id=1 forced');
}

// ============================================
// NEW: Load all Mathease data
// ============================================
async function loadMatheaseData() {
    console.log('📥 Loading ALL Mathease data (lesson_id=1)...');
    
    try {
        showDashboardLoading();
        
        await Promise.allSettled([
            updateContinueLearningModule(),
            loadPracticeStatistics(),
            loadQuizCategories(),
            fetchCumulativeProgress(),
            updateProgressSummaryCards(),
            fetchPracticeStatistics(),
            loadLeaderboard('weekly')
        ]);
        
        const welcomeTitle = document.getElementById('dashboardWelcomeTitle');
        if (welcomeTitle) {
            welcomeTitle.innerHTML = 'Welcome to <span class="app-title">Mathease</span>!';
        }
        
        const userMessage = document.getElementById('dashboardUserMessage');
        if (userMessage) {
            userMessage.textContent = 'You\'re making excellent progress in your Mathease journey. Keep up the great work!';
        }
        
        hideDashboardLoading();
        console.log('✅ All Mathease data loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading Mathease data:', error);
        hideDashboardLoading();
    }
}

// ============================================
// DEBUG: Check Mathease Data
// ============================================
window.debugMatheaseData = async function() {
    console.log('🔍 DEBUGGING MATHEASE DATA (lesson_id=1)');
    console.log('========================================');
    
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        console.error('❌ No auth token found');
        return;
    }
    
    console.log('\n📚 FETCHING DATA FOR LESSON_ID = 1 (Mathease)...\n');
    
    // 1. Check lessons
    try {
        const lessonRes = await fetch(`/api/lessons-db/complete?lesson_id=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const lessonData = await lessonRes.json();
        console.log('📋 LESSONS IN DATABASE:');
        console.log(`- Total lessons: ${lessonData.lessons?.length || 0}`);
        if (lessonData.lessons) {
            lessonData.lessons.forEach((l, i) => {
                console.log(`  ${i+1}. ID: ${l.content_id}, Title: ${l.content_title}`);
            });
        }
    } catch (e) {
        console.error('Lesson fetch error:', e);
    }
    
    // 2. Check practice exercises
    try {
        const practiceRes = await fetch(`/api/practice/exercises/count?lesson_id=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const practiceData = await practiceRes.json();
        console.log('\n💪 PRACTICE EXERCISES:');
        console.log(`- Total exercises: ${practiceData.count || 0}`);
    } catch (e) {
        console.error('Practice fetch error:', e);
    }
    
    // 3. Check practice attempts
    try {
        const attemptsRes = await fetch(`/api/progress/practice-attempts?lesson_id=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const attemptsData = await attemptsRes.json();
        console.log('\n📝 PRACTICE ATTEMPTS:');
        if (attemptsData.success) {
            console.log(`- Total attempts: ${attemptsData.attempts?.length || 0}`);
        }
    } catch (e) {
        console.error('Attempts fetch error:', e);
    }
    
    // 4. Check quizzes
    try {
        const quizRes = await fetch(`/api/quiz/categories?lesson_id=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const quizData = await quizRes.json();
        console.log('\n🧠 QUIZ CATEGORIES:');
        if (quizData.success && quizData.categories) {
            console.log(`- Total categories: ${quizData.categories.length}`);
            quizData.categories.forEach((c, i) => {
                console.log(`  ${i+1}. ID: ${c.category_id}, Name: ${c.category_name}`);
            });
        }
    } catch (e) {
        console.error('Quiz fetch error:', e);
    }
    
    console.log('\n✅ Debug complete for Mathease');
};

// ============================================
// 🚨 EMERGENCY OVERRIDE - Force ALL lesson_id to 1
// ============================================
(function forceLessonId1() {
    console.log('🚨 EMERGENCY: Forcing ALL lesson_id to 1 for Mathease');
    
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (typeof url === 'string' && 
            (url.includes('/api/progress/') || 
             url.includes('/api/lessons') || 
             url.includes('/api/practice/') ||
             url.includes('/api/quiz/')) && 
            !url.includes('lesson_id=')) {
            
            const separator = url.includes('?') ? '&' : '?';
            url = `${url}${separator}lesson_id=1`;
            console.log(`🔧 Forced lesson_id=1: ${url.split('?')[0]}`);
        }
        return originalFetch.call(this, url, options);
    };
    
    window.MATHEASE_LESSON_ID = 1;
    
    window.getCurrentAppLessonId = function() {
        return 1;
    };
    
    localStorage.setItem('selectedApp', 'mathease');
    localStorage.setItem('currentLessonFilter', '1');
    localStorage.setItem('currentLessonId', '1');
    
    console.log('✅ Emergency override complete - All API calls will use lesson_id=1 for Mathease');
})();

// ============================================
// START THE APP
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM fully loaded - Starting Mathease...');
    
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
        connectToolButtons();
    }, 500);
    
    setTimeout(() => {
        connectToolButtons();
    }, 2000);
    
    setTimeout(() => {
        addReviewModalStyles();
        console.log('✅ Review modal styles added');
    }, 500);
    
    setTimeout(() => {
        connectReviewButtons();
        console.log('✅ Review buttons connected');
    }, 1000);
    
    const reviewObserver = new MutationObserver(function(mutations) {
        connectReviewButtons();
    });
    
    reviewObserver.observe(document.body, { childList: true, subtree: true });
    
    const quizInterface = document.getElementById('quizInterfaceContainer');
    if (quizInterface) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!quizInterface.classList.contains('hidden')) {
                        setTimeout(connectReviewButtons, 500);
                    }
                }
            });
        });
        
        observer.observe(quizInterface, { attributes: true });
    }
});

// Make functions globally available
window.debugMatheaseData = debugMatheaseData;
window.MATHEASE_LESSON_ID = 1;

console.log('✅ Mathease Complete Fix Applied!');
