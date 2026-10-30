/* =========================================================
   EDV-Kretzer – Kontaktformular mit E-Mail-Bestätigung
   Der Server prüft alles; diese Datei zeigt nur die Schritte an.
   ========================================================= */

(function () {
  "use strict";

  var root = document.getElementById("verify");
  if (!root || !window.fetch) return;

  /* Die Basis-URL steht verschleiert (Base64), kein Schutz, nur gegen beiläufiges Finden. */
  var API_BASE = atob("aHR0cHM6Ly90aWNrZXQtZ2F0ZS10ZWNoLnBrZS1sYWIuZGU=");

  var stepEmail = document.getElementById("step-email");
  var stepCode = document.getElementById("step-code");
  var stepTicket = document.getElementById("step-ticket");
  var statusEl = document.getElementById("v-status");
  var emailInput = document.getElementById("v-email");
  var codeInput = document.getElementById("v-code");
  var sendBtn = document.getElementById("v-send");
  var confirmBtn = document.getElementById("v-confirm");
  var resendBtn = document.getElementById("v-resend");
  var changeBtn = document.getElementById("v-change");
  var submitBtn = document.getElementById("t-submit");

  var sessionToken = "";
  var verificationToken = "";
  var countdownTimer = null;
  var busy = false;

  var MESSAGES = {
    email_invalid: "Bitte gib eine gültige E-Mail-Adresse ein.",
    code_expired: "Der Code ist abgelaufen oder nicht mehr gültig. Bitte fordere einen neuen Code an.",
    code_locked: "Zu viele Fehlversuche. Der Code wurde gesperrt, bitte fordere einen neuen Code an.",
    session_invalid: "Die Sitzung ist abgelaufen. Bitte fordere den Code erneut an.",
    verification_required: "Die Bestätigung ist abgelaufen. Bitte bestätige deine E-Mail-Adresse erneut.",
    ticket_invalid: "Bitte fülle Betreff und Nachricht aus und halte die maximale Länge ein.",
    ticket_failed: "Das Ticket konnte nicht angelegt werden. Bitte versuche es später erneut oder schreibe an info@edv-kretzer.de.",
    unavailable: "Der Dienst ist gerade ausgelastet. Bitte versuche es später erneut.",
    origin_not_allowed: "Das Formular ist auf dieser Adresse nicht freigeschaltet."
  };

  function show(el, visible) {
    if (visible) el.removeAttribute("hidden");
    else el.setAttribute("hidden", "");
  }

  function setStatus(text, isError) {
    statusEl.textContent = text || "";
    statusEl.classList.toggle("is-error", !!isError);
  }

  function setBusy(value) {
    busy = value;
    sendBtn.disabled = value;
    confirmBtn.disabled = value;
    submitBtn.disabled = value;
  }

  function waitText(seconds) {
    if (seconds < 90) return seconds + " Sekunden";
    return Math.ceil(seconds / 60) + " Minuten";
  }

  function errorText(err) {
    var data = err.data || {};
    if (err.status === 0) return "Keine Verbindung zum Server. Bitte versuche es später erneut.";
    if (data.error === "rate_limited") {
      return "Zu viele Anfragen. Bitte warte " + waitText(data.retry_after || 60) + " und versuche es dann erneut.";
    }
    if (data.error === "code_invalid") {
      var left = data.attempts_left;
      return "Der Code ist falsch." + (left ? " Noch " + left + (left === 1 ? " Versuch." : " Versuche.") : "");
    }
    return MESSAGES[data.error] || "Das hat nicht geklappt. Bitte versuche es erneut.";
  }

  function api(path, body, token) {
    var headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    return fetch(API_BASE + path, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body || {}),
      credentials: "omit",
      cache: "no-store"
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw { status: res.status, data: data };
        return data;
      });
    }, function () {
      throw { status: 0, data: {} };
    });
  }

  function ensureSession() {
    if (sessionToken) return Promise.resolve(sessionToken);
    return api("/v1/session").then(function (data) {
      sessionToken = data.session_token;
      return sessionToken;
    });
  }

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function startCountdown(seconds) {
    stopCountdown();
    var left = seconds;
    var render = function () {
      if (left > 0) {
        resendBtn.disabled = true;
        resendBtn.textContent = "Code erneut senden (" + left + " s)";
      } else {
        resendBtn.disabled = false;
        resendBtn.textContent = "Code erneut senden";
        stopCountdown();
      }
    };
    render();
    countdownTimer = setInterval(function () {
      left -= 1;
      render();
    }, 1000);
  }

  function resetToEmail(message, isError) {
    stopCountdown();
    sessionToken = "";
    verificationToken = "";
    codeInput.value = "";
    show(stepCode, false);
    show(stepTicket, false);
    show(stepEmail, true);
    setStatus(message, isError);
    emailInput.focus();
  }

  function requestCode() {
    var email = emailInput.value.trim();
    if (!email) {
      setStatus(MESSAGES.email_invalid, true);
      emailInput.focus();
      return;
    }
    setBusy(true);
    resendBtn.disabled = true;
    setStatus("Code wird gesendet …", false);
    ensureSession().then(function (token) {
      return api("/v1/verify/request", { email: email }, token);
    }).then(function (data) {
      document.getElementById("v-sent-to").textContent = email;
      show(stepEmail, false);
      show(stepCode, true);
      codeInput.value = "";
      codeInput.focus();
      startCountdown(data.resend_after || 60);
      setStatus("Wenn die Adresse stimmt, ist der Code unterwegs.", false);
    }).catch(function (err) {
      if (err.data && err.data.error === "session_invalid") sessionToken = "";
      setStatus(errorText(err), true);
      if (stepCode.hasAttribute("hidden")) {
        show(stepEmail, true);
      } else {
        startCountdown(err.data && err.data.retry_after ? err.data.retry_after : 0);
      }
    }).then(function () {
      setBusy(false);
    });
  }

  function confirmCode() {
    var code = codeInput.value.trim();
    if (!/^[0-9]{6}$/.test(code)) {
      setStatus("Bitte gib den 6-stelligen Code aus der E-Mail ein.", true);
      codeInput.focus();
      return;
    }
    setBusy(true);
    setStatus("Code wird geprüft …", false);
    api("/v1/verify/confirm", { code: code }, sessionToken).then(function (data) {
      verificationToken = data.verification_token;
      document.getElementById("v-verified").textContent = data.email;
      stopCountdown();
      show(stepCode, false);
      show(stepTicket, true);
      var subject = document.getElementById("t-subject");
      if (!subject.value && window.__contactInterest) subject.value = "Anfrage: " + window.__contactInterest;
      setStatus("", false);
      document.getElementById("t-name").focus();
    }).catch(function (err) {
      var code = err.data && err.data.error;
      if (code === "session_invalid") {
        resetToEmail(MESSAGES.session_invalid, true);
        return;
      }
      setStatus(errorText(err), true);
      if (code === "code_locked" || code === "code_expired") codeInput.value = "";
      codeInput.focus();
    }).then(function () {
      setBusy(false);
    });
  }

  function submitTicket() {
    var subject = document.getElementById("t-subject").value.trim();
    var message = document.getElementById("t-message").value.trim();
    if (!subject || !message) {
      setStatus(MESSAGES.ticket_invalid, true);
      return;
    }
    if (!document.getElementById("t-consent").checked) {
      setStatus("Bitte stimme der Datenschutzerklärung zu.", true);
      return;
    }
    setBusy(true);
    setStatus("Anfrage wird übermittelt …", false);
    api("/v1/tickets", {
      verification_token: verificationToken,
      name: document.getElementById("t-name").value.trim(),
      subject: subject,
      message: message
    }, sessionToken).then(function (data) {
      verificationToken = "";
      stepTicket.reset();
      show(stepTicket, false);
      show(stepEmail, true);
      emailInput.value = "";
      setStatus("Vielen Dank für deine Anfrage (#" + data.ticket_number + "). Ich melde mich bei dir.", false);
    }).catch(function (err) {
      var code = err.data && err.data.error;
      if (code === "verification_required" || code === "session_invalid" || code === "ticket_failed") {
        resetToEmail(errorText(err), true);
        return;
      }
      setStatus(errorText(err), true);
    }).then(function () {
      setBusy(false);
    });
  }

  stepEmail.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!busy) requestCode();
  });

  stepCode.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!busy) confirmCode();
  });

  stepTicket.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!busy) submitTicket();
  });

  resendBtn.addEventListener("click", function () {
    if (!busy) requestCode();
  });

  changeBtn.addEventListener("click", function () {
    stopCountdown();
    codeInput.value = "";
    show(stepCode, false);
    show(stepEmail, true);
    setStatus("", false);
    emailInput.focus();
  });

  codeInput.addEventListener("input", function () {
    codeInput.value = codeInput.value.replace(/[^0-9]/g, "").slice(0, 6);
  });

  show(root, true);
})();
