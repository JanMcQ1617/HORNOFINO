/* ============================================================
   Hornofino — client-side cart + checkout
   Cart lives in localStorage. Checkout is stubbed for Stripe:
   fill STRIPE.publishableKey + STRIPE.endpoint later to go live
   (see STRIPE-SETUP.md). No card data is ever handled here.
   ============================================================ */
(function () {
  "use strict";

  // ---- Stripe config (empty = demo/stub mode) -------------
  var STRIPE = {
    publishableKey: "",   // e.g. "pk_live_..."  (safe to expose)
    endpoint: ""          // serverless URL that creates a Checkout Session
  };

  var KEY = "hornofino_cart_v1";
  var money = function (n) { return "$" + n.toFixed(2); };

  // ---- storage --------------------------------------------
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function write(cart) {
    localStorage.setItem(KEY, JSON.stringify(cart));
    updateBadges();
  }
  function count(cart) {
    cart = cart || read();
    return Object.keys(cart).reduce(function (n, k) { return n + cart[k].qty; }, 0);
  }
  function total(cart) {
    cart = cart || read();
    return Object.keys(cart).reduce(function (s, k) { return s + cart[k].qty * cart[k].price; }, 0);
  }

  // ---- mutations ------------------------------------------
  function add(name, price) {
    var cart = read();
    var id = name;
    if (cart[id]) cart[id].qty += 1;
    else cart[id] = { name: name, price: price, qty: 1 };
    write(cart);
  }
  function setQty(id, qty) {
    var cart = read();
    if (!cart[id]) return;
    cart[id].qty = qty;
    if (cart[id].qty <= 0) delete cart[id];
    write(cart);
  }
  function remove(id) { var c = read(); delete c[id]; write(c); }
  function clear() { localStorage.removeItem(KEY); updateBadges(); }

  // ---- nav badge ------------------------------------------
  function updateBadges() {
    var n = count();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = n;
      el.classList.toggle("has-items", n > 0);
    });
  }

  // ---- add-to-cart buttons --------------------------------
  function bindAddButtons() {
    document.querySelectorAll("[data-add-to-cart]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-name");
        var price = parseFloat(btn.getAttribute("data-price")) || 0;
        add(name, price);
        var original = btn.textContent;
        btn.classList.add("added");
        btn.textContent = "✓";
        setTimeout(function () { btn.classList.remove("added"); btn.textContent = original; }, 900);
      });
    });
  }

  // ---- cart page ------------------------------------------
  function renderCart() {
    var wrap = document.getElementById("cartItems");
    if (!wrap) return;
    var cart = read();
    var ids = Object.keys(cart);

    if (!ids.length) {
      wrap.innerHTML =
        '<div class="cart-empty"><p>Your basket is empty.</p>' +
        '<a class="btn btn--solid" href="menu.html">Browse the menu</a></div>';
      var sum = document.getElementById("cartSummary");
      if (sum) sum.style.display = "none";
      return;
    }

    wrap.innerHTML = ids.map(function (id) {
      var it = cart[id];
      return (
        '<div class="cart-row" data-id="' + escapeAttr(id) + '">' +
          '<div><div class="cart-row__name">' + escapeHtml(it.name) + '</div>' +
            '<span class="cart-row__unit">' + money(it.price) + ' each</span></div>' +
          '<div class="qty">' +
            '<button type="button" data-act="dec" aria-label="Decrease">–</button>' +
            '<span>' + it.qty + '</span>' +
            '<button type="button" data-act="inc" aria-label="Increase">+</button>' +
          '</div>' +
          '<div class="cart-row__line">' + money(it.qty * it.price) + '</div>' +
          '<button class="cart-row__remove" data-act="rm" aria-label="Remove">✕</button>' +
        '</div>'
      );
    }).join("");

    var sumEl = document.getElementById("cartSummary");
    if (sumEl) {
      sumEl.style.display = "";
      var t = document.getElementById("cartTotal");
      if (t) t.textContent = money(total(cart));
    }

    wrap.querySelectorAll(".cart-row").forEach(function (row) {
      var id = row.getAttribute("data-id");
      row.querySelector('[data-act="inc"]').addEventListener("click", function () { setQty(id, cart[id].qty + 1); renderCart(); });
      row.querySelector('[data-act="dec"]').addEventListener("click", function () { setQty(id, cart[id].qty - 1); renderCart(); });
      row.querySelector('[data-act="rm"]').addEventListener("click", function () { remove(id); renderCart(); });
    });
  }

  // ---- checkout page --------------------------------------
  function renderCheckout() {
    var list = document.getElementById("checkoutSummary");
    if (!list) return;
    var cart = read();
    var ids = Object.keys(cart);
    var form = document.getElementById("checkoutForm");

    if (!ids.length) {
      list.innerHTML = '<li><span>Your basket is empty.</span></li>';
      var totEl0 = document.getElementById("checkoutTotal");
      if (totEl0) totEl0.textContent = money(0);
      if (form) form.style.display = "none";
      return;
    }

    list.innerHTML = ids.map(function (id) {
      var it = cart[id];
      return '<li><span>' + it.qty + ' × ' + escapeHtml(it.name) + '</span><span>' + money(it.qty * it.price) + '</span></li>';
    }).join("");
    var totEl = document.getElementById("checkoutTotal");
    if (totEl) totEl.textContent = money(total(cart));

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        startCheckout(cart, form);
      });
    }
  }

  // ---- checkout handoff (Stripe, stubbed) -----------------
  function startCheckout(cart, form) {
    var customer = {
      name: (form.querySelector("#co-name") || {}).value || "",
      email: (form.querySelector("#co-email") || {}).value || "",
      fulfilment: (form.querySelector("#co-fulfilment") || {}).value || ""
    };
    var items = Object.keys(cart).map(function (id) {
      return { name: cart[id].name, price: cart[id].price, qty: cart[id].qty };
    });

    if (STRIPE.publishableKey && STRIPE.endpoint) {
      // LIVE path: ask the serverless function for a Checkout Session, then redirect
      fetch(STRIPE.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items, customer: customer })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.url) window.location.href = data.url;            // Stripe-hosted checkout
          else throw new Error(data.error || "No checkout URL returned");
        })
        .catch(function (err) { showStub("Couldn't start payment: " + err.message); });
      return;
    }

    // STUB path: Stripe not configured yet
    showStub(
      "Order received, " + (customer.name || "friend") + "! " +
      "Total " + money(total(cart)) + ". Card payment isn't connected yet — " +
      "add your Stripe keys (see STRIPE-SETUP.md) to take real payments. Your basket has been saved."
    );
  }

  function showStub(msg) {
    var box = document.getElementById("payStub");
    if (box) { box.textContent = msg; box.classList.add("show"); box.scrollIntoView({ behavior: "smooth", block: "center" }); }
    else alert(msg);
  }

  // ---- helpers --------------------------------------------
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function escapeAttr(s) { return escapeHtml(s); }

  // ---- init -----------------------------------------------
  function init() {
    updateBadges();
    bindAddButtons();
    renderCart();
    renderCheckout();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // expose a tiny API (handy for the rebuilt menu / debugging)
  window.HornofinoCart = { add: add, clear: clear, count: count, total: total };
})();
