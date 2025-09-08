import { supabase } from './app.js';

// Configurar formulario de login de administrador
document.addEventListener('DOMContentLoaded', () => {
  const adminLoginForm = document.getElementById('adminLoginForm');
  
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = adminLoginForm.adminEmail.value;
      const password = adminLoginForm.adminPassword.value;
      const token = adminLoginForm.adminToken.value;
      
      // Validación básica
      if (!email || !password) {
        alert('Por favor ingresa correo y contraseña');
        return;
      }
      
      // Intentar login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Admin login error:', error);
        alert('Error de acceso: ' + error.message);
        return;
      }
      
      // Verificar rol de administrador
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();
      
      if (userError || !userData?.is_admin) {
        await supabase.auth.signOut();
        alert('Acceso denegado. No tienes privilegios de administrador.');
        return;
      }
      
      // Redirigir al panel de administración
      window.location.href = 'admin/index.html';
    });
  }
});

// Función para verificar sesión de admin en páginas protegidas
export async function verifyAdminSession() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    window.location.href = '../admin-login.html';
    return;
  }
  
  const { data: userData, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  
  if (error || !userData?.is_admin) {
    await supabase.auth.signOut();
    window.location.href = '../admin-login.html';
  }
}