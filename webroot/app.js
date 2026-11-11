// HyperGSM — app.js
"use strict";
(function(){
  var MODDIR = "/data/adb/modules/hypergsm";
  var CONF = MODDIR + "/settings.conf";
  var cbSeq = 0;
  var state = { MODE:"auto", NOTIF_FIX:"1", PRIORITY_APPS:"", GMS_PROFILE:"balanced", KEEP_APPLIED:"1", CONF_VERSION:"1" };
  var confLoaded = false;
  var PKG_RE = /^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)+$/;
  var $ = function(id){ return document.getElementById(id); };

  var PROFILE_DESC = {
    off: "Nothing is disabled. Google services keep their default behaviour and are kept unrestricted.",
    balanced: "Disables analytics and measurement components in Play Services. Push, location and sync are untouched.",
    aggressive: "Balanced, plus removes Play Services from the Doze whitelist. Saves more, but push can arrive late."
  };
  var titles = {
    home:["Home","GMS and notification fixes."],
    notify:["Notify","Priority apps and diagnostics."],
    battery:["Battery","GMS battery profile and ROM mode."],
    about:["About","Module info and recent log."]
  };

  function ksuExec(cmd){
    return new Promise(function(resolve){
      if (!window.ksu || typeof window.ksu.exec !== "function"){ resolve({errno:-1, stdout:"", stderr:"ksu bridge unavailable"}); return; }
      var name = "__hg_cb_" + (cbSeq++);
      window[name] = function(code, stdout, stderr){ delete window[name]; resolve({errno:code, stdout:stdout||"", stderr:stderr||""}); };
      try { window.ksu.exec(cmd, name); } catch(e){ delete window[name]; resolve({errno:-1, stdout:"", stderr:String(e)}); }
    });
  }
  function parseConf(text){
    var out = {};
    text.split("\n").forEach(function(line){
      line = line.trim();
      if (!line || line[0] === "#") return;
      var i = line.indexOf("=");
      if (i < 0) return;
      out[line.slice(0,i).trim()] = line.slice(i+1).trim();
    });
    return out;
  }
  function stripQuotes(v){ return String(v).replace(/^[\s"']+|[\s"']+$/g, ""); }
  function renderConf(){
    return [
      "# HyperGSM settings. Edit from the WebUI or by hand, then run apply.sh.",
      "MODE=" + state.MODE,
      "NOTIF_FIX=" + state.NOTIF_FIX,
      "PRIORITY_APPS=\"" + state.PRIORITY_APPS + "\"",
      "GMS_PROFILE=" + state.GMS_PROFILE,
      "KEEP_APPLIED=" + state.KEEP_APPLIED,
      "CONF_VERSION=" + state.CONF_VERSION
    ].join("\n");
  }

  function setStatus(msg, isErr){
    ["status","statusN","statusB"].forEach(function(id){
      var el = $(id); if (!el) return;
      el.textContent = msg; el.classList.toggle("err", !!isErr);
    });
  }
  function toast(msg, isErr){
    var t = document.createElement("div");
    t.className = "toast" + (isErr ? " err" : "");
    t.textContent = msg;
    $("toastStack").appendChild(t);
    setTimeout(function(){ t.remove(); }, 2400);
  }
  function setLive(ok){
    $("livePill").classList.toggle("err", !ok);
    $("livePillText").textContent = ok ? "Bridge Online" : "Bridge Offline";
  }
  function setSeg(id, val){
    $(id).querySelectorAll(".seg-btn").forEach(function(b){ b.classList.toggle("active", b.dataset.val === val); });
  }

  async function loadConf(){
    var r = await ksuExec("cat " + CONF);
    setLive(r.errno === 0);
    if (r.errno === 0){
      var p = parseConf(r.stdout);
      Object.keys(p).forEach(function(k){ if (k in state) state[k] = stripQuotes(p[k]); });
      state.PRIORITY_APPS = state.PRIORITY_APPS.split(/\s+/).filter(function(x){ return PKG_RE.test(x); }).join(" ");
      confLoaded = true;
      setStatus("Settings loaded.");
    } else {
      confLoaded = false;
      setStatus(window.ksu ? "Could not read settings.conf." : "Open this from your root manager.", true);
    }
    render();
  }
  async function saveConf(){
    if (!confLoaded) return {errno:-2, stderr:"settings.conf not loaded"};
    var tmp = CONF + ".tmp";
    var cmd = "(\ncat > '" + tmp + "' << 'HG_EOF' || exit 1\n" + renderConf() + "\nHG_EOF\n[ -s '" + tmp + "' ] && mv -f '" + tmp + "' '" + CONF + "'\n)";
    return ksuExec(cmd);
  }
  async function applyNow(busy){
    var btns = [$("applyBtn"), $("applyBtnN"), $("applyBtnB")];
    if (busy) btns.forEach(function(b){ b.disabled = true; b.textContent = "Applying…"; });
    var sv = await saveConf();
    var r = sv;
    if (sv.errno === 0) r = await ksuExec("sh " + MODDIR + "/apply.sh 2>&1");
    btns.forEach(function(b){ b.disabled = false; b.textContent = "Apply now"; });
    if (r.errno === 0){ setStatus("Applied at " + new Date().toLocaleTimeString() + "."); if (busy) toast("Applied"); }
    else { setStatus("Failed (errno " + r.errno + "). " + (r.stderr || r.stdout || ""), true); toast("Apply failed", true); }
    loadStatus(); loadLog();
  }

  async function loadStatus(){
    var r = await ksuExec("sh " + MODDIR + "/status.sh");
    if (r.errno !== 0) return;
    var s = parseConf(r.stdout);
    var gms = s.PKG_com_google_android_gms === "1";
    var fcm = parseInt(s.FCM_CONN || "0", 10) || 0;
    $("devCode").textContent = s.DEVICE || "—";
    $("modeEyebrow").textContent = (s.MODE_EFFECTIVE || "—").toUpperCase();
    $("stMode").textContent = (s.MODE_EFFECTIVE || "—").toUpperCase();
    $("stRegion").textContent = (s.REGION || "—").toUpperCase();
    $("stGms").textContent = gms ? "Installed" : "Not installed";
    $("stRom").textContent = s.ROM || "—";
    $("heroFcm").textContent = !gms ? "No Play Services" : (fcm > 0 ? "Connected (" + fcm + ")" : "No connection");
    $("heroFcmSub").textContent = !gms ? "Install Play Services first" : (fcm > 0 ? "GMS holds an open push socket" : "Push socket is down or sleeping. Run diagnostics.");
  }
  async function loadLog(){
    var r = await ksuExec("tail -n 60 " + MODDIR + "/hypergsm.log 2>/dev/null");
    $("logOut").textContent = (r.stdout || "").trim() || "No log yet.";
  }

  function render(){
    $("swNotif").classList.remove("skel"); $("swKeep").classList.remove("skel");
    $("swNotif").classList.toggle("on", state.NOTIF_FIX === "1");
    $("swKeep").classList.toggle("on", state.KEEP_APPLIED === "1");
    setSeg("segProfile", state.GMS_PROFILE);
    setSeg("segMode", state.MODE);
    $("profileDesc").textContent = PROFILE_DESC[state.GMS_PROFILE] || "";
    var list = $("chipList"); list.innerHTML = "";
    state.PRIORITY_APPS.split(" ").filter(Boolean).forEach(function(pkg){
      var chip = document.createElement("div"); chip.className = "chip";
      var span = document.createElement("span"); span.textContent = pkg;
      var btn = document.createElement("button"); btn.textContent = "\u00d7"; btn.setAttribute("aria-label", "Remove " + pkg);
      btn.addEventListener("click", function(){
        state.PRIORITY_APPS = state.PRIORITY_APPS.split(" ").filter(function(p){ return p && p !== pkg; }).join(" ");
        render(); applyNow(false);
      });
      chip.appendChild(span); chip.appendChild(btn); list.appendChild(chip);
    });
  }

  function switchPage(name){
    document.querySelectorAll(".page").forEach(function(p){ p.hidden = (p.id !== "page-" + name); });
    document.querySelectorAll(".navitem").forEach(function(b){ b.classList.toggle("active", b.dataset.page === name); });
    $("pageTitle").textContent = titles[name][0];
    $("pageSub").textContent = titles[name][1];
    if (name === "about") loadLog();
    window.scrollTo(0, 0);
  }

  function init(){
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    function setMode(){ document.documentElement.dataset.mode = mq.matches ? "dark" : "light"; }
    setMode(); mq.addEventListener("change", setMode);

    document.querySelectorAll(".navitem").forEach(function(b){ b.addEventListener("click", function(){ switchPage(b.dataset.page); }); });
    document.addEventListener("click", function(e){
      var sw = e.target.closest(".switch"); if (!sw) return;
      sw.classList.add("pressing"); setTimeout(function(){ sw.classList.remove("pressing"); }, 160);
    });
    function toggle(key){ state[key] = state[key] === "1" ? "0" : "1"; render(); applyNow(false); }
    $("swNotif").addEventListener("click", function(){ toggle("NOTIF_FIX"); });
    $("swKeep").addEventListener("click", function(){ toggle("KEEP_APPLIED"); });
    $("segProfile").addEventListener("click", function(e){
      var b = e.target.closest(".seg-btn"); if (!b) return;
      state.GMS_PROFILE = b.dataset.val; render(); applyNow(false);
    });
    $("segMode").addEventListener("click", function(e){
      var b = e.target.closest(".seg-btn"); if (!b) return;
      state.MODE = b.dataset.val; render(); applyNow(false);
    });
    function addPkg(){
      var v = $("pkgInput").value.trim();
      if (!PKG_RE.test(v) || v.length > 255){ toast("Not a valid package name", true); return; }
      var list = state.PRIORITY_APPS.split(" ").filter(Boolean);
      if (list.indexOf(v) === -1) list.push(v);
      state.PRIORITY_APPS = list.join(" ");
      $("pkgInput").value = "";
      render(); applyNow(false);
    }
    $("pkgAdd").addEventListener("click", addPkg);
    $("pkgInput").addEventListener("keydown", function(e){ if (e.key === "Enter") addPkg(); });
    ["applyBtn","applyBtnN","applyBtnB"].forEach(function(id){ $(id).addEventListener("click", function(){ applyNow(true); }); });
    $("diagBtn").addEventListener("click", async function(){
      $("diagBtn").disabled = true; $("diagBtn").textContent = "Collecting…";
      var r = await ksuExec("sh " + MODDIR + "/diag.sh >/dev/null 2>&1; cat " + MODDIR + "/webroot/diag.txt");
      $("diagBtn").disabled = false; $("diagBtn").textContent = "Run diagnostics";
      var out = $("diagOut"); out.hidden = false; out.textContent = r.stdout || "No output.";
    });
    loadConf().then(loadStatus);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
