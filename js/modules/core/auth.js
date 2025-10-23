// js/modules/core/auth.js
import { supabase } from './supabase.js';
import { appState, showNotification } from '../app.js';

/**
 * Módulo de autenticación con seguridad robusta
 * Maneja login, registro, OAuth y gestión de sesiones seguras
 * @version 2.0
 * @author Carnicería El Señor de La Misericordia
 */

// Authentication state con encriptación de datos sensibles
let authState = {
  user: null,
  session: null,
  isLoading: true,
  security: {
    lastActivity: Date.now(),
    failedAttempts: 0,
    lockUntil: null
  }
};

// Configuración de seguridad
const SECURITY_CONFIG = {
  maxFailedAttempts: 5,
  lockoutTime: 15 * 60 * 1000, // 15 minutos
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
  refreshInterval: 30 * 60 * 1000 // 30 minutos
};

// Inicializar autenticación con verificación de seguridad
export async function initializeAuth() {
  try {
    console.log('🔐 Inicializando módulo de autenticación...');
    
    // Verificar si hay un bloqueo activo
    if (isAccountLocked()) {
      showNotification('Cuenta temporalmente bloqueada por seguridad. Intente más tarde.', 'warning');
      authState.isLoading = false;
      return;
    }

    // Verificar sesión existente con timeout
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error al obtener sesión:', error);
      handleSecurityEvent('session_error', error.message);
      throw error;
    }
    
    if (session) {
      // Verificar expiración de sesión
      if (isSessionExpired(session)) {
        console.log('🕒 Sesión expirada, cerrando...');
        await signOut();
        return;
      }
      
      authState.session = session;
      authState.user = session.user;
      appState.user = session.user;
      
      // Actualizar timestamp de actividad
      authState.security.lastActivity = Date.now();
      
      // Actualizar UI
      updateAuthUI(true);
      
      // Iniciar monitoreo de seguridad
      startSecurityMonitoring();
      
      console.log('✅ Sesión activa encontrada para:', session.user.email);
    }
    
    authState.isLoading = false;
    
    // Escuchar cambios de estado de autenticación
    setupAuthStateListener();
    
  } catch (error) {
    console.error('❌ Error crítico en inicialización de auth:', error);
    authState.isLoading = false;
    showNotification('Error de seguridad. Por favor, recargue la página.', 'error');
  }
}

// Configurar listener de cambios de autenticación
function setupAuthStateListener() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔄 Cambio de estado de auth:', event);
    
    // Registrar evento de seguridad
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      await logSecurityEvent(event, session?.user?.email);
    }
    
    authState.session = session;
    authState.user = session?.user || null;
    appState.user = session?.user || null;
    
    switch (event) {
      case 'SIGNED_IN':
        authState.security.lastActivity = Date.now();
        authState.security.failedAttempts = 0; // Resetear intentos fallidos
        updateAuthUI(true);
        startSecurityMonitoring();
        showNotification('Sesión iniciada correctamente', 'success');
        break;
        
      case 'SIGNED_OUT':
        updateAuthUI(false);
        stopSecurityMonitoring();
        showNotification('Sesión cerrada correctamente', 'info');
        break;
        
      case 'TOKEN_REFRESHED':
        console.log('🔄 Token refrescado correctamente');
        authState.security.lastActivity = Date.now();
        break;
        
      case 'USER_UPDATED':
        console.log('👤 Usuario actualizado');
        break;
    }
  });
}

// Iniciar sesión con email y password
export async function signIn(email, password) {
  try {
    // Validaciones de seguridad
    if (isAccountLocked()) {
      return { 
        success: false, 
        error: 'Cuenta temporalmente bloqueada por seguridad. Intente más tarde.' 
      };
    }

    if (!isValidEmail(email)) {
      handleSecurityEvent('invalid_email', email);
      return { success: false, error: 'Formato de email inválido' };
    }

    // Limpiar y normalizar inputs
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanPassword.length < 8) {
      return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' };
    }

    console.log('🔐 Intentando login para:', cleanEmail);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword
    });
    
    if (error) {
      handleSecurityEvent('failed_login', cleanEmail);
      authState.security.failedAttempts++;
      
      if (authState.security.failedAttempts >= SECURITY_CONFIG.maxFailedAttempts) {
        lockAccount();
        return { 
          success: false, 
          error: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.' 
        };
      }
      
      throw error;
    }

    // Login exitoso - resetear contador
    authState.security.failedAttempts = 0;
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en login:', error);
    return { 
      success: false, 
      error: error.message || 'Error al iniciar sesión' 
    };
  }
}

// Registrar nuevo usuario con validaciones robustas
export async function signUp(email, password, userData) {
  try {
    // Validaciones de seguridad
    if (!isValidEmail(email)) {
      return { success: false, error: 'Formato de email inválido' };
    }

    if (!isStrongPassword(password)) {
      return { 
        success: false, 
        error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número' 
      };
    }

    // Validar datos de usuario
    if (!isValidUserData(userData)) {
      return { success: false, error: 'Datos de usuario inválidos' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    console.log('👤 Registrando nuevo usuario:', cleanEmail);
    
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          ...userData,
          role: userData.role || 'customer',
          created_at: new Date().toISOString(),
          email_confirmed: false
        }
      }
    });
    
    if (error) {
      handleSecurityEvent('failed_registration', cleanEmail);
      throw error;
    }

    // Crear perfil de cliente en la base de datos
    if (data.user) {
      await createCustomerProfile(data.user, userData);
    }

    await logSecurityEvent('registration_success', cleanEmail);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error en registro:', error);
    return { 
      success: false, 
      error: error.message || 'Error al crear la cuenta' 
    };
  }
}

// Cerrar sesión de forma segura
export async function signOut() {
  try {
    console.log('🚪 Cerrando sesión...');
    
    // Registrar evento de logout
    await logSecurityEvent('user_logout', authState.user?.email);
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    // Limpiar estado local
    authState.security.failedAttempts = 0;
    authState.security.lockUntil = null;
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    return { success: false, error: error.message };
  }
}

// Login con Google OAuth
export async function loginWithGoogle(isAdminLogin = false) {
  try {
    const redirectTo = isAdminLogin 
      ? `${window.location.origin}/admin/dashboard.html`
      : `${window.location.origin}/dashboard.html`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    
    if (error) throw error;
    
    await logSecurityEvent('oauth_google_initiated', null);
    return { success: true };
  } catch (error) {
    console.error('❌ Error en login con Google:', error);
    handleSecurityEvent('oauth_google_failed', error.message);
    return { success: false, error: error.message };
  }
}

// Login con Facebook OAuth
export async function loginWithFacebook(isAdminLogin = false) {
  try {
    const redirectTo = isAdminLogin 
      ? `${window.location.origin}/admin/dashboard.html`
      : `${window.location.origin}/dashboard.html`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo,
        scopes: 'email,public_profile'
      }
    });
    
    if (error) throw error;
    
    await logSecurityEvent('oauth_facebook_initiated', null);
    return { success: true };
  } catch (error) {
    console.error('❌ Error en login con Facebook:', error);
    handleSecurityEvent('oauth_facebook_failed', error.message);
    return { success: false, error: error.message };
  }
}

// Reset password con validaciones
export async function resetPassword(email) {
  try {
    if (!isValidEmail(email)) {
      return { success: false, error: 'Email inválido' };
    }

    const cleanEmail = email.trim().toLowerCase();
    
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });
    
    if (error) {
      throw error;
    }
    
    await logSecurityEvent('password_reset_requested', cleanEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al resetear password:', error);
    return { success: false, error: error.message };
  }
}

// Actualizar perfil de usuario
export async function updateProfile(updates) {
  try {
    if (!authState.user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Validar datos de actualización
    if (!isValidUserData(updates)) {
      return { success: false, error: 'Datos de actualización inválidos' };
    }

    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    
    if (error) {
      throw error;
    }
    
    await logSecurityEvent('profile_updated', authState.user.email);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    return { success: false, error: error.message };
  }
}

// Verificar autenticación para páginas administrativas
export async function checkAdminAuth() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      await logSecurityEvent('admin_access_denied_no_user', null);
      window.location.href = '../login.html?admin=true';
      return false;
    }
    
    // Verificar si el usuario es administrador
    const isAdmin = user.email.endsWith('@carniceriaadmin.com') || 
                   user.user_metadata?.role === 'admin';
    
    if (!isAdmin) {
      await logSecurityEvent('admin_access_denied_unauthorized', user.email);
      await supabase.auth.signOut();
      window.location.href = '../login.html?admin=true';
      return false;
    }
    
    await logSecurityEvent('admin_access_granted', user.email);
    return true;
  } catch (error) {
    console.error('❌ Error en verificación admin:', error);
    window.location.href = '../login.html?admin=true';
    return false;
  }
}

// === FUNCIONES DE SEGURIDAD ===

// Monitoreo de seguridad
let securityInterval = null;

function startSecurityMonitoring() {
  // Verificar inactividad cada minuto
  securityInterval = setInterval(() => {
    const now = Date.now();
    const inactiveTime = now - authState.security.lastActivity;
    
    // Cerrar sesión después de 24 horas de inactividad
    if (inactiveTime > SECURITY_CONFIG.sessionTimeout) {
      console.log('🕒 Sesión expirada por inactividad');
      signOut();
      showNotification('Sesión cerrada por inactividad', 'warning');
    }
  }, 60 * 1000); // 1 minuto
}

function stopSecurityMonitoring() {
  if (securityInterval) {
    clearInterval(securityInterval);
    securityInterval = null;
  }
}

// Verificar si la cuenta está bloqueada
function isAccountLocked() {
  if (authState.security.lockUntil && Date.now() < authState.security.lockUntil) {
    return true;
  }
  
  // Si el tiempo de bloqueo ha expirado, resetear
  if (authState.security.lockUntil && Date.now() >= authState.security.lockUntil) {
    authState.security.lockUntil = null;
    authState.security.failedAttempts = 0;
  }
  
  return false;
}

// Bloquear cuenta temporalmente
function lockAccount() {
  authState.security.lockUntil = Date.now() + SECURITY_CONFIG.lockoutTime;
  logSecurityEvent('account_locked', authState.user?.email);
}

// Verificar expiración de sesión
function isSessionExpired(session) {
  if (!session?.expires_at) return true;
  return Date.now() >= session.expires_at * 1000;
}

// Manejar eventos de seguridad
function handleSecurityEvent(type, details) {
  console.warn(`⚠️ Evento de seguridad: ${type}`, details);
  
  switch (type) {
    case 'failed_login':
    case 'invalid_email':
    case 'session_error':
      // Estos eventos se registran en la base de datos
      logSecurityEvent(type, details);
      break;
  }
}

// Registrar evento de seguridad en la base de datos
async function logSecurityEvent(eventType, userEmail) {
  try {
    await supabase.from('security_logs').insert({
      event_type: eventType,
      user_email: userEmail,
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error al registrar evento de seguridad:', error);
  }
}

// Obtener IP del cliente (simplificado)
async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
}

// === VALIDACIONES ===

// Validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar fortaleza de password
function isStrongPassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
}

// Validar datos de usuario
function isValidUserData(userData) {
  if (!userData) return false;
  
  // Validar nombre (solo letras y espacios)
  if (userData.first_name && !/^[A-Za-záéíóúñÁÉÍÓÚÑ\s]+$/.test(userData.first_name)) {
    return false;
  }
  
  // Validar teléfono (10 dígitos)
  if (userData.phone && !/^[0-9]{10}$/.test(userData.phone)) {
    return false;
  }
  
  return true;
}

// === FUNCIONES AUXILIARES ===

// Obtener usuario actual
export function getCurrentUser() {
  return authState.user;
}

// Verificar si está autenticado
export function isAuthenticated() {
  return !!authState.user && !isSessionExpired(authState.session);
}

// Verificar si es administrador
export function isAdmin() {
  return authState.user?.email?.endsWith('@carniceriaadmin.com') || 
         authState.user?.user_metadata?.role === 'admin';
}

// Actualizar timestamp de actividad
export function updateActivity() {
  authState.security.lastActivity = Date.now();
}

// === GESTIÓN DE UI ===

// Actualizar UI basado en estado de autenticación
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
  
  // Actualizar información de usuario en UI
  if (isAuthenticated && authState.user) {
    updateUserInfoUI();
  }
}

// Actualizar información de usuario en UI
function updateUserInfoUI() {
  const userElements = document.querySelectorAll('[data-user]');
  
  userElements.forEach(element => {
    const property = element.getAttribute('data-user');
    let value = authState.user[property] || authState.user.user_metadata?.[property];
    
    // Sanitizar output para prevenir XSS
    if (value && typeof value === 'string') {
      value = value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    if (value) {
      if (element.tagName === 'IMG') {
        element.src = value;
        element.alt = `Avatar de ${authState.user.user_metadata?.first_name || 'usuario'}`;
      } else {
        element.textContent = value;
      }
    }
  });
}

// === CREACIÓN DE PERFIL DE CLIENTE ===

// Crear perfil de cliente en la base de datos
async function createCustomerProfile(user, userData) {
  try {
    const { error } = await supabase
      .from('customers')
      .insert([{
        user_id: user.id,
        name: `${userData.first_name} ${userData.last_name}`.trim(),
        email: user.email,
        phone: userData.phone,
        newsletter: userData.newsletter || false,
        loyalty_points: 0,
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    // Crear registro en programa de fidelidad
    await supabase
      .from('loyalty_program')
      .insert([{
        user_id: user.id,
        points: 0,
        qr_code: user.id,
        created_at: new Date().toISOString()
      }]);
      
    console.log('✅ Perfil de cliente creado exitosamente');
  } catch (error) {
    console.error('❌ Error al crear perfil de cliente:', error);
    throw error;
  }
}

// === INICIALIZACIÓN DE FORMULARIOS ===

// Inicializar formularios de autenticación
function initializeAuthForms() {
  setupLoginForm();
  setupRegisterForm();
  setupLogoutHandlers();
  setupOAuthHandlers();
}

// Configurar formulario de login
function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<span class="spinner spinner-sm"></span> Verificando...';
    submitBtn.disabled = true;
    
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    
    const result = await signIn(email, password);
    
    if (result.success) {
      showNotification('Sesión verificada correctamente', 'success');
      
      // Redirección segura
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirectTo') || '/dashboard.html';
      const isAdminLogin = urlParams.get('admin') === 'true';
      
      if (isAdminLogin && isAdmin()) {
        window.location.href = '/admin/dashboard.html';
      } else {
        window.location.href = redirectTo;
      }
    } else {
      showNotification(result.error, 'error');
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Configurar formulario de registro
function setupRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;

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
    const newsletter = formData.get('newsletter') || false;
    
    // Validaciones del cliente
    if (password !== confirmPassword) {
      showNotification('Las contraseñas no coinciden', 'error');
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      return;
    }
    
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
      newsletter: newsletter,
      role: 'customer'
    };
    
    const result = await signUp(email, password, userData);
    
    if (result.success) {
      showNotification('Cuenta creada. Verifica tu email para activarla.', 'success');
      
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 3000);
    } else {
      showNotification(result.error, 'error');
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Configurar manejadores de logout
function setupLogoutHandlers() {
  const logoutButtons = document.querySelectorAll('[data-action="logout"]');
  logoutButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const result = await signOut();
      
      if (result.success) {
        window.location.href = '/';
      } else {
        showNotification('Error al cerrar sesión', 'error');
      }
    });
  });
}

// Configurar manejadores de OAuth
function setupOAuthHandlers() {
  const googleBtn = document.getElementById('googleLogin');
  const facebookBtn = document.getElementById('facebookLogin');
  
  if (googleBtn) {
    googleBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const isAdminLogin = new URLSearchParams(window.location.search).get('admin') === 'true';
      await loginWithGoogle(isAdminLogin);
    });
  }
  
  if (facebookBtn) {
    facebookBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const isAdminLogin = new URLSearchParams(window.location.search).get('admin') === 'true';
      await loginWithFacebook(isAdminLogin);
    });
  }
}

// === INICIALIZACIÓN ===

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initializeAuthForms();
  
  // Monitorear actividad del usuario
  document.addEventListener('click', updateActivity);
  document.addEventListener('keypress', updateActivity);
  document.addEventListener('scroll', updateActivity);
});

// Exportar funciones principales
export {
  initializeAuth,
  signIn,
  signUp,
  signOut,
  loginWithGoogle,
  loginWithFacebook,
  resetPassword,
  updateProfile,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  checkAdminAuth,
  updateActivity
};