(function () {
  "use strict";

  var NativeXMLHttpRequest = window.XMLHttpRequest;
  var nativeOpen = NativeXMLHttpRequest.prototype.open;
  var nativeAddEventListener = NativeXMLHttpRequest.prototype.addEventListener;
  var searchRequests = new WeakSet();
  var activeLanguage = document.documentElement.lang.toLowerCase();
  var showEnglish = activeLanguage === "en" || activeLanguage.indexOf("en-") === 0;
  var searchSeparator = "[\\s\\u200b\\u3000_\\-、。，．？！；：:，,.!?;()（）/]+";

  function isSearchIndex(value) {
    try {
      return new URL(String(value), window.location.href).pathname.endsWith(
        "/search/search_index.json"
      );
    } catch (_error) {
      return false;
    }
  }

  function belongsToActiveLanguage(entry) {
    var location = String(entry.location || "").replace(/^\//, "");
    var isEnglish = location === "en" || location.indexOf("en/") === 0;
    return showEnglish ? isEnglish : !isEnglish;
  }

  function configureSearchIndex(index) {
    index.config = index.config || {};
    index.config.lang = [showEnglish ? "en" : "zh"];
    index.config.pipeline = showEnglish ? ["trimmer"] : ["stemmer"];
    index.config.separator = searchSeparator;
    index.docs = index.docs.filter(belongsToActiveLanguage);
  }

  function notify(listener, request, event) {
    if (typeof listener === "function") {
      listener.call(request, event);
    } else if (listener && typeof listener.handleEvent === "function") {
      listener.handleEvent(event);
    }
  }

  NativeXMLHttpRequest.prototype.open = function () {
    if (isSearchIndex(arguments[1])) {
      searchRequests.add(this);
    }
    return nativeOpen.apply(this, arguments);
  };

  NativeXMLHttpRequest.prototype.addEventListener = function (type, listener, options) {
    if (type !== "load") {
      return nativeAddEventListener.call(this, type, listener, options);
    }

    var request = this;
    return nativeAddEventListener.call(this, type, function (event) {
      if (
        !searchRequests.has(request) ||
        request.status < 200 ||
        request.status >= 300 ||
        !(request.response instanceof Blob)
      ) {
        notify(listener, request, event);
        return;
      }

      request.response
        .text()
        .then(function (body) {
          var index = JSON.parse(body);
          if (!index || !Array.isArray(index.docs)) {
            return;
          }

          configureSearchIndex(index);
          Object.defineProperty(request, "response", {
            configurable: true,
            value: new Blob([JSON.stringify(index)], { type: "application/json" }),
          });
        })
        .catch(function () {
          // Fall back to the original response if the index cannot be transformed.
        })
        .then(function () {
          notify(listener, request, event);
        });
    }, options);
  };
})();
