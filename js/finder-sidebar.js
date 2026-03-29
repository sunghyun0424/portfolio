/**
 * Finder 사이드바: 클립보드 복사 (HTTPS / localhost 외에는 execCommand 폴백)
 */
(function () {
  function showToast(message) {
    var el = document.getElementById("portfolio-toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("finder__toast--show");
    window.clearTimeout(el._hideT);
    el._hideT = window.setTimeout(function () {
      el.classList.remove("finder__toast--show");
      el.textContent = "";
    }, 2600);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("aria-hidden", "true");
      ta.style.cssText =
        "position:fixed;top:0;left:0;width:2em;height:2em;padding:0;margin:0;border:0;opacity:0;pointer-events:none;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(ta);
      if (ok) resolve();
      else reject(new Error("legacy copy failed"));
    });
  }

  function copyText(text) {
    return new Promise(function (resolve, reject) {
      var useModern =
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function" &&
        window.isSecureContext === true;

      if (useModern) {
        navigator.clipboard.writeText(text).then(resolve).catch(function () {
          legacyCopy(text).then(resolve).catch(reject);
        });
        return;
      }
      legacyCopy(text).then(resolve).catch(reject);
    });
  }

  function bindCopyButtons() {
    document.querySelectorAll("[data-copy-clipboard]").forEach(function (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var text = copyBtn.getAttribute("data-copy-clipboard") || "";
        var toastMsg = copyBtn.getAttribute("data-copy-toast") || "복사되었어요!";
        function flash() {
          showToast(toastMsg);
          var pulse =
            copyBtn.classList.contains("finder__row") ? "finder__row--copied" : "landing-foot__flash";
          copyBtn.classList.add(pulse);
          window.setTimeout(function () {
            copyBtn.classList.remove(pulse);
          }, 2000);
        }
        copyText(text)
          .then(function () {
            flash();
          })
          .catch(function () {
            window.prompt("자동 복사가 막혀 있어요. 아래를 직접 선택해 복사해 주세요.", text);
          });
      });
    });
  }

  bindCopyButtons();
})();
