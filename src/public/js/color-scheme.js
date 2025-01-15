class UserColorScheme {
  static read(defaultValue) {
    return localStorage.getItem("color-scheme") ?? defaultValue;
  }
  static write(value) {
    localStorage.setItem("color-scheme", value);
  }
  static display(value, allValues) {
    allValues.forEach(v => document.body.classList.remove(v));
    document.body.classList.add(value);
  }
}

document.querySelectorAll('#color-scheme-selector').forEach((/** @type HTMLSelectElement */ element) => {
  const defaultValue = element.dataset["default"];
  const allValues = Array.from(element.querySelectorAll('option')).map(e => e.value);

  const userValue = UserColorScheme.read(defaultValue);

  element.value = userValue;
  UserColorScheme.display(userValue, allValues);

  element.onchange = () => {
    const newValue = element.value;
    UserColorScheme.write(newValue);
    UserColorScheme.display(newValue, allValues);
  };
});
