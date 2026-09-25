/* Bresdi — comportamiento del sitio.
   Menú de móvil, envío del formulario de contacto, filtros de artículos y
   movimiento: secciones que aparecen al hacer scroll, sombra de la barra y
   los tres pasos del Inicio que avanzan con el scroll.
   El sitio funciona sin este archivo; solo pierde esas comodidades.
   Todo el movimiento se omite si el visitante pidió reducir animaciones. */

(function () {
  "use strict";

  /* ---------------------------------------------------------- menú móvil */
  var boton = document.querySelector(".bd-menu-btn");
  var menu = document.getElementById("bd-menu");

  if (boton && menu) {
    boton.addEventListener("click", function () {
      var abierto = boton.getAttribute("aria-expanded") === "true";
      boton.setAttribute("aria-expanded", abierto ? "false" : "true");
      boton.setAttribute("aria-label", abierto ? "Abrir menú" : "Cerrar menú");
      menu.hidden = abierto;
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && boton.getAttribute("aria-expanded") === "true") {
        boton.setAttribute("aria-expanded", "false");
        boton.setAttribute("aria-label", "Abrir menú");
        menu.hidden = true;
        boton.focus();
      }
    });
  }

  /* ------------------------------------------------ desplegable Servicios
     En escritorio se abre al pasar el cursor (css). La flecha lo abre y lo
     cierra al tocar o con el teclado; Escape y un clic fuera lo cierran. */
  var drop = document.querySelector(".bd-drop");
  var dropBtn = drop && drop.querySelector(".bd-drop-btn");
  if (drop && dropBtn) {
    var cierraDrop = function () {
      drop.classList.remove("bd-abierto");
      dropBtn.setAttribute("aria-expanded", "false");
    };
    dropBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var abierto = drop.classList.toggle("bd-abierto");
      dropBtn.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (!drop.contains(e.target)) cierraDrop();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drop.classList.contains("bd-abierto")) {
        cierraDrop();
        dropBtn.focus();
      }
    });
  }

  /* ------------------------------------------------- formulario de contacto
     Envío por fetch a Web3Forms para no salir de la página. Si la clave
     todavía no está configurada, el formulario avisa en lugar de fallar en
     silencio. */
  var forma = document.querySelector("form[data-bd-form]");
  if (forma) conectaFormulario(forma);

  function conectaFormulario(forma) {

  var estado = forma.querySelector(".bd-form-estado");
  var enviar = forma.querySelector('button[type="submit"]');
  var medio = forma.querySelector('select[name="medio"]');
  var contacto = forma.querySelector('input[name="contacto"]');
  var ayuda = forma.querySelector(".bd-medio-ayuda");
  var tarjeta = forma.closest(".bd-form-tarjeta");
  var confirma = tarjeta && tarjeta.querySelector(".bd-confirma");

  function aviso(texto, tipo) {
    if (!estado) return;
    estado.textContent = texto;
    estado.setAttribute("data-tipo", tipo);
  }

  // El campo de contacto se adapta a lo elegido: teclado, autocompletado y ayuda
  function ajustaMedio() {
    if (!medio || !contacto) return;
    var wa = medio.value === "WhatsApp";
    contacto.type = wa ? "tel" : "email";
    contacto.setAttribute("inputmode", wa ? "tel" : "email");
    contacto.setAttribute("autocomplete", wa ? "tel-national" : "email");
    contacto.placeholder = wa ? "442 123 4567" : "nombre@empresa.com";
    if (ayuda) ayuda.textContent = wa ? "10 dígitos, sin lada internacional." : "Te escribimos a este correo.";
  }
  if (medio) {
    medio.addEventListener("change", function () {
      contacto.value = "";
      ajustaMedio();
      contacto.focus();
    });
    ajustaMedio();
  }

  function contactoValido() {
    if (!medio || !contacto) return true;
    var v = contacto.value.trim();
    if (medio.value === "WhatsApp") {
      var digitos = v.replace(/\D/g, "");
      if (digitos.length === 12 && digitos.indexOf("52") === 0) digitos = digitos.slice(2);
      return digitos.length === 10;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  // Folio para identificar el caso: día y mes más cuatro caracteres al azar.
  // Viaja en el asunto del correo que recibe Bresdi.
  function nuevoFolio() {
    var hoy = new Date();
    var dos = function (n) { return (n < 10 ? "0" : "") + n; };
    var letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", azar = "";
    for (var i = 0; i < 4; i++) azar += letras.charAt(Math.floor(Math.random() * letras.length));
    return "BR-" + dos(hoy.getDate()) + dos(hoy.getMonth() + 1) + "-" + azar;
  }

  function muestraConfirmacion(folio) {
    if (!tarjeta || !confirma) {
      forma.reset();
      aviso("Mensaje enviado. Tu folio es " + folio + ". Te respondemos el siguiente día hábil.", "ok");
      return;
    }
    confirma.querySelector("[data-folio]").textContent = folio;
    var wa = confirma.querySelector(".bd-conf-wa");
    if (wa) wa.href = wa.href.replace(/text=[^&]*/, "text=" + encodeURIComponent("Hola Bresdi, les dejé un mensaje en su sitio con el folio " + folio + "."));
    var cambia = function () {
      tarjeta.style.minHeight = tarjeta.offsetHeight + "px";
      tarjeta.classList.remove("bd-saliendo");
      tarjeta.classList.add("bd-enviado");
      confirma.hidden = false;
      confirma.classList.add("bd-conf-anima");
      confirma.focus();
      forma.reset();
      ajustaMedio();
    };
    if (document.documentElement.classList.contains("bd-js")) {
      tarjeta.style.minHeight = tarjeta.offsetHeight + "px";
      tarjeta.classList.add("bd-saliendo");
      setTimeout(cambia, 300);
    } else {
      cambia();
    }
  }

  forma.addEventListener("submit", function (e) {
    e.preventDefault();

    var destino = forma.getAttribute("action") || "";
    var clave = forma.querySelector('input[name="access_key"]');
    if (!destino || (clave && !clave.value)) {
      aviso("El formulario todavía no está conectado. Escríbenos por WhatsApp mientras tanto.", "error");
      return;
    }
    if (!contactoValido()) {
      aviso(medio.value === "WhatsApp"
        ? "Revisa tu número de WhatsApp: deben ser 10 dígitos."
        : "Revisa tu correo: parece que le falta algo.", "error");
      contacto.focus();
      return;
    }

    var folio = nuevoFolio();
    var campoFolio = forma.querySelector('input[name="folio"]');
    var asunto = forma.querySelector('input[name="subject"]');
    if (campoFolio) campoFolio.value = folio;
    if (asunto) asunto.value = "Mensaje nuevo · Folio " + folio;

    if (enviar) {
      enviar.disabled = true;
      enviar.textContent = "Enviando…";
    }
    aviso("", "");

    fetch(destino, {
      method: "POST",
      body: new FormData(forma),
      headers: { Accept: "application/json" }
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (datos) {
          if (!r.ok || datos.success === false) throw new Error("respuesta " + r.status);
        });
      })
      .then(function () {
        muestraConfirmacion(folio);
      })
      .catch(function () {
        aviso("No se pudo enviar el mensaje. Escríbenos por WhatsApp y lo resolvemos.", "error");
      })
      .then(function () {
        if (enviar) {
          enviar.disabled = false;
          enviar.textContent = "Enviar mensaje";
        }
      });
  });
  }

  /* ------------------------------------------------ filtros de artículos
     Las píldoras del índice filtran las tarjetas por la categoría que cada
     tarjeta muestra en su etiqueta. */
  var pildoras = Array.prototype.filter.call(
    document.querySelectorAll('main a[href="#"]'),
    function (a) { return /^(Todos|REPSE|Trámites SAT|NOM-035|Capacitaciones)$/.test(a.textContent.trim()); });

  if (pildoras.length > 1) {
    var estiloActivo = pildoras[0].getAttribute("style");
    var estiloInactivo = pildoras[1].getAttribute("style");
    var tarjetas = Array.prototype.filter.call(
      document.querySelectorAll("main a.bd-card"),
      function (t) { return t.querySelector("span"); });

    pildoras.forEach(function (p, i) {
      p.setAttribute("role", "button");
      p.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      p.addEventListener("click", function (e) {
        e.preventDefault();
        var cat = p.textContent.trim();
        pildoras.forEach(function (o) {
          var activo = o === p;
          o.setAttribute("style", activo ? estiloActivo : estiloInactivo);
          o.setAttribute("aria-pressed", activo ? "true" : "false");
        });
        tarjetas.forEach(function (t) {
          var etiqueta = t.querySelector("span").textContent;
          var entra = cat === "Todos" || etiqueta.indexOf(cat) !== -1;
          t.hidden = !entra;
          t.style.display = entra ? "" : "none";
        });
        // Si el destacado queda oculto, su sección no debe dejar hueco
        document.querySelectorAll("main section").forEach(function (s) {
          var propias = s.querySelectorAll("a.bd-card");
          if (!propias.length) return;
          var alguna = Array.prototype.some.call(propias, function (t) { return !t.hidden; });
          s.style.display = alguna ? "" : "none";
        });
      });
    });
  }

  /* ------------------------------------------------- CTA flotante en móvil
     El círculo de WhatsApp espera a que el botón de WhatsApp del hero quede
     detrás de la barra. Si la página no tiene ese botón en la primera
     pantalla, aparece tras 300 px de scroll. La clase solo tiene efecto en
     móvil (css); en escritorio la píldora se ve siempre. */
  var flotante = document.querySelector(".bd-float");
  if (flotante) {
    var navFija = document.querySelector(".bd-nav");
    // El botón del hero manda aunque quede bajo la primera pantalla: en el
    // Inicio en celular va después de la ilustración (25-sep-2026)
    var ctaHero = document.querySelector(".bd-hero .bd-wa");
    if (!ctaHero) {
      ctaHero = document.querySelector("main .bd-wa");
      if (ctaHero && ctaHero.getBoundingClientRect().top + window.scrollY > window.innerHeight) ctaHero = null;
    }
    var revisaFlotante = function () {
      var oculto = ctaHero
        ? ctaHero.getBoundingClientRect().bottom > (navFija ? navFija.offsetHeight : 0)
        : window.scrollY < 300;
      flotante.classList.toggle("bd-float-oculto", oculto);
    };
    revisaFlotante();
    window.addEventListener("scroll", revisaFlotante, { passive: true });
    window.addEventListener("resize", revisaFlotante);
  }

  /* ------------------------------------------ servicios.html en celular
     El desglose de cada área se pliega detrás de un botón (idea C,
     25-sep-2026). El css solo lo oculta hasta 640 px, así que al girar el
     teléfono o ensanchar la ventana la lista vuelve a verse completa. */
  document.querySelectorAll('section[id^="servicios-"] .bd-split > div:last-child').forEach(function (lista, n) {
    var total = lista.querySelectorAll(".bd-serv").length;
    if (!total) return;
    var id = "bd-desglose-" + n;
    var textoCerrado = "Ver los " + total + " servicios";
    lista.id = id;
    lista.classList.add("bd-plegable");
    var boton = document.createElement("button");
    boton.type = "button";
    boton.className = "bd-ver-serv";
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-controls", id);
    boton.innerHTML = "<span>" + textoCerrado + "</span>" +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    boton.addEventListener("click", function () {
      var abre = boton.getAttribute("aria-expanded") !== "true";
      boton.setAttribute("aria-expanded", abre ? "true" : "false");
      lista.classList.toggle("bd-abierto", abre);
      boton.firstChild.textContent = abre ? "Ocultar servicios" : textoCerrado;
    });
    lista.parentNode.insertBefore(boton, lista);
  });

  /* ------------------------------------------------------------ movimiento */
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Hero animado: la imagen fija se sustituye por un video en loop con la
  // misma imagen como póster, así que no hay salto visual mientras carga.
  // Se omite con animaciones reducidas o con ahorro de datos.
  var imgHero = document.querySelector("img[data-video]");
  var ahorro = navigator.connection && navigator.connection.saveData;
  if (imgHero && !reducir && !ahorro) {
    var video = document.createElement("video");
    video.className = "bd-hero-video";
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "auto");
    video.setAttribute("poster", imgHero.getAttribute("src"));
    video.setAttribute("aria-label", imgHero.getAttribute("alt"));
    video.setAttribute("style", imgHero.getAttribute("style") || "");
    var fuente = document.createElement("source");
    fuente.src = imgHero.getAttribute("data-video");
    fuente.type = "video/mp4";
    video.appendChild(fuente);
    imgHero.replaceWith(video);
    var reproduce = function () {
      var intento = video.play();
      if (intento && intento.catch) intento.catch(function () {});
    };
    reproduce();
    // Si la página cargó en una pestaña oculta, arranca al volverse visible
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && video.paused) reproduce();
    });
  }

  if (reducir || !("IntersectionObserver" in window)) return;

  document.documentElement.classList.add("bd-js");

  // Portada del Inicio (variante C, 25-sep-2026). En escritorio el hero queda
  // fijo mientras .bd-cortina sube encima (css). Aquí el hero se reduce y se
  // desvanece al quedar tapado, la franja se apaga al empezar a bajar y, con
  // la hoja encima, el hero se oculta y su video se pausa para no gastar
  // batería reproduciendo algo que nadie ve.
  var portada = document.querySelector(".bd-portada");
  var cortina = document.querySelector(".bd-cortina");
  if (portada && cortina) {
    var navPortada = document.querySelector(".bd-nav");
    var amplia = window.matchMedia("(min-width: 901px) and (min-height: 700px)");
    var textoPortada = portada.querySelector(":scope > div:first-child");
    var figPortada = portada.querySelector("figure");
    var franja = portada.querySelector(".bd-franja");
    // La píldora flotante tapaba "Desliza para conocer más" a 1440 × 900.
    // Mientras la franja se ve, el hero ya ofrece su propio botón de
    // WhatsApp; la píldora aparece en cuanto se empieza a bajar
    var pildora = document.querySelector(".bd-float");
    var tapada = false;
    var pintaPortada = function () {
      var alto = navPortada ? navPortada.offsetHeight : 0;
      document.documentElement.style.setProperty("--nav-alto", alto + "px");
      var video = portada.querySelector("video");
      if (!amplia.matches) {
        [textoPortada, figPortada, franja].forEach(function (el) {
          if (el) { el.style.transform = ""; el.style.opacity = ""; }
        });
        portada.style.visibility = "";
        if (pildora) pildora.classList.remove("bd-float-arriba");
        if (tapada && video && video.paused) video.play().catch(function () {});
        tapada = false;
        return;
      }
      var hojaArriba = cortina.getBoundingClientRect().top;
      var p = Math.min(Math.max(1 - (hojaArriba - alto) / portada.offsetHeight, 0), 1);
      var escala = (1 - p * 0.06).toFixed(3);
      var opacidad = Math.max(1 - p * 0.9, 0).toFixed(3);
      textoPortada.style.transform = figPortada.style.transform = "scale(" + escala + ")";
      textoPortada.style.opacity = figPortada.style.opacity = opacidad;
      if (franja) franja.style.opacity = Math.max(1 - window.scrollY / 120, 0).toFixed(3);
      if (pildora) pildora.classList.toggle("bd-float-arriba", window.scrollY < 120);
      var cubre = hojaArriba <= alto;
      if (cubre !== tapada) {
        tapada = cubre;
        portada.style.visibility = cubre ? "hidden" : "";
        if (video) {
          if (cubre) video.pause();
          else video.play().catch(function () {});
        }
      }
    };
    var pidePortada = false;
    var agendaPortada = function () {
      if (pidePortada) return;
      pidePortada = true;
      requestAnimationFrame(function () { pidePortada = false; pintaPortada(); });
    };
    window.addEventListener("scroll", agendaPortada, { passive: true });
    window.addEventListener("resize", agendaPortada);
    pintaPortada();
  }

  // Sombra de la barra al bajar
  var barra = document.querySelector(".bd-nav");
  function sombra() {
    if (barra) barra.classList.toggle("bd-nav-sombra", window.scrollY > 8);
  }
  sombra();
  window.addEventListener("scroll", sombra, { passive: true });

  // Pasos con línea superior (Inicio y Nosotros): la línea se llena al aparecer
  document.querySelectorAll('main [style*="border-top:3px solid"]').forEach(function (el) {
    el.classList.add("bd-linea");
  });

  // Los tres pasos del Inicio: fijos en pantalla mientras avanzan con el scroll
  var pasos = document.getElementById("como");
  var lineasPasos = pasos ? pasos.querySelectorAll(".bd-linea") : [];

  if (pasos && lineasPasos.length) {
    var fijo = document.createElement("div");
    fijo.className = "bd-pasos-fijo";
    // El interior se puede escalar un poco para caber en pantallas bajas
    var interior = document.createElement("div");
    interior.className = "bd-pasos-interior";
    while (pasos.firstChild) interior.appendChild(pasos.firstChild);
    fijo.appendChild(interior);
    pasos.appendChild(fijo);

    var pintaPasos = function () {
      if (!pasos.classList.contains("bd-pasos-scroll")) return;
      var arriba = barra ? barra.offsetHeight : 0;
      var recorrido = pasos.offsetHeight - fijo.offsetHeight;
      var avance = recorrido > 0 ? (arriba - pasos.getBoundingClientRect().top) / recorrido : 1;
      // El último 15 % del recorrido deja los tres pasos completos a la vista
      avance = Math.min(Math.max(avance / 0.85, 0), 1);
      Array.prototype.forEach.call(lineasPasos, function (el, i) {
        var lleno = Math.min(Math.max(avance * lineasPasos.length - i, 0), 1);
        el.style.setProperty("--lleno", lleno.toFixed(3));
        el.classList.toggle("bd-paso-pendiente", i > 0 && lleno === 0);
      });
    };

    // Quedan fijos en pantallas amplias donde la sección cabe, escalada hasta
    // el 80 % si hace falta. Antes se exigían 700 px de alto y muchas laptops
    // con la escala de Windows quedaban fuera (24-sep-2026). Devuelve la
    // escala, o 0 si no cabe.
    var escalaPasos = function () {
      if (window.innerWidth < 901) return 0;
      // 64 px del relleno de la sección fija y 16 px de holgura
      var necesita = interior.offsetHeight + 64 + 16;
      var hay = window.innerHeight - (barra ? barra.offsetHeight : 0);
      var escala = Math.min(1, hay / necesita);
      return escala >= 0.8 ? escala : 0;
    };

    var ajustaModo = function () {
      var escala = escalaPasos();
      var activo = escala > 0;
      pasos.style.setProperty("--pasos-escala", activo ? escala.toFixed(3) : "1");
      pasos.classList.toggle("bd-pasos-scroll", activo);
      if (barra) pasos.style.setProperty("--nav-alto", barra.offsetHeight + "px");
      if (!activo) {
        Array.prototype.forEach.call(lineasPasos, function (el) {
          el.style.removeProperty("--lleno");
          el.classList.remove("bd-paso-pendiente");
        });
      }
      pintaPasos();
    };

    ajustaModo();
    // Las fuentes y las imágenes pueden cambiar el alto de la sección al cargar
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustaModo);
    window.addEventListener("load", ajustaModo);
    window.addEventListener("scroll", pintaPasos, { passive: true });
    window.addEventListener("resize", ajustaModo);
  }

  // Ilustraciones animadas de los pasos del Inicio. En pantallas amplias cada
  // una avanza con la línea cian de su paso; en móvil, mientras sube por la
  // pantalla. Siguen al scroll con un leve retraso para suavizar la rueda.
  var escenas = document.querySelectorAll("[data-anim]");
  if (escenas.length) {
    var suave = function (t) { return t * t * (3 - 2 * t); };
    var tramo = function (p, a, b) { return Math.min(Math.max((p - a) / (b - a), 0), 1); };
    // Curva de la lupa: entra abajo a la derecha, barre los renglones, sube al
    // título y baja a descansar sobre la barra cian.
    var curva = [[74, 60], [26, 64], [28, 6], [57, 31.5]];
    var bezier = function (t, i) {
      var u = 1 - t;
      return u * u * u * curva[0][i] + 3 * u * u * t * curva[1][i] + 3 * u * t * t * curva[2][i] + t * t * t * curva[3][i];
    };
    var pintores = {
      // Las cuatro burbujas llegan una tras otra desde su colita
      telefono: function (el, p) {
        Array.prototype.forEach.call(el.querySelectorAll(".bd-esc-burbuja"), function (b, i) {
          var t = suave(tramo(p, 0.04 + i * 0.22, 0.26 + i * 0.22));
          b.style.opacity = t.toFixed(3);
          b.style.transform = "translateY(" + ((1 - t) * 2).toFixed(2) + "cqw) scale(" + (0.6 + 0.4 * t).toFixed(3) + ")";
        });
      },
      lupa: function (el, p) {
        var t = suave(p), e = Math.min(p / 0.18, 1);
        el.style.setProperty("--x", bezier(t, 0).toFixed(2) + "cqw");
        el.style.setProperty("--y", bezier(t, 1).toFixed(2) + "cqw");
        el.style.setProperty("--o", e.toFixed(3));
        el.style.setProperty("--s", (0.9 + 0.1 * e).toFixed(3));
      },
      // Tres hojas bajan y se meten en la carpeta; al final entra la palomita
      carpeta: function (el, p) {
        Array.prototype.forEach.call(el.querySelectorAll(".bd-esc-hoja"), function (h, i) {
          var t = suave(tramo(p, 0.02 + i * 0.2, 0.3 + i * 0.2));
          h.style.opacity = Math.min(t * 2.5, 1).toFixed(3);
          h.style.transform = "translateY(" + ((1 - t) * -14).toFixed(2) + "cqw) rotate(var(--giro))";
        });
        var q = tramo(p, 0.72, 0.96), c = 1.70158;
        var rebote = q ? 1 + (c + 1) * Math.pow(q - 1, 3) + c * Math.pow(q - 1, 2) : 0;
        var palomita = el.querySelector(".bd-esc-palomita");
        palomita.style.opacity = Math.min(q * 3, 1).toFixed(3);
        palomita.style.transform = "scale(" + rebote.toFixed(3) + ")";
      }
    };
    var items = Array.prototype.map.call(escenas, function (el) {
      return { el: el, paso: el.closest(".bd-linea"), pinta: pintores[el.getAttribute("data-anim")] };
    }).filter(function (it) { return it.pinta; });
    var objetivo = function (it) {
      if (pasos && pasos.classList.contains("bd-pasos-scroll") && it.paso) {
        var v = parseFloat(it.paso.style.getPropertyValue("--lleno"));
        return isNaN(v) ? 0 : v;
      }
      var r = it.el.getBoundingClientRect(), vh = window.innerHeight;
      return Math.min(Math.max((vh * 0.95 - r.top) / (vh * 0.55), 0), 1);
    };
    var corriendo = false;
    var ciclo = function () {
      var sigue = false;
      items.forEach(function (it) {
        var meta = objetivo(it);
        it.actual += (meta - it.actual) * 0.09;
        if (Math.abs(meta - it.actual) < 0.0008) it.actual = meta; else sigue = true;
        it.pinta(it.el, it.actual);
      });
      corriendo = sigue;
      if (sigue) requestAnimationFrame(ciclo);
    };
    var arranca = function () {
      if (!corriendo) { corriendo = true; requestAnimationFrame(ciclo); }
    };
    items.forEach(function (it) { it.actual = objetivo(it); it.pinta(it.el, it.actual); });
    window.addEventListener("scroll", arranca, { passive: true });
    window.addEventListener("resize", arranca);
  }

  // Aparición al hacer scroll. Dentro de una rejilla, cada elemento entra con
  // un pequeño retraso respecto al anterior. No se animan el texto de los
  // artículos ni lo que ya se ve al cargar la página.
  var rejilla = /(^|\s)bd-(2|3|4|hero)(\s|$)/;
  var objetivos = [];
  // En celular no hay aparición (25-sep-2026): quien baja rápido veía bloques
  // vacíos. Solo se conserva el llenado de la línea de los pasos
  var movil = window.matchMedia("(max-width: 640px)").matches;

  function agrega(el, i) {
    if (el.closest(".bd-post") && !el.classList.contains("bd-post")) return;
    if (el.closest(".bd-pasos-scroll")) return;
    if (movil && !el.classList.contains("bd-linea")) return;
    // Lo que ya está en pantalla al cargar se muestra de inmediato
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.classList.add("bd-rev");
    el.style.setProperty("--i", i);
    objetivos.push(el);
  }

  document.querySelectorAll("main section").forEach(function (sec) {
    if (sec.classList.contains("bd-post")) return;
    var hijos = sec.classList.contains("bd-pasos-scroll") ? [] :
      (rejilla.test(sec.className) && !sec.classList.contains("bd-cta") ? sec.children : [sec]);
    if (hijos.length === 1 && hijos[0] === sec) {
      Array.prototype.forEach.call(sec.children, function (h) {
        if (rejilla.test(h.className) && !h.classList.contains("bd-card")) {
          Array.prototype.forEach.call(h.children, function (n, i) { agrega(n, i); });
        } else {
          agrega(h, 0);
        }
      });
    } else {
      Array.prototype.forEach.call(hijos, function (n, i) { agrega(n, i); });
    }
  });

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      observador.unobserve(el);
      el.classList.add("bd-visto");
      // Al terminar, se quitan las clases para que el hover de las tarjetas
      // recupere su transición corta
      var limpia = function (e) {
        if (e && (e.target !== el || e.propertyName !== "opacity" || e.pseudoElement)) return;
        el.removeEventListener("transitionend", limpia);
        el.classList.remove("bd-rev", "bd-visto");
        el.style.removeProperty("--i");
      };
      el.addEventListener("transitionend", limpia);
      setTimeout(limpia, 1600);
    });
  }, { rootMargin: movil ? "0px 0px -8% 0px" : "0px 0px 8% 0px", threshold: 0 });

  objetivos.forEach(function (el) { observador.observe(el); });
})();
