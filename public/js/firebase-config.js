// ========================================================
// FIREBASE CONFIGURATION & INITIALIZATION
// Project: jg-fiestaaa
// ========================================================

const firebaseConfig = {
  apiKey: "AIzaSyCEHDnf9AqA-EFjSgfKQPAtZjVM5-bqq0M",
  authDomain: "jg-fiestaaa.firebaseapp.com",
  databaseURL: "https://jg-fiestaaa-default-rtdb.firebaseio.com",
  projectId: "jg-fiestaaa",
  storageBucket: "jg-fiestaaa.firebasestorage.app",
  messagingSenderId: "135785837910",
  appId: "1:135785837910:web:a69c316fb3d46777afd2f7",
  measurementId: "G-TD66G4MP3N"
};

let firebaseApp = null;
let firebaseAnalytics = null;
let firebaseDb = null;

try {
  if (typeof firebase !== 'undefined') {
    // Initialize Firebase App
    firebaseApp = firebase.initializeApp(firebaseConfig);
    console.log(`🔥 [Firebase] App initialized successfully: ${firebaseConfig.projectId}`);

    // Initialize Realtime Database
    if (typeof firebase.database === 'function') {
      try {
        firebaseDb = firebase.database();
        console.log(`⚡ [Firebase] Realtime Database active & connected!`);
      } catch (dbErr) {
        console.warn('⚠️ [Firebase] Realtime Database init warning:', dbErr.message);
      }
    }

    // Initialize Analytics if supported
    if (typeof firebase.analytics === 'function') {
      try {
        firebaseAnalytics = firebase.analytics();
        console.log(`📊 [Firebase] Analytics active (Measurement ID: ${firebaseConfig.measurementId})`);
      } catch (analyticsErr) {
        console.warn('⚠️ [Firebase] Analytics could not be initialized:', analyticsErr.message);
      }
    }
  } else {
    console.warn('⚠️ [Firebase] SDK not loaded on window.');
  }
} catch (err) {
  console.error('❌ [Firebase] Initialization error:', err);
}

// Global Firebase Event Logger Helper
window.logFirebaseEvent = function(eventName, eventParams = {}) {
  try {
    if (firebaseAnalytics) {
      firebaseAnalytics.logEvent(eventName, eventParams);
      console.log(`📡 [Firebase Analytics] Event "${eventName}":`, eventParams);
    }
  } catch (e) {
    console.debug(`[Firebase Analytics Notice] Event "${eventName}" skipped:`, e.message);
  }
};

// Expose globals for app access
window.firebaseConfig = firebaseConfig;
window.firebaseApp = firebaseApp;
window.firebaseAnalytics = firebaseAnalytics;
window.firebaseDb = firebaseDb;
