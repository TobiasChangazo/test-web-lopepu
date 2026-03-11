(() => {
    function updateStatus() {
        const pill = document.getElementById('status-pill');
        const texto = document.getElementById('estado-texto-nuevo');
        if (!pill || !texto) return;

        const ahora = new Date();
        const dia = ahora.getDay(); // 0 domingo, 1 lunes...
        const horas = ahora.getHours();
        const minutos = ahora.getMinutes();

        // Convertimos todo a minutos totales transcurridos en el día para comparar fácil
        // Ejemplo: 19:30 = (19 * 60) + 30 = 1170 minutos
        const tiempoActual = (horas * 60) + minutos;

        // Definimos los puntos de corte en minutos
        const min1900 = 19 * 60;          // 1140 min
        const min1930 = (19 * 60) + 30;   // 1170 min
        const min2230 = (22 * 60) + 30;   // 1350 min
        const min2300 = 23 * 60;          // 1380 min

        // 1. Validar si es Lunes (Día 1)
        if (dia === 1) {
            pill.className = 'lp-pill pill-closed';
            texto.innerText = 'Cerrado';
            return;
        }

        // 2. Lógica de horarios (Martes a Domingo)
        if (tiempoActual >= min1900 && tiempoActual < min1930) {
            // 19:00 a 19:29
            pill.className = 'lp-pill pill-warning'; // Usamos warning para el color naranja/amarillo
            texto.innerText = 'Abre Pronto';

        } else if (tiempoActual >= min1930 && tiempoActual < min2230) {
            // 19:30 a 22:29
            pill.className = 'lp-pill pill-open';
            texto.innerText = 'Abierto';

        } else if (tiempoActual >= min2230 && tiempoActual < min2300) {
            // 22:30 a 22:59
            pill.className = 'lp-pill pill-warning';
            texto.innerText = 'Cierra Pronto';

        } else {
            // Cualquier otro horario
            pill.className = 'lp-pill pill-closed';
            texto.innerText = 'Cerrado';
        }
    }

    // Ejecutar al cargar
    document.addEventListener('DOMContentLoaded', updateStatus);

    function foldAccents(str) {
        return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    (function initSearch() {
        const input = document.getElementById('lp-search');
        if (!input) return;

        const productSelectors = [
            '#promos .card-horizontal', '#pizzas .card-horizontal',
            '#empanadas .card-horizontal', '#tartas .card-horizontal',
            '#bebidas .card-horizontal', '#conos .card-horizontal'
        ];

        const nonProductSelectors = [
            '#empanadas .bloque-precio-empanadas',
            '#conos .bloque-promo-conos',
            '#conos .nota-conos'
        ];

        const chips = [...document.querySelectorAll('#lp-nav .nav-chip')];
        const sections = [...document.querySelectorAll('.section')];
        const getActiveTarget = () => chips.find(c => c.classList.contains('active'))?.dataset.target;

        function showAllSections() {
            sections.forEach(sec => sec.classList.add('active'));
        }

        function filterProducts(q) {
            const qFold = foldAccents(q.trim());
            if (qFold) {
                showAllSections();
            } else {
                const target = getActiveTarget() || 'promos';
                showOnly(target);
            }

            productSelectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(card => {
                    const txt = [
                        card.innerText || '',
                        card.getAttribute('data-tags') || '',
                        card.getAttribute('data-name') || ''
                    ].join(' ');
                    const txtFold = foldAccents(txt);
                    card.style.display = qFold ? (txtFold.includes(qFold) ? '' : 'none') : '';
                });
            });

            nonProductSelectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    el.style.display = qFold ? 'none' : '';
                });
            });
        }

        input.addEventListener('input', () => filterProducts(input.value));
    })();

    const initUI = () => {
        const btnHorarios = document.getElementById('toggle-horarios');
        const detalleHorarios = document.getElementById('horarios-detalle');
        btnHorarios?.addEventListener('click', () => {
            if (!detalleHorarios) return;
            const visible = window.getComputedStyle(detalleHorarios).display !== 'none';
            detalleHorarios.style.display = visible ? 'none' : 'block';
        });

        const sobreNosotrosOverlay = document.getElementById('sobre-nosotros-overlay');
        const sobreNosotros = document.getElementById('sobre-nosotros');
        const cerrarSobreNosotros = document.getElementById('cerrar-sobre-nosotros');
        const logo = document.querySelector('.logo-redondo');

        const abrirSobreNosotros = () => {
            if (!sobreNosotros || !sobreNosotrosOverlay) return;
            sobreNosotrosOverlay.classList.add('visible');
            sobreNosotros.classList.add('visible');
            document.body.style.overflow = 'hidden';
            setTimeout(() => sobreNosotros.focus(), 10);
        };

        const cerrarSobre = () => {
            if (!sobreNosotros || !sobreNosotrosOverlay) return;
            sobreNosotrosOverlay.classList.remove('visible');
            sobreNosotros.classList.remove('visible');
            document.body.style.overflow = '';
        };

        logo?.addEventListener('click', abrirSobreNosotros);
        cerrarSobreNosotros?.addEventListener('click', cerrarSobre);
        sobreNosotrosOverlay?.addEventListener('click', cerrarSobre);
        window.addEventListener('keydown', e => {
            if (e.key === 'Escape' && sobreNosotros?.classList.contains('visible')) cerrarSobre();
        });

        actualizarEstado();
        setInterval(actualizarEstado, 60_000);

        const tipoPizza = document.getElementById("tipo-pizza");
        const gusto1 = document.getElementById("gusto1");
        const gusto2 = document.getElementById("gusto2");

        if (tipoPizza && gusto1 && gusto2) {
            syncGustos(gusto1, gusto2, tipoPizza);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }

    const CART_KEY = 'lopepu-cart';
    const fmt = n => '$ ' + (n || 0).toLocaleString('es-AR');

    function compressLines(lines) {
        const order = [];
        const counts = new Map();

        (lines || []).forEach(l => {
            const key = String(l || '').trim();
            if (!key) return;
            if (!counts.has(key)) order.push(key);
            counts.set(key, (counts.get(key) || 0) + 1);
        });

        return order.map(key => {
            const n = counts.get(key) || 1;
            return n > 1 ? `(x${n}) ${key}` : key;
        });
    }

    function buildWhatsappMessage() {
        const cartRaw = getCart();
        const cart = buildCartView(cartRaw); // promos ya aplicadas como en el carrito

        const nombre = document.getElementById('cd-nombre')?.value.trim() || '';
        const pago = document.querySelector('input[name="cd-pago"]:checked')?.value || '';

        const modo = document.querySelector('.cd-mode__card.is-active')?.dataset.mode || 'retiro';

        const calle = document.getElementById('cd-calle')?.value.trim() || '';
        const numero = document.getElementById('cd-num')?.value.trim() || '';
        const ref = document.getElementById('cd-ref')?.value.trim() || '';

        const fmtMoney = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

        // Convierte cualquier cosa (string/obj) a una línea legible
        const toLine = (raw) => {
            if (raw == null) return '';
            if (typeof raw === 'string' || typeof raw === 'number') return String(raw).trim();
            if (typeof raw === 'object') {
                const name = (raw.name ?? raw.title ?? '').toString().trim();
                const q = Number(raw.qty) || 1;
                if (!name) return '';
                return `${q > 1 ? `(x${q}) ` : ''}${name}`.trim();
            }
            return String(raw).trim();
        };

        // ===== TOTAL (igual que carrito) =====
        let totalFinal = 0;

        // ===== PROMOS APLICADAS =====
        const promoLabels = cart
            .filter(it => it.type === 'promo')
            .map(p => `${p.name}${(Number(p.qty) || 1) > 1 ? ` (x${Number(p.qty) || 1})` : ''}`);

        // ===== ARMAR PEDIDO =====
        let pedidoTxt = '';

        // ===== AGRUPADOR GLOBAL DE PIZZAS ENTERAS (solo las que NO tienen detalles) =====
        // key: "Muzzarella|Grande" -> qty total
        const pizzasAgg = new Map();
        const addPizzaAgg = (name, sizeName, qty) => {
            const n = String(name || '').trim();
            const s = String(sizeName || '').trim();
            if (!n) return;
            const key = `${n}|${s}`;
            pizzasAgg.set(key, (pizzasAgg.get(key) || 0) + (Number(qty) || 1));
        };

        // helpers
        const sizeNameFromIt = (it) =>
            it.size === 'g' ? 'Grande' :
                it.size === 's' ? 'Chica' :
                    it.size === 'half' ? '1/2' : '';

        const sizeLabelFromName = (sizeName) => {
            if (!sizeName) return '';
            if (sizeName === '1/2') return ''; // ❌ no mostrar (1/2)
            return ` (${sizeName})`;
        };

        cart.forEach(it => {
            const qty = Number(it.qty) || 1;

            const opts = Array.isArray(it.options) ? it.options : [];
            const optsTotal = opts.reduce((s, o) => s + (Number(o.price) || 0) * (Number(o.qty) || 1), 0);

            const unit = (Number(it.basePrice) || 0) + optsTotal;
            totalFinal += unit * qty;

            // ===== Detectar si esta pizza tiene "gustos/detalles" =====
            const hasSections = Array.isArray(it.sections) && it.sections.length > 0;
            const hasPizzaLinesInOptions = opts.some(o => /^PIZZA\s*:/i.test(String(o?.name || o || '')));

            const isPizzaWithDetails = (it.type === 'pizza') && (hasSections || hasPizzaLinesInOptions);

            // ===== 1) IMPRIMIR TITULO (promo / pizza con detalles / otros) =====
            if (it.type === 'promo') {
                // ✅ MOSTRAR SIEMPRE el titulo de la promo
                pedidoTxt += `${qty > 1 ? `(x${qty}) ` : ''}${it.name}\n`;
            } else if (isPizzaWithDetails) {
                // ✅ pizza suelta con gustos: mostrar encabezado + luego detalles
                const sizeName = sizeNameFromIt(it);
                pedidoTxt += `${qty > 1 ? `(x${qty}) ` : ''}${it.name}${sizeLabelFromName(sizeName)}\n`;
            } else if (it.type === 'pizza') {
                // pizza simple sin detalles -> va al agregador global
                const sizeName = sizeNameFromIt(it);
                const cleanName = it.name
                    .replace(/\s+Chica$/i, '')
                    .replace(/\s+Grande$/i, '')
                    .trim();

                addPizzaAgg(cleanName, sizeName, qty);
            } else {
                // cualquier otro producto normal
                pedidoTxt += `${qty > 1 ? `(x${qty}) ` : ''}${it.name}\n`;
            }

            // ===== 2) SECTIONS (para promos y pizzas con detalles / 1/2 y 1/2) =====
            if (Array.isArray(it.sections) && it.sections.length) {
                const pizzaLines = [];
                const empLines = [];

                it.sections.forEach(sec => {
                    const title = String(sec.title || '').trim().toUpperCase();
                    const lines = (sec.lines || []).map(toLine).filter(Boolean);
                    if (!lines.length) return;

                    if (!title && (it.type === 'pizza' || /^1\/2/i.test(it.name))) {
                        pizzaLines.push(...lines); // ✅ FIX (antes tenías pizzaLines.push(.lines))
                        return;
                    }
                    if (title.startsWith('PIZZA')) {
                        pizzaLines.push(...lines); // ✅ FIX
                        return;
                    }
                    if (title.startsWith('EMP')) {
                        empLines.push(...lines);
                        return;
                    }

                    // fallback por si viene otro título
                    if (it.type === 'promo') {
                        // si es promo y no sabemos el título, lo tratamos como detalle de pizza
                        pizzaLines.push(...lines);
                    }
                });

                if (pizzaLines.length) {
                    const compressed = compressLines(pizzaLines);
                    const parts = compressed.map(p => p.replace(/^PIZZA\s*:\s*/i, '').trim()).filter(Boolean);

                    // si las líneas ya vienen con 1/2, las dejamos tal cual
                    if (parts.length) pedidoTxt += `PIZZA: ${parts.join(' , ')}\n`;
                }

                if (empLines.length) {
                    const compressed = compressLines(empLines);
                    pedidoTxt += `EMPANADAS: ${compressed.join(' , ')}\n`;
                }
            }

            // ===== 3) OPCIONAL / GUSTOS / COMENTARIO =====
            const opcional = [];
            const gustos = [];

            opts.forEach(o => {
                const n = toLine(o);
                if (!n) return;

                if (/^Gusto\s*\d*\s*:/i.test(n) || /^Gustos?\s*:/i.test(n)) {
                    gustos.push(
                        n.replace(/^Gusto\s*\d*\s*:\s*/i, '')
                            .replace(/^Gustos?\s*:\s*/i, '')
                            .trim()
                    );
                    return;
                }

                if (/^(CON|SIN)\b/i.test(n)) {
                    opcional.push(n.trim());
                    return;
                }
            });

            if (opcional.length) pedidoTxt += `   ↳ Opcional: ${opcional.join(' , ')}\n`;
            if (gustos.length) pedidoTxt += `   ↳ Gustos: ${gustos.join(' y ')}\n`;

            const noteVal = String(it.comment || it.note || '').trim();
            if (noteVal) pedidoTxt += `   ↳ Comentario: ${noteVal}\n`;

            pedidoTxt += `\n`;
        });

        // ===== IMPRIMIR PIZZAS AGRUPADAS (UNA SOLA VEZ) =====
        if (pizzasAgg.size) {
            let out = '';
            pizzasAgg.forEach((q, key) => {
                const [name, sizeName] = key.split('|');
                out += `(x${q}) ${name}${sizeLabelFromName(sizeName)}\n`;
            });
            // las ponemos arriba del resto del pedido
            pedidoTxt = `${out}\n${pedidoTxt}`.trim() + '\n';
        }

        // ===== CABECERA SEGÚN ENTREGA =====
        let header = '';
        header += `Nombre y Apellido: ${nombre}\n`;

        if (modo === 'envio') {
            header += `Forma de entrega: Envío\n`;
            header += `Dirección: ${[calle, numero].filter(Boolean).join(' ')}\n`;
            if (ref) header += `Referencia: ${ref}\n`;
        } else {
            header += `Forma de entrega: Retiro\n`;
        }

        header += `Medio de pago: ${pago}\n\n`;
        header += `----------------------\n\n`;
        header += `Pedido:\n\n`;

        // ===== FOOTER =====
        let footer = '';
        footer += `\n----------------------\n\n`;
        footer += `Total: ${fmtMoney(totalFinal)}\n`;
        if (promoLabels.length) footer += `Promos Aplicadas: ${promoLabels.join(' | ')}\n`;

        return `${header}${pedidoTxt}${footer}`.trim();
    }

    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        } catch {
            return [];
        }
    }
    function setCart(arr) {
        localStorage.setItem(CART_KEY, JSON.stringify(arr));
        renderCart();
        if (typeof updateCartFab === 'function') updateCartFab();
    }

    function addToCart(item) {
        const cart = getCart();
        cart.push(item);
        setCart(cart);
        updateCartFab();
    }

    /* DRAWER */
    const elDrawer = document.getElementById('cart-drawer');
    const elOverlay = document.getElementById('cart-overlay');
    const elList = document.getElementById('cart-list');
    const elTotal = document.getElementById('cart-total');
    const elClose = document.getElementById('cart-close');
    const btnOpen = document.getElementById('open-cart');
    const btnClear = document.getElementById('cd-clear');
    const btnCheck = document.getElementById('cd-checkout');
    const formWrap = document.getElementById('cd-form');
    const sendBtn = document.getElementById('cd-send');
    const modeSel = document.getElementById('cd-mode');
    const addrWrap = document.getElementById('cd-addr-wrap');

    // ===== PASO 2: ENTREGA =====
    const btnContinue = document.getElementById('cart-continue');
    const step2 = document.getElementById('cd-step2');
    const step2Back = document.getElementById('cd-step2-back');

    const modeCards = document.querySelectorAll('.cd-mode__card');
    const boxEnvio = document.getElementById('cd-envio');
    const shipNote = document.getElementById('cd-shipnote');

    function showStep2() {
        if (!elDrawer) return;

        elDrawer.classList.add('is-step2');

        // si todavía tenés estas refs, dejalas
        if (elList) elList.hidden = true;
        if (step2) step2.hidden = false;

        const sumWrap = elDrawer.querySelector('.cd-summary');
        const actWrap = elDrawer.querySelector('.cd-actions');
        if (sumWrap) sumWrap.style.display = 'none';
        if (actWrap) actWrap.style.display = 'none';
    }

    function hideStep2() {
        if (!elDrawer) return;

        elDrawer.classList.remove('is-step2');

        if (elList) elList.hidden = false;
        if (step2) step2.hidden = true;

        const sumWrap = elDrawer.querySelector('.cd-summary');
        const actWrap = elDrawer.querySelector('.cd-actions');
        if (sumWrap) sumWrap.style.display = '';
        if (actWrap) actWrap.style.display = '';
    }

    function setEntregaMode(mode) {
        modeCards.forEach(b => b.classList.toggle('is-active', b.dataset.mode === mode));

        const isEnvio = mode === 'envio';
        if (boxEnvio) boxEnvio.hidden = !isEnvio;
        if (shipNote) shipNote.hidden = !isEnvio;
    }

    btnContinue?.addEventListener('click', showStep2);
    step2Back?.addEventListener('click', hideStep2);

    modeCards.forEach(b => b.addEventListener('click', () => setEntregaMode(b.dataset.mode)));

    // default
    setEntregaMode('retiro');

    const btnEnviarPedido = document.getElementById('cd-step2-confirm');
    const inputCalle = document.getElementById('cd-calle');
    const inputNumero = document.getElementById('cd-num');

    // BUSCA ESTE BLOQUE Y REEMPLÁZALO COMPLETO:
    btnEnviarPedido?.addEventListener('click', () => {
        const modoActivo = document.querySelector('.cd-mode__card.is-active')?.dataset.mode;

        // 1. LIMPIEZA DE ERRORES PREVIOS
        // Quitamos la clase de error del nombre y los pagos
        const inputNombre = document.getElementById('cd-nombre');
        inputNombre?.classList.remove('is-error');

        document.querySelectorAll('.cd-radio').forEach(r => r.classList.remove('is-error'));

        // Quitamos la clase de error de calle/número (si hubiera)
        inputCalle?.classList.remove('is-error');
        inputNumero?.classList.remove('is-error');

        // Borramos mensajes de error viejos (tanto de cliente como de envío)
        document.querySelectorAll('.cd-field-error-msg, .cd-envio-error').forEach(e => e.remove());

        // 2. VALIDACIÓN DE DATOS DEL CLIENTE (Nombre y Pago)
        let clienteError = false;
        const pagoSeleccionado = document.querySelector('input[name="cd-pago"]:checked');

        // Validar Nombre
        if (!inputNombre?.value.trim()) {
            inputNombre?.classList.add('is-error');
            clienteError = true;
        }

        // Validar Pago
        if (!pagoSeleccionado) {
            // Marcamos ambas opciones en rojo para indicar que falta seleccionar una
            document.querySelectorAll('.cd-radio').forEach(r => r.classList.add('is-error'));
            clienteError = true;
        }

        // Si falta Nombre o Pago, mostramos mensaje y cortamos
        if (clienteError) {
            const box = document.createElement('div');
            box.className = 'cd-field-error-msg'; // Usamos la nueva clase CSS
            box.textContent = 'Por favor completá tu Nombre y Medio de Pago.';
            document.getElementById('cd-cliente')?.appendChild(box);
            return; // <--- Importante: detiene la ejecución aquí
        }

        // 3. VALIDACIÓN DE ENVÍO (Solo si el modo es "envio")
        if (modoActivo === 'envio') {
            const calle = inputCalle?.value.trim();
            const numero = inputNumero?.value.trim();

            if (!calle || !numero) {
                if (!calle) inputCalle?.classList.add('is-error');
                if (!numero) inputNumero?.classList.add('is-error');

                const box = document.createElement('div');
                box.className = 'cd-envio-error'; // Usamos la clase que ya tenías
                box.textContent = 'Para envío a domicilio, completá Calle y Número.';
                document.getElementById('cd-envio')?.appendChild(box);
                return; // <--- Detiene la ejecución si falta dirección
            }
        }

        // 4. SI TODO ESTÁ BIEN: ARMAR WHATSAPP
        const mensaje = buildWhatsappMessage();
        const phone = '5492324674311'; // Tu número
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');

        // Vaciar carrito y cerrar
        localStorage.removeItem(CART_KEY);
        renderCart?.();
        closeCart?.();
    });

    btnOpen?.addEventListener('click', openCart);
    elClose?.addEventListener('click', closeCart);
    elOverlay?.addEventListener('click', closeCart);

    btnClear?.addEventListener('click', () => setCart([]));

    btnCheck?.addEventListener('click', () => {
        if (!formWrap || !elList) return;
        formWrap.hidden = false;
        elList.scrollTop = elList.scrollHeight;
    });

    modeSel?.addEventListener('change', () => {
        if (!addrWrap || !modeSel) return;
        addrWrap.hidden = modeSel.value !== 'envio';
    });

    function getPromoPrice(promoId) {
        const el = document.querySelector(`[data-promo-id="${promoId}"]`);
        if (el) return (Number(el.dataset.price) || 0);

        // fallback hardcode (por si no existe card en HTML)
        const MAP = {
            "2muzza": 19000,
            "esp+muzza": 21500,
            "2esp": 23000,
            "3esp": 34500,
            "3muzza": 28500,

            "emp6": 8000,
            "emp12": 15000,
            "emp24": 29000,

            // ya las que tenías antes (por si las usás)
            "muzza+6": 17500,
            "esp+6": 19500,
            "muzza+12": 24500,
            "esp+12": 26500,
        };
        return MAP[promoId] || 0;
    }


    function calcAutoPromos(cart) {
        // ignorar si el usuario ya agregó promos manuales
        if (cart.some(it => it.type === "promo")) return { discount: 0, label: "" };

        // contar empanadas
        const empCount = cart
            .filter(it => it.type === "empanada")
            .reduce((s, it) => s + (Number(it.qty) || 1), 0);

        // pizzas elegibles SOLO grande o half (chica NO entra en promos)
        const pizzas = cart.filter(it =>
            it.type === "pizza" && (it.size === "g" || it.size === "half")
        );

        let muzzaUnits = 0;
        let espUnits = 0;

        pizzas.forEach(it => {
            if (it.tier === "super") return;

            const q = Number(it.qty) || 1;

            if (it.tier === "muzza") {
                muzzaUnits += it.size === "half" ? 0.5 * q : 1 * q;
            }

            if (it.tier === "esp") {
                espUnits += it.size === "half" ? 0.5 * q : 1 * q;
            }
        });

        const muzzaPizzas = Math.floor(muzzaUnits);
        const espPizzas = Math.floor(espUnits);

        // ===== elegir 1 promo “pizza + empanadas” (la más grande posible)
        // prioridad: 12 emp > 6 emp
        let best = { discount: 0, label: "" };

        function tryPromo(promoId, needTier, needEmp) {
            const pricePromo = getPromoPrice(promoId);
            if (!pricePromo) return;

            const hasPizza = (needTier === "muzza") ? (muzzaPizzas >= 1) : (espPizzas >= 1);
            if (!hasPizza) return;
            if (empCount < needEmp) return;

            // calcular normal: 1 pizza grande del tier (usamos precio grande “oficial” del tier)
            // muzza grande = 10000, especial grande = 12000
            const pizzaNormal = (needTier === "muzza") ? 10000 : 12000;

            // empanadas normal: $1500 c/u (según tus cards).
            const empNormal = 1500 * needEmp;

            const normal = pizzaNormal + empNormal;
            const discount = Math.max(0, normal - pricePromo);

            if (discount > best.discount) {
                best = {
                    discount,
                    label: `Promo aplicada: ${promoId} (${needEmp} emp)`
                };
            }
        }

        // promo ids...
        tryPromo("muzza+12", "muzza", 12);
        tryPromo("esp+12", "esp", 12);
        tryPromo("muzza+6", "muzza", 6);
        tryPromo("esp+6", "esp", 6);

        return best;
    }

    // ===== ARMAR "VISTA" DEL CARRITO (fusiona 1/2 + aplica promos auto) =====
    function buildCartView(cart) {
        const items = cart.map((it, i) => ({ ...it, _src: [i] }));

        const tierLabel = (tier) => tier === 'muzza' ? 'Muzzarella'
            : tier === 'esp' ? 'Especial'
                : tier === 'super' ? 'Super'
                    : 'Pizza';

        const tierFullPrice = (tier) => tier === 'muzza' ? 10000
            : tier === 'esp' ? 12000
                : tier === 'super' ? 13500
                    : 0;

        const halfComboPrice = (t1, t2) => {
            const a = String(t1 || 'unk');
            const b = String(t2 || 'unk');
            const key = [a, b].sort().join('+');

            const MAP = {
                'esp+muzza': 11000,
                'muzza+super': 11800,
                'esp+super': 12800,
            };
            return MAP[key] || 0;
        };

        // juntar extras/opcionales: si lo ponen en una mitad, aplica a toda la pizza
        const mergeOptions = (a, b) => {
            const norm = (s) => String(s || '').trim().toLowerCase();
            const map = new Map();

            [a, b].forEach(arr => {
                (Array.isArray(arr) ? arr : []).forEach(o => {
                    const key = norm(o?.name);
                    if (!key) return;

                    const qty = Number(o.qty) || 1;
                    const price = Number(o.price) || 0;

                    if (!map.has(key)) {
                        map.set(key, { name: o.name, price, qty });
                    } else {
                        const prev = map.get(key);
                        prev.qty = Math.max(prev.qty, qty);
                        prev.price = Math.max(prev.price, price);
                    }
                });
            });

            return Array.from(map.values());
        };

        const mergeNote = (n1, n2) => {
            const a = Array.isArray(n1) ? n1.join(' ') : String(n1 || '').trim();
            const b = Array.isArray(n2) ? n2.join(' ') : String(n2 || '').trim();
            if (!a && !b) return '';
            if (a && !b) return a;
            if (!a && b) return b;
            return a === b ? a : `${a} | ${b}`;
        };

        // opcionales SIN el comentario (evita que "Comentario: ..." aparezca en EXTRAS/OPCIONALES)
        const isCommentLike = (s) => {
            const t = String(s || '').trim().toLowerCase();
            return t.startsWith('comentario') || t.startsWith('comment');
        };

        const mergePickedOptions = (picked) => {
            const merged = [];
            const seen = new Set();
            picked.forEach(pz => {
                (Array.isArray(pz.options) ? pz.options : []).forEach(o => {
                    const name = String(o?.name || '').trim();
                    if (!name) return;
                    if (isCommentLike(name)) return; // <- clave para que no se cuele
                    const q = Number(o?.qty) || 1;
                    const pr = Number(o?.price) || 0;
                    const key = `${name}|${q}|${pr}`;
                    if (seen.has(key)) return;
                    seen.add(key);
                    merged.push({ name, qty: q, price: pr });
                });
            });
            return merged;
        };

        const mergePickedNote = (picked) => {
            return [...new Set(
                picked.map(pz => String(pz.note || '').trim()).filter(Boolean)
            )].join(' / ');
        };

        // 1) Fusionar 2 medias -> 1 pizza grande con detalles
        const used = new Set();
        const halfBuckets = { muzza: [], esp: [], super: [] };

        items.forEach((it, idx) => {
            if (it.type === 'pizza' && it.size === 'half' && (it.tier in halfBuckets)) {
                halfBuckets[it.tier].push({ it, idx });
            }
        });

        const out = [];
        for (let i = 0; i < items.length; i++) {
            if (used.has(i)) continue;
            const it = items[i];

            if (it.type === 'pizza' && it.size === 'half' && it.tier && (it.tier in halfBuckets)) {
                // buscamos otra media disponible (la primera que haya)
                const pair = items
                    .map((cand, idx) => ({ cand, idx }))
                    .find(x =>
                        x.idx !== i &&
                        !used.has(x.idx) &&
                        x.cand.type === 'pizza' &&
                        x.cand.size === 'half' &&
                        x.cand.tier &&
                        (x.cand.tier in halfBuckets)
                    );

                if (pair) {
                    const pairIt = pair.cand;

                    used.add(i);
                    used.add(pair.idx);

                    const cleanName = (n) => String(n || '').replace(/^1\/2\s+/i, '');

                    const t1 = it.tier;
                    const t2 = pairIt.tier;
                    const mixed = (t1 !== t2);

                    const merged = {
                        type: 'pizza',
                        tier: mixed ? 'mix' : t1,
                        size: 'g',
                        qty: 1,
                        basePrice: mixed ? halfComboPrice(t1, t2) : tierFullPrice(t1),
                        name: mixed
                            ? `1/2 ${tierLabel(t1)} y 1/2 ${tierLabel(t2)}`
                            : `${tierLabel(t1)}`,
                        options: mergeOptions(it.options, pairIt.options),
                        note: mergeNote(it.note, pairIt.note),
                        _src: [...(it._src || []), ...(pairIt._src || [])],
                        sections: [{
                            title: '',
                            lines: [
                                `1/2 ${cleanName(it.name)}`,
                                `1/2 ${cleanName(pairIt.name)}`
                            ]
                        }]
                    };

                    out.push(merged);
                    continue;
                }
            }

            out.push(it);
        }

        // 2) Aplicar promos automáticas (pizza + empanadas)
        const promos = [
            { tier: 'esp', emp: 12, id: 'esp+12', label: '1 Especial + 1 Docena' },
            { tier: 'muzza', emp: 12, id: 'muzza+12', label: '1 Muzzarella + 1 Docena' },
            { tier: 'esp', emp: 6, id: 'esp+6', label: '1 Especial + 1/2 Docena' },
            { tier: 'muzza', emp: 6, id: 'muzza+6', label: '1 Muzzarella + 1/2 Docena' },
        ];

        function consumeEmpanadas(empItems, need) {
            const taken = [];
            let left = need;

            for (const e of empItems) {
                if (left <= 0) break;
                const q = Number(e.qty) || 1;
                const take = Math.min(q, left);
                if (take > 0) {
                    taken.push({ ...e, qty: take });
                    e.qty = q - take;
                    left -= take;
                }
            }
            return { taken, ok: left === 0 };
        }

        let view = out.map(x => ({ ...x, _src: Array.isArray(x._src) ? x._src : [] }));

        const totalEmpCount = () =>
            view.filter(it => it.type === 'empanada' && (Number(it.qty) || 0) > 0)
                .reduce((s, it) => s + (Number(it.qty) || 0), 0);

        const firstPizzaUnitOfTier = (tier) =>
            view.find(it =>
                it.type === 'pizza' &&
                it.tier === tier &&
                it.size === 'g' &&
                (Number(it.qty) || 0) > 0
            );

        const consumePizzaLines = (pizza) => {
            const lines = [];
            if (Array.isArray(pizza.sections) && pizza.sections.length) {
                pizza.sections.forEach(sec => (sec.lines || []).forEach(l => lines.push(l)));
            } else {
                lines.push(pizza.name);
            }
            return lines;
        };

        for (const p of promos) {
            while (true) {
                const pizza = firstPizzaUnitOfTier(p.tier);
                if (!pizza) break;
                if (totalEmpCount() < p.emp) break;

                const empList = view.filter(it => it.type === 'empanada' && (Number(it.qty) || 0) > 0);
                const { taken, ok } = consumeEmpanadas(empList, p.emp);
                if (!ok) break;

                const price = getPromoPrice(p.id) || 0;
                if (!price) break;

                const pizzaLines = consumePizzaLines(pizza);
                const empLines = taken.map(t =>
                    `(x${Number(t.qty) || 1}) ${t.name}`
                );

                // promo: hereda opcionales + comentario SOLO de la pizza usada (1 unidad)
                const picked = [pizza];
                const mergedOptions = mergePickedOptions(picked);
                const mergedNote = mergePickedNote(picked);

                const promoItem = {
                    type: 'promo',
                    qty: 1,
                    basePrice: price,
                    name: p.label,
                    options: mergedOptions,
                    note: mergedNote,
                    sections: [
                        { title: 'PIZZAS', lines: pizzaLines },
                        { title: 'EMPANADAS', lines: empLines }
                    ],
                    _src: picked.flatMap(pp => pp._src || []).concat(taken.flatMap(t => t._src || []))
                };

                // consumir 1 pizza
                pizza.qty = (Number(pizza.qty) || 0) - 1;

                const insertAt = view.indexOf(pizza);
                view.splice(insertAt, 0, promoItem);

                view = view.filter(it => (Number(it.qty) || 0) > 0);
            }
        }

        // ===== PROMOS SOLO PIZZAS (sin super) =====
        function tryPizzaPromo(id, label, take) {
            while (true) {
                if (take.muzza) {
                    const countM = view
                        .filter(it => it.type === 'pizza' && it.tier === 'muzza' && it.size === 'g' && (Number(it.qty) || 0) > 0)
                        .reduce((s, it) => s + (Number(it.qty) || 0), 0);
                    if (countM < take.muzza) break;
                }
                if (take.esp) {
                    const countE = view
                        .filter(it => it.type === 'pizza' && it.tier === 'esp' && it.size === 'g' && (Number(it.qty) || 0) > 0)
                        .reduce((s, it) => s + (Number(it.qty) || 0), 0);
                    if (countE < take.esp) break;
                }

                const picked = [];

                const takeUnits = (tier, need) => {
                    let remaining = need;
                    for (const it of view) {
                        if (it.type === 'pizza' && it.tier === tier && it.size === 'g' && (Number(it.qty) || 0) > 0) {
                            const avail = Number(it.qty) || 0;
                            const n = Math.min(avail, remaining);
                            for (let k = 0; k < n; k++) picked.push(it);
                            remaining -= n;
                            if (remaining <= 0) break;
                        }
                    }
                    return remaining <= 0;
                };

                if (take.muzza && !takeUnits('muzza', take.muzza)) break;
                if (take.esp && !takeUnits('esp', take.esp)) break;

                const price = getPromoPrice(id) || 0;
                if (!price) break;

                const pizzaLines = [];
                picked.forEach(pz => consumePizzaLines(pz).forEach(l => pizzaLines.push(l)));

                const promoItem = {
                    type: 'promo',
                    qty: 1,
                    basePrice: price,
                    name: label,
                    options: mergePickedOptions(picked),
                    note: mergePickedNote(picked),
                    sections: [{ title: 'PIZZAS', lines: pizzaLines }],
                    _src: picked.flatMap(pz => pz._src || [])
                };

                // consumir unidades
                const dec = new Map();
                picked.forEach(pz => dec.set(pz, (dec.get(pz) || 0) + 1));
                dec.forEach((n, pz) => { pz.qty = (Number(pz.qty) || 0) - n; });

                const insertAt = view.indexOf(picked[0]);
                view.splice(insertAt, 0, promoItem);

                view = view.filter(it => (Number(it.qty) || 0) > 0);
            }
        }

        tryPizzaPromo("3esp", "3 Especiales", { esp: 3 });
        tryPizzaPromo("3muzza", "3 Muzzarellas", { muzza: 3 });
        tryPizzaPromo("2esp", "2 Especiales", { esp: 2 });
        tryPizzaPromo("2muzza", "2 Muzzarellas", { muzza: 2 });
        tryPizzaPromo("esp+muzza", "1 Especial + 1 Muzzarella", { esp: 1, muzza: 1 });

        // ===== PROMOS SOLO EMPANADAS (6 / 12 / 24) =====
        function tryEmpPromo(id, label, need) {
            while (totalEmpCount() >= need) {
                const empList = view.filter(it => it.type === 'empanada' && (Number(it.qty) || 0) > 0);
                const { taken, ok } = consumeEmpanadas(empList, need);
                if (!ok) break;

                const price = getPromoPrice(id) || 0;
                if (!price) break;

                const empLines = taken.map(t =>
                    `(x${Number(t.qty) || 1}) ${t.name}`
                );

                const promoItem = {
                    type: 'promo',
                    qty: 1,
                    basePrice: price,
                    name: label,
                    sections: [{ title: 'EMPANADAS', lines: empLines }],
                    _src: taken.flatMap(t => t._src || [])
                };

                const insertAt = view.indexOf(empList[0]);
                view.splice(insertAt, 0, promoItem);

                view = view.filter(it => (Number(it.qty) || 0) > 0);
            }
        }

        tryEmpPromo("emp24", "2 Docenas de Empanadas", 24);
        tryEmpPromo("emp12", "1 Docena de Empanadas", 12);
        tryEmpPromo("emp6", "1/2 Docena de Empanadas", 6);

        // 3) Ajuste de nombres SOLO display
        view.forEach(it => {
            if (it.type === 'pizza') {
                if (it.size === 's' && !/\bchica\b/i.test(it.name)) it.name = `${it.name} Chica`;
                if (it.size === 'half' && !/^1\/2\s+/i.test(it.name)) it.name = `1/2 ${it.name}`;
            }
        });

        return view;
    }


    function renderCart() {
        if (!elList || !elTotal) return;

        const cart = getCart();
        const view = buildCartView(cart);

        // contenedores opcionales (para ocultar resumen/botón cuando está vacío)
        const sumWrap = elDrawer ? elDrawer.querySelector('.cd-summary') : null;
        const actWrap = elDrawer ? elDrawer.querySelector('.cd-actions') : null;

        // ====== CARRITO VACÍO ======
        if (!cart.length) {
            elList.innerHTML = `
      <div class="cd-empty">
        <div class="illu">🛍️</div>
        <div class="txt">Pedido vacío</div>
      </div>
    `;
            elTotal.textContent = fmt(0);

            if (sumWrap) sumWrap.style.display = 'none';
            if (actWrap) actWrap.style.display = 'none';

            // si tenés el botón flotante
            if (typeof updateCartFab === 'function') updateCartFab();
            return;
        } else {
            if (sumWrap) sumWrap.style.display = '';
            if (actWrap) actWrap.style.display = '';
        }

        // ====== CARRITO CON ITEMS ======
        elList.innerHTML = '';
        let subtotal = 0;

        view.forEach((it, idx) => {
            const qty = Number(it.qty) || 1;
            const opts = Array.isArray(it.options) ? it.options : [];

            const extrasTotal = opts.reduce((s, o) => s + (Number(o.price) || 0) * (Number(o.qty) || 1), 0);
            const unitTotal = (Number(it.basePrice) || 0) + extrasTotal;
            const lineTotal = unitTotal * qty;

            subtotal += lineTotal;

            const row = document.createElement('div');
            row.className = 'cd-item';

            // mini-resumen (para que NO se cargue)
            const extrasCount = opts.reduce((s, o) => s + (Number(o.qty) || 1), 0);
            const noteVal = Array.isArray(it.note) ? it.note.join(' ') : (it.note || '');
            const badges = [
                extrasCount ? `${extrasCount} extra${extrasCount > 1 ? 's' : ''}` : '',
                noteVal ? `comentario` : ''
            ].filter(Boolean).join(' • ');

            // ===== DETALLES BONITOS (auto-secciones) =====

            // 1) si ya vienen "sections" prearmadas, las usamos
            let sections = Array.isArray(it.sections) ? it.sections : [];

            // 2) si NO vienen sections, las armamos desde options (PIZZA 1: ..., EMPANADAS: ...)
            let extraLines = []; // extras / opcionales (BASE TOSTADA, EXTRA MUZZA, etc.)

            if (!sections.length && opts.length) {
                const map = new Map(); // title -> lines[]

                const addLine = (title, line) => {
                    if (!map.has(title)) map.set(title, []);
                    map.get(title).push(line);
                };

                opts.forEach(o => {
                    const name = String(o.name || '').trim();
                    const q = Number(o.qty) || 1;

                    // PIZZA 1: ½ Jamón Solo
                    let m = name.match(/^PIZZA\s*(\d+)\s*:\s*(.+)$/i);
                    if (m) {
                        const n = m[1];
                        const line = m[2].trim();
                        addLine(`PIZZA ${n}`, line);
                        return;
                    }

                    // EMPANADAS: Jamón y Queso (qty puede ser >1)
                    m = name.match(/^EMPANADAS\s*:\s*(.+)$/i);
                    if (m) {
                        const line = m[1].trim();
                        addLine(`EMPANADAS`, `${q > 1 ? `(x${q}) ` : ''}${line}`);
                        return;
                    }

                    // PIZZA: Muzzarella (si alguna promo te lo mete así)
                    m = name.match(/^PIZZA\s*:\s*(.+)$/i);
                    if (m) {
                        const line = m[1].trim();
                        addLine(`PIZZA`, `${q > 1 ? `(x${q}) ` : ''}${line}`);
                        return;
                    }

                    // lo demás = extras/opcionales
                    extraLines.push(`${q > 1 ? `(x${q}) ` : ''}${name}`);
                });

                // orden para pizzas numeradas: 1,2,3...
                const pizzaKeys = [...map.keys()]
                    .filter(k => /^PIZZA\s+\d+$/.test(k))
                    .sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')));

                const otherKeys = [...map.keys()]
                    .filter(k => !/^PIZZA\s+\d+$/.test(k));

                const orderedKeys = [...pizzaKeys, ...otherKeys];

                sections = orderedKeys.map(k => ({ title: k, lines: map.get(k) }));
            } else {
                // si sections ya existe, NO dupliques líneas que ya son "PIZZA:" / "EMPANADAS:"
                // dejamos acá solo extras reales (CON/SIN, gustos, etc.)
                extraLines = opts
                    .map(o => {
                        const q = Number(o.qty) || 1;
                        const name = String(o.name || '').trim();

                        // ❌ esto YA va en secciones, no en "EXTRAS / OPCIONALES"
                        if (/^PIZZA(\s*\d+)?\s*:/i.test(name)) return '';
                        if (/^EMPANADAS\s*:/i.test(name)) return '';

                        return `${q > 1 ? `(x${q}) ` : ''}${name}`;
                    })
                    .filter(Boolean);
            }

            // ✅ esto define si hay algo para mostrar
            const hasDetails = (sections.length > 0) || (extraLines.length > 0) || !!noteVal;

            const detailsHTML = hasDetails ? `
  <details class="cd-details">
    <summary class="cd-details__sum">Ver detalles</summary>

    <div class="cd-details__body">

      ${sections.map((sec, i) => `
        <div class="cd-sec">
          <div class="cd-sec__title">${sec.title || ''}</div>
          ${compressLines(sec.lines || []).map(l => `<div class="cd-line">${l}</div>`).join('')}
        </div>
        ${i < sections.length - 1 ? `<div class="cd-sep"></div>` : ``}
      `).join('')}

      ${extraLines.length ? `
        ${sections.length ? `<div class="cd-sep"></div>` : ``}
        <div class="cd-sec">
          <div class="cd-sec__title">EXTRAS / OPCIONALES</div>
          ${extraLines.map(t => `<div class="cd-line">${t}</div>`).join('')}
        </div>
      ` : ''}

      ${noteVal ? `
        <div class="cd-sep"></div>
        <div class="cd-sec">
          <div class="cd-sec__title">Comentario</div>
          <div class="cd-line cd-note">${noteVal}</div>
        </div>
      ` : ''}

    </div>
  </details>
` : '';

            row.innerHTML = `
    <div class="cd-left">
      <div class="cd-topline">
        <h5>${it.name} <span class="cd-meta">(x${qty})</span></h5>
        ${badges ? `<div class="cd-badges">${badges}</div>` : ``}
      </div>
      ${detailsHTML}
    </div>

    <div class="cd-controls">
      <span class="cd-price">${fmt(lineTotal)}</span>
      <button class="cd-trash" data-act="del" data-src="${(it._src || []).join(',')}" aria-label="Eliminar">🗑️</button>
    </div>
  `;

            elList.appendChild(row);
        });
        elTotal.textContent = fmt(subtotal);

        if (typeof updateCartFab === 'function') updateCartFab();
    }


    elList?.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-act]');
        if (!btn) return;

        const cart = getCart();

        if (btn.dataset.act === 'del') {
            const src = String(btn.dataset.src || '').split(',').map(n => parseInt(n, 10)).filter(n => !isNaN(n));
            // borrar de mayor a menor para que splice no corra índices
            src.sort((a, b) => b - a).forEach(i => { if (cart[i]) cart.splice(i, 1); });
            setCart(cart);
            return;
        }
    });

    /* MODAL PIZZA */

    const imOverlay = document.getElementById('item-modal-overlay');
    const imModal = document.getElementById('item-modal');
    const imClose = imModal?.querySelector('.im-close');
    const qtyInput = document.getElementById('im-qty');
    const extrasBox = document.getElementById('im-extras');
    const extrasList = document.getElementById('im-extras-list');
    const noteInput = document.getElementById('im-note');
    const addBtn = document.getElementById('im-add');
    const addTotal = document.getElementById('im-add-total');

    function resetModal() {
        if (!imModal || !qtyInput || !noteInput) return;
        qtyInput.value = '1';
        noteInput.value = '';
        imModal.querySelectorAll('.ex-qty').forEach(inp => inp.value = '0');
        imModal.querySelectorAll('.opt-flag').forEach(ch => ch.checked = false);
        updateModalTotal();
    }

    function openItemModal() {
        if (!imOverlay || !imModal) return;
        imOverlay.hidden = false;
        imModal.hidden = false;
        imOverlay.classList.add('visible');
        imModal.classList.add('visible');
        document.body.classList.add('modal-open');
        updateModalTotal();
    }

    function closeItemModal() {
        if (!imOverlay || !imModal) return;
        imOverlay.classList.remove('visible');
        imModal.classList.remove('visible');
        imOverlay.hidden = true;
        imModal.hidden = true;
        document.body.classList.remove('modal-open');
        resetModal();
    }

    imOverlay?.addEventListener('click', closeItemModal);
    imClose?.addEventListener('click', closeItemModal);

    imModal?.addEventListener('click', (e) => {
        const b = e.target.closest('.im-btn');
        if (!b || !qtyInput) return;
        if (b.dataset.act === 'qty-inc') qtyInput.value = +qtyInput.value + 1;
        if (b.dataset.act === 'qty-dec') qtyInput.value = Math.max(1, (+qtyInput.value - 1));
        updateModalTotal();
    });
    qtyInput?.addEventListener('input', updateModalTotal);

    imModal?.addEventListener('click', (e) => {
        const btn = e.target.closest('.im-extra-btn');
        if (!btn) return;
        const i = +btn.dataset.i || 0;
        const inp = imModal.querySelector(`.ex-qty[data-i="${i}"]`);
        if (!inp) return;

        let val = parseInt(inp.value || '0', 10);
        if (btn.dataset.act === 'ex-inc') val = Math.min(1, val + 1);
        if (btn.dataset.act === 'ex-dec') val = Math.max(0, val - 1);
        inp.value = String(val);
        updateModalTotal();
    });

    imModal?.addEventListener('input', (e) => {
        if (e.target.classList.contains('ex-qty')) updateModalTotal();
    });
    imModal?.addEventListener('change', (e) => {
        if (e.target.classList.contains('opt-flag')) updateModalTotal();
    });

    function updateModalTotal() {
        if (!imModal || !qtyInput || !addTotal) return;

        const name = imModal.dataset.name || '';
        const qty = Math.max(1, parseInt(qtyInput.value || '1', 10));

        // ✅ tamaño elegido desde el select
        const size = document.getElementById('pizza-size')?.value || 'g';

        const basePrice =
            size === 'half' ? parseInt(imModal.dataset.priceHalf || imModal.dataset.basePrice || '0', 10) :
                size === 's' ? parseInt(imModal.dataset.priceS || imModal.dataset.basePrice || '0', 10) :
                    parseInt(imModal.dataset.priceG || imModal.dataset.basePrice || '0', 10);

        imModal.dataset.basePrice = String(basePrice);

        let extrasSum = 0;
        imModal.querySelectorAll('.ex-qty').forEach(inp => {
            const i = +inp.dataset.i || 0;
            let ex = null;
            try {
                const parentCardExtras = JSON.parse(
                    document.querySelector('.card-horizontal[data-name="' + name + '"]')?.dataset.extras || '[]'
                );
                ex = parentCardExtras[i];
            } catch { ex = null; }
            if (ex) extrasSum += ex.price * Math.max(0, +inp.value || 0);
        });

        const total = (basePrice + extrasSum) * qty;
        addTotal.textContent = fmt(total);

        const priceEl = document.getElementById('im-price');
        if (priceEl) priceEl.textContent = fmt(total);
    }

    document.getElementById('pizza-size')?.addEventListener('change', updateModalTotal);


    addBtn?.addEventListener('click', () => {
        if (!imModal || !qtyInput) return;
        const name = imModal.dataset.name || 'Producto';
        const basePrice = parseInt(imModal.dataset.basePrice || '0', 10);
        const qty = Math.max(1, parseInt(qtyInput.value || '1', 10));
        const note = noteInput?.value.trim() || '';

        const options = [];

        imModal.querySelectorAll('.ex-qty').forEach(inp => {
            const i = +inp.dataset.i || 0;
            const q = Math.max(0, parseInt(inp.value || '0', 10));
            if (!q) return;
            let exConf = null;
            try {
                const parentCardExtras = JSON.parse(
                    document.querySelector('.card-horizontal[data-name="' + name + '"]')?.dataset.extras || '[]'
                );
                exConf = parentCardExtras[i];
            } catch { exConf = null; }
            if (exConf) {
                options.push({
                    name: exConf.name,
                    price: exConf.price,
                    qty: q
                });
            }
        });

        imModal.querySelectorAll('.opt-flag').forEach(ch => {
            if (!ch.checked) return;
            const label = ch.closest('.im-opt')?.querySelector('span')?.textContent?.trim()
                || ch.value || 'Opción';
            options.push({
                name: label,
                price: 0,
                qty: 1
            });
        });

        const size = document.getElementById('pizza-size')?.value || 'g';

        const sizeLabel =
            size === 's' ? 'Chica' :
                size === 'half' ? '1/2' :
                    '';

        const nameShown =
            size === 'half'
                ? `1/2 ${name}`
                : `${name} ${sizeLabel}`;

        addToCart({
            type: "pizza",
            name: nameShown,
            basePrice,
            qty,
            options,
            note,

            // 👇 meta para detectar promos
            size: (basePrice === Number(imModal?.dataset?.priceS || 0)) ? "s"
                : (basePrice === Number(imModal?.dataset?.priceHalf || 0)) ? "half"
                    : "g",

            tier: imModal?.dataset?.tier || "unk", // muzza | esp | super | unk
        });

        closeItemModal();
    });

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.card-horizontal.full, .lp-best__card');
        if (!card) return;

        if (card.dataset.type) return;

        const section = card.closest('.section');
        // Permitimos abrir si estamos en la sección 'pizzas' O si es una tarjeta de 'bestsellers' (lp-best__card)
        const isBestseller = card.classList.contains('lp-best__card');

        if (!isBestseller && (!section || section.id !== 'pizzas')) return;

        const name = card.dataset.name || card.querySelector('.card-title')?.textContent?.trim() || 'Producto';
        const priceG = parseInt(card.dataset.priceG || card.dataset.price || '0', 10); // data-price-g
        const priceS = parseInt(card.dataset.priceS || '0', 10);                        // data-price-s
        const priceHalf = parseInt(card.dataset.priceHalf || '0', 10);                        // data-price-half
        const price = priceG; // default: Grande
        const photo = card.querySelector('img')?.src || '';
        const desc = card.querySelector('.card-desc')?.textContent?.trim() || '';

        const tEl = document.getElementById('im-title');
        const pEl = document.getElementById('im-price');
        const imgEl = document.getElementById('im-photo');
        const dEl = document.getElementById('im-desc');

        if (tEl) tEl.textContent = name;
        if (pEl) pEl.textContent = fmt(price);
        if (imgEl) imgEl.src = photo;
        if (dEl) dEl.textContent = desc;

        if (imModal) {
            imModal.dataset.basePrice = String(price);
            imModal.dataset.name = name;
            imModal.dataset.priceG = String(priceG);
            imModal.dataset.priceS = String(priceS || priceG);
            imModal.dataset.priceHalf = String(priceHalf || priceG);
            imModal.dataset.basePrice = String(priceG); // arranca en grande

            // tier por precio grande (13500 = super prohibida en promos)
            imModal.dataset.tier = (priceG === 10000) ? "muzza"
                : (priceG === 12000) ? "esp"
                    : (priceG === 13500) ? "super"
                        : "unk";
        }

        resetModal();
        if (qtyInput) qtyInput.value = 1;
        updateModalTotal();
        openItemModal();
    });
    document.querySelectorAll('input[name="pizza-size"]').forEach(radio => {
        radio.addEventListener('change', updateModalTotal);
    });

    /* MODAL CONO */

    const modalCono = document.getElementById("modal-cono");
    const overlayCono = document.getElementById("modal-cono-overlay");

    const conoTitle = document.getElementById("cono-title");
    const conoDesc = document.getElementById("cono-desc");
    const conoPrice = document.getElementById("cono-price");
    const conoImg = document.getElementById("cono-img");
    const conoAddTotal = document.getElementById("cono-add-total");
    let conoBasePrice = 0;
    const conoAddBtn = document.getElementById("cono-add");
    const conoComments = document.getElementById("cono-comments");
    const conoQty = document.getElementById("cono-qty");
    const conoQtyMinus = document.getElementById("cono-qty-minus");
    const conoQtyPlus = document.getElementById("cono-qty-plus");

    const conoFlavorCount = document.getElementById("cono-flavor-count");
    const conoFlavor1 = document.getElementById("cono-flavor-1");
    const conoFlavor2 = document.getElementById("cono-flavor-2");
    const conoFlavor2Box = document.getElementById("cono-flavor-2-box");

    const closeCono = document.getElementById("close-cono");

    let currentCono = null;

    // ===== NUEVO: DETECTOR DE CLICKS EN CONOS (Delegación) =====
    document.addEventListener('click', (e) => {
        const card = e.target.closest('[data-type="cono"]');
        if (!card) return;

        currentCono = card;
        conoTitle.textContent = card.dataset.name;
        conoDesc.textContent = card.dataset.desc;

        conoBasePrice = parseInt(card.dataset.price || "0", 10);
        conoPrice.textContent = fmt(conoBasePrice);

        conoImg.src = card.dataset.img;

        conoQty.textContent = "1";
        if (conoAddTotal) conoAddTotal.textContent = fmt(conoBasePrice);
        if (conoComments) conoComments.value = "";

        // Parsear sabores con seguridad
        let flavors = [];
        try {
            flavors = JSON.parse(card.dataset.flavors || '[]');
        } catch (err) {
            console.error("Error parsing flavors", err);
        }

        conoFlavor1.innerHTML = "";
        conoFlavor2.innerHTML = "";

        flavors.forEach(f => {
            conoFlavor1.innerHTML += `<option value="${f}">${f}</option>`;
            conoFlavor2.innerHTML += `<option value="${f}">${f}</option>`;
        });

        conoFlavorCount.value = "1";
        conoFlavor2Box.style.display = "none";
        // Evitar error si no hay sabores
        if (conoFlavor1.options.length > 0) {
            conoFlavor2.value = conoFlavor1.value;
        }

        overlayCono.hidden = false;
        modalCono.hidden = false;
        document.body.classList.add('modal-open');
    });

    function closeConoModal() {
        overlayCono.hidden = true;
        modalCono.hidden = true;
        document.body.classList.remove('modal-open');
    }

    closeCono.addEventListener("click", closeConoModal);
    overlayCono.addEventListener("click", closeConoModal);

    function updateConoTotal() {
        const qty = Math.max(1, parseInt(conoQty.textContent || "1", 10));
        const total = conoBasePrice * qty;
        if (conoAddTotal) conoAddTotal.textContent = fmt(total);
    }

    conoQtyMinus.addEventListener("click", () => {
        let v = parseInt(conoQty.textContent);
        if (v > 1) {
            conoQty.textContent = v - 1;
            updateConoTotal();
        }
    });

    conoQtyPlus.addEventListener("click", () => {
        let v = parseInt(conoQty.textContent);
        conoQty.textContent = v + 1;
        updateConoTotal();
    });

    conoFlavorCount.addEventListener("change", () => {
        if (conoFlavorCount.value === "2") {
            conoFlavor2Box.style.display = "block";
        } else {
            conoFlavor2Box.style.display = "none";
        }
    });

    conoFlavor1.addEventListener("change", () => {
        if (conoFlavorCount.value === "2" && conoFlavor1.value === conoFlavor2.value) {
            const options = Array.from(conoFlavor2.options).map(o => o.value);
            const newOption = options.find(o => o !== conoFlavor1.value);
            conoFlavor2.value = newOption;
        }
    });

    conoFlavor2.addEventListener("change", () => {
        if (conoFlavor1.value === conoFlavor2.value) {
            const options = Array.from(conoFlavor2.options).map(o => o.value);
            const newOption = options.find(o => o !== conoFlavor2.value);
            conoFlavor1.value = newOption;
        }
    });

    conoAddBtn?.addEventListener("click", () => {
        const qty = Math.max(1, parseInt(conoQty?.textContent || "1", 10));
        const note = (conoComments?.value || "").trim();

        const options = [];
        const count = parseInt(conoFlavorCount?.value || "1", 10);
        const f1 = (conoFlavor1?.value || "").trim();
        const f2 = (conoFlavor2?.value || "").trim();

        if (f1) {
            options.push({
                name: count === 2 ? `Gusto 1: ${f1}` : `Gusto: ${f1}`,
                price: 0,
                qty: 1
            });
        }

        if (count === 2 && f2) {
            options.push({
                name: `Gusto 2: ${f2}`,
                price: 0,
                qty: 1
            });
        }

        addToCart({
            type: "cono",
            name: (conoTitle?.textContent || "").trim() || "Cono",
            basePrice: Number(conoBasePrice) || 0,
            qty,
            extras: [],
            options,
            note: note ? [note] : []
        });

        closeConoModal?.();
        updateCartFab?.();
    });


    /* MODAL PROMOS */

    const promoOverlay = document.getElementById("promo-modal-overlay");
    const promoModal = document.getElementById("promo-modal");
    const promoClose = document.getElementById("promo-close");
    const promoContent = document.getElementById("promo-content");

    const promoQtyInput = document.getElementById("promo-qty");
    const promoQtyDec = document.getElementById("promo-qty-dec");
    const promoQtyInc = document.getElementById("promo-qty-inc");
    const promoPriceEl = document.getElementById("promo-modal-price");
    const promoAddTotal = document.getElementById("promo-add-total");

    let promoBasePrice = 0;
    let currentPromoId = "";

    function updatePromoTotal() {
        if (!promoQtyInput) return;
        let qty = parseInt(promoQtyInput.value || "1", 10);
        if (isNaN(qty) || qty < 1) qty = 1;
        promoQtyInput.value = qty;

        const total = (promoBasePrice) * qty;

        if (promoPriceEl) promoPriceEl.textContent = fmt(total);
        if (promoAddTotal) promoAddTotal.textContent = fmt(total);
    }

    function resetPromoState() {
        if (promoQtyInput) promoQtyInput.value = "1";
        document.querySelectorAll('#promo-modal .opt-flag').forEach(ch => ch.checked = false);
        const note = document.getElementById("promo-note");
        if (note) note.value = "";

        updatePromoTotal();
    }

    promoQtyDec?.addEventListener("click", () => {
        let v = parseInt(promoQtyInput.value || "1", 10);
        if (v > 1) {
            promoQtyInput.value = String(v - 1);
            updatePromoTotal();
        }
    });

    promoQtyInc?.addEventListener("click", () => {
        let v = parseInt(promoQtyInput.value || "1", 10);
        promoQtyInput.value = String(v + 1);
        updatePromoTotal();
    });

    promoQtyInput?.addEventListener("input", updatePromoTotal);

    // ===== NUEVO: DETECTOR DE CLICKS EN PROMOS (Delegación) =====
    // Reemplaza al bloque anterior de querySelectorAll(...promo...)
    document.addEventListener('click', (e) => {
        // Buscamos si el click fue en una tarjeta de promo (sea horizontal o best-seller)
        const card = e.target.closest('[data-type="promo"]');
        if (!card) return;

        const promoId = card.dataset.promoId || "";
        currentPromoId = promoId;

        document.getElementById("promo-modal-img").src = card.dataset.img || "";
        // Soporte para titulo en h4 (horizontal) o .lp-best__title (vertical)
        const titleEl = card.querySelector("h4") || card.querySelector(".lp-best__title");
        document.getElementById("promo-modal-title").innerText = titleEl ? titleEl.innerText : "Promo";

        document.getElementById("promo-modal-desc").innerText = card.dataset.desc || "";

        promoBasePrice = parseInt(card.dataset.price || "0", 10) || 0;

        resetPromoState();
        promoContent.innerHTML = "";

        //  CARGAR LÓGICA DE PROMOS
        if (promoId === "esp+6") loadPromoEspecialMasMediaDocena();
        if (promoId === "2muzza") loadPromoSoloMuzzas(2);
        if (promoId === "3muzza") loadPromoSoloMuzzas(3);
        if (promoId === "2esp") loadPromoEspeciales(2);
        if (promoId === "3esp") loadPromoEspeciales(3);
        if (promoId === "esp+muzza") loadPromoEspecialMasMuzza();
        if (promoId === "muzza+6") loadPromoMuzzaMasMediaDocena();
        if (promoId === "muzza+12") loadPromoMuzzaMasDocena();
        if (promoId === "esp+12") loadPromoEspecialMasDocena();

        function loadPromoSoloMuzzas(n) {
            promoContent.innerHTML = `
              <div class="im-block">
                <h4>Incluye</h4>
                <p class="im-help"><strong>${n}</strong> pizzas <strong>Muzzarella</strong>.</p>
              </div>`;
        }

        promoOverlay.hidden = false;
        promoModal.hidden = false;
        document.body.classList.add('modal-open');
    });

    // ===== CERRAR PROMO (asegurado) =====
    function closePromo() {
        promoOverlay.hidden = true;
        promoModal.hidden = true;
        document.body.classList.remove("modal-open");

        // 🔥 clave: limpiar estado para que no quede el botón disabled en otras promos
        try { resetPromoState(); } catch (e) { }
        const addBtn = document.getElementById("promo-add");
        if (addBtn) addBtn.disabled = false;
    }
    promoClose?.addEventListener("click", closePromo);
    promoOverlay?.addEventListener("click", closePromo);

    // ===== BUILDER: opciones según promo =====
    function pick(id) {
        return document.getElementById(id);
    }

    function buildEspecialFrom(prefixLabel, tipoId, g1Id, g2Id) {
        const out = [];
        const tipo = pick(tipoId)?.value || "1";
        const g1 = pick(g1Id)?.value || "";
        const g2 = pick(g2Id)?.value || "";

        if (tipo === "2") {
            if (g1) out.push({ name: `${prefixLabel}: ½ ${g1}`, qty: 1, price: 0 });
            if (g2) out.push({ name: `${prefixLabel}: ½ ${g2}`, qty: 1, price: 0 });
        } else {
            if (g1) out.push({ name: `${prefixLabel}: ${g1}`, qty: 1, price: 0 });
        }
        return out;
    }

    function buildEmpanadasFromList(listId) {
        const out = [];
        const list = pick(listId);
        if (!list) return out;

        list.querySelectorAll(".im-extra").forEach(row => {
            const name = row.querySelector(".im-extra-name")?.textContent?.trim() || "";
            const qty = parseInt(row.querySelector(".emp-cant")?.textContent || "0", 10) || 0;
            if (name && qty > 0) out.push({ name: `EMPANADAS: ${name}`, qty, price: 0 });
        });
        return out;
    }

    function buildPromoBundleOptions() {
        const out = [];

        // promos SOLO muzza
        if (currentPromoId === "2muzza") out.push({ name: `PIZZA: Muzzarella`, qty: 2, price: 0 });
        if (currentPromoId === "3muzza") out.push({ name: `PIZZA: Muzzarella`, qty: 3, price: 0 });

        // promos SOLO especiales (2 o 3)
        if (currentPromoId === "2esp" || currentPromoId === "3esp") {
            const n = currentPromoId === "2esp" ? 2 : 3;
            for (let i = 1; i <= n; i++) {
                out.push(...buildEspecialFrom(`PIZZA ${i}`, `p${i}-tipo`, `p${i}-g1`, `p${i}-g2`));
            }
        }

        // 1 especial + 1 muzza
        if (currentPromoId === "esp+muzza") {
            out.push({ name: `PIZZA: Muzzarella`, qty: 1, price: 0 });
            out.push(...buildEspecialFrom(`PIZZA`, `promo-pizza-tipo`, `gusto1`, `gusto2`));
        }

        // muzza + 1/2 doc o doc
        if (currentPromoId === "muzza+6" || currentPromoId === "muzza+12") {
            out.push({ name: `PIZZA: Muzzarella`, qty: 1, price: 0 });
            out.push(...buildEmpanadasFromList("empanada-list"));
        }

        // especial + 1/2 doc o doc
        if (currentPromoId === "esp+6" || currentPromoId === "esp+12") {
            out.push(...buildEspecialFrom(`PIZZA`, `promo-pizza-tipo`, `gusto1`, `gusto2`));
            out.push(...buildEmpanadasFromList("empanada-list"));
        }

        return out;
    }

    // ===== BUILDER: opciones según promo =====
    function pick(id) {
        return document.getElementById(id);
    }

    function buildEspecialFrom(prefixLabel, tipoId, g1Id, g2Id) {
        const out = [];
        const tipo = pick(tipoId)?.value || "1";
        const g1 = pick(g1Id)?.value || "";
        const g2 = pick(g2Id)?.value || "";

        if (tipo === "2") {
            if (g1) out.push({ name: `${prefixLabel}: ½ ${g1}`, qty: 1, price: 0 });
            if (g2) out.push({ name: `${prefixLabel}: ½ ${g2}`, qty: 1, price: 0 });
        } else {
            if (g1) out.push({ name: `${prefixLabel}: ${g1}`, qty: 1, price: 0 });
        }
        return out;
    }

    function buildEmpanadasFromList(listId) {
        const out = [];
        const list = pick(listId);
        if (!list) return out;

        list.querySelectorAll(".im-extra").forEach(row => {
            const name = row.querySelector(".im-extra-name")?.textContent?.trim() || "";
            const qty = parseInt(row.querySelector(".emp-cant")?.textContent || "0", 10) || 0;
            if (name && qty > 0) out.push({ name: `EMPANADAS: ${name}`, qty, price: 0 });
        });
        return out;
    }

    function buildPromoBundleOptions() {
        const out = [];

        // promos SOLO muzza
        if (currentPromoId === "2muzza") out.push({ name: `PIZZA: Muzzarella`, qty: 2, price: 0 });
        if (currentPromoId === "3muzza") out.push({ name: `PIZZA: Muzzarella`, qty: 3, price: 0 });

        // promos SOLO especiales (2 o 3)
        if (currentPromoId === "2esp" || currentPromoId === "3esp") {
            const n = currentPromoId === "2esp" ? 2 : 3;
            for (let i = 1; i <= n; i++) {
                // ✅ buildEspecialFrom devuelve array -> se mete con spread
                out.push(...buildEspecialFrom(`PIZZA ${i}`, `p${i}-tipo`, `p${i}-g1`, `p${i}-g2`));
            }
        }

        // 1 especial + 1 muzza
        if (currentPromoId === "esp+muzza") {
            out.push({ name: `PIZZA: Muzzarella`, qty: 1, price: 0 });
            out.push(...buildEspecialFrom(`PIZZA`, `promo-pizza-tipo`, `gusto1`, `gusto2`));
        }

        // muzza + 1/2 doc o doc
        if (currentPromoId === "muzza+6" || currentPromoId === "muzza+12") {
            out.push({ name: `PIZZA: Muzzarella`, qty: 1, price: 0 });
            out.push(...buildEmpanadasFromList("empanada-list"));
        }

        // especial + 1/2 doc o doc
        if (currentPromoId === "esp+6" || currentPromoId === "esp+12") {
            out.push(...buildEspecialFrom(`PIZZA`, `promo-pizza-tipo`, `gusto1`, `gusto2`));
            out.push(...buildEmpanadasFromList("empanada-list"));
        }

        return out;
    }


    // ===== AGREGAR PROMO AL CARRITO =====
    const promoAddBtn = document.getElementById("promo-add");
    const promoQtyIn = document.getElementById("promo-qty");
    const promoTitleEl = document.getElementById("promo-modal-title");

    promoAddBtn?.addEventListener("click", () => {
        const qty = Math.max(1, parseInt(promoQtyIn?.value || "1", 10));

        const basePrice = promoBasePrice;

        const requiredEmp =
            (currentPromoId === "muzza+6" || currentPromoId === "esp+6") ? 6 :
                (currentPromoId === "muzza+12" || currentPromoId === "esp+12") ? 12 : 0;

        if (requiredEmp > 0) {
            const list = document.getElementById("empanada-list");
            const selected = list
                ? Array.from(list.querySelectorAll(".emp-cant"))
                    .reduce((s, el) => s + (parseInt(el.textContent || "0", 10) || 0), 0)
                : 0;

            if (selected !== requiredEmp) {
                alert(`Tenés que elegir ${requiredEmp} empanadas. Te faltan ${requiredEmp - selected}.`);
                return;
            }
        }

        const bundle = buildPromoBundleOptions();

        const commonOpts = [];

        document.querySelectorAll('#promo-modal .im-options .opt-flag:checked').forEach(ch => {
            commonOpts.push({ name: ch.value, price: 0, qty: 1 });
        });

        const note = (document.getElementById("promo-note")?.value || "").trim();
        if (note) commonOpts.push({ name: `Comentario: ${note}`, price: 0, qty: 1 });

        const PIZZA_G = { muzza: 10000, esp: 12000 };
        const EMP_UNIT = 1500;

        const addPizzaItem = ({ tier, qty, pizzaLines }) => {
            const optLines = [];

            (pizzaLines || []).forEach(line => {
                const t = String(line || "").trim();
                if (t) optLines.push({ name: `PIZZA: ${t}`, qty: 1, price: 0 });
            });

            addToCart({
                type: "pizza",
                tier,
                size: "g",
                name: (tier === "muzza" ? "Muzzarella" : "Especial"),
                basePrice: PIZZA_G[tier] || 0,
                qty: Math.max(1, Number(qty) || 1),
                extras: [],
                options: [...optLines, ...commonOpts],
                note: note,
                sections: (pizzaLines && pizzaLines.length)
                    ? [{ title: "PIZZA", lines: pizzaLines }]
                    : []
            });
        };

        const addEmpItem = ({ name, qty }) => {
            addToCart({
                type: "empanada",
                name,
                basePrice: EMP_UNIT,
                qty: Math.max(1, Number(qty) || 1),
                extras: [],
                options: [...commonOpts],
                note: note
            });
        };

        const pizzasByNum = new Map();
        let muzzaCount = 0;

        bundle.forEach(b => {
            const raw = String(b?.name || "").trim();
            const q = Math.max(1, Number(b?.qty) || 1);

            let m = raw.match(/^EMPANADAS\s*:\s*(.+)$/i);
            if (m) {
                const empName = (m[1] || "").trim();
                if (empName) addEmpItem({ name: empName, qty: q * qty });
                return;
            }

            m = raw.match(/^PIZZA\s+(\d+)\s*:\s*(.+)$/i);
            if (m) {
                const num = Number(m[1] || 0);
                const line = (m[2] || "").trim();
                if (!line) return;
                if (!pizzasByNum.has(num)) pizzasByNum.set(num, []);
                for (let k = 0; k < q * qty; k++) pizzasByNum.get(num).push(line);
                return;
            }

            // PIZZA simple: "PIZZA: Muzzarella" o "PIZZA: Jamón y Morrón"
            m = raw.match(/^PIZZA\s*:\s*(.+)$/i);
            if (m) {
                const line = (m[1] || "").trim();
                if (!line) return;

                if (/^muzzarella$/i.test(line)) {
                    muzzaCount += (q * qty);
                    return;
                }

                if (!pizzasByNum.has(0)) pizzasByNum.set(0, []);
                for (let k = 0; k < q * qty; k++) pizzasByNum.get(0).push(line);
                return;
            }
        });

        // ✅ si hubo muzzas, agregamos UNA pizza item con qty N
        if (muzzaCount > 0) {
            addPizzaItem({ tier: "muzza", qty: muzzaCount, pizzaLines: [] });
        }

        // ✅ pizzas especiales: por cada número (o 0) armamos una pizza item con sus líneas
        [...pizzasByNum.entries()]
            .sort((a, b) => a[0] - b[0])
            .forEach(([num, lines]) => {
                if (!lines?.length) return;
                addPizzaItem({ tier: "esp", qty: 1, pizzaLines: lines });
            });

        closePromo();
        updateCartFab();
    });

    promoClose.addEventListener("click", () => {
        promoOverlay.hidden = true;
        promoModal.hidden = true;
        document.body.classList.remove("modal-open");
        resetPromoState();
    });

    promoOverlay.addEventListener("click", () => {
        promoOverlay.hidden = true;
        promoModal.hidden = true;
        document.body.classList.remove("modal-open");
        resetPromoState();
    });

    function loadPromoEspeciales(n) {
        const gustos1 = [
            "Jamón y Morrón",
            "Jamón Solo",
            "Huevo Solo",
            "Jamón y Huevo",
            "Cebolla y Albahaca",
            "Doble Muzzarella",
            "Napolitana",
            "Fugazzeta",
            "Cebolla y Tomate",
            "Albahaca",
            "Capresse",
            "Calabresa",
            "Papas Pay",
            "Choclo"
        ];

        const gustos2 = gustos1;

        const pluralPizza = (n === 1) ? "pizza" : "pizzas";
        const pluralEsp = (n === 1) ? "Especial" : "Especiales";

        const incluyeHTML = `
    <div class="im-block">
      <h4>Incluye</h4>
      <p class="im-help"><strong>${n}</strong> ${pluralPizza} <strong>${pluralEsp}</strong>.</p>
    </div>
  `;

        const pizzaBlock = (idx) => `
    <div class="im-block">
      <h4>Pizza ${idx}</h4>
      <p class="im-help">Elegí si la querés de una sola variedad o mitad y mitad.</p>

      <label for="p${idx}-tipo">¿Cómo la querés?</label>
      <select id="p${idx}-tipo">
        <option value="1">1 Variedad</option>
        <option value="2">1/2 y 1/2</option>
      </select>

      <label for="p${idx}-g1">Gusto 1</label>
      <select id="p${idx}-g1">
        ${gustos1.map(g => `<option>${g}</option>`).join("")}
      </select>

      <div id="p${idx}-g2-box" style="display:none;">
        <label for="p${idx}-g2">Gusto 2</label>
        <select id="p${idx}-g2">
          ${gustos2.map(g => `<option>${g}</option>`).join("")}
        </select>
      </div>
    </div>
  `;

        promoContent.innerHTML =
            incluyeHTML +
            Array.from({ length: n }, (_, i) => pizzaBlock(i + 1)).join("");

        for (let i = 1; i <= n; i++) {
            const tipo = document.getElementById(`p${i}-tipo`);
            const box = document.getElementById(`p${i}-g2-box`);
            if (!tipo || !box) continue;

            tipo.addEventListener("change", () => {
                box.style.display = (tipo.value === "2") ? "" : "none";
            });
        }

        for (let i = 1; i <= n; i++) {
            const tipo = document.getElementById(`p${i}-tipo`);
            const g1 = document.getElementById(`p${i}-g1`);
            const g2 = document.getElementById(`p${i}-g2`);
            if (!tipo || !g1 || !g2) continue;

            syncGustos(g1, g2, tipo);
        }
    }

    function syncGustos(select1, select2, tipoPizzaSelect) {
        function actualizar() {
            const esMitad = (tipoPizzaSelect.value === "2");

            Array.from(select1.options).forEach(opt => opt.disabled = false);
            Array.from(select2.options).forEach(opt => opt.disabled = false);

            if (!esMitad) return;

            if (select1.value) {
                Array.from(select2.options).forEach(opt => {
                    if (opt.value === select1.value) opt.disabled = true;
                });
            }

            if (select2.value) {
                Array.from(select1.options).forEach(opt => {
                    if (opt.value === select2.value) opt.disabled = true;
                });
            }
        }

        select1.addEventListener("change", actualizar);
        select2.addEventListener("change", actualizar);
        tipoPizzaSelect.addEventListener("change", actualizar);

        actualizar();
    }

    function loadPromoEspecialMasMuzza() {
        promoContent.innerHTML = `
    <div class="im-block">
      <h4>Incluye</h4>
      <p class="im-help"><strong>1</strong> pizza <strong>Muzzarella</strong> + <strong>1</strong> pizza <strong>Especial</strong>.</p>
    </div>

    <div class="im-block">
      <h4>Pizza Especial</h4>
      <p class="im-help">Elegí si la querés de una sola variedad o mitad y mitad.</p>

      <label for="promo-pizza-tipo">¿Cómo la querés?</label>
      <select id="promo-pizza-tipo">
        <option value="1">1 Variedad</option>
        <option value="2">1/2 y 1/2</option>
      </select>

      <label for="gusto1">Gusto 1</label>
      <select id="gusto1">
          <option>Jamón y Morrón</option>
          <option>Jamón Solo</option>
          <option>Huevo Solo</option>
          <option>Jamón y Huevo</option>
          <option>Cebolla y Albahaca</option>
          <option>Doble Muzzarella</option>
          <option>Napolitana</option>
          <option>Fugazzeta</option>
          <option>Cebolla y Tomate</option>
          <option>Albahaca</option>
          <option>Capresse</option>
          <option>Calabresa</option>
          <option>Papas Pay</option>
          <option>Choclo</option>
      </select>

      <div id="gusto2-box" style="display:none;">
        <label for="gusto2">Gusto 2</label>
        <select id="gusto2">
          <option>Jamón y Morrón</option>
          <option>Jamón Solo</option>
          <option>Huevo Solo</option>
          <option>Jamón y Huevo</option>
          <option>Cebolla y Albahaca</option>
          <option>Doble Muzzarella</option>
          <option>Napolitana</option>
          <option>Fugazzeta</option>
          <option>Cebolla y Tomate</option>
          <option>Albahaca</option>
          <option>Capresse</option>
          <option>Calabresa</option>
          <option>Papas Pay</option>
          <option>Choclo</option>
        </select>
      </div>
    </div>
  `;

        const tipo = document.getElementById("promo-pizza-tipo");
        const box = document.getElementById("gusto2-box");
        if (tipo && box) {
            tipo.addEventListener("change", () => {
                box.style.display = (tipo.value === "2") ? "" : "none";
            });
        }

        const g1 = document.getElementById("gusto1");
        const g2 = document.getElementById("gusto2");
        if (tipo && g1 && g2) {
            syncGustos(g1, g2, tipo);
        }
    }

    function loadPromoMuzzaMasMediaDocena() {
        promoContent.innerHTML = `
    <div class="im-block">
      <h4>Incluye</h4>
      <p class="im-help"><strong>1</strong> pizza <strong>Muzzarella</strong> + <strong>6</strong> empanadas.</p>
    </div>

    <div class="im-block">
      <h4>Empanadas (6 unidades)</h4>
      <p class="im-help">Repartí tus <strong>6 unidades</strong> entre los gustos disponibles. Máximo 6 en total.</p>
      <div id="empanada-list"></div>
      <p class="contador-emp">Seleccionadas: <span id="emp-count">0</span> / 6</p>
      <p id="emp-warn" class="emp-warn" hidden></p>
    </div>
  `;

        const empContainer = document.getElementById("empanada-list");
        const empanadas = ["Carne", "Jamón y Queso", "Pollo", "Cebolla y Queso"];

        let total = 0;
        const MAX = 6;

        const promoAddBtn = document.getElementById("promo-add");
        const warnEl = document.getElementById("emp-warn");
        const counterEl = document.querySelector(".contador-emp");

        function refreshEmpUI() {
            const missing = MAX - total;
            const ok = (missing === 0);

            if (promoAddBtn) promoAddBtn.disabled = !ok;
            if (counterEl) counterEl.classList.toggle("is-invalid", !ok);

            if (warnEl) {
                warnEl.hidden = ok;
                if (!ok) warnEl.textContent =
                    `Te faltan ${missing} empanada${missing === 1 ? "" : "s"} para completar la promo.`;
            }
        }

        refreshEmpUI();

        empanadas.forEach(gusto => {
            const row = document.createElement("div");
            row.className = "im-extra";
            row.innerHTML = `
      <div class="im-extra-left">
        <span class="im-extra-name">${gusto}</span>
      </div>
      <div class="im-extra-ctrl">
        <button type="button" class="im-extra-btn emp-minus">−</button>
        <span class="emp-cant">0</span>
        <button type="button" class="im-extra-btn emp-plus">+</button>
      </div>
    `;

            empContainer.appendChild(row);

            const minus = row.querySelector(".emp-minus");
            const plus = row.querySelector(".emp-plus");
            const cant = row.querySelector(".emp-cant");

            plus.onclick = () => {
                if (total < MAX) {
                    cant.innerText = String(parseInt(cant.innerText, 10) + 1);
                    total++;
                    document.getElementById("emp-count").innerText = String(total);
                    refreshEmpUI();
                }
            };

            minus.onclick = () => {
                const v = parseInt(cant.innerText, 10);
                if (v > 0) {
                    cant.innerText = String(v - 1);
                    total--;
                    document.getElementById("emp-count").innerText = String(total);
                    refreshEmpUI();
                }
            };
        });
    }

    function loadPromoMuzzaMasDocena() {
        promoContent.innerHTML = `
    <div class="im-block">
      <h4>Incluye</h4>
      <p class="im-help"><strong>1</strong> pizza <strong>Muzzarella</strong> + <strong>12</strong> empanadas.</p>
    </div>

    <div class="im-block">
      <h4>Empanadas (12 unidades)</h4>
      <p class="im-help">Repartí tus <strong>12 unidades</strong> entre los gustos disponibles. Máximo 12 en total.</p>
      <div id="empanada-list"></div>
      <p class="contador-emp">Seleccionadas: <span id="emp-count">0</span> / 12</p>
      <p id="emp-warn" class="emp-warn" hidden></p>
    </div>
  `;

        const empContainer = document.getElementById("empanada-list");
        const empanadas = ["Carne", "Jamón y Queso", "Pollo", "Cebolla y Queso"];

        let total = 0;
        const MAX = 12;

        const promoAddBtn = document.getElementById("promo-add");
        const warnEl = document.getElementById("emp-warn");
        const counterEl = document.querySelector(".contador-emp");

        function refreshEmpUI() {
            const missing = MAX - total;
            const ok = (missing === 0);

            if (promoAddBtn) promoAddBtn.disabled = !ok;

            if (counterEl) counterEl.classList.toggle("is-invalid", !ok);

            if (warnEl) {
                warnEl.hidden = ok;
                if (!ok) warnEl.textContent = `Te faltan ${missing} empanada${missing === 1 ? "" : "s"} para completar la promo.`;
            }
        }

        refreshEmpUI();


        empanadas.forEach(gusto => {
            const row = document.createElement("div");
            row.className = "im-extra";

            row.innerHTML = `
      <div class="im-extra-left">
        <span class="im-extra-name">${gusto}</span>
      </div>
      <div class="im-extra-ctrl">
        <button type="button" class="im-extra-btn emp-minus">−</button>
        <span class="emp-cant">0</span>
        <button type="button" class="im-extra-btn emp-plus">+</button>
      </div>
    `;

            empContainer.appendChild(row);

            const minus = row.querySelector(".emp-minus");
            const plus = row.querySelector(".emp-plus");
            const cant = row.querySelector(".emp-cant");

            plus.onclick = () => {
                if (total < MAX) {
                    cant.innerText = String(parseInt(cant.innerText, 10) + 1);
                    total++;
                    document.getElementById("emp-count").innerText = String(total);
                    refreshEmpUI();
                }
            };

            minus.onclick = () => {
                const v = parseInt(cant.innerText, 10);
                if (v > 0) {
                    cant.innerText = String(v - 1);
                    total--;
                    document.getElementById("emp-count").innerText = String(total);
                    refreshEmpUI();
                }
            };
        });
    }

    function loadPromoEspecialMasDocena() {
        promoContent.innerHTML = `
    <div class="im-block">
      <h4>Incluye</h4>
      <p class="im-help"><strong>1</strong> pizza <strong>Especial</strong> + <strong>12</strong> empanadas.</p>
    </div>

    <div class="im-block">
      <h4>Pizza Especial</h4>
      <p class="im-help">Elegí si la querés de una sola variedad o mitad y mitad.</p>

      <label for="promo-pizza-tipo">¿Cómo la querés?</label>
      <select id="promo-pizza-tipo">
        <option value="1">1 Variedad</option>
        <option value="2">1/2 y 1/2</option>
      </select>

      <label for="gusto1">Gusto 1</label>
      <select id="gusto1">
          <option>Jamón y Morrón</option>
          <option>Jamón Solo</option>
          <option>Huevo Solo</option>
          <option>Jamón y Huevo</option>
          <option>Cebolla y Albahaca</option>
          <option>Doble Muzzarella</option>
          <option>Napolitana</option>
          <option>Fugazzeta</option>
          <option>Cebolla y Tomate</option>
          <option>Albahaca</option>
          <option>Capresse</option>
          <option>Calabresa</option>
          <option>Papas Pay</option>
          <option>Choclo</option>
      </select>

      <div id="gusto2-box" style="display:none;">
        <label for="gusto2">Gusto 2</label>
        <select id="gusto2">
          <option>Jamón y Morrón</option>
          <option>Jamón Solo</option>
          <option>Huevo Solo</option>
          <option>Jamón y Huevo</option>
          <option>Cebolla y Albahaca</option>
          <option>Doble Muzzarella</option>
          <option>Napolitana</option>
          <option>Fugazzeta</option>
          <option>Cebolla y Tomate</option>
          <option>Albahaca</option>
          <option>Capresse</option>
          <option>Calabresa</option>
          <option>Papas Pay</option>
          <option>Choclo</option>
        </select>
      </div>
    </div>

    <div class="im-block">
      <h4>Empanadas (12 unidades)</h4>
      <p class="im-help">Repartí tus <strong>12 unidades</strong> entre los gustos disponibles. Máximo 12 en total.</p>
      <div id="empanada-list"></div>
      <p class="contador-emp">Seleccionadas: <span id="emp-count">0</span> / 12</p>
      <p id="emp-warn" class="emp-warn" hidden></p>
    </div>
  `;

        const tipo = document.getElementById("promo-pizza-tipo");
        const box = document.getElementById("gusto2-box");
        if (tipo && box) {
            tipo.addEventListener("change", () => {
                box.style.display = (tipo.value === "2") ? "" : "none";
            });
        }

        const g1 = document.getElementById("gusto1");
        const g2 = document.getElementById("gusto2");
        if (tipo && g1 && g2) syncGustos(g1, g2, tipo);

        const empContainer = document.getElementById("empanada-list");
        const empanadas = ["Carne", "Jamón y Queso", "Pollo", "Cebolla y Queso"];

        let total = 0;
        const MAX = 12;

        const promoAddBtn = document.getElementById("promo-add");
        const warnEl = document.getElementById("emp-warn");
        const counterEl = document.querySelector(".contador-emp");

        function refreshEmpUI() {
            const missing = MAX - total;
            const ok = (missing === 0);

            if (promoAddBtn) promoAddBtn.disabled = !ok;
            if (counterEl) counterEl.classList.toggle("is-invalid", !ok);

            if (warnEl) {
                warnEl.hidden = ok;
                if (!ok) warnEl.textContent = `Te faltan ${missing} empanada${missing === 1 ? "" : "s"} para completar la promo.`;
            }
        }

        refreshEmpUI();

        empanadas.forEach(gusto => {
            const row = document.createElement("div");
            row.className = "im-extra";

            row.innerHTML = `
      <div class="im-extra-left">
        <span class="im-extra-name">${gusto}</span>
      </div>
      <div class="im-extra-ctrl">
        <button type="button" class="im-extra-btn emp-minus">−</button>
        <span class="emp-cant">0</span>
        <button type="button" class="im-extra-btn emp-plus">+</button>
      </div>
    `;

            empContainer.appendChild(row);

            const minus = row.querySelector(".emp-minus");
            const plus = row.querySelector(".emp-plus");
            const cant = row.querySelector(".emp-cant");

            plus.onclick = () => {
                if (total < MAX) {
                    cant.innerText = String(parseInt(cant.innerText, 10) + 1);
                    total++;
                    document.getElementById("emp-count").innerText = String(total);
                    refreshEmpUI();
                }
            };

            minus.onclick = () => {
                const v = parseInt(cant.innerText, 10);
                if (v > 0) {
                    cant.innerText = String(v - 1);
                    total--;
                    document.getElementById("emp-count").innerText = String(total);
                    refreshEmpUI();
                }
            };
        });
    }

    function loadPromoEspecialMasMediaDocena() {

        promoContent.innerHTML = `
    <div class="im-block">
      <h4>Incluye</h4>
      <p class="im-help"><strong>1</strong> pizza <strong>Especial</strong> + <strong>6</strong> empanadas.</p>
    </div>

    <div class="im-block">
      <h4>Pizza Especial</h4>
      <p class="im-help">Elegí si la querés de una sola variedad o mitad y mitad.</p>

      <label for="promo-pizza-tipo">¿Cómo la querés?</label>
      <select id="promo-pizza-tipo">
        <option value="1">1 Variedad</option>
        <option value="2">1/2 y 1/2</option>
      </select>

      <label for="gusto1">Gusto 1</label>
      <select id="gusto1">
          <option>Jamón y Morrón</option>
          <option>Jamón Solo</option>
          <option>Huevo Solo</option>
          <option>Jamón y Huevo</option>
          <option>Cebolla y Albahaca</option>
          <option>Doble Muzzarella</option>
          <option>Napolitana</option>
          <option>Fugazzeta</option>
          <option>Cebolla y Tomate</option>
          <option>Albahaca</option>
          <option>Capresse</option>
          <option>Calabresa</option>
          <option>Papas Pay</option>
          <option>Choclo</option>
      </select>

      <div id="gusto2-box" style="display:none;">
        <label for="gusto2">Gusto 2</label>
        <select id="gusto2">
          <option>Jamón y Morrón</option>
          <option>Jamón Solo</option>
          <option>Huevo Solo</option>
          <option>Jamón y Huevo</option>
          <option>Cebolla y Albahaca</option>
          <option>Doble Muzzarella</option>
          <option>Napolitana</option>
          <option>Fugazzeta</option>
          <option>Cebolla y Tomate</option>
          <option>Albahaca</option>
          <option>Capresse</option>
          <option>Calabresa</option>
          <option>Papas Pay</option>
          <option>Choclo</option>
        </select>
      </div>
    </div>

    <div class="im-block">
      <h4>Empanadas (6 unidades)</h4>
      <p class="im-help">Repartí tus <strong>6 unidades</strong> entre los gustos disponibles. Máximo 6 en total.</p>
      <div id="empanada-list"></div>
      <p class="contador-emp">Seleccionadas: <span id="emp-count">0</span> / 6</p>
      <p id="emp-warn" class="emp-warn" hidden></p>
    </div>
  `;

        const empContainer = document.getElementById("empanada-list");
        const empanadas = ["Carne", "Jamón y Queso", "Pollo", "Cebolla y Queso"];

        let total = 0;
        const MAX = 6;

        // ✅ BLOQUE PRO (faltaba acá)
        const promoAddBtn = document.getElementById("promo-add");
        const warnEl = document.getElementById("emp-warn");
        const counterEl = document.querySelector(".contador-emp");

        function refreshEmpUI() {
            const missing = MAX - total;
            const ok = (missing === 0);

            if (promoAddBtn) promoAddBtn.disabled = !ok;
            if (counterEl) counterEl.classList.toggle("is-invalid", !ok);

            if (warnEl) {
                warnEl.hidden = ok;
                if (!ok) warnEl.textContent = `Te faltan ${missing} empanada${missing === 1 ? "" : "s"} para completar la promo.`;
            }
        }

        refreshEmpUI();

        empanadas.forEach(gusto => {
            const row = document.createElement("div");
            row.className = "im-extra";

            row.innerHTML = `
      <div class="im-extra-left">
        <span class="im-extra-name">${gusto}</span>
      </div>
      <div class="im-extra-ctrl">
        <button type="button" class="im-extra-btn emp-minus">−</button>
        <span class="emp-cant">0</span>
        <button type="button" class="im-extra-btn emp-plus">+</button>
      </div>
    `;

            empContainer.appendChild(row);

            const minus = row.querySelector(".emp-minus");
            const plus = row.querySelector(".emp-plus");
            const cant = row.querySelector(".emp-cant");

            plus.onclick = () => {
                if (total < MAX) {
                    cant.innerText = String(parseInt(cant.innerText, 10) + 1);
                    total++;
                    document.getElementById("emp-count").innerText = String(total);
                    refreshEmpUI(); // ✅ faltaba
                }
            };

            minus.onclick = () => {
                const v = parseInt(cant.innerText, 10);
                if (v > 0) {
                    cant.innerText = String(v - 1);
                    total--;
                    document.getElementById("emp-count").innerText = String(total);
                    refreshEmpUI(); // ✅ faltaba
                }
            };
        });

        const tipo = document.getElementById("promo-pizza-tipo");
        tipo.addEventListener("change", () => {
            const box = document.getElementById("gusto2-box");
            box.style.display = (tipo.value === "2") ? "block" : "none";
        });

        const g1 = document.getElementById("gusto1");
        const g2 = document.getElementById("gusto2");
        if (tipo && g1 && g2) syncGustos(g1, g2, tipo);
    }

    /* MODAL EMPANADA */

    const empOverlay = document.getElementById("modal-empanada-overlay");
    const empModal = document.getElementById("modal-empanada");
    const empTitle = document.getElementById("emp-title");
    const empPriceEl = document.getElementById("emp-price");
    const empImg = document.getElementById("emp-photo");
    const empDesc = document.getElementById("emp-desc");
    const empQtyInput = document.getElementById("emp-qty");
    const empComment = document.getElementById("emp-comment");
    const empAddBtn = document.getElementById("emp-add");
    const empAddTotal = document.getElementById("emp-add-total");

    let empBasePrice = 0;
    let currentEmpCard = null;

    document.querySelectorAll('[data-type="empanada"], [data-type="tarta"], [data-type="bebida"]').forEach(card => {
        card.addEventListener('click', () => {
            currentEmpCard = card;

            empTitle.textContent = card.dataset.name;
            empBasePrice = parseInt(card.dataset.price || "0", 10);
            empPriceEl.textContent = fmt(empBasePrice);
            empImg.src = card.dataset.img;
            empDesc.textContent = card.dataset.desc || "";

            empQtyInput.value = 1;
            empComment.value = "";
            updateEmpTotal();

            empOverlay.style.display = "block";
            empModal.style.display = "block";
            document.body.classList.add("modal-open");
        });
    });

    function updateEmpTotal() {
        const qty = Math.max(1, parseInt(empQtyInput.value || "1", 10));
        if (empAddTotal) empAddTotal.textContent = fmt(empBasePrice * qty);
    }

    function empClose() {
        empOverlay.style.display = "none";
        empModal.style.display = "none";
        document.body.classList.remove("modal-open");
    }

    document.querySelector('[data-close-emp]')?.addEventListener("click", empClose);
    empOverlay.addEventListener("click", empClose);

    document.querySelectorAll('[data-emp-act]').forEach(btn => {
        btn.addEventListener('click', () => {
            let val = parseInt(empQtyInput.value || "1", 10);
            if (btn.dataset.empAct === "inc") val++;
            else if (val > 1) val--;
            empQtyInput.value = val;
            updateEmpTotal();
        });
    });

    empQtyInput.addEventListener("input", () => {
        let val = parseInt(empQtyInput.value || "1", 10);
        if (isNaN(val) || val < 1) val = 1;
        empQtyInput.value = val;
        updateEmpTotal();
    });

    empAddBtn.addEventListener("click", () => {
        const qty = Math.max(1, parseInt(empQtyInput.value || "1", 10));
        const note = empComment.value.trim();

        if (!currentEmpCard) return;

        addToCart({
            type: (currentEmpCard?.dataset?.type || "empanada"),
            name: empTitle.textContent || "Empanada",
            basePrice: empBasePrice,
            qty,
            extras: [],
            options: [],
            note: note ? [note] : []
        });

        empClose();
        updateCartFab();
    });

    function updateCartFab() {
        const btn = document.getElementById("open-cart");
        if (!btn) return;

        const cart = getCart();

        // Si no hay nada, ocultar y resetear textos
        if (!Array.isArray(cart) || cart.length === 0) {
            btn.hidden = true;
            const countEl = document.getElementById("cart-count");
            if (countEl) countEl.textContent = "0";
            const totalEl = document.getElementById("cart-total-fab");
            if (totalEl) totalEl.textContent = fmt(0);
            return;
        }

        // Cantidad total de items
        const count = cart.reduce((s, it) => {
            const q = Number(it.qty);
            return s + (Number.isFinite(q) && q > 0 ? q : 1);
        }, 0);

        // Total = (basePrice + options) * qty
        const total = cart.reduce((acc, it) => {
            const opts = Array.isArray(it.options) ? it.options : [];
            const extrasTotal = opts.reduce((s, o) =>
                s + (Number(o.price) || 0) * (Number(o.qty) || 1)
                , 0);

            const unitTotal = (Number(it.basePrice) || 0) + extrasTotal;
            const q = Number(it.qty);
            const qty = (Number.isFinite(q) && q > 0) ? q : 1;

            return acc + unitTotal * qty;
        }, 0);

        // Si por algún motivo queda en 0, también lo ocultamos
        btn.hidden = (count <= 0);

        const countEl = document.getElementById("cart-count");
        if (countEl) countEl.textContent = String(count);

        const totalEl = document.getElementById("cart-total-fab");
        if (totalEl) totalEl.textContent = fmt(total);
    }


    function itemDetailsHTML(it) {
        const lines = [];

        if (it.optionals?.length) {
            it.optionals.forEach(op => lines.push(`(x1) ${op}`));
        }

        if (it.note) {
            lines.push(`📝 ${it.note}`);
        }

        return lines.length ? `<div class="cd-meta">${lines.join("<br>")}</div>` : "";
    }

    window.addEventListener("pageshow", () => {
        document.body.classList.remove("modal-open");
    });

    renderCart();
})();

function openCart() {
    const elDrawer = document.getElementById('cart-drawer');
    const elOverlay = document.getElementById('cart-overlay');
    if (!elDrawer || !elOverlay) return;

    // reset paso 2 si existe
    if (typeof hideStep2 === 'function') hideStep2();

    elDrawer.hidden = false;
    elOverlay.hidden = false;

    if (typeof renderCart === 'function') renderCart();
}

function closeCart() {
    const elDrawer = document.getElementById('cart-drawer');
    const elOverlay = document.getElementById('cart-overlay');
    if (!elDrawer || !elOverlay) return;

    if (typeof hideStep2 === 'function') hideStep2();

    elDrawer.hidden = true;
    elOverlay.hidden = true;
}

function toggleHorarios() {
    const panel = document.getElementById("horarios-accordion");
    const btn = document.getElementById("btn-horarios");

    const isOpen = panel.classList.contains("is-open");

    if (isOpen) {
        // cerrar
        panel.style.maxHeight = "0px";
        panel.classList.remove("is-open");
        btn?.setAttribute("aria-expanded", "false");

        // al terminar la animación, ocultar del flujo (evita espacios raros)
        setTimeout(() => {
            panel.hidden = true;
        }, 280);
    } else {
        // abrir
        panel.hidden = false;
        panel.classList.add("is-open");
        btn?.setAttribute("aria-expanded", "true");

        // set max-height dinámico para animar
        panel.style.maxHeight = panel.scrollHeight + "px";
    }
}

// cerrar con ESC
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById('modal-horarios');
    if (modal && modal.classList.contains('is-open')) toggleHorarios();
});

function showOnly(targetId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(targetId)?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setBottomActive(target) {
    // Apaga todos los botones de la nav nueva
    document.querySelectorAll('.lp-bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
    // Enciende el botón correcto buscando por su data-go
    document.querySelector(`.lp-bottom-nav .nav-item[data-go="${target}"]`)?.classList.add('active');
}

// Botones de la nueva bottom nav (inicio/productos/promociones)
document.querySelectorAll('.lp-bottom-nav .nav-item[data-go]').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.go;
        if (!target) return;

        closeCart();
        setBottomActive(target);
        showOnly(target);
    });
});

// Botón “Mi Pedido” de la nueva nav
document.getElementById('lp-open-cart-bottom')?.addEventListener('click', (e) => {
    e.preventDefault();
    openCart();
});

// ===============================
// CATEGORÍAS (HOME y PANEL PRODUCTOS)
// ===============================

function goToCategory(targetId) {
    if (!targetId) return;
    closeCart();
    setBottomActive('productos');
    showOnly(targetId);
}

// Escucha los clics en categorías del Home Y del panel de Productos
document.querySelectorAll('.lp-cat-card[data-go], .lp-cat-boceto[data-go]').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.go; 
        goToCategory(targetId);
    });
});

// ===============================
// BOTONES "VOLVER" de los paneles (Productos / Promociones)
// ===============================
document.querySelectorAll('.lp-panel-back[data-back]').forEach(btn => {
    btn.addEventListener('click', () => {
        const back = btn.dataset.back || 'home';
        closeCart();
        setBottomActive(back);
        showOnly(back);
    });
});

// ===============================
// CTA dentro de "Promociones" (data-go="promos")
// ===============================
document.querySelectorAll('[data-go="promos"]').forEach(btn => {
    btn.addEventListener('click', () => {
        // "promos" es una sección del menú (combos), la tratamos como parte de Productos
        goToCategory('promos');
    });
});

// Listener para los botones de volver con clase "lp-clean-back"
document.querySelectorAll('.lp-clean-back[data-back]').forEach(btn => {
    btn.addEventListener('click', () => {
        const back = btn.dataset.back || 'home';
        
        // Usamos las mismas funciones que ya tenés en tu script
        if (typeof closeCart === 'function') closeCart();
        
        // Marcamos "Inicio" o "Productos" en la barra inferior según corresponda
        if (typeof setBottomActive === 'function') setBottomActive(back);
        
        // Mostramos la sección destino
        if (typeof showOnly === 'function') showOnly(back);
    });
});