import { supabase } from './supabase.js';
import { appState, showNotification } from './app.js';

// Authentication state
let authState = {
  user: null,
  session: null,
  isLoading: true
};

// Initialize authentication
export async function initializeAuth() {
  try {
    console.log('Initializing authentication...');
    
    // Check for existing session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    if (session) {
      authState.session = session;
      authState.user = session.user;
      appState.user = session.user;
      
      // Update UI for authenticated user
      updateAuthUI(true);
      
      // Start auto refresh
      startSessionRefresh();
    }
    
    authState.isLoading = false;
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      authState.session = session;
      authState.user = session?.user || null;
      appState.user = session?.user || null;
      
      if (event === 'SIGNED_IN') {
        updateAuthUI(true);
        startSessionRefresh();
        showNotification('Sesión iniciada correctamente', 'success');
      } else if (event === 'SIGNED_OUT') {
        updateAuthUI(false);
        stopSessionRefresh();
        showNotification('Sesión cerrada', 'info');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
    });
    
  } catch (error) {
    console.error('Error initializing authentication:', error);
    authState.isLoading = false;
  }
}

// Sign in with email and password
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim()
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: error.message };
  }
}

// Sign up with email and password
export async function signUp(email, password, userData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      options: {
        data: userData
      }
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: error.message };
  }
}

// Sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
}

// Reset password
export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: error.message };
  }
}

// Update user profile
export async function updateProfile(updates) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
}

// Get current user
export function getCurrentUser() {
  return authState.user;
}

// Check if user is authenticated
export function isAuthenticated() {
  return !!authState.user;
}

// Check if user is admin
export function isAdmin() {
  return authState.user?.user_metadata?.role === 'admin';
}

// Update UI based on auth state
function updateAuthUI(isAuthenticated) {
  const authElements = document.querySelectorAll('[data-auth]');
  
  authElements.forEach(element => {
    const authState = element.getAttribute('data-auth');
    
    if (authState === 'authenticated') {
      element.style.display = isAuthenticated ? '' : 'none';
    } else if (authState === 'unauthenticated') {
      element.style.display = isAuthenticated ? 'none' : '';
    }
  });
  
  // Update user info in UI
  if (isAuthenticated && authState.user) {
    const userElements = document.querySelectorAll('[data-user]');
    
    userElements.forEach(element => {
      const property = element.getAttribute('data-user');
      const value = authState.user[property] || authState.user.user_metadata?.[property];
      
      if (value) {
        if (element.tagName === 'IMG') {
          element.src = value;
        } else {
          element.textContent = value;
        }
      }
    });
  }
}

// Session refresh management
let refreshInterval = null;

function startSessionRefresh() {
  // Refresh token every 30 minutes
  refreshInterval = setInterval(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      console.log('Session refreshed successfully');
    } catch (error) {
      console.error('Session refresh error:', error);
      stopSessionRefresh();
    }
  }, 30 * 60 * 1000); // 30 minutes
}

function stopSessionRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// Initialize auth forms
function initializeAuthForms() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      submitBtn.innerHTML = '<span class="spinner spinner-sm"></span> Iniciando sesión...';
      submitBtn.disabled = true;
      
      const formData = new FormData(loginForm);
      const email = formData.get('email');
      const password = formData.get('password');
      const remember = formData.get('remember');
      
      const result = await signIn(email, password);
      
      if (result.success) {
        showNotification('Sesión iniciada correctamente', 'success');
        
        // Redirect to dashboard or intended page
        const redirectTo = new URLSearchParams(window.location.search).get('redirectTo') || '/dashboard';
        window.location.href = redirectTo;
      } else {
        showNotification(result.error, 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
  
  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      submitBtn.innerHTML = '<span class="spinner spinner-sm"></span> Creando cuenta...';
      submitBtn.disabled = true;
      
      const formData = new FormData(registerForm);
      const email = formData.get('email');
      const password = formData.get('password');
      const confirmPassword = formData.get('confirmPassword');
      const firstName = formData.get('firstName');
      const lastName = formData.get('lastName');
      const phone = formData.get('phone');
      const acceptTerms = formData.get('acceptTerms');
      
      // Validate passwords match
      if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
      }
      
      // Validate terms acceptance
      if (!acceptTerms) {
        showNotification('Debes aceptar los términos y condiciones', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
      }
      
      const userData = {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role: 'customer'
      };
      
      const result = await signUp(email, password, userData);
      
      if (result.success) {
        showNotification('Cuenta creada correctamente. Revisa tu email para confirmar.', 'success');
        
        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        showNotification(result.error, 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
  
  // Logout buttons
  const logoutButtons = document.querySelectorAll('[data-action="logout"]');
  logoutButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const result = await signOut();
      
      if (result.success) {
        window.location.href = '/';
      } else {
        showNotification(result.error, 'error');
      }
    });
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAuthForms);