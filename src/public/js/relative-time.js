import moment from "https://esm.sh/moment@2.30.1";

globalThis.addEventListener("DOMContentLoaded", () => {
  /**
   * @type {NodeListOf<HTMLTimeElement>}
   */
  const elements = document.querySelectorAll("time.relative-time");

  elements.forEach((element) => {
    const date = element.getAttribute("datetime");
    element.textContent = moment(date).fromNow();
    element.dataset["refreshed"] = new Date().toISOString();
  });
});
