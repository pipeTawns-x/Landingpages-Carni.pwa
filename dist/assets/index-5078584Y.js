(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const n of o)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function a(o){const n={};return o.integrity&&(n.integrity=o.integrity),o.referrerPolicy&&(n.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?n.credentials="include":o.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(o){if(o.ep)return;o.ep=!0;const n=a(o);fetch(o.href,n)}})();const m="https://your-project-ref.supabase.co",p="your-anon-key",l=l.createClient(m,p);let i={user:null,cart:[],loyaltyPoints:0};document.addEventListener("DOMContentLoaded",()=>{y(),w(),u(),f()});async function y(){const{data:{user:t}}=await l.auth.getUser();t&&(i.user=t,document.getElementById("userBtn").innerHTML='<i class="bi bi-person-check"></i>',g(t.id))}async function g(t){const{data:e,error:a}=await l.from("loyalty_program").select("points").eq("user_id",t).single();e&&(i.loyaltyPoints=e.points)}function f(){document.getElementById("searchBtn").addEventListener("click",h),document.getElementById("cartBtn").addEventListener("click",()=>{alert("Carrito de compras (próximamente)")}),document.getElementById("loyaltyBtn").addEventListener("click",b),document.getElementById("contactForm").addEventListener("submit",v)}function h(){const t=document.getElementById("searchBar");t.classList.toggle("d-none"),t.classList.contains("d-none")||document.getElementById("searchInput").focus()}function b(){const t=new bootstrap.Modal(document.getElementById("loyaltyModal"));i.user?document.getElementById("loyaltyContent").innerHTML=`
      <div class="text-center">
        <h4 class="mb-4">Tu Programa de Fidelidad</h4>
        <div class="loyalty-card p-4 mb-4 bg-primary text-white rounded-3">
          <h1 class="display-4">${i.loyaltyPoints} Puntos</h1>
          <p class="mb-0">Acumulados</p>
        </div>
        <div class="qr-code mb-4">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${i.user.id}" 
               alt="QR Code" class="img-fluid">
          <p class="small text-muted mt-2">Muestra este código al pagar para acumular puntos</p>
        </div>
        <div class="loyalty-benefits">
          <h5 class="mb-3">Beneficios</h5>
          <ul class="list-group">
            <li class="list-group-item">1 punto por cada $100 en compras</li>
            <li class="list-group-item">100 puntos = $50 de descuento</li>
            <li class="list-group-item">Ofertas exclusivas</li>
          </ul>
        </div>
      </div>
    `:document.getElementById("loyaltyContent").innerHTML=`
      <div class="text-center py-4">
        <h4 class="mb-4">Programa de Fidelidad</h4>
        <p class="mb-4">Únete a nuestro programa de fidelidad y comienza a ganar puntos con cada compra</p>
        <div class="d-flex justify-content-center gap-3">
          <a href="register.html" class="btn btn-primary">Regístrate</a>
          <a href="login.html" class="btn btn-outline-primary">Inicia Sesión</a>
        </div>
      </div>
    `,t.show()}async function v(t){t.preventDefault();const e=t.target,a={name:e.name.value,email:e.email.value,subject:e.subject.value,message:e.message.value,created_at:new Date().toISOString()};if(!a.name||!a.email||!a.message){alert("Por favor completa todos los campos requeridos");return}const{error:s}=await l.from("contacts").insert([a]);s?(console.error("Error enviando mensaje:",s),alert("Hubo un error al enviar tu mensaje. Por favor intenta nuevamente.")):(alert("¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto."),e.reset())}function w(){const t=localStorage.getItem("cart");t&&(i.cart=JSON.parse(t))}function u(){const t=i.cart.reduce((e,a)=>e+a.quantity,0);document.querySelectorAll(".cart-counter").forEach(e=>{e.textContent=t,e.style.display=t>0?"block":"none"})}document.addEventListener("DOMContentLoaded",async()=>{await t(),L();async function t(){const e=document.getElementById("productsGrid");if(!e)return;e.innerHTML=`
    <div class="col-12 text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando productos...</span>
      </div>
    </div>
  `;const{data:a,error:s}=await l.from("products").select("*").order("category",{ascending:!0});if(s){console.error("Error loading products:",s),e.innerHTML=`
      <div class="col-12 text-center text-danger">
        <i class="bi bi-exclamation-triangle-fill fs-1"></i>
        <p class="mt-3">Error cargando los productos. Por favor intenta nuevamente.</p>
      </div>
    `;return}if(a.length===0){e.innerHTML=`
      <div class="col-12 text-center text-muted">
        <i class="bi bi-box-seam fs-1"></i>
        <p class="mt-3">No hay productos disponibles en este momento.</p>
      </div>
    `;return}const o={};a.forEach(r=>{o[r.category]||(o[r.category]=[]),o[r.category].push(r)});let n="";for(const r in o)n+=`
      <div class="col-12 mt-4">
        <h3 class="category-title">${r}</h3>
        <hr>
      </div>
    `,o[r].forEach(c=>{n+=`
        <div class="col-md-4 mb-4">
          <div class="card h-100 product-card">
            <img src="${c.image_url||"img/placeholder-meat.jpg"}" 
                 class="card-img-top" 
                 alt="${c.name}"
                 loading="lazy">
            <div class="card-body">
              <h5 class="card-title">${c.name}</h5>
              <p class="card-text">${c.description||"Producto de alta calidad"}</p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="price">$${c.price.toFixed(2)}</span>
                <button class="btn btn-sm btn-primary add-to-cart" 
                        data-id="${c.id}"
                        data-name="${c.name}"
                        data-price="${c.price}">
                  <i class="bi bi-cart-plus"></i> Añadir
                </button>
              </div>
            </div>
          </div>
        </div>
      `});e.innerHTML=n,document.querySelectorAll(".add-to-cart").forEach(r=>{r.addEventListener("click",E)})}});function E(t){const e=t.currentTarget,a={id:e.dataset.id,name:e.dataset.name,price:parseFloat(e.dataset.price),quantity:1},s=i.cart.find(o=>o.id===a.id);s?s.quantity+=1:i.cart.push(a),C(),u(),e.innerHTML='<i class="bi bi-check"></i> Añadido',e.classList.remove("btn-primary"),e.classList.add("btn-success"),setTimeout(()=>{e.innerHTML='<i class="bi bi-cart-plus"></i> Añadir',e.classList.remove("btn-success"),e.classList.add("btn-primary")},1e3)}function L(){const t=document.getElementById("searchInput");t&&t.addEventListener("input",x)}function x(){const t=document.getElementById("searchInput").value.toLowerCase();document.querySelectorAll(".product-card").forEach(a=>{const s=a.querySelector(".card-title").textContent.toLowerCase(),o=a.querySelector(".card-text").textContent.toLowerCase();s.includes(t)||o.includes(t)?a.parentElement.style.display="block":a.parentElement.style.display="none"})}function C(){localStorage.setItem("cart",JSON.stringify(i.cart))}const d=document.getElementById("loyaltyBtn");d&&d.addEventListener("click",I);async function I(){if(!i.user){const s=new bootstrap.Modal(document.getElementById("loyaltyModal"));document.getElementById("loyaltyContent").innerHTML=`
      <div class="text-center py-4">
        <h4 class="mb-4">Programa de Fidelidad</h4>
        <p class="mb-4">Únete a nuestro programa de fidelidad y comienza a ganar puntos con cada compra</p>
        <div class="d-flex justify-content-center gap-3">
          <a href="register.html" class="btn btn-primary">Regístrate</a>
          <a href="login.html" class="btn btn-outline-primary">Inicia Sesión</a>
        </div>
      </div>
    `,s.show();return}const{data:t,error:e}=await l.from("loyalty_program").select("*").eq("user_id",i.user.id).single();if(e){console.error("Error loading loyalty data:",e),alert("Error cargando tu información de fidelidad");return}const a=new bootstrap.Modal(document.getElementById("loyaltyModal"));document.getElementById("loyaltyContent").innerHTML=`
    <div class="text-center">
      <h4 class="mb-4">Tu Programa de Fidelidad</h4>
      <div class="loyalty-card p-4 mb-4 bg-primary text-white rounded-3">
        <h1 class="display-4">${t.points} Puntos</h1>
        <p class="mb-0">Acumulados</p>
      </div>
      <div class="qr-code mb-4">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${t.qr_code||i.user.id}" 
             alt="QR Code" class="img-fluid">
        <p class="small text-muted mt-2">Muestra este código al pagar para acumular puntos</p>
      </div>
      <div class="loyalty-benefits">
        <h5 class="mb-3">Beneficios</h5>
        <ul class="list-group">
          <li class="list-group-item">1 punto por cada $100 en compras</li>
          <li class="list-group-item">100 puntos = $50 de descuento</li>
          <li class="list-group-item">Ofertas exclusivas</li>
          <li class="list-group-item">Descuentos en cumpleaños</li>
        </ul>
      </div>
      <div class="loyalty-history mt-4">
        <h5 class="mb-3">Historial Reciente</h5>
        ${await B()}
      </div>
    </div>
  `,a.show()}async function B(){const{data:t,error:e}=await l.from("loyalty_history").select("*").eq("user_id",i.user.id).order("created_at",{ascending:!1}).limit(5);if(e||!t.length)return console.error("Error loading loyalty history:",e),'<p class="text-muted">No hay historial reciente</p>';let a='<div class="list-group">';return t.forEach(s=>{const o=new Date(s.created_at).toLocaleDateString(),n=s.points>0?`<span class="text-success">+${s.points}</span>`:`<span class="text-danger">${s.points}</span>`;a+=`
      <div class="list-group-item">
        <div class="d-flex justify-content-between">
          <span>${s.description}</span>
          <div>
            ${n} puntos <span class="text-muted small">${o}</span>
          </div>
        </div>
      </div>
    `}),a+="</div>",a}const $="your-openweathermap-api-key",M={lat:22.1565,lon:-100.9855};document.addEventListener("DOMContentLoaded",()=>{document.getElementById("weatherWidget")&&S()});async function S(){try{const t=document.getElementById("weatherWidget");t.innerHTML=`
      <div class="d-flex align-items-center">
        <i class="bi bi-cloud-arrow-down fs-3 me-2 weather-icon"></i>
        <div>
          <div class="weather-temp">Cargando clima...</div>
          <small class="weather-desc text-muted"></small>
        </div>
      </div>
    `;let e=M;if(navigator.geolocation){const o=await new Promise((n,r)=>{navigator.geolocation.getCurrentPosition(n,r)});e={lat:o.coords.latitude,lon:o.coords.longitude}}const a=await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${e.lat}&lon=${e.lon}&appid=${$}&units=metric&lang=es`);if(!a.ok)throw new Error("Error al obtener datos del clima");const s=await a.json();q(s),P(s)}catch(t){console.error("Error loading weather data:",t),document.querySelector(".weather-temp").textContent="Clima no disponible",document.querySelector(".weather-desc").textContent=""}}function q(t){const e=Math.round(t.main.temp),a=t.weather[0].description,s=t.weather[0].icon,o=T(s);document.querySelector(".weather-icon").className=`bi ${o} fs-3 me-2 weather-icon`,document.querySelector(".weather-temp").textContent=`${e}°C`,document.querySelector(".weather-desc").textContent=a}function P(t){const e=t.main.temp,a=t.weather[0].id;let s="";e>30?s="¡Día caluroso! Perfecto para carnes frías y ensaladas.":e>20?s="Clima agradable. Ideal para una parrillada al aire libre.":e>10?s="Día fresco. ¿Qué tal un estofado o carne al horno?":s="¡Hace frío! Caliéntate con nuestros cortes para guisos.",a>=200&&a<300?s+=" Tormentas eléctricas: mejor disfruta de carnes preparadas en casa.":a>=300&&a<600&&(s+=" Día lluvioso: perfecto para cocinar al horno o a la plancha."),console.log("Sugerencia:",s)}function T(t){return{"01d":"bi-sun","01n":"bi-moon","02d":"bi-cloud-sun","02n":"bi-cloud-moon","03d":"bi-cloud","03n":"bi-cloud","04d":"bi-clouds","04n":"bi-clouds","09d":"bi-cloud-rain","09n":"bi-cloud-rain","10d":"bi-cloud-rain","10n":"bi-cloud-rain","11d":"bi-lightning","11n":"bi-lightning","13d":"bi-snow","13n":"bi-snow","50d":"bi-cloud-fog","50n":"bi-cloud-fog"}[t]||"bi-cloud"}
