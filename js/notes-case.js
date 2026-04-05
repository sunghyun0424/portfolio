/**
 * Notes-style 케이스: 섹션 탭 클릭 시 스크롤은 .notes-case__reader-scroll 기준으로만 이동.
 * 스무스 스크롤 중 즉시 scroll 스파이를 돌리면 중간 프레임에서 이전 섹션이 다시 선택되는 문제가 있어,
 * 탭 클릭으로 고른 섹션은 잠금 해제 시점까지 하이라이트를 고정한다.
 */
(function () {
  var reader = document.querySelector(".notes-case__reader-scroll");
  var tabs = document.querySelectorAll(".notes-case__note[data-notes-target]");
  var panels = document.querySelectorAll(".notes-case__panel");
  if (!reader || !tabs.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  /* 읽기 영역 상단 ↔ 섹션 제목(h2) 사이 여백 */
  var READER_TOP_OFFSET = 68;
  /** 탭으로 스크롤한 뒤 하이라이트를 고정할 data-notes-target 값 */
  var pendingScrollTarget = null;
  /** true면 스크롤로 인한 활성 탭 갱신을 하지 않음 */
  var scrollSpySuppressed = false;
  var suppressTimer = null;
  var scrollDebounceTimer = null;

  function clearSuppressTimer() {
    if (suppressTimer) {
      clearTimeout(suppressTimer);
      suppressTimer = null;
    }
  }

  function releaseTabLock() {
    clearSuppressTimer();
    scrollSpySuppressed = false;
    if (pendingScrollTarget !== null) {
      setActive(pendingScrollTarget);
      pendingScrollTarget = null;
    }
  }

  function setActive(target) {
    tabs.forEach(function (t) {
      var sel = t.getAttribute("data-notes-target") === target;
      t.classList.toggle("notes-case__note--active", sel);
      if (sel) t.setAttribute("aria-current", "location");
      else t.removeAttribute("aria-current");
    });
  }

  function scrollToPanel(target) {
    var el = document.getElementById("panel-" + target);
    if (!el) return;
    var anchor = el.querySelector(".notes-case__title") || el.querySelector("h2") || el;

    function applyScroll() {
      var top =
        anchor.getBoundingClientRect().top -
        reader.getBoundingClientRect().top +
        reader.scrollTop -
        READER_TOP_OFFSET;
      var maxScroll = Math.max(0, reader.scrollHeight - reader.clientHeight);
      var nextTop = Math.max(0, Math.min(top, maxScroll));

      if (reduceMotion.matches) {
        reader.scrollTo({ top: nextTop, behavior: "auto" });
        requestAnimationFrame(function () {
          requestAnimationFrame(releaseTabLock);
        });
        return;
      }

      reader.scrollTo({ top: nextTop, behavior: "smooth" });
      /* div 스크롤은 scrollend 미지원·불안정한 경우가 많아 고정 시간 후 잠금 해제 */
      clearSuppressTimer();
      suppressTimer = setTimeout(releaseTabLock, 1000);
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(applyScroll);
    });
  }

  function updateActiveFromScroll() {
    if (scrollSpySuppressed) return;
    if (!panels.length) return;
    var readerRect = reader.getBoundingClientRect();
    var y = readerRect.top + READER_TOP_OFFSET;
    var current = panels[0].id.replace("panel-", "");
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      var ref = p.querySelector(".notes-case__title") || p.querySelector("h2") || p;
      if (ref.getBoundingClientRect().top <= y) {
        current = p.id.replace("panel-", "");
      }
    }
    setActive(current);
  }

  function onReaderScroll() {
    if (scrollSpySuppressed) return;
    clearTimeout(scrollDebounceTimer);
    scrollDebounceTimer = setTimeout(function () {
      scrollDebounceTimer = null;
      updateActiveFromScroll();
    }, 160);
  }

  tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-notes-target");
      clearTimeout(scrollDebounceTimer);
      clearSuppressTimer();
      pendingScrollTarget = target;
      scrollSpySuppressed = true;
      setActive(target);
      scrollToPanel(target);
    });
  });

  reader.addEventListener("scroll", onReaderScroll, { passive: true });
  updateActiveFromScroll();
})();
