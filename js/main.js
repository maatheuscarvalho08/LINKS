(() => {
  "use strict";

  const CONFIG = {
    whatsappNumber: "552164032468",
  };

  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
   * WhatsApp — sem número configurado, o href="#contato" original vale.
   * ------------------------------------------------------------------ */
  if (CONFIG.whatsappNumber) {
    document.querySelectorAll("[data-whatsapp]").forEach((link) => {
      const msg = link.dataset.whatsappMessage || "Olá! Quero saber mais sobre o crédito MaisMoney.";
      link.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
      link.target = "_blank";
      link.rel = "noopener";
    });
  }

  document.querySelectorAll("[data-current-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ------------------------------------------------------------------
   * Status da loja — o foco do hero.
   * Sai do horário real de funcionamento, sempre no fuso de São Paulo:
   * quem abre o site de outro fuso precisa ver a hora da loja, não a dele.
   * ------------------------------------------------------------------ */
  const HORARIO = {
    0: null,          // domingo, fechado
    1: [540, 1080],   // segunda a sexta, 9h às 18h (em minutos)
    2: [540, 1080],
    3: [540, 1080],
    4: [540, 1080],
    5: [540, 1080],
    6: [540, 780],    // sábado, 9h às 13h
  };
  const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

  function agoraNaLoja() {
    try {
      return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    } catch {
      return new Date(); // fuso indisponível: melhor a hora local que nenhuma
    }
  }

  const hora = (min) => (min % 60 === 0 ? `${min / 60}h` : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`);

  function textoDoStatus() {
    const t = agoraNaLoja();
    const dia = t.getDay();
    const agora = t.getHours() * 60 + t.getMinutes();
    const hoje = HORARIO[dia];

    if (hoje && agora >= hoje[0] && agora < hoje[1]) {
      return { aberto: true, texto: `Aberto agora, fecha às ${hora(hoje[1])}` };
    }
    if (hoje && agora < hoje[0]) {
      return { aberto: false, texto: `Fechado, abre hoje às ${hora(hoje[0])}` };
    }

    for (let i = 1; i <= 7; i++) {
      const prox = HORARIO[(dia + i) % 7];
      if (!prox) continue;
      const quando = i === 1 ? "amanhã" : DIAS[(dia + i) % 7];
      return { aberto: false, texto: `Fechado, abre ${quando} às ${hora(prox[0])}` };
    }
    return { aberto: false, texto: "Loja em Alcântara, São Gonçalo" };
  }

  const statusEl = document.getElementById("status-loja");
  if (statusEl) {
    const pintar = () => {
      const s = textoDoStatus();
      statusEl.dataset.open = s.aberto ? "sim" : "nao";
      statusEl.querySelector("[data-status-texto]").textContent = s.texto;
    };
    pintar();
    // a loja fecha enquanto a aba está aberta; sem isto o rótulo mentiria
    setInterval(pintar, 60000);
  }

  /* ------------------------------------------------------------------
   * Cabeçalho: transparente sobre o hero, sólido depois dele.
   * Um marco de 1px no fim do hero avisa quando a seção passou por baixo,
   * então não existe listener de scroll.
   * ------------------------------------------------------------------ */
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  if (header && hero && "IntersectionObserver" in window) {
    const ALTURA = 74;
    const marco = document.createElement("div");
    marco.setAttribute("aria-hidden", "true");
    marco.style.cssText = "position:absolute;bottom:0;left:0;width:1px;height:1px;pointer-events:none";
    hero.style.position = "relative";
    hero.appendChild(marco);

    new IntersectionObserver(
      ([e]) => header.classList.toggle("is-solid", e.boundingClientRect.top < ALTURA),
      { rootMargin: `-${ALTURA}px 0px 0px 0px`, threshold: 0 }
    ).observe(marco);
  }

  /* ------------------------------------------------------------------
   * Menu mobile
   * ------------------------------------------------------------------ */
  const navToggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("nav-principal");
  if (navToggle && nav) {
    const fechar = () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Abrir menu");
    };
    navToggle.addEventListener("click", () => {
      const aberto = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(aberto));
      navToggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", fechar));
  }

  /* ------------------------------------------------------------------
   * Modalidades — abre e fecha em resposta ao clique.
   * Vários painéis podem ficar abertos: fechar o que a pessoa abriu
   * sozinho seria uma reação que ela não pediu.
   * ------------------------------------------------------------------ */
  document.querySelectorAll("[data-lines] .line__trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      const linha = btn.closest(".line");
      const aberto = linha.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(aberto));
    });
  });

  /* ------------------------------------------------------------------
   * Mídia — a imagem só entra depois de carregar; se o arquivo não
   * existir, o texto de fallback continua no lugar.
   * ------------------------------------------------------------------ */
  function carregarImagem(src) {
    return new Promise((ok, falha) => {
      const probe = new Image();
      probe.onload = () => ok(src);
      probe.onerror = falha;
      probe.src = src;
    });
  }

  function carregarMidia(escopo) {
    const raiz = escopo || document;

    raiz.querySelectorAll("img[data-media]").forEach((img) => {
      if (img.dataset.lida) return;
      img.dataset.lida = "1";
      const src = img.getAttribute("data-media");
      carregarImagem(src).then(() => {
        img.src = src;
        img.hidden = false;
        const alt = img.parentElement && img.parentElement.querySelector("[data-fallback]");
        if (alt) alt.hidden = true;
      }).catch(() => {});
    });

    raiz.querySelectorAll("[data-media-bg]").forEach((el) => {
      if (el.dataset.lida) return;
      el.dataset.lida = "1";
      const src = el.getAttribute("data-media-bg");
      carregarImagem(src).then(() => {
        el.style.backgroundImage = `url("${src}")`;
      }).catch(() => {});
    });
  }

  /* ------------------------------------------------------------------
   * Esteira de bancos — faixa informativa, não interativa.
   * ------------------------------------------------------------------ */
  function esteiraDeLogos(track) {
    if (!track || REDUCED_MOTION) return;
    const originais = Array.from(track.children);
    if (!originais.length) return;

    const clonar = () => {
      originais.forEach((li) => {
        const c = li.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.querySelectorAll("img").forEach((i) => {
          i.setAttribute("alt", "");
          delete i.dataset.lida; // senão o carregador pularia o clone
        });
        track.appendChild(c);
      });
    };

    // um conjunto só não cobre a tela: repete até passar de duas larguras
    clonar();
    let guarda = 0;
    while (track.scrollWidth < window.innerWidth * 2 && guarda++ < 12) clonar();

    carregarMidia(track);

    const VELOCIDADE = 42; // px/s
    let offset = 0;
    let laco = 0;
    const medir = () => {
      const ref = track.children[originais.length];
      laco = ref ? ref.offsetLeft - track.children[0].offsetLeft : 0;
    };
    medir();
    window.addEventListener("resize", medir);

    let ultimo = performance.now();
    (function quadro(agora) {
      const dt = Math.min((agora - ultimo) / 1000, 0.1);
      ultimo = agora;
      if (laco > 0) {
        offset = (offset + VELOCIDADE * dt) % laco;
        track.style.transform = `translateX(${-offset}px)`;
      }
      requestAnimationFrame(quadro);
    })(ultimo);
  }

  /* ------------------------------------------------------------------
   * Vídeo do hero — 8 MB, então não baixa em tela estreita nem sob
   * movimento reduzido. Sem ele fica o poster, que é um frame do vídeo.
   * ------------------------------------------------------------------ */
  const video = document.querySelector(".hero__frame video");
  if (video && !REDUCED_MOTION && window.matchMedia("(min-width: 768px)").matches && video.dataset.src) {
    video.muted = true;
    video.src = video.dataset.src;
    const tocar = video.play();
    if (tocar && tocar.catch) tocar.catch(() => {});
  }

  carregarMidia(document);
  esteiraDeLogos(document.querySelector("[data-logo-track]"));
})();
