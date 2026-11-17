// HyperGSM WebUI
"use strict";
(function () {
  var MODDIR = "/data/adb/modules/hypergsm";
  var CONF = MODDIR + "/settings.conf";
  var PKG_RE = /^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)+$/;
  var PROFILES = [
    { id: "off", title: "Off", sub: "Nothing is disabled. Google services are kept unrestricted for the fastest push." },
    { id: "balanced", title: "Balanced", sub: "Disables Play Services analytics and measurement. Push, location and sync are untouched." },
    { id: "aggressive", title: "Aggressive", sub: "Balanced, plus removes Play Services from the Doze whitelist. Saves more, push can arrive late." }
  ];
  var PAGES = {
    home: ["Home", "GMS and notification fixes."],
    notify: ["Notify", "Priority apps and diagnostics."],
    battery: ["Battery", "GMS battery profile."],
    about: ["About", "Module info and recent log."]
  };

  var state = { NOTIF_FIX: "1", PRIORITY_APPS: "", GMS_PROFILE: "off", KEEP_APPLIED: "1", CONF_VERSION: "2" };
  var selected = "off";      // profile picked in the list (not yet applied)
  var confLoaded = false;
  var busy = false;
  var cbSeq = 0;

  function $(id) { return document.getElementById(id); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // ---- root bridge -------------------------------------------------------
  function ksuExec(cmd, timeoutMs) {
    return new Promise(function (resolve) {
      if (!window.ksu || typeof window.ksu.exec !== "function") {
        resolve({ errno: -1, stdout: "", stderr: "bridge unavailable" });
        return;
      }
      var name = "__hg_cb_" + (cbSeq++);
      var timer = setTimeout(function () {
        window[name] = function () { delete window[name]; };
        resolve({ errno: -3, stdout: "", stderr: "timeout" });
      }, timeoutMs || 20000);
      window[name] = function (code, stdout, stderr) {
        clearTimeout(timer);
        delete window[name];
        resolve({ errno: code, stdout: stdout || "", stderr: stderr || "" });
      };
      try { window.ksu.exec(cmd, name); }
      catch (e) { clearTimeout(timer); delete window[name]; resolve({ errno: -1, stdout: "", stderr: String(e) }); }
    });
  }

  // ---- settings.conf -----------------------------------------------------
  function parseKv(text) {
    var out = {};
    text.split("\n").forEach(function (line) {
      line = line.trim();
      if (!line || line.charAt(0) === "#") return;
      var i = line.indexOf("=");
      if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
    return out;
  }
  function unquote(v) { return String(v).replace(/^[\s"']+|[\s"']+$/g, ""); }
  function renderConf() {
    return [
      "# HyperGSM settings. Edit from the WebUI or by hand, then run apply.sh.",
      "NOTIF_FIX=" + state.NOTIF_FIX,
      "PRIORITY_APPS=\"" + state.PRIORITY_APPS + "\"",
      "GMS_PROFILE=" + state.GMS_PROFILE,
      "KEEP_APPLIED=" + state.KEEP_APPLIED,
      "CONF_VERSION=" + state.CONF_VERSION
    ].join("\n");
  }
  async function loadConf() {
    var r = await ksuExec("cat " + CONF);
    setLive(r.errno === 0);
    if (r.errno === 0) {
      var p = parseKv(r.stdout);
      Object.keys(state).forEach(function (k) { if (k in p) state[k] = unquote(p[k]); });
      state.PRIORITY_APPS = state.PRIORITY_APPS.split(/\s+/).filter(function (x) { return PKG_RE.test(x); }).join(" ");
      if (!PROFILES.some(function (p2) { return p2.id === state.GMS_PROFILE; })) state.GMS_PROFILE = "off";
      selected = state.GMS_PROFILE;
      confLoaded = true;
      setStatus("Settings loaded.");
    } else {
      confLoaded = false;
      setStatus(window.ksu ? "Could not read settings.conf." : "Open this from your root manager.", true);
    }
    render();
  }
  async function saveConf() {
    if (!confLoaded) return { errno: -2, stderr: "settings not loaded" };
    var tmp = CONF + ".tmp";
    return ksuExec("cat > '" + tmp + "' << 'HG_EOF' && mv -f '" + tmp + "' '" + CONF + "'\n" + renderConf() + "\nHG_EOF");
  }

  // ---- apply -------------------------------------------------------------
  async function applyNow(showToast) {
    if (busy) return;
    busy = true;
    var btns = [$("applyBtn"), $("applyProfile")];
    btns.forEach(function (b) { b.disabled = true; });
    $("applyBtn").textContent = "Applying…";
    var r = await saveConf();
    if (r.errno === 0) r = await ksuExec("sh " + MODDIR + "/apply.sh 2>&1", 60000);
    $("applyBtn").textContent = "Apply now";
    busy = false;
    if (r.errno === 0) {
      setStatus("Applied at " + new Date().toLocaleTimeString() + ".");
      if (showToast) toast("Applied");
    } else {
      setStatus("Failed (errno " + r.errno + "). " + (r.stderr || r.stdout || ""), true);
      toast("Apply failed", true);
    }
    render();
    loadStatus();
  }
  function applyProfile() {
    if (selected === state.GMS_PROFILE) return;
    state.GMS_PROFILE = selected;
    applyNow(true);
  }

  // ---- status / log / diagnostics ----------------------------------------
  async function loadStatus() {
    var r = await ksuExec("sh " + MODDIR + "/status.sh");
    if (r.errno !== 0) return;
    var s = parseKv(r.stdout);
    var gms = s.GMS === "1";
    var fcm = parseInt(s.FCM_CONN || "0", 10) || 0;
    $("devCode").textContent = s.DEVICE || "—";
    $("romEyebrow").textContent = (s.ROMTYPE || "—").toUpperCase();
    $("stRegion").textContent = (s.REGION || "—").toUpperCase();
    $("stGms").textContent = gms ? "Installed" : "Not installed";
    $("stRom").textContent = s.ROM || "—";
    $("heroFcm").textContent = !gms ? "No Play Services" : (fcm > 0 ? "Connected (" + fcm + ")" : "No connection");
    $("heroFcmSub").textContent = !gms ? "Install Play Services first"
      : (fcm > 0 ? "Play Services holds an open push socket" : "Push socket is down or sleeping. Run diagnostics.");
  }
  async function loadLog() {
    var r = await ksuExec("tail -n 60 " + MODDIR + "/hypergsm.log 2>/dev/null");
    $("logOut").textContent = (r.stdout || "").trim() || "No log yet.";
  }
  async function runDiag() {
    var btn = $("diagBtn"), out = $("diagOut");
    btn.disabled = true;
    btn.textContent = "Collecting…";
    out.hidden = false;
    out.textContent = "Collecting, this can take up to 30 seconds.";
    var r = await ksuExec("sh " + MODDIR + "/diag.sh start");
    if (r.errno !== 0) {
      out.textContent = "Could not start diagnostics (errno " + r.errno + ").";
    } else {
      var done = false;
      for (var i = 0; i < 30 && !done; i++) {
        await sleep(1500);
        var s = await ksuExec("sh " + MODDIR + "/diag.sh state");
        done = s.stdout.indexOf("DONE") !== -1;
      }
      var res = await ksuExec("sh " + MODDIR + "/diag.sh read");
      out.textContent = (res.stdout || "").trim() || (done ? "No output." : "Timed out. Try again.");
    }
    btn.disabled = false;
    btn.textContent = "Run diagnostics";
  }

  // ---- ui ----------------------------------------------------------------
  function setStatus(msg, isErr) {
    document.querySelectorAll(".status-line").forEach(function (el) {
      el.textContent = msg;
      el.classList.toggle("err", !!isErr);
    });
  }
  function setLive(ok) {
    $("livePill").classList.toggle("err", !ok);
    $("livePillText").textContent = ok ? "Bridge Online" : "Bridge Offline";
  }
  function toast(msg, isErr) {
    var t = document.createElement("div");
    t.className = "toast" + (isErr ? " err" : "");
    t.textContent = msg;
    $("toastStack").appendChild(t);
    setTimeout(function () { t.remove(); }, 2400);
  }
  function profileTitle(id) {
    for (var i = 0; i < PROFILES.length; i++) if (PROFILES[i].id === id) return PROFILES[i].title;
    return id;
  }
  function render() {
    $("swNotif").classList.remove("skel");
    $("swKeep").classList.remove("skel");
    $("swNotif").classList.toggle("on", state.NOTIF_FIX === "1");
    $("swKeep").classList.toggle("on", state.KEEP_APPLIED === "1");
    $("stProfile").textContent = profileTitle(state.GMS_PROFILE);

    var list = $("profileList");
    list.innerHTML = "";
    PROFILES.forEach(function (p) {
      var row = document.createElement("button");
      row.className = "opt" + (p.id === selected ? " active" : "");
      var radio = document.createElement("span"); radio.className = "opt-radio";
      var body = document.createElement("span"); body.className = "opt-body";
      var title = document.createElement("span"); title.className = "opt-title"; title.textContent = p.title;
      if (p.id === state.GMS_PROFILE) {
        var tag = document.createElement("span"); tag.className = "opt-tag"; tag.textContent = "ACTIVE";
        title.appendChild(tag);
      }
      var sub = document.createElement("span"); sub.className = "opt-sub"; sub.textContent = p.sub;
      body.appendChild(title); body.appendChild(sub);
      row.appendChild(radio); row.appendChild(body);
      row.addEventListener("click", function () { selected = p.id; render(); });
      list.appendChild(row);
    });
    var changed = selected !== state.GMS_PROFILE;
    var ab = $("applyProfile");
    ab.disabled = busy || !confLoaded || !changed;
    ab.textContent = changed ? "Apply " + profileTitle(selected) + " profile" : "Profile applied";

    var chips = $("chipList");
    chips.innerHTML = "";
    state.PRIORITY_APPS.split(" ").filter(Boolean).forEach(function (pkg) {
      var chip = document.createElement("div"); chip.className = "chip";
      var label = document.createElement("span"); label.textContent = pkg;
      var del = document.createElement("button"); del.textContent = "\u00d7"; del.setAttribute("aria-label", "Remove " + pkg);
      del.addEventListener("click", function () {
        state.PRIORITY_APPS = state.PRIORITY_APPS.split(" ").filter(function (x) { return x && x !== pkg; }).join(" ");
        render(); applyNow(false);
      });
      chip.appendChild(label); chip.appendChild(del); chips.appendChild(chip);
    });
  }
  function showPage(name) {
    document.querySelectorAll(".page").forEach(function (p) { p.hidden = p.id !== "page-" + name; });
    document.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("active", t.dataset.page === name); });
    $("pageTitle").textContent = PAGES[name][0];
    $("pageSub").textContent = PAGES[name][1];
    if (name === "about") loadLog();
    window.scrollTo(0, 0);
  }
  function toggle(key) {
    state[key] = state[key] === "1" ? "0" : "1";
    render();
    applyNow(false);
  }
  function addPkg() {
    var v = $("pkgInput").value.trim();
    if (!PKG_RE.test(v) || v.length > 255) { toast("Not a valid package name", true); return; }
    var list = state.PRIORITY_APPS.split(" ").filter(Boolean);
    if (list.indexOf(v) === -1) list.push(v);
    state.PRIORITY_APPS = list.join(" ");
    $("pkgInput").value = "";
    render();
    applyNow(false);
  }

  function init() {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    function setMode() { document.documentElement.dataset.mode = mq.matches ? "dark" : "light"; }
    setMode();
    mq.addEventListener("change", setMode);

    document.querySelectorAll(".tab").forEach(function (t) {
      t.addEventListener("click", function () { showPage(t.dataset.page); });
    });
    $("swNotif").addEventListener("click", function () { toggle("NOTIF_FIX"); });
    $("swKeep").addEventListener("click", function () { toggle("KEEP_APPLIED"); });
    $("applyBtn").addEventListener("click", function () { applyNow(true); });
    $("applyProfile").addEventListener("click", applyProfile);
    $("pkgAdd").addEventListener("click", addPkg);
    $("pkgInput").addEventListener("keydown", function (e) { if (e.key === "Enter") addPkg(); });
    $("diagBtn").addEventListener("click", runDiag);
    loadConf().then(loadStatus);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
