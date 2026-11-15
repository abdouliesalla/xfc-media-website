/* XFC Media — interactions. No dependencies. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Year ---------- */
  var year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Nav: compact on scroll, active link, mobile menu ---------- */
  var nav = $("[data-nav]");
  var lastCompact = null;
  function onScrollNav() {
    var compact = window.scrollY > 60;
    if (compact !== lastCompact) { nav.classList.toggle("is-compact", compact); lastCompact = compact; }
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  var toggle = $("[data-menu-toggle]");
  var menu = $("[data-menu]");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".visually-hidden").textContent = open ? "Close menu" : "Open menu";
    menu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    ["main", "footer"].forEach(function (sel) { var n = $(sel); if (n) n.inert = open; });
    if (open) $("a", menu).focus();
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia("(min-width: 981px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  if ("IntersectionObserver" in window) {
    var links = $$(".nav__links a");
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
      .concat([document.getElementById("top"), document.getElementById("contact"), document.querySelector(".statement")])
      .filter(Boolean);
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute("href") === "#" + en.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-50% 0px -49% 0px" });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  /* ---------- Heading reveals ---------- */
  var reveals = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); revObs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { revObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Videos: play only while visible, respect reduced motion and the toggle ---------- */
  $$("video[data-autoplay]").forEach(function (video) {
    var holder = video.parentElement;
    var btn = $("[data-video-toggle]", holder);
    var label = btn && $("[data-video-label]", btn);
    var userPaused = reduceMotion.matches;

    function render() {
      if (!btn) return;
      btn.setAttribute("aria-pressed", String(userPaused));
      label.textContent = userPaused ? "Play video" : "Pause video";
    }
    function tryPlay() {
      var p = video.play();
      if (p && p.catch) p.catch(function () { userPaused = true; render(); });
    }
    render();

    if (btn) btn.addEventListener("click", function () {
      userPaused = !userPaused;
      if (userPaused) video.pause(); else tryPlay();
      render();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !userPaused) {
            if (video.preload === "none") video.preload = "auto";
            tryPlay();
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.25 }).observe(video);
    }
  });

  /* ---------- Logo marquee: seamless loop with a pause control ---------- */
  var marquee = $("[data-marquee]");
  if (marquee) {
    var track = $(".marquee__track", marquee);
    var originals = $$("li", track);
    var fill = function () {
      var guard = 0;
      while (track.scrollWidth < window.innerWidth * 1.1 && guard++ < 12) {
        originals.forEach(function (li) {
          var c = li.cloneNode(true);
          c.setAttribute("aria-hidden", "true");
          $$("img", c).forEach(function (img) { img.alt = ""; });
          track.appendChild(c);
        });
      }
    };
    fill();
    var copy = track.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    $$("img", copy).forEach(function (img) { img.alt = ""; });
    marquee.appendChild(copy);
    var setSpeed = function () {
      marquee.style.setProperty("--marquee-dur", Math.max(18, track.scrollWidth / 55).toFixed(1) + "s");   /* ~55px per second */
    };
    setSpeed();
    window.addEventListener("load", setSpeed);
    /* Rotating a phone or widening the window: top the loop up so it never shows a gap.
       ResizeObserver fires after the new layout has settled (window "resize" can fire too early). */
    var topUp = function () {
      if (track.scrollWidth < window.innerWidth * 1.1) {
        fill();
        var fresh = track.cloneNode(true);
        fresh.setAttribute("aria-hidden", "true");
        $$("img", fresh).forEach(function (img) { img.alt = ""; });
        marquee.replaceChild(fresh, copy);
        copy = fresh;
      }
      setSpeed();
    };
    if ("ResizeObserver" in window) {
      /* Adding cards doesn't change the marquee's own box (it clips), so this can't loop */
      new ResizeObserver(topUp).observe(marquee);
    }
    /* Backup for browsers or moments where the observer doesn't report; topUp is safe to repeat */
    var mTimer;
    var lateCheck = function () { clearTimeout(mTimer); mTimer = setTimeout(topUp, 300); };
    window.addEventListener("resize", lateCheck);
    window.addEventListener("orientationchange", lateCheck);

    var mToggle = $("[data-marquee-toggle]");
    mToggle.addEventListener("click", function () {
      var paused = marquee.classList.toggle("is-paused");
      mToggle.setAttribute("aria-pressed", String(paused));
      mToggle.textContent = paused ? "Play logos" : "Pause logos";
    });
  }

  /* ---------- Services accordion ---------- */
  var accordion = $("[data-accordion]");
  if (accordion) {
    var buttons = $$(".svc__btn", accordion);

    function setPanel(btn, open) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      btn.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
      if (reduceMotion.matches) { panel.hidden = !open; return; }

      panel.classList.remove("is-animating");
      if (open) {
        panel.hidden = false;
        var h = panel.scrollHeight;
        panel.style.height = "0px";
        panel.offsetHeight; // reflow
        panel.classList.add("is-animating");
        panel.style.height = h + "px";
      } else {
        panel.style.height = panel.scrollHeight + "px";
        panel.offsetHeight;
        panel.classList.add("is-animating");
        panel.style.height = "0px";
      }
      var finished = false;
      var done = function (e) {
        if (finished || (e && e.propertyName !== "height")) return;
        finished = true;
        panel.removeEventListener("transitionend", done);
        panel.classList.remove("is-animating");
        panel.style.height = "";
        if (btn.getAttribute("aria-expanded") !== "true") panel.hidden = true;
      };
      panel.addEventListener("transitionend", done);
      setTimeout(done, 600);   /* safety net: the transition is 420ms */
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var willOpen = btn.getAttribute("aria-expanded") !== "true";
        buttons.forEach(function (other) {
          if (other !== btn && other.getAttribute("aria-expanded") === "true") setPanel(other, false);
        });
        setPanel(btn, willOpen);
      });
    });
  }

  /* ---------- Team bios: Read full bio / Show less ---------- */
  $$("[data-bio]").forEach(function (bio) {
    var btn = $("[data-bio-toggle]", bio);
    var more = $(".bio__more", bio);
    var label = $(".bio__label", btn);
    var closedLabel = label.textContent;
    var collapsed = function () { return parseFloat(getComputedStyle(bio).fontSize) * 4.8; };

    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      bio.classList.toggle("is-open", open);
      label.textContent = open ? "Show less" : closedLabel;

      if (reduceMotion.matches) { more.style.height = open ? "auto" : ""; return; }
      var from = more.getBoundingClientRect().height;
      var to = open ? more.scrollHeight : collapsed();
      more.style.height = from + "px";
      more.offsetHeight; // reflow so the transition starts from the current height
      more.style.height = to + "px";
      var settle = function (e) {
        if (e && e.propertyName !== "height") return;
        more.removeEventListener("transitionend", settle);
        if (btn.getAttribute("aria-expanded") === "true") more.style.height = "auto";
        else more.style.height = "";
      };
      more.addEventListener("transitionend", settle);
      setTimeout(settle, 700);   /* safety net if transitionend doesn't fire */

      /* Closing a long bio: bring the person back into view rather than leaving the reader below it */
      if (!open) {
        var top = bio.closest(".person").getBoundingClientRect().top;
        if (top < 0) window.scrollBy({ top: top - 120, behavior: "smooth" });
      }
    });
  });

  /* ---------- CTAs prefill the form ---------- */
  var industrySel = document.getElementById("f-industry");
  $$("[data-industry]").forEach(function (a) {
    a.addEventListener("click", function () { if (industrySel) industrySel.value = a.getAttribute("data-industry"); });
  });
  $$("[data-service]").forEach(function (a) {
    a.addEventListener("click", function () {
      var box = $('input[name="services"][value="' + a.getAttribute("data-service") + '"]');
      if (box) box.checked = true;
    });
  });

  /* ---------- Consultation form ---------- */
  var form = $("[data-form]");
  if (form) {
    var summary = $("[data-error-summary]", form);
    var status = $("[data-status]", form);
    var submit = $("[data-submit]", form);
    var checks = [
      { id: "f-name", ok: function (v) { return v.trim().length > 0; } },
      { id: "f-email", ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
      { id: "f-msg", ok: function (v) { return v.trim().length > 0; } }
    ];

    function validate(c) {
      var input = document.getElementById(c.id);
      var err = document.getElementById(c.id + "-err");
      var ok = c.ok(input.value);
      input.setAttribute("aria-invalid", ok ? "false" : "true");
      err.hidden = ok;
      return ok;
    }
    checks.forEach(function (c) {
      var input = document.getElementById(c.id);
      input.addEventListener("blur", function () { if (input.value) validate(c); });
      input.addEventListener("input", function () { if (input.getAttribute("aria-invalid") === "true") validate(c); });
    });

    function el(tag, text) { var n = document.createElement(tag); if (text) n.textContent = text; return n; }

    /* Messages under the submit button: success, or an error with a way to reach us anyway */
    function showStatus(kind, text) {
      status.innerHTML = "";
      status.classList.remove("is-success", "is-error");
      if (!kind) return;
      status.classList.add(kind === "success" ? "is-success" : "is-error");
      status.appendChild(document.createTextNode(text));
      if (kind === "error") {
        status.appendChild(document.createTextNode(" You can also email us at "));
        var mail = el("a", "info@xfcmedia.com");
        mail.href = "mailto:info@xfcmedia.com";
        status.appendChild(mail);
        status.appendChild(document.createTextNode("."));
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      showStatus(null);

      var failed = checks.filter(function (c) { return !validate(c); });
      if (failed.length) {
        summary.innerHTML = "";
        summary.appendChild(el("p", failed.length === 1 ? "Fix 1 field to book your consultation:" : "Fix " + failed.length + " fields to book your consultation:"));
        var ul = el("ul");
        failed.forEach(function (c) {
          var a = el("a", document.getElementById(c.id + "-err").textContent);
          a.href = "#" + c.id;
          a.addEventListener("click", function (ev) { ev.preventDefault(); document.getElementById(c.id).focus(); });
          var li = el("li"); li.appendChild(a); ul.appendChild(li);
        });
        summary.appendChild(ul);
        summary.hidden = false;
        summary.focus();
        return;
      }
      summary.hidden = true;

      var data = new FormData(form);
      if (data.get("_gotcha")) return; // spam trap

      var name = String(data.get("name") || "").trim();
      var business = String(data.get("business") || "").trim();
      var payload = {
        name: name,
        email: String(data.get("email") || "").trim(),
        business: business,
        phone: String(data.get("phone") || "").trim(),
        industry: data.get("industry") || "",
        services: data.getAll("services").join(", "),
        message: String(data.get("message") || "").trim(),
        _subject: "Consultation request from " + name + (business ? " (" + business + ")" : "")
      };

      var label = submit.querySelector(".btn__label") || submit;
      submit.disabled = true;
      label.textContent = "Sending request";

      /* Formspree: JSON in, JSON out (status 200 on success, 4xx with { errors: [...] } otherwise) */
      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) { return { ok: res.ok, code: res.status, body: body }; });
      }).then(function (result) {
        if (result.ok) {
          form.reset();
          showStatus("success", "Consultation request sent. We'll reply by email to set up a time.");
          return;
        }
        /* Turn Formspree's errors ({ field, message }) into readable sentences, and flag the field */
        var labels = { name: "Name", email: "Email", message: "Message", phone: "Phone", business: "Business name" };
        var fieldIds = { name: "f-name", email: "f-email", message: "f-msg" };
        var reasons = (result.body && result.body.errors || []).map(function (err) {
          if (!err || !err.message) return "";
          if (fieldIds[err.field]) document.getElementById(fieldIds[err.field]).setAttribute("aria-invalid", "true");
          var text = (labels[err.field] ? labels[err.field] + " " : "") + err.message;
          text = text.charAt(0).toUpperCase() + text.slice(1);
          return /[.!?]$/.test(text) ? text : text + ".";
        }).filter(Boolean);
        if (!reasons.length && result.code >= 500) {
          showStatus("error", "Your request wasn't sent because our form service didn't respond. Try again in a minute.");
          return;
        }
        showStatus("error", "Your request wasn't sent." + (reasons.length ? " " + reasons.join(" ") : "") + " Check the form and try again.");
      }).catch(function () {
        showStatus("error", "Your request wasn't sent because the connection dropped. Check your internet connection and try again.");
      }).then(function () {
        submit.disabled = false;
        label.textContent = "Book a consultation";
      });
    });
  }
})();

/* =========================================================
   Craft layer: micro-interactions that respond to the visitor.
   ========================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Buttons: wrap the label so it can roll on hover */
  $$(".btn").forEach(function (btn) {
    if (btn.querySelector(".btn__label")) return;
    var label = document.createElement("span");
    label.className = "btn__label";
    label.textContent = btn.textContent.trim();
    btn.textContent = "";
    btn.appendChild(label);
  });

  /* Industry tiles: light follows the pointer */
  if (finePointer) {
    $$(".ind").forEach(function (tile) {
      var raf = 0, x = 0, y = 0;
      tile.addEventListener("pointermove", function (e) {
        var r = tile.getBoundingClientRect();
        x = e.clientX - r.left; y = e.clientY - r.top;
        if (!raf) raf = requestAnimationFrame(function () {
          tile.style.setProperty("--mx", x + "px");
          tile.style.setProperty("--my", y + "px");
          raf = 0;
        });
      });
    });
  }

  /* Case studies open as they arrive; process steps fill in sequence */
  $$(".steps li").forEach(function (li, i) { li.style.setProperty("--i", i); });
  var once = function (els, cls, threshold) {
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add(cls); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add(cls); io.unobserve(en.target); }
      });
    }, { threshold: threshold });
    els.forEach(function (el) { io.observe(el); });
  };
  once($$(".case"), "is-shown", 0.2);
  once($$(".steps"), "is-done", 0.35);

  /* A label that follows the pointer over videos; clicking the video toggles it */
  if (finePointer && !reduce) {
    var chip = document.createElement("div");
    chip.className = "cursor-chip";
    chip.setAttribute("aria-hidden", "true");
    document.body.appendChild(chip);
    var tx = 0, ty = 0, cx = 0, cy = 0, active = null, loop = 0;

    var stateText = function (holder) {
      var t = holder.querySelector("[data-video-toggle]");
      return t && t.getAttribute("aria-pressed") === "true" ? "Play" : "Pause";
    };
    var tick = function () {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      chip.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0) translate(-50%,-50%) scale(" + (active ? 1 : 0.6) + ")";
      if (active || Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) loop = requestAnimationFrame(tick); else loop = 0;
    };

    $$("video[data-autoplay]").forEach(function (video) {
      var holder = video.parentElement;
      var toggle = holder.querySelector("[data-video-toggle]");
      if (!toggle) return;
      holder.classList.add("has-chip");
      holder.addEventListener("pointerenter", function (e) {
        active = holder; tx = cx = e.clientX; ty = cy = e.clientY;
        chip.textContent = stateText(holder);
        chip.classList.add("is-on");
        if (!loop) loop = requestAnimationFrame(tick);
      });
      holder.addEventListener("pointermove", function (e) {
        tx = e.clientX; ty = e.clientY;
        chip.classList.toggle("is-on", !e.target.closest("[data-video-toggle]"));
      });
      holder.addEventListener("pointerleave", function () { active = null; chip.classList.remove("is-on"); });
      holder.addEventListener("click", function (e) {
        if (!e.target.closest("[data-video-toggle]")) toggle.click();
        chip.textContent = stateText(holder);
      });
    });
  }

  /* Team portraits drift gently inside their frames */
  if (!reduce) {
    var photos = $$(".person__photo");
    var pending = false;
    var drift = function () {
      pending = false;
      var vh = window.innerHeight;
      photos.forEach(function (ph) {
        var r = ph.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = ((r.top + r.height / 2) - vh / 2) / vh;
        ph.firstElementChild.style.setProperty("--py", (p * -26).toFixed(1) + "px");
      });
    };
    window.addEventListener("scroll", function () { if (!pending) { pending = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }

  /* Chips: a check mark that draws in when selected */
  $$(".chip span").forEach(function (span) {
    span.insertAdjacentHTML("afterbegin", '<svg class="chip__check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>');
  });

  /* Copy email address */
  $$("[data-copy]").forEach(function (btn) {
    btn.setAttribute("aria-live", "polite");
    var timer;
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        btn.textContent = "Copied";
        btn.classList.add("is-copied");
        clearTimeout(timer);
        timer = setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("is-copied"); }, 1800);
      };
      var fallback = function () {
        var ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (err) { btn.textContent = "Select and copy"; }
        ta.remove();
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    });
  });
})();

/* =========================================================
   Hero: word swap, scroll fan-out, pointer tilt
   ========================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* 1. Headline: cycle once through who we serve, settle on "business." */
  var swap = document.querySelector("[data-swap]");
  if (swap) {
    var words = ["practice.", "club.", "brand.", "business."];
    var colors = ["#7FD6C4", "#9BE07A", "#F5B85C", "var(--blue)"];   /* dental mint, pitch green, amber, crown blue */
    var current = swap.querySelector(".swap__w");
    var measure = function (text) {
      var m = document.createElement("span");
      m.className = "swap__w";
      m.style.cssText = "position:absolute;visibility:hidden;";
      m.textContent = text;
      swap.appendChild(m);
      var w = m.getBoundingClientRect().width;
      m.remove();
      return w;
    };
    var visual = document.querySelector(".hero__visual");
    var checkFit = function () {
      /* Try every word; if any changes the headline height, give the word its own line */
      swap.classList.remove("is-block");
      var shown = swap.querySelector(".swap__w:not(.is-out)") || current;
      var keep = shown.textContent, keepW = swap.style.width, heights = {};
      swap.style.width = "";
      words.forEach(function (w) { shown.textContent = w; heights[visual.getBoundingClientRect().height.toFixed(0)] = 1; });
      shown.textContent = keep; swap.style.width = keepW;
      if (Object.keys(heights).length > 1) { swap.classList.add("is-block"); swap.style.width = ""; }
    };
    var isBlock = function () { return swap.classList.contains("is-block"); };
    var resizeTimer;
    window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(checkFit, 150); });

    var step = function (i) {
      if (i >= words.length) { swap.style.width = ""; return; }
      var next = document.createElement("span");
      next.className = "swap__w is-in";
      next.textContent = words[i];
      next.style.color = colors[i];
      if (!isBlock()) {
        swap.style.width = swap.getBoundingClientRect().width + "px";
        requestAnimationFrame(function () { swap.style.width = measure(words[i]) + "px"; });
      }
      current.classList.remove("is-in");
      current.classList.add("is-out");
      var old = current;
      setTimeout(function () { old.remove(); }, 600);
      swap.appendChild(next);
      current = next;
      setTimeout(function () { step(i + 1); }, i === words.length - 1 ? 900 : 1150);
    };
    var start = function () { checkFit(); setTimeout(function () { step(0); }, 1700); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  }

  /* 2. Reel: tilts gently toward the pointer (mouse and trackpad only) */
  var reel = document.querySelector("[data-reel]");
  if (!reel) return;

  if (finePointer) {
    var hero = document.querySelector(".hero");
    var tx = 0, ty = 0, rx = 0, ry = 0, raf = 0;
    var tick = function () {
      rx += (tx - rx) * 0.08; ry += (ty - ry) * 0.08;
      reel.style.transform = "perspective(1800px) rotateX(" + rx.toFixed(3) + "deg) rotateY(" + ry.toFixed(3) + "deg)";
      if (Math.abs(tx - rx) > 0.01 || Math.abs(ty - ry) > 0.01) raf = requestAnimationFrame(tick); else raf = 0;
    };
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
      var dy = (e.clientY - r.top) / r.height - 0.5;
      ty = dx * 6;      // rotateY: up to 3deg each way
      tx = -dy * 4;     // rotateX: up to 2deg each way
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener("pointerleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
  }
})();
