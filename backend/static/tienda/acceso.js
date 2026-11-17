// Sign in and sign up (/acceso/). Loaded by acceso.html as one external module.
//
// Supabase Auth runs in the browser. This script gets everything it needs from the data-*
// attributes of #acceso (the project URL, the publishable key, where to post the token, where to
// go next); nothing here is a secret and nothing is read from another site. The supabase-js
// build is the one in static/tienda/vendor/, loaded on demand.
//
// After signing in: an admin is handed to the panel (POST of the access token to the sesion
// address, same origin, then the panel); anyone else goes to the products. With ?salir=1 (where
// the panel sends people after closing its session) the Supabase session of this browser is
// closed before the forms are usable.

const raiz = document.getElementById("acceso");
const aviso = document.getElementById("acceso-aviso");
const formIngresar = document.getElementById("form-ingresar");
const formRegistro = document.getElementById("form-registro");

const ESPERA_SALIDA_MS = 5000;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO = /^\d{10}$/;

const MENSAJES = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed: "Confirma tu correo antes de entrar: te enviamos un mensaje.",
  user_already_exists: "Ese correo ya tiene una cuenta. Inicia sesión.",
  email_exists: "Ese correo ya tiene una cuenta. Inicia sesión.",
  weak_password: "La contraseña es muy débil. Usa al menos 8 caracteres, con letras y números.",
  over_request_rate_limit: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  over_email_send_rate_limit: "Demasiados correos enviados. Espera unos minutos e inténtalo de nuevo.",
  signup_disabled: "El registro de cuentas está desactivado por ahora.",
};

function mensajeDe(error, porDefecto) {
  if (error && MENSAJES[error.code]) return MENSAJES[error.code];
  if (error && error.message === "Invalid login credentials") return MENSAJES.invalid_credentials;
  if (error && /failed to fetch|networkerror|load failed/i.test(error.message || "")) {
    return "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.";
  }
  return porDefecto;
}

function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.removeAttribute("data-admin");
}

function mostrarError(formulario, texto) {
  formulario.querySelector("[data-error]").textContent = texto;
}

function limpiarErrores() {
  for (const lugar of raiz.querySelectorAll("[data-error]")) lugar.textContent = "";
}

// --- The switch between the two forms ----------------------------------------------------------

function cambiarModo(modo) {
  if (raiz.dataset.modo === modo) return;
  raiz.dataset.modo = modo;
  limpiarErrores();
  const formulario = modo === "registro" ? formRegistro : formIngresar;
  // The inactive form is invisible, not removed: the focus moves to the one that is showing.
  formulario.querySelector("input").focus({ preventScroll: true });
}

for (const boton of raiz.querySelectorAll("[data-accion]")) {
  boton.addEventListener("click", () => {
    cambiarModo(boton.dataset.accion === "ver-registro" ? "registro" : "ingresar");
  });
}

// --- Busy state --------------------------------------------------------------------------------

async function ocupado(formulario, texto, tarea) {
  const boton = formulario.querySelector('button[type="submit"]');
  const original = boton.textContent;
  boton.disabled = true;
  boton.textContent = texto;
  try {
    return await tarea();
  } finally {
    boton.disabled = false;
    boton.textContent = original;
  }
}

// --- Supabase ----------------------------------------------------------------------------------

async function abrirSupabase() {
  const { createClient } = await import(raiz.dataset.supabaseJs);
  return createClient(raiz.dataset.supabaseUrl, raiz.dataset.supabaseKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
}

// Closes the session of this browser. auth-js reports an error before it clears the local
// copy, so when it fails the stored session is removed by hand: leaving it would keep the
// person signed in after they asked to leave.
async function cerrarSesion(supabase) {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (!error) return true;
  try {
    const clave = supabase.auth.storageKey;
    if (typeof clave === "string" && clave) window.localStorage.removeItem(clave);
    return typeof clave === "string" && window.localStorage.getItem(clave) === null;
  } catch {
    return false;
  }
}

async function esAdmin(supabase, usuario) {
  const { data, error } = await supabase.from("profiles").select("role").eq("id", usuario.id).single();
  return !error && data !== null && data.role === "admin";
}

// Posts the token to the panel's handoff. Recién emitido: the panel refuses an old token, so the
// session is refreshed first. The token travels only in the body of the POST.
async function entregarAlPanel(supabase) {
  const { data, error } = await supabase.auth.refreshSession();
  const token = error ? null : data.session && data.session.access_token;
  if (typeof token !== "string" || token.trim() === "") return false;
  const cuerpo = new FormData();
  cuerpo.set("access_token", token);
  try {
    const respuesta = await fetch(raiz.dataset.sesionUrl, {
      method: "POST",
      body: cuerpo,
      credentials: "same-origin",
      redirect: "follow",
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}

function iniciarIngreso(supabase, esperarSalida) {
  const soloAdmin = new URLSearchParams(window.location.search).get("admin") === "true";

  formIngresar.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limpiarErrores();
    const correo = formIngresar.elements.email.value.trim();
    const clave = formIngresar.elements.password.value;
    if (!correo || !clave) return mostrarError(formIngresar, "Escribe tu correo y tu contraseña.");
    if (!CORREO.test(correo)) return mostrarError(formIngresar, "Escribe un correo válido.");

    await ocupado(formIngresar, "Procesando…", async () => {
      await esperarSalida(); // A late sign-out would revoke the session that is about to open.
      const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
      if (error) {
        return mostrarError(formIngresar, mensajeDe(error, "No se pudo iniciar sesión. Inténtalo de nuevo."));
      }
      formIngresar.elements.password.value = "";

      const admin = await esAdmin(supabase, data.user);
      if (soloAdmin && !admin) {
        await cerrarSesion(supabase);
        return mostrarError(formIngresar, "Acceso denegado. Solo personal autorizado.");
      }
      if (admin) {
        if (!(await entregarAlPanel(supabase))) {
          return mostrarError(formIngresar, "No se pudo abrir el panel. Inténtalo de nuevo.");
        }
        window.location.replace(raiz.dataset.panelUrl);
        return;
      }
      window.location.replace(raiz.dataset.tiendaUrl);
    });
  });
}

function iniciarRegistro(supabase) {
  formRegistro.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limpiarErrores();
    const campos = formRegistro.elements;
    const nombre = campos.full_name.value.trim();
    const correo = campos.email.value.trim();
    const telefono = campos.phone.value.trim();
    const clave = campos.password.value;

    const problema = !nombre || !correo || !telefono || !clave || !campos.password_confirm.value
      ? "Completa todos los campos."
      : !CORREO.test(correo)
        ? "Escribe un correo válido."
        : !TELEFONO.test(telefono)
          ? "Escribe un teléfono de 10 dígitos."
          : clave.length < 8
            ? "La contraseña debe tener al menos 8 caracteres."
            : clave !== campos.password_confirm.value
              ? "Las contraseñas no coinciden."
              : !campos.terms.checked
                ? "Debes aceptar los términos y condiciones."
                : "";
    if (problema) return mostrarError(formRegistro, problema);

    await ocupado(formRegistro, "Registrando…", async () => {
      const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: clave,
        options: { data: { full_name: nombre, phone: telefono, newsletter: campos.newsletter.checked } },
      });
      if (error) {
        return mostrarError(formRegistro, mensajeDe(error, "No se pudo crear la cuenta. Inténtalo de nuevo."));
      }
      // With email confirmation on, an address that already has an account comes back without
      // identities instead of an error.
      if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
        return mostrarError(formRegistro, MENSAJES.user_already_exists);
      }
      campos.password.value = "";
      campos.password_confirm.value = "";
      if (data.session) {
        window.location.replace(raiz.dataset.tiendaUrl);
        return;
      }
      cambiarModo("ingresar");
      mostrarAviso("Cuenta creada. Te enviamos un correo: confírmalo y luego inicia sesión.");
    });
  });
}

async function iniciar() {
  const parametros = new URLSearchParams(window.location.search);

  let supabase;
  try {
    supabase = await abrirSupabase();
  } catch {
    raiz.hidden = false;
    mostrarError(formIngresar, "No se pudo cargar el acceso. Recarga la página.");
    mostrarError(formRegistro, "No se pudo cargar el acceso. Recarga la página.");
    return;
  }

  let salida = Promise.resolve();
  if (parametros.get("salir") === "1") {
    salida = cerrarSesion(supabase).then((cerrada) => {
      if (!cerrada) mostrarAviso("No se pudo cerrar tu sesión en este navegador. Borra los datos del sitio e inténtalo de nuevo.");
    });
    // The address no longer asks for it: a reload does not repeat the sign-out.
    parametros.delete("salir");
    const resto = parametros.toString();
    window.history.replaceState(null, "", window.location.pathname + (resto ? `?${resto}` : ""));
  }
  const esperarSalida = () => Promise.race([salida, new Promise((listo) => setTimeout(listo, ESPERA_SALIDA_MS))]);

  iniciarIngreso(supabase, esperarSalida);
  iniciarRegistro(supabase);
  // The forms show only once they have their handlers: a submit before that would post a password.
  raiz.hidden = false;
}

iniciar();
