import { supabase } from '../supabase.js';

// Estado de la aplicación
export const appState = {
  user: null,
  cart: [],
  isAuthenticated: false
};

let authSubscription;

// Elementos del DOM
let loginForm;
let registerForm;
let googleLoginBtn;
let facebookLoginBtn;

function syncAppState(user) {
  appState.user = user;
  appState.isAuthenticated = Boolean(user);
}

async function hydrateAuthState() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error loading auth session:', error);
    return;
  }

  syncAppState(session?.user ?? null);
}

async function getProfileRole(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data?.role || 'customer';
}

/**
 * ========================================
 * FUNCIÓN PRINCIPAL: setupAuthToggle()
 * ========================================
 * 
 * Implementa el efecto de deslizamiento mejorado basado en Codehal + Grok.
 * Cuando el usuario hace clic en "Crear cuenta", se agrega la clase 'sign-up-mode'
 * al contenedor principal, activando animaciones CSS suaves y fluidas.
 * 
 * Mejoras implementadas:
 * - ✅ Validación robusta de elementos DOM
 * - ✅ Logs de debugging para troubleshooting
 * - ✅ Prevención de eventos duplicados (cloneNode)
 * - ✅ DOMContentLoaded para asegurar elementos cargados
 */
function setupAuthToggle() {
  const container = document.getElementById('authContainer');
  const btnShowRegister = document.getElementById('btnShowRegister');
  const btnShowLogin = document.getElementById('btnShowLogin');

  // Validación exhaustiva
  if (!container) {
    console.error('❌ authContainer no encontrado en el DOM');
    console.warn('💡 Verifica que el HTML tenga: <div id="authContainer">');
    return;
  }

  if (!btnShowRegister) {
    console.error('❌ btnShowRegister no encontrado en el DOM');
    console.warn('💡 Verifica que el HTML tenga: <button id="btnShowRegister">');
    return;
  }

  if (!btnShowLogin) {
    console.error('❌ btnShowLogin no encontrado en el DOM');
    console.warn('💡 Verifica que el HTML tenga: <button id="btnShowLogin">');
    return;
  }

  console.log('✅ Elementos encontrados, configurando eventos de deslizamiento...');

  // Remover listeners previos para evitar duplicados (técnica cloneNode)
  const newBtnRegister = btnShowRegister.cloneNode(true);
  btnShowRegister.parentNode.replaceChild(newBtnRegister, btnShowRegister);
  
  const newBtnLogin = btnShowLogin.cloneNode(true);
  btnShowLogin.parentNode.replaceChild(newBtnLogin, btnShowLogin);

  /**
   * EVENTO: Click en "Crear cuenta"
   * Activa el modo registro con animación suave
   */
  newBtnRegister.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔄 Activando modo registro...');
    container.classList.add('sign-up-mode');
    console.log('✅ Clase sign-up-mode agregada - Animación iniciada');
  });

  /**
   * EVENTO: Click en "Iniciar sesión"
   * Revierte al modo login
   */
  newBtnLogin.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔄 Activando modo login...');
    container.classList.remove('sign-up-mode');
    console.log('✅ Clase sign-up-mode removida - Volviendo a login');
  });

  console.log('✅ setupAuthToggle configurado correctamente');
}

// Inicialización
async function initAuth() {
  loginForm = document.getElementById('loginForm');
  registerForm = document.getElementById('registerForm');
  googleLoginBtn = document.getElementById('googleLogin');
  facebookLoginBtn = document.getElementById('facebookLogin');

  await hydrateAuthState();

  if (!authSubscription) {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncAppState(session?.user ?? null);
    });

    authSubscription = subscription;
  }

  if (loginForm) setupLoginForm();
  if (registerForm) setupRegisterForm();
  if (googleLoginBtn) googleLoginBtn.addEventListener('click', loginWithGoogle);
  if (facebookLoginBtn) facebookLoginBtn.addEventListener('click', loginWithFacebook);
  
  // CRÍTICO: setupAuthToggle debe ejecutarse después de que el DOM esté listo
  setupAuthToggle();

  if (isAdminLogin && loginForm) {
    const adminLoginAlert = document.getElementById('adminLoginAlert');
    if (adminLoginAlert) {
      adminLoginAlert.classList.remove('d-none');
    }
  }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void initAuth();
  });
} else {
  void initAuth();
}

// Verificar si es acceso administrativo
const urlParams = new URLSearchParams(window.location.search);
const isAdminLogin = urlParams.get('admin') === 'true';

// Configurar formulario de login
function setupLoginForm() {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginForm.loginEmail.value;
    const password = loginForm.loginPassword.value;
    
    // Validación simple
    if (!email || !password) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    // Mostrar spinner
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
    submitBtn.disabled = true;
    
    try {
      // Intentar login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }

      const role = await getProfileRole(data.user.id);
      const isAdmin = role === 'admin';
      
      if (isAdminLogin && !isAdmin) {
        await supabase.auth.signOut();
        throw new Error('Acceso denegado. Solo personal autorizado.');
      }

      syncAppState(data.user);

      // Redirección según tipo de usuario
      if (isAdmin) {
        window.location.href = 'dashboar.html';
      } else {
        window.location.href = 'index.html';
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Error al iniciar sesión: ' + error.message);
    } finally {
      submitBtn.innerHTML = originalBtnContent;
      submitBtn.disabled = false;
    }
  });
}

// Configurar formulario de registro
function setupRegisterForm() {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = registerForm.registerName.value;
    const email = registerForm.registerEmail.value;
    const phone = registerForm.registerPhone.value;
    const password = registerForm.registerPassword.value;
    const confirmPassword = registerForm.registerConfirmPassword.value;
    
    // Validaciones
    if (!name || !email || !phone || !password || !confirmPassword) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    if (!registerForm.termsCheck.checked) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }
    
    // Mostrar spinner
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';
    submitBtn.disabled = true;
    
    try {
      // Registrar usuario
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone,
            newsletter: registerForm.newsletterCheck.checked
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('No se pudo crear el usuario en Auth.');
      }

      alert(data.session
        ? '¡Registro exitoso! Ya puedes usar tu cuenta.'
        : '¡Registro exitoso! Por favor verifica tu correo electrónico.');
      window.location.href = 'accessweb.html';
    } catch (error) {
      console.error('Register error:', error);
      alert('Error al registrarse: ' + error.message);
    } finally {
      submitBtn.innerHTML = originalBtnContent;
      submitBtn.disabled = false;
    }
  });
}

// Login con Google
async function loginWithGoogle() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + (isAdminLogin ? '/dashboar.html' : '/index.html')
      }
    });
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Google login error:', error);
    alert('Error al iniciar sesión con Google: ' + error.message);
  }
}

// Login con Facebook
async function loginWithFacebook() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: window.location.origin + (isAdminLogin ? '/dashboar.html' : '/index.html')
      }
    });
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Facebook login error:', error);
    alert('Error al iniciar sesión con Facebook: ' + error.message);
  }
}

// Función para cerrar sesión
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    appState.user = null;
    window.location.href = isAdminLogin ? 'accessweb.html?admin=true' : 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Error al cerrar sesión: ' + error.message);
  }
}

// Verificar autenticación al cargar páginas administrativas
export async function checkAdminAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    window.location.href = 'accessweb.html?admin=true';
    return;
  }
  
  try {
    const role = await getProfileRole(user.id);
    const isAdmin = role === 'admin';
  
    if (!isAdmin) {
      await supabase.auth.signOut();
      window.location.href = 'accessweb.html?admin=true';
    }
  } catch (profileError) {
    console.error('Admin profile verification failed:', profileError);
    await supabase.auth.signOut();
    window.location.href = 'accessweb.html?admin=true';
  }
}

export function isAuthenticated() {
  return Boolean(appState.user || appState.isAuthenticated);
}

export function getCurrentUser() {
  return appState.user;
}