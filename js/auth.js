import { supabase, appState } from './app.js';

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const googleLoginBtn = document.getElementById('googleLogin');
const facebookLoginBtn = document.getElementById('facebookLogin');

// Inicialización
if (loginForm) setupLoginForm();
if (registerForm) setupRegisterForm();
if (googleLoginBtn) googleLoginBtn.addEventListener('click', loginWithGoogle);
if (facebookLoginBtn) facebookLoginBtn.addEventListener('click', loginWithFacebook);

// Verificar si es acceso administrativo
const urlParams = new URLSearchParams(window.location.search);
const isAdminLogin = urlParams.get('admin') === 'true';

if (isAdminLogin && loginForm) {
  document.getElementById('adminLoginAlert').classList.remove('d-none');
}

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

      // Verificar si es administrador (en un sistema real esto debería verificarse en la base de datos)
      const isAdmin = email.endsWith('@carniceriaadmin.com');
      
      if (isAdminLogin && !isAdmin) {
        await supabase.auth.signOut();
        throw new Error('Acceso denegado. Solo personal autorizado.');
      }

      // Redirección según tipo de usuario
      if (isAdmin) {
        window.location.href = 'admin/dashboard.html';
      } else {
        appState.user = data.user;
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
      
      // Crear registro en la tabla de clientes
      const { error: profileError } = await supabase
        .from('customers')
        .insert([{
          user_id: data.user.id,
          name,
          email,
          phone,
          newsletter: registerForm.newsletterCheck.checked,
          loyalty_points: 0
        }]);
      
      if (profileError) {
        throw profileError;
      }
      
      // Crear registro en el programa de fidelidad
      const { error: loyaltyError } = await supabase
        .from('loyalty_program')
        .insert([{
          user_id: data.user.id,
          points: 0,
          qr_code: data.user.id
        }]);
      
      if (loyaltyError) {
        throw loyaltyError;
      }
      
      alert('¡Registro exitoso! Por favor verifica tu correo electrónico.');
      window.location.href = 'login.html';
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
        redirectTo: window.location.origin + (isAdminLogin ? '/admin/dashboard.html' : '/index.html')
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
        redirectTo: window.location.origin + (isAdminLogin ? '/admin/dashboard.html' : '/index.html')
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
    window.location.href = isAdminLogin ? 'login.html?admin=true' : 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Error al cerrar sesión: ' + error.message);
  }
}

// Verificar autenticación al cargar páginas administrativas
export async function checkAdminAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    window.location.href = '../login.html?admin=true';
    return;
  }
  
  // Verificar si el usuario es administrador
  const isAdmin = user.email.endsWith('@carniceriaadmin.com');
  
  if (!isAdmin) {
    await supabase.auth.signOut();
    window.location.href = '../login.html?admin=true';
  }
}