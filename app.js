(() => {
    function updateStatus() {
        const pill = document.getElementById('estado-local'); // ID correcto según tu HTML
        if (!pill) return;

        const ahora = new Date();
        const dia = ahora.getDay(); // 0 domingo, 1 lunes...
        const horas = ahora.getHours();
        const minutos = ahora.getMinutes();
        const tiempoActual = (horas * 60) + minutos;

        // Definimos los puntos de corte en minutos
        const min1900 = 19 * 60;          // 19:00 hs
        const min1930 = (19 * 60) + 30;   // 19:30 hs
        const min2230 = (22 * 60) + 30;   // 22:30 hs
        const min2300 = 23 * 60;          // 23:00 hs

        // 1. Validar si es Lunes (Cerrado todo el día)
        if (dia === 1) {
            pill.className = 'estado-local cerrado';
            pill.innerText = 'CERRADO';
            return;
        }

        // 2. Lógica de horarios (Martes a Domingo)
        if (tiempoActual >= min1900 && tiempoActual < min1930) {
            // 19:00 a 19:29
            pill.className = 'estado-local abriendo';
            pill.innerText = 'ABRE PRONTO';
        } else if (tiempoActual >= min1930 && tiempoActual <= min2230) {
            // 19:30 a 22:30 (Incluimos el minuto 30)
            pill.className = 'estado-local abierto';
            pill.innerText = 'ABIERTO';
        } else if (tiempoActual > min2230 && tiempoActual < min2300) {
            // 22:31 a 22:59
            pill.className = 'estado-local cerrando';
            pill.innerText = 'CIERRA PRONTO';
        } else {
            // De 23:00 a 18:59
            pill.className = 'estado-local cerrado';
            pill.innerText = 'CERRADO';
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

        updateStatus();
        setInterval(updateStatus, 60_000);

        const tipoPizza = document.getElementById("tipo-pizza");
        const gusto1 = document.getElementById("gusto1");
        const gusto2 = document.getElementById("gusto2");

        if (tipoPizza && gusto1 && gusto2) {
            syncGustos(gusto1, gusto2, tipoPizza);
        }

        // Optimización mobile: lazy + decoding async para imágenes de cards.
        // Esto evita que al abrir categorías se “disparen” muchas cargas/decodificaciones de golpe.
        // (No cambia la lógica; solo atributos de performance en imágenes existentes.)
        document.querySelectorAll('img.card-img').forEach(img => {
            try {
                if (img.getAttribute('loading') !== 'lazy') img.loading = 'lazy';
                if (img.getAttribute('decoding') !== 'async') img.decoding = 'async';

                // Ayuda a priorizar el resto de recursos frente a imágenes de grilla.
                if ('fetchPriority' in img) img.fetchPriority = 'low';

                // Reserva espacio para evitar relayout (CSS ya define el tamaño visual).
                if (!img.hasAttribute('width')) img.width = 115;
                if (!img.hasAttribute('height')) img.height = 115;
            } catch { /* sin afectar el flujo */ }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }

    const CART_KEY = 'lopepu-cart';
    const fmt = n => '$ ' + (n || 0).toLocaleString('es-AR');

    const isCommentLikeOption = (s) => {
        const t = String(s || '').trim().toLowerCase();
        return t.startsWith('comentario') || t.startsWith('comment');
    };

    /** Quita prefijos de bundle tipo "PIZZA:", "PIZZA 2:", "EMPANADAS:" en detalles y mensajes. No elimina "Chica"/"Grande" de tamaño. */
    function stripMenuLinePrefixes(line) {
        let t = String(line || '').trim();
        let prev;
        do {
            prev = t;
            t = t
                .replace(/\s*PIZZA\s*\d*\s*:\s*/gi, ' ')
                .replace(/\s*PIZZA\s*:\s*/gi, ' ')
                .replace(/\s*EMPANADAS\s*:\s*/gi, ' ')
                .replace(/\s*,\s*,+/g, ', ')
                .replace(/^\s*,\s*|\s*,\s*$/g, '')
                .trim();
        } while (prev !== t);
        return t.replace(/\s+/g, ' ').trim();
    }

    /** Para no repetir sabores de la línea principal dentro del paréntesis de extras. */
    function normalizeHalfFlavor(s) {
        return stripMenuLinePrefixes(String(s || '').trim())
            .replace(/^1\/2\s+/i, '')
            .trim()
            .toLowerCase();
    }

    /**
     * Sufijo con extras + nota. excludeFlavorLines = líneas base (ej. mitades): no se repiten en ().
     * No se aplica a empanadas.
     */
    function formatPizzaExtrasSuffix(options, note, excludeFlavorLines = []) {
        const excl = new Set(
            (excludeFlavorLines || [])
                .map(s => normalizeHalfFlavor(s))
                .filter(Boolean)
        );
        const rawLines = (excludeFlavorLines || []).map(s =>
            stripMenuLinePrefixes(String(s || '').trim()).toLowerCase()
        );

        const parts = [];
        (Array.isArray(options) ? options : []).forEach(o => {
            const name = String(o?.name || '').trim();
            if (!name || isCommentLikeOption(name)) return;
            const clean = stripMenuLinePrefixes(name);
            const n = normalizeHalfFlavor(clean);
            if (excl.has(n)) return;
            if (rawLines.some(rl => rl && (clean.toLowerCase() === rl || n === normalizeHalfFlavor(rl)))) return;
            parts.push(clean);
        });
        const n = Array.isArray(note) ? note.filter(Boolean).join(' ') : String(note || '').trim();
        if (n) parts.push(stripMenuLinePrefixes(n));
        if (!parts.length) return '';
        return ' (' + parts.join(', ') + ')';
    }

    function compressLines(lines) {
        const order = [];
        const counts = new Map();

        (lines || []).forEach(l => {
            const raw = stripMenuLinePrefixes(String(l || '').trim());
            if (!raw) return;

            // Si la línea ya trae `(xN) ...`, no debemos contarla como "otra línea"
            // (eso duplica multiplicadores). Acá sumamos las unidades directamente.
            const pref = raw.match(/^\(x(\d+)\)\s*(.+)$/i);
            const qtyToAdd = pref ? (Number(pref[1]) || 1) : 1;
            const key = pref ? String(pref[2] || '').trim() : raw;
            if (!key) return;

            if (!counts.has(key)) order.push(key);
            counts.set(key, (counts.get(key) || 0) + qtyToAdd);
        });

        const out = [];

        order.forEach(key => {
            const n = counts.get(key) || 1;

            const halfMatch = key.match(/^1\/2\s+(.+)$/i);
            if (halfMatch) {
                const prodName = halfMatch[1].trim();
                const wholeCount = Math.floor(n / 2);
                const halfRest = n % 2;

                if (wholeCount > 0) {
                    out.push(wholeCount > 1 ? `(x${wholeCount}) ${prodName}` : prodName);
                }

                if (halfRest > 0) {
                    out.push(`1/2 ${prodName}`);
                }

                return;
            }

            out.push(n > 1 ? `(x${n}) ${key}` : key);
        });

        return out;
    }

    function applyTierPlural(name, n) {
        let out = name;
        if (n <= 1) return out;
        if (/muzzarella$/i.test(out)) {
            out = out.replace(/muzzarella$/i, 'Muzzarellas');
        } else if (/especial$/i.test(out)) {
            out = out.replace(/especial$/i, 'Especiales');
        } else if (/super$/i.test(out)) {
            out = out.replace(/super$/i, 'Supers');
        }
        return out;
    }

    function formatPizzaDetailLine(line) {
        const raw = String(line || '').trim();
        if (!raw) return raw;

        if (/\r?\n/.test(raw)) {
            return raw.split(/\r?\n/)
                .map(seg => formatPizzaDetailLine(seg.trim()))
                .filter(s => s !== '')
                .join('<br>');
        }

        // Extras / nota en líneas aparte (sin cantidad de pizza)
        if (/^\[/.test(raw) || /^\(Nota:/i.test(raw)) return raw;

        // (xN) 1 Sabor — salida legacy de compressLines
        const legacyX1 = raw.match(/^\(x(\d+)\)\s*1\s+(.+)$/i);
        if (legacyX1) {
            const n = Number(legacyX1[1]) || 1;
            const name = applyTierPlural(legacyX1[2].trim(), n);
            return `<span class="qty-highlight">(x${n})</span> ${name}`;
        }

        const xQty = raw.match(/^\(x(\d+)\)\s*(.+)$/i);
        if (xQty) {
            const n = Number(xQty[1]) || 1;
            let rest = String(xQty[2] || '').trim();

            const halfAfter = rest.match(/^1\/2\s+(.+)$/i);
            if (halfAfter) {
                return `<span class="qty-highlight">(x${n})</span> <span class="qty-highlight">1/2</span> ${halfAfter[1].trim()}`;
            }

            const oneAfter = rest.match(/^1\s+(.+)$/i);
            if (oneAfter) {
                const name = applyTierPlural(oneAfter[1].trim(), n);
                return `<span class="qty-highlight">(x${n})</span> ${name}`;
            }

            if (rest) {
                const name = /^½/i.test(rest) ? rest : applyTierPlural(rest, n);
                return `<span class="qty-highlight">(x${n})</span> ${name}`;
            }
            return raw;
        }

        if (/^1\/2\s+/i.test(raw)) {
            const hm = raw.match(/^1\/2\s+(.+)$/i);
            if (hm) {
                return `<span class="qty-highlight">1/2</span> ${hm[1].trim()}`;
            }
        }

        const oneLead = raw.match(/^1\s+(.+)$/i);
        if (oneLead) {
            return `<span class="qty-highlight">(x1)</span> ${oneLead[1].trim()}`;
        }

        return `<span class="qty-highlight">(x1)</span> ${raw}`;
    }

    function buildWhatsappMessage() {
        const cartRaw = getCart();
        const cart = buildCartView(cartRaw); // promos ya aplicadas como en el carrito

        const nombre = document.getElementById('cd-nombre')?.value.trim() || '';
        const pagoBtn = document.querySelector('.pago-card.selected');
        const pago = pagoBtn?.querySelector('.pago-name')?.textContent?.trim() ||
            pagoBtn?.textContent?.trim() || '';

        const modo = (document.getElementById('opt-delivery')?.classList.contains('selected'))
            ? 'envio'
            : 'retiro';

        const calle = document.getElementById('cd-calle')?.value.trim() || '';
        const numero = document.getElementById('cd-num')?.value.trim() || '';

        const tipoEntrega = modo === 'envio' ? 'Envío' : 'Retiro';
        const direccion = [calle, numero].filter(Boolean).join(' ');
        const total = document.getElementById('cart-total')?.textContent?.trim() || '0';

        const SEP = '━━━━━━━━━━━━━━━━━━━━━━';

        const normComment = (val) => {
            if (val == null) return '';
            let s = '';
            if (Array.isArray(val)) s = val.filter(Boolean).join(' ');
            else s = String(val);
            s = s.trim();
            if (!s) return '';
            s = s.replace(/^Comentario\s*:\s*/i, '').replace(/^Comentarios\s*:\s*/i, '').trim();
            return s;
        };

        /** Solo quita "Grande"; no toca "Chica" (evita que Chica y Grande se confundan en WhatsApp). */
        const stripGrandeOnly = (n) =>
            String(n || '')
                .replace(/\s+Grande\b/gi, '')
                .trim();

        const displayWhatsappPizzaName = (nameAfterPrefixStrip, size) => {
            let n = stripGrandeOnly(String(nameAfterPrefixStrip || '').trim());
            if (size === 's' && n && !/\bchica\b/i.test(n)) {
                n = `${n} Chica`.trim();
            }
            return n;
        };

        const parseXQty = (raw) => {
            const s = String(raw || '').trim();
            const m = s.match(/^\(x(\d+)\)\s*(.+)$/i);
            if (!m) return null;
            return { qty: Number(m[1]) || 1, name: m[2].trim() };
        };

        const linesByType = {
            pizzas: [],
            empanadas: [],
            tarta: [],
            bebidas: [],
            conos: []
        };

        const pushLine = (arr, qty, name, comment, pizzaSize) => {
            const q = Number(qty) || 1;
            const n = String(name || '').trim();
            if (!n) return;
            const c = normComment(comment);
            arr.push({ qty: q, name: n, comment: c, _pizzaSize: pizzaSize });
        };

        const promoItems = cart.filter(it => it.type === 'promo');
        const promoNames = promoItems
            .map(p => String(p.name || '').trim())
            .filter(Boolean);

        // Recorremos el carrito ya "vista" (promos aplicadas) para incluir
        // los productos consumidos dentro de promos.
        cart.forEach(it => {
            if (it.type === 'promo') {
                const promoQty = Number(it.qty) || 1;
                const promoComment = normComment(it.note);

                (Array.isArray(it.sections) ? it.sections : []).forEach(sec => {
                    const title = String(sec.title || '').trim().toUpperCase();
                    const secLines = Array.isArray(sec.lines) ? sec.lines : [];

                    if (title.startsWith('PIZZA')) {
                        secLines.forEach(line => {
                            const raw = String(line || '').trim();
                            if (!raw) return;

                            const parsed = parseXQty(raw);
                            const qtyLine = parsed ? (parsed.qty * promoQty) : promoQty;
                            let nameLine = parsed ? parsed.name : raw;
                            nameLine = displayWhatsappPizzaName(stripMenuLinePrefixes(nameLine), it.pizzaSize);
                            // Extras/nota ya van en la línea (buildCartView); no repetir nota global en cada pizza.
                            pushLine(linesByType.pizzas, qtyLine, nameLine, '', it.pizzaSize);
                        });
                        return;
                    }

                    if (title.startsWith('EMP')) {
                        secLines.forEach(line => {
                            const raw = String(line || '').trim();
                            if (!raw) return;

                            const parsed = parseXQty(raw);
                            const qtyLine = parsed ? (parsed.qty * promoQty) : promoQty;
                            let nameLine = parsed ? parsed.name : raw;
                            nameLine = stripMenuLinePrefixes(String(nameLine).trim());

                            pushLine(linesByType.empanadas, qtyLine, nameLine, '');
                        });
                        return;
                    }
                });

                if (promoComment) {
                    pushLine(linesByType.pizzas, promoQty, 'Nota al combo', promoComment);
                }

                return;
            }

            const qty = Number(it.qty) || 1;
            const comment = normComment(it.comment || it.note);

            if (it.type === 'pizza') {
                const noteMerged = [
                    Array.isArray(it.note) ? it.note.filter(Boolean).join(' ') : String(it.note || '').trim(),
                    String(it.comment || '').trim()
                ].filter(Boolean).join(' ');
                // Si la pizza tiene secciones (mitad y mitad), mostramos cada línea como item.
                if (Array.isArray(it.sections) && it.sections.length) {
                    const flavorExclude = [];
                    it.sections.forEach(sec => {
                        const title = String(sec.title || '').trim().toUpperCase();
                        if (title && !title.startsWith('PIZZA')) return;
                        (Array.isArray(sec.lines) ? sec.lines : []).forEach(line => {
                            const raw = String(line || '').trim();
                            if (raw) flavorExclude.push(displayWhatsappPizzaName(stripMenuLinePrefixes(raw), it.size));
                        });
                    });
                    it.sections.forEach(sec => {
                        const title = String(sec.title || '').trim().toUpperCase();
                        const secLines = Array.isArray(sec.lines) ? sec.lines : [];
                        if (title && !title.startsWith('PIZZA')) return;

                        secLines.forEach(line => {
                            const raw = String(line || '').trim();
                            if (!raw) return;
                            let nameLine = displayWhatsappPizzaName(stripMenuLinePrefixes(raw), it.size);
                            const optSuf = formatPizzaExtrasSuffix(it.options, noteMerged, flavorExclude);
                            pushLine(linesByType.pizzas, qty, nameLine + optSuf, '', it.size);
                        });
                    });
                } else {
                    const nameLine = displayWhatsappPizzaName(stripMenuLinePrefixes(it.name), it.size);
                    const optSuf = formatPizzaExtrasSuffix(it.options, noteMerged, [nameLine]);
                    pushLine(linesByType.pizzas, qty, nameLine + optSuf, '', it.size);
                }
                return;
            }

            if (it.type === 'empanada') {
                const nameClean = (it.name || '').trim();
                pushLine(linesByType.empanadas, qty, nameClean, comment);
                return;
            }

            if (it.type === 'tarta') {
                pushLine(linesByType.tarta, qty, it.name, comment);
                return;
            }

            if (it.type === 'bebida') {
                pushLine(linesByType.bebidas, qty, it.name, comment);
                return;
            }

            if (it.type === 'cono') {
                let nombre = it.name;

                if (Array.isArray(it.options) && it.options.length) {
                    const sabores = it.options.map(o => o.name).join(' + ');
                    nombre += ` (${sabores})`;
                }

                pushLine(linesByType.conos, qty, nombre, comment);
                return;
            }
        });

        function compactItems(items) {
            const map = new Map();
            const nm = (s) => String(s || '').trim().replace(/\s+/g, ' ');
            const sig = (s) => {
                try {
                    return nm(s).normalize('NFKC');
                } catch {
                    return nm(s);
                }
            };

            items.forEach(it => {
                const key = `${sig(it.name)}||${sig(it.comment)}||${sig(it._pizzaSize ?? '')}`;

                if (!map.has(key)) {
                    map.set(key, { ...it, name: nm(it.name), comment: nm(it.comment) });
                } else {
                    map.get(key).qty += it.qty;
                }
            });

            return Array.from(map.values());
        }

        const renderItems = (items) => {
            const compacted = compactItems(items);

            return compacted
                .map(itLine => {
                    let base = `* (x${itLine.qty}) ${itLine.name}`;

                    if (itLine.comment) {
                        base += ` (${itLine.comment})`;
                    }

                    return base;
                })
                .join('\n');
        };

        let msg = '';
        msg += `Nombre y Apellido: ${nombre}\n`;
        msg += `Tipo de Entrega: ${tipoEntrega}\n`;
        if (modo === 'envio') {
            if (direccion) msg += `Dirección: ${direccion}\n`;
        }
        msg += `Medio de Pago: ${pago}\n`;
        msg += `Total del Pedido: ${total}\n\n${SEP}\n\n`;

        if (linesByType.pizzas.length) {
            msg += `PIZZAS\n${renderItems(linesByType.pizzas)}\n\n`;
        }
        if (linesByType.empanadas.length) {
            msg += `EMPANADAS\n${renderItems(linesByType.empanadas)}\n\n`;
        }
        if (linesByType.tarta.length) {
            msg += `TARTA\n${renderItems(linesByType.tarta)}\n\n`;
        }
        if (linesByType.bebidas.length) {
            msg += `BEBIDAS\n${renderItems(linesByType.bebidas)}\n\n`;
        }
        if (linesByType.conos.length) {
            msg += `CONO\n${renderItems(linesByType.conos)}\n\n`;
        }

        if (promoNames.length) {
            msg += `${SEP}\n\nPromociones Aplicadas:\n`;
            msg += promoNames.map(p => `* ${p}`).join('\n');
            msg += '\n';
        }

        return msg.trim();
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

    const btnRetiro = document.getElementById('opt-retiro');
    const btnDelivery = document.getElementById('opt-delivery');
    const boxEnvio = document.getElementById('addressFields');
    const shipNote = document.getElementById('cd-shipnote');

    function showStep2() {
        const s1 = document.getElementById('cd-step1');
        const s2 = document.getElementById('cd-step2');
        const f1 = document.getElementById('cart-footer-step1');
        const f2 = document.getElementById('cart-footer-step2');

        // STEP BAR
        const steps = document.querySelectorAll('.step-item');
        steps[0]?.classList.add('done');
        steps[0]?.classList.remove('active');
        steps[1]?.classList.add('active');

        if (s1) s1.style.display = 'none';
        if (f1) f1.style.display = 'none';

        if (s2) {
            s2.style.display = 'flex';
            s2.classList.add('active');
        }

        if (f2) {
            f2.style.display = 'flex';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function hideStep2() {
        const s1 = document.getElementById('cd-step1');
        const s2 = document.getElementById('cd-step2');
        const f1 = document.getElementById('cart-footer-step1');
        const f2 = document.getElementById('cart-footer-step2');

        const steps = document.querySelectorAll('.step-item');
        steps[0]?.classList.remove('done');
        steps[0]?.classList.add('active');
        steps[1]?.classList.remove('active');

        if (s2) {
            s2.style.display = 'none';
            s2.classList.remove('active');
        }
        if (f2) f2.style.display = 'none';

        if (s1) s1.style.display = 'block';
        if (f1) f1.style.display = 'flex';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function setEntregaMode(mode) {
        const isEnvio = mode === 'envio';

        btnRetiro?.classList.toggle('selected', !isEnvio);
        btnDelivery?.classList.toggle('selected', isEnvio);

        if (boxEnvio) {
            boxEnvio.hidden = !isEnvio;
            boxEnvio.classList.toggle('visible', isEnvio);
        }

        if (shipNote) {
            shipNote.hidden = !isEnvio;
        }
    }

    window.setEntregaMode = setEntregaMode;
    window.selectEntrega = function (mode) {
        setEntregaMode(mode);
    };

    setEntregaMode('retiro');

    function showToast(message) {
        let toast = document.getElementById('lp-toast');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'lp-toast';
            toast.className = 'lp-toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('show');

        clearTimeout(window.__lpToastTimer);
        window.__lpToastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2600);
    }

    const btnEnviarPedido =
        document.querySelector('#cart-footer-step2 .btn-send') ||
        document.getElementById('cd-step2-confirm');
    const inputCalle = document.getElementById('cd-calle');
    const inputNumero = document.getElementById('cd-num');

    // BUSCA ESTE BLOQUE Y REEMPLÁZALO COMPLETO:
    btnEnviarPedido?.addEventListener('click', () => {
        const modoActivo = (document.getElementById('opt-delivery')?.classList.contains('selected'))
            ? 'envio'
            : 'retiro';

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
        const pagoSeleccionado = document.querySelector('.pago-card.selected');

        // Validar Nombre
        if (!inputNombre?.value.trim()) {
            inputNombre?.classList.add('is-error');
            clienteError = true;
        }

        // Validar Pago
        if (!pagoSeleccionado) {
            // Marcamos ambas opciones en rojo para indicar que falta seleccionar una
            document.querySelectorAll('.pago-card').forEach(r => r.classList.add('is-error'));
            clienteError = true;
        }

        // Si falta Nombre o Pago, mostramos mensaje y cortamos
        if (clienteError) {
            const box = document.createElement('div');
            box.className = 'cd-field-error-msg'; // Usamos la nueva clase CSS
            box.textContent = 'Por favor completá tu Nombre y Medio de Pago.';
            document.getElementById('cd-cliente')?.appendChild(box);
            showToast('Completá nombre y medio de pago para continuar.');
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
                document.getElementById('addressFields')?.appendChild(box);
                showToast('Completá calle y número para el envío.');
                return; // <--- Detiene la ejecución si falta dirección
            }
        }

        // 4. SI TODO ESTÁ BIEN: ARMAR WHATSAPP
        const mensaje = buildWhatsappMessage();
        const phone = '5492324674311'; // Tu número
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
        const waWin = window.open(url, '_blank');
        if (!waWin) window.location.href = url;

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
            "2muzza": 23000,
            "esp+muzza": 25000,
            "2esp": 27000,
            "3esp": 39000,
            "3muzza": 33000,

            "emp6": 10000,
            "emp12": 18000,
            "emp24": 34000,

            "muzza+6": 21000,
            "esp+6": 23000,
            "muzza+12": 29000,
            "esp+12": 31000,
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
            // muzza grande = 12000, especial grande = 14000
            const pizzaNormal = (needTier === "muzza") ? 12000 : 14000;

            // empanadas normal: $1800 c/u (según tus cards).
            const empNormal = 1800 * needEmp;

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

        const tierFullPrice = (tier) => tier === 'muzza' ? 12000
            : tier === 'esp' ? 14000
                : tier === 'super' ? 15500
                    : 0;

        /** Entre dos tiers distintos, gana el de mayor precio de pizza grande (p. ej. muzza+esp → esp). */
        const higherPriceTier = (ta, tb) =>
            (tierFullPrice(ta) >= tierFullPrice(tb) ? ta : tb);

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

        const mergeHalfNotes = (n1, n2) => {
            const a = Array.isArray(n1) ? n1.join(' ').trim() : String(n1 || '').trim();
            const b = Array.isArray(n2) ? n2.join(' ').trim() : String(n2 || '').trim();
            return [a, b].filter(Boolean).join(' | ');
        };

        const isTostadaOption = (o) => {
            const n = String(o?.name || '').trim().toLowerCase();
            return n.includes('tostada');
        };

        const optionsListHasTostada = (opts) =>
            (Array.isArray(opts) ? opts : []).some(isTostadaOption);

        /** Solo extras con costo > 0 (para sumar al subtotal del combo sin mezclar texto con empanadas). */
        const mergePickedPricedOptions = (picked) => {
            const merged = [];
            const seen = new Set();
            picked.forEach(pz => {
                (Array.isArray(pz.options) ? pz.options : []).forEach(o => {
                    const name = String(o?.name || '').trim();
                    if (!name || isCommentLikeOption(name)) return;
                    if ((Number(o.price) || 0) <= 0) return;
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

        // 1) Fusionar 2 medias -> 1 pizza grande con detalles
        const used = new Set();
        const out = [];

        const cleanName = (n) => String(n || '').replace(/^1\/2\s+/i, '');

        function makeMergedHalfPizza(a, b) {
            const t1 = a.tier;
            const t2 = b.tier;
            const mixedTier = (t1 !== t2);
            const winningTier = mixedTier ? higherPriceTier(t1, t2) : t1;
            const aClean = cleanName(a.name);
            const bClean = cleanName(b.name);
            // Si las dos mitades son del mismo tier pero eligieron gustos/variedades distintas,
            // necesitamos reflejar ambas mitades en el detalle (para que las promos no muestren "Especial" genérico).
            const showHalfDetails = mixedTier
                || aClean !== tierLabel(t1)
                || bClean !== tierLabel(t1);

            const basePrice = mixedTier
                ? tierFullPrice(winningTier)
                : tierFullPrice(t1);

            let mergedOpts = mergeOptions(a.options, b.options);
            if (optionsListHasTostada(a.options) || optionsListHasTostada(b.options)) {
                if (!mergedOpts.some(isTostadaOption)) {
                    mergedOpts = mergeOptions(mergedOpts, [{ name: 'BASE TOSTADA', price: 0, qty: 1 }]);
                }
                mergedOpts = mergeOptions(
                    mergedOpts.map(o =>
                        isTostadaOption(o)
                            ? { name: 'BASE TOSTADA', price: Number(o.price) || 0, qty: 1 }
                            : o
                    ),
                    []
                );
            }

            return {
                type: 'pizza',
                tier: winningTier,
                size: 'g',
                qty: 1,
                basePrice,
                name: mixedTier
                    ? `1/2 ${tierLabel(t1)} y 1/2 ${tierLabel(t2)}`
                    : `${tierLabel(t1)}`,
                options: mergedOpts,
                note: mergeHalfNotes(a.note, b.note),
                _src: [...(a._src || []), ...(b._src || [])],
                sections: showHalfDetails ? [{
                    title: '',
                    lines: [
                        `1/2 ${aClean}`,
                        `1/2 ${bClean}`
                    ]
                }] : []
            };
        }

        function isHalfPizza(it) {
            return it.type === 'pizza' && it.size === 'half' && ['muzza', 'esp', 'super'].includes(it.tier);
        }

        /** Dos mitades del mismo tier → 1 grande (orden del carrito); gustos distintos van en sections. */
        function pairSameTier(tier) {
            const indexes = items
                .map((it, idx) => ({ it, idx }))
                .filter(x => !used.has(x.idx) && isHalfPizza(x.it) && x.it.tier === tier)
                .map(x => x.idx);

            for (let k = 0; k + 1 < indexes.length; k += 2) {
                const i1 = indexes[k];
                const i2 = indexes[k + 1];
                used.add(i1);
                used.add(i2);
                out.push(makeMergedHalfPizza(items[i1], items[i2]));
            }
        }

        /** Cruza tiers (muzza+esp, etc.): empareja la primera media disponible de cada una, sin exigir mismos extras/nota. */
        function pairFirstAvailable(tierA, tierB) {
            while (true) {
                const i1 = items.findIndex((it, idx) =>
                    !used.has(idx) && isHalfPizza(it) && it.tier === tierA
                );
                const i2 = items.findIndex((it, idx) =>
                    !used.has(idx) && isHalfPizza(it) && it.tier === tierB
                );

                if (i1 === -1 || i2 === -1) break;

                used.add(i1);
                used.add(i2);
                out.push(makeMergedHalfPizza(items[i1], items[i2]));
            }
        }

        // prioridad para lograr el mejor precio/promo:
        // 1. mismas mitades entre sí
        pairSameTier('muzza');
        pairSameTier('esp');
        pairSameTier('super');

        // 2. después mezclar lo que sobró
        pairFirstAvailable('muzza', 'esp');
        pairFirstAvailable('muzza', 'super');
        pairFirstAvailable('esp', 'super');

        // 3. dejar pasar lo que no se pudo fusionar
        for (let i = 0; i < items.length; i++) {
            if (used.has(i)) continue;
            out.push(items[i]);
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

        /** Líneas de sección PIZZA en promos: base + extras/nota solo de esa pizza (no van al root ni a empanadas). */
        const buildPizzaSectionLinesForPromo = (pizza) => {
            const baseLines = consumePizzaLines(pizza).map(l =>
                stripMenuLinePrefixes(String(l || '').trim())
            );
            return baseLines.map(bl =>
                stripMenuLinePrefixes(
                    String(bl || '').trim() +
                    formatPizzaExtrasSuffix(pizza.options, pizza.note, baseLines)
                )
            );
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

                const pizzaLines = buildPizzaSectionLinesForPromo(pizza);
                const empLines = taken.map(t =>
                    `(x${Number(t.qty) || 1}) ${t.name}`
                );

                // Texto de extras en líneas de PIZZA; solo cobramos opciones con precio en el combo.
                const picked = [pizza];
                const pricedOpts = mergePickedPricedOptions(picked);

                const promoItem = {
                    type: 'promo',
                    qty: 1,
                    basePrice: price,
                    name: p.label,
                    options: pricedOpts,
                    note: '',
                    pizzaSize: pizza.size,
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
                picked.forEach(pz => {
                    buildPizzaSectionLinesForPromo(pz).forEach(l => pizzaLines.push(l));
                });

                const promoItem = {
                    type: 'promo',
                    qty: 1,
                    basePrice: price,
                    name: label,
                    options: mergePickedPricedOptions(picked),
                    note: '',
                    pizzaSize: picked[0]?.size,
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
        const elList = document.getElementById('cart-list');
        const elTotal = document.getElementById('cart-total');
        const emptyState = document.getElementById('cd-empty');
        const footer1 = document.getElementById('cart-footer-step1');

        if (!elList || !elTotal) return;

        const cart = getCart();
        const view = buildCartView(cart);

        // Carrito Vacío
        if (!view || view.length === 0) {
            elList.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            if (footer1) footer1.style.display = 'none';
            elTotal.textContent = '0';
            updateCartFab();
            return;
        }

        // Carrito con Items
        if (emptyState) emptyState.style.display = 'none';
        if (footer1) footer1.style.display = 'flex';

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
            row.className = 'cart-item';

            // LÓGICA DE AGRUPACIÓN (SEPARA PIZZAS, EMPANADAS Y EXTRAS)
            let sections = Array.isArray(it.sections) ? [...it.sections] : [];
            let extraLines = [];
            const hasEmpSection = sections.some(sec =>
                String(sec?.title || '').trim().toUpperCase().startsWith('EMP')
            );

            if (sections.length === 0 && opts.length > 0) {
                const map = new Map();
                const addLine = (title, line) => {
                    if (!map.has(title)) map.set(title, []);
                    map.get(title).push(line);
                };

                opts.forEach(o => {
                    const name = String(o.name || '').trim();
                    const q = Number(o.qty) || 1;
                    const qtyStr = q > 1 ? `(x${q}) ` : '';

                    let m = name.match(/^PIZZA\s*(\d+)\s*:\s*(.+)$/i);
                    if (m) { addLine(`PIZZA ${m[1]}`, m[2].trim()); return; }

                    m = name.match(/^EMPANADAS\s*:\s*(.+)$/i);
                    if (m) { addLine(`EMPANADAS`, `${qtyStr}${m[1].trim()}`); return; }

                    m = name.match(/^PIZZA\s*:\s*(.+)$/i);
                    if (m) { addLine(`PIZZA`, `${qtyStr}${m[1].trim()}`); return; }

                    extraLines.push(`${qtyStr}${name}`);
                });

                const pK = [...map.keys()].filter(k => /^PIZZA\s+\d+$/.test(k)).sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')));
                const oK = [...map.keys()].filter(k => !/^PIZZA\s+\d+$/.test(k));

                sections = [...pK, ...oK].map(k => ({ title: k, lines: map.get(k) }));
            } else if (sections.length > 0) {
                opts.forEach(o => {
                    const name = String(o.name || '').trim();
                    const q = Number(o.qty) || 1;
                    const qtyStr = q > 1 ? `(x${q}) ` : '';
                    if (/^PIZZA/i.test(name) || /^EMPANADAS/i.test(name)) return;
                    extraLines.push(`${qtyStr}${name}`);
                });
            } else {
                opts.forEach(o => {
                    const name = String(o.name || '').trim();
                    const q = Number(o.qty) || 1;
                    const qtyStr = q > 1 ? `(x${q}) ` : '';
                    extraLines.push(`${qtyStr}${name}`);
                });
            }

            // ARMAR EL HTML
            let innerHTML = '';

            if (sections.length > 0) {
                sections.forEach(sec => {
                    const title = String(sec.title || '').trim().toUpperCase();
                    const isPizzaGroup = !title || title.startsWith('PIZZA');
                    const rawSectionLines = Array.isArray(sec.lines) ? sec.lines : [];
                    let lines = isPizzaGroup ? [] : compressLines(rawSectionLines);

                    if (!isPizzaGroup) {
                        // Solo pizzas pasan por formatPizzaDetailLine actualmente.
                    }

                    // Asegurar cantidad explícita en EMPANADAS (cuando es 1, hoy se renderiza como "Carne")
                    if (title.startsWith('EMP')) {
                        lines = lines.map(l => {
                            const s = String(l || '').trim();
                            if (!s) return s;
                            return /^\(x\d+\)/i.test(s) ? s : `(x1) ${s}`;
                        });
                    }

                    innerHTML += `<div class="detail-group">`;

                    // Mostrar "PIZZAS" solo si la promo no tiene sección EMPANADAS (promo solo pizzas)
                    const showSectionTitle =
                        title && (!title.startsWith('PIZZA') || (title.startsWith('PIZZA') && !hasEmpSection));

                    if (showSectionTitle) {
                        innerHTML += `<span class="detail-group-title">${sec.title}</span>`;
                    }

                    if (isPizzaGroup) {
                        const lines = compressLines(rawSectionLines);
                        lines.forEach(line => {
                            const formatted = formatPizzaDetailLine(line);
                            if (!String(formatted || '').replace(/<[^>]+>/g, '').trim()) return;
                            innerHTML += `<span class="detail-item">${formatted}</span>`;
                        });
                    } else {
                        lines.forEach(l => {
                            let lineFmt = l.replace(/\(x(\d+)\)\s*/gi, '<span style="color: #FFC107; font-weight: 800;">(x$1)</span> ');
                            innerHTML += `<span class="detail-item">${lineFmt}</span>`;
                        });
                    }

                    innerHTML += `</div>`;
                });
            }

            if (extraLines.length > 0) {
                innerHTML += `<div class="detail-group"><span class="detail-group-title">AGREGADOS</span>`;
                extraLines.forEach(l => {
                    let lineFmt = l.replace(/\(x(\d+)\)/gi, '<span style="color: #FFC107; font-weight: 800;">(x$1)</span>');
                    innerHTML += `<span class="detail-item">${lineFmt}</span>`;
                });
                innerHTML += `</div>`;
            }

            const noteVal = Array.isArray(it.note) ? it.note.join(' ') : (it.note || '');
            if (noteVal) {
                innerHTML += `<div class="detail-group"><span class="detail-group-title">COMENTARIO</span><span class="detail-item">${noteVal}</span></div>`;
            }

            let detailsHTML = '';
            if (innerHTML !== '') {
                detailsHTML = `
            <div class="cart-item-toggle" onclick="this.closest('.cart-item').classList.toggle('is-open')">
              <span>Ver detalles</span>
              <svg class="toggle-arrow" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
            </div>
            <div class="cart-item-details">
              <div class="cart-details-inner">${innerHTML}</div>
            </div>`;
            }

            // INSERTAR EN LA TARJETA (Acá borré el $ duplicado del lineTotal)
            row.innerHTML = `
          <div class="cart-item-main">
            <div class="cart-item-info">
              <span class="cart-item-name">${it.name} <span class="qty" style="color: #FFC107;">(x${qty})</span></span>
            </div>
            <span class="cart-item-price">${fmt(lineTotal)}</span>
            <button class="cart-delete-btn" data-act="del" data-src="${(it._src || []).join(',')}" aria-label="Eliminar">
              <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
          ${detailsHTML}
        `;

            elList.appendChild(row);
        });

        elTotal.textContent = fmt(subtotal);
        updateCartFab();
    }

    document.getElementById('cart-continue')?.addEventListener('click', showStep2);
    document.getElementById('cd-step2-back')?.addEventListener('click', hideStep2);


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

        // Mostramos los elementos
        imOverlay.hidden = false;
        imModal.hidden = false;
        imOverlay.classList.add('visible');
        imModal.classList.add('visible');

        // Bloqueamos el scroll del fondo y reseteamos el del modal
        document.body.classList.add('modal-open');
        imModal.scrollTop = 0;

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

        const halfHint = document.getElementById('im-half-tostada-hint');
        if (halfHint) halfHint.hidden = size !== 'half';
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

            size: size,
            tier: imModal?.dataset?.tier || "unk",
        });

        closeItemModal();
    });

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.card-horizontal.full, .lp-promo-card'); // Añadimos .lp-promo-card
        if (!card) return;

        // Si es un cono, bebida o promo, no hacemos nada (ellos tienen sus propios eventos)
        if (card.dataset.type && card.dataset.type !== 'pizza') return;

        // YA NO FILTRAMOS POR SECTION ID, permitimos que abra desde cualquier lado
        const name = card.dataset.name || card.querySelector('h4')?.textContent?.trim() || 'Producto';

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
            imModal.dataset.tier = (priceG === 12000) ? "muzza"
                : (priceG === 14000) ? "esp"
                    : (priceG === 15500) ? "super"
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
        const EMP_UNIT = 1800;

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
                options: [],
                note: ''
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
        const cart = getCart();
        const countEl = document.getElementById("cart-count");
        if (!countEl) return;

        // Usamos la "vista agrupada" para que cuente combos enteros, no empanadas sueltas
        const view = typeof buildCartView === 'function' ? buildCartView(cart) : cart;

        if (!Array.isArray(view) || view.length === 0) {
            countEl.textContent = "0 items";
            return;
        }

        const count = view.reduce((s, it) => s + (Number(it.qty) || 1), 0);
        countEl.textContent = count + (count === 1 ? " item" : " items");
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

    function openCart() {
        showOnly('carrito');
        setBottomActive('carrito');
        hideStep2();
        if (typeof renderCart === 'function') renderCart();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function closeCart() {
        // Ya no hace falta ocultar overlays, pero la función debe existir para que los botones no tiren error.
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
        document.querySelectorAll('.lp-bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
        document.querySelector(`.lp-bottom-nav .nav-item[data-go="${target}"]`)?.classList.add('active');
    }

    // Click en la barra inferior
    document.querySelectorAll('.lp-bottom-nav .nav-item[data-go]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.go;
            if (!target) return;

            if (target === 'carrito') {
                openCart();
                return;
            }

            closeCart();
            setBottomActive(target);
            showOnly(target);
        });
    });

    // Respaldo por si tocan el botón del carrito
    document.getElementById('lp-open-cart-bottom')?.addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
    });

    function goToCategory(targetId) {
        if (!targetId) return;
        closeCart();
        setBottomActive('productos');
        showOnly(targetId);
    }

    // Click en categorías del Home y Panel Productos
    document.querySelectorAll('.lp-cat-card[data-go], .lp-cat-boceto[data-go]').forEach(btn => {
        btn.addEventListener('click', () => {
            goToCategory(btn.dataset.go);
        });
    });

    // Botones Volver genéricos unificados
    document.querySelectorAll('.lp-panel-back[data-back], .lp-clean-back[data-back]').forEach(btn => {
        btn.addEventListener('click', () => {
            const back = btn.dataset.back || 'home';
            closeCart();
            setBottomActive(back);
            showOnly(back);
        });
    });

    // ===============================
    // HORARIOS (Global para el HTML)
    // ===============================
    window.toggleHorarios = function () {
        const panel = document.getElementById("horarios-accordion");
        const btn = document.getElementById("btn-horarios");
        if (!panel) return;

        const isOpen = panel.classList.contains("is-open");
        if (isOpen) {
            panel.style.maxHeight = "0px";
            panel.classList.remove("is-open");
            btn?.setAttribute("aria-expanded", "false");
            setTimeout(() => { panel.hidden = true; }, 280);
        } else {
            panel.hidden = false;
            panel.classList.add("is-open");
            btn?.setAttribute("aria-expanded", "true");
            panel.style.maxHeight = panel.scrollHeight + "px";
        }
    };

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const modal = document.getElementById('horarios-accordion');
        if (modal && modal.classList.contains('is-open')) window.toggleHorarios();
    });

})();

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

const initDniSlider = () => {
    const wrapper = document.querySelector('.dni-slider-wrapper');
    const dots = document.querySelectorAll('.dni-dot');
    if (!wrapper || dots.length === 0) return;

    let currentIndex = 0;
    let autoSlideInterval;

    function updateSlider(index) {
        currentIndex = index;
        wrapper.style.transform = `translateX(-${index * 100}%)`;

        // Actualizar estado de los dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    function startAutoSlide() {
        stopAutoSlide(); // Limpiar si ya existe uno
        autoSlideInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % dots.length;
            updateSlider(currentIndex);
        }, 5000);
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    // Evento Click en los Dots
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            updateSlider(i);
            startAutoSlide(); // Reinicia el tiempo para que no salte rápido tras clickear
        });
    });

    // Iniciar el movimiento automático
    startAutoSlide();
};

// Asegúrate de llamarla
initDniSlider();

function selectEntrega(mode) {
    window.setEntregaMode?.(mode);
}

function selectPago(tipo) {
    document.getElementById('pago-transferencia').classList.remove('selected');
    document.getElementById('pago-efectivo').classList.remove('selected');
    document.getElementById('pago-' + tipo).classList.add('selected');
}