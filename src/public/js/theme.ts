enum ColorScheme {
  system = "◐ System theme",
  dark = "☾ Dark theme",
  light = "☀︎ Light theme",
}

type ColorSchemeKey = keyof typeof ColorScheme;

const ColorSchemeDefault: ColorSchemeKey = "system";

const ColorSchemeKeysAll = Object.keys(ColorScheme) as ColorSchemeKey[];

function parseColorSchemeKey(value: string | null): ColorSchemeKey {
  switch (value) {
    case "system":
    case "dark":
    case "light":
      return value;
    default:
      return ColorSchemeDefault;
  }
}

class UserColorScheme {
  /**
   * Load the user's color scheme preference from local storage and apply it.
   */
  static load(): ColorSchemeKey {
    const userValue = this.read();
    this.display(userValue);
    return userValue;
  }

  static read(): ColorSchemeKey {
    const value = localStorage.getItem("color-scheme");
    return parseColorSchemeKey(value);
  }

  static write(value: ColorSchemeKey) {
    localStorage.setItem("color-scheme", value);
  }

  static display(value: ColorSchemeKey) {
    ColorSchemeKeysAll.forEach((v) => document.body.classList.remove(v));
    document.body.classList.add(value);

    document.querySelectorAll<HTMLLinkElement>(
      'link[rel="stylesheet"][data-theme]',
    ).forEach(
      (element) => {
        if (value === ColorSchemeDefault) {
          element.disabled = false;
          element.media = element.dataset["media"] ?? "";
        } else {
          element.disabled = element.dataset["theme"] !== value;
          element.media = "";
        }
      },
    );
  }
}

if ("document" in globalThis) {
  const userValue = UserColorScheme.load();

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll<HTMLLinkElement>(
      'link[rel="stylesheet"][data-theme]',
    ).forEach(
      (element) => {
        element.dataset["media"] = element.media; // save media attribute
      },
    );

    // Maybe implement a custom element for this?
    document.querySelectorAll<HTMLSelectElement>("#color-scheme-selector")
      .forEach(
        (element) => {
          ColorSchemeKeysAll.forEach((value) => {
            const option = document.createElement("option");
            option.value = value;
            option.text = ColorScheme[value];
            element.appendChild(option);
          });

          element.value = userValue;

          element.onchange = () => {
            const newValue = parseColorSchemeKey(element.value);
            UserColorScheme.write(newValue);
            UserColorScheme.display(newValue);
          };
        },
      );
  });
}
