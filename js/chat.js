(function () {
  "use strict";

  if (typeof window.ZammadChat !== "function") return;

  new window.ZammadChat({
    chatId: 1,
    show: false,
    flat: true,
    background: "#3e2b22",
    fontSize: "12px",
    title: "<strong>Chat</strong> mit mir"
  });
})();
