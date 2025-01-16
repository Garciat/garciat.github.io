class UserColorScheme {
  static read(defaultValue) {
    return localStorage.getItem("color-scheme") ?? defaultValue;
  }
  static write(value) {
    localStorage.setItem("color-scheme", value);
  }
  static display(value, allValues, defaultValue) {
    allValues.forEach((v) => document.body.classList.remove(v));
    document.body.classList.add(value);

    document.querySelectorAll('link[rel="stylesheet"][data-theme]').forEach(
      (/** @type HTMLLinkElement */ element) => {
        if (value === defaultValue) {
          element.disabled = false;
          element.media = element.dataset["media"];
        } else {
          element.disabled = element.dataset["theme"] !== value;
          element.media = "";
        }
      },
    );
  }
}

document.querySelectorAll('link[rel="stylesheet"][data-theme]').forEach(
  (/** @type HTMLLinkElement */ element) => {
    element.dataset["media"] = element.media; // save media attribute
  },
);

document.querySelectorAll("#color-scheme-selector").forEach(
  (/** @type HTMLSelectElement */ element) => {
    const defaultValue = element.dataset["default"];
    const allValues = Array.from(element.querySelectorAll("option")).map((e) =>
      e.value
    );

    const userValue = UserColorScheme.read(defaultValue);

    element.value = userValue;
    UserColorScheme.display(userValue, allValues, defaultValue);

    element.onchange = () => {
      const newValue = element.value;
      UserColorScheme.write(newValue);
      UserColorScheme.display(newValue, allValues, defaultValue);
    };
  },
);
