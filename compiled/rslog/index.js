(() => {
  "use strict";
  var __webpack_modules__ = {
    161: (module) => {
      module.exports = require("node:os");
    },
    708: (module) => {
      module.exports = require("node:process");
    },
    66: (module) => {
      module.exports = require("node:tty");
    },
    838: (__unused_webpack_module, exports, __nccwpck_require__) => {
      var __nested_webpack_require_18__ = {};
      (() => {
        __nested_webpack_require_18__.d = (exports1, definition) => {
          for (var key in definition)
            if (
              __nested_webpack_require_18__.o(definition, key) &&
              !__nested_webpack_require_18__.o(exports1, key)
            )
              Object.defineProperty(exports1, key, {
                enumerable: true,
                get: definition[key],
              });
        };
      })();
      (() => {
        __nested_webpack_require_18__.o = (obj, prop) =>
          Object.prototype.hasOwnProperty.call(obj, prop);
      })();
      (() => {
        __nested_webpack_require_18__.r = (exports1) => {
          if ("undefined" != typeof Symbol && Symbol.toStringTag)
            Object.defineProperty(exports1, Symbol.toStringTag, {
              value: "Module",
            });
          Object.defineProperty(exports1, "__esModule", { value: true });
        };
      })();
      var __nested_webpack_exports__ = {};
      __nested_webpack_require_18__.r(__nested_webpack_exports__);
      __nested_webpack_require_18__.d(__nested_webpack_exports__, {
        logger: () => src_logger,
        createLogger: () => createLogger,
      });
      const external_node_process_namespaceObject = __nccwpck_require__(708);
      const external_node_os_namespaceObject = __nccwpck_require__(161);
      const external_node_tty_namespaceObject = __nccwpck_require__(66);
      function hasFlag(
        flag,
        argv = globalThis.Deno
          ? globalThis.Deno.args
          : external_node_process_namespaceObject.argv,
      ) {
        const prefix = flag.startsWith("-")
          ? ""
          : 1 === flag.length
            ? "-"
            : "--";
        const position = argv.indexOf(prefix + flag);
        const terminatorPosition = argv.indexOf("--");
        return (
          -1 !== position &&
          (-1 === terminatorPosition || position < terminatorPosition)
        );
      }
      const { env } = external_node_process_namespaceObject;
      let flagForceColor;
      if (
        hasFlag("no-color") ||
        hasFlag("no-colors") ||
        hasFlag("color=false") ||
        hasFlag("color=never")
      )
        flagForceColor = 0;
      else if (
        hasFlag("color") ||
        hasFlag("colors") ||
        hasFlag("color=true") ||
        hasFlag("color=always")
      )
        flagForceColor = 1;
      function envForceColor() {
        if (!("FORCE_COLOR" in env)) return;
        if ("true" === env.FORCE_COLOR) return 1;
        if ("false" === env.FORCE_COLOR) return 0;
        if (0 === env.FORCE_COLOR.length) return 1;
        const level = Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
        if (![0, 1, 2, 3].includes(level)) return;
        return level;
      }
      function translateLevel(level) {
        if (0 === level) return false;
        return {
          level,
          hasBasic: true,
          has256: level >= 2,
          has16m: level >= 3,
        };
      }
      function _supportsColor(
        haveStream,
        { streamIsTTY, sniffFlags = true } = {},
      ) {
        const noFlagForceColor = envForceColor();
        if (void 0 !== noFlagForceColor) flagForceColor = noFlagForceColor;
        const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
        if (0 === forceColor) return 0;
        if (sniffFlags) {
          if (
            hasFlag("color=16m") ||
            hasFlag("color=full") ||
            hasFlag("color=truecolor")
          )
            return 3;
          if (hasFlag("color=256")) return 2;
        }
        if ("TF_BUILD" in env && "AGENT_NAME" in env) return 1;
        if (haveStream && !streamIsTTY && void 0 === forceColor) return 0;
        const min = forceColor || 0;
        if ("dumb" === env.TERM) return min;
        if ("win32" === external_node_process_namespaceObject.platform) {
          const osRelease = external_node_os_namespaceObject
            .release()
            .split(".");
          if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586)
            return Number(osRelease[2]) >= 14931 ? 3 : 2;
          return 1;
        }
        if ("CI" in env) {
          if (
            ["GITHUB_ACTIONS", "GITEA_ACTIONS", "CIRCLECI"].some(
              (key) => key in env,
            )
          )
            return 3;
          if (
            ["TRAVIS", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some(
              (sign) => sign in env,
            ) ||
            "codeship" === env.CI_NAME
          )
            return 1;
          return min;
        }
        if ("TEAMCITY_VERSION" in env)
          return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION)
            ? 1
            : 0;
        if ("truecolor" === env.COLORTERM) return 3;
        if ("xterm-kitty" === env.TERM) return 3;
        if ("xterm-ghostty" === env.TERM) return 3;
        if ("TERM_PROGRAM" in env) {
          const version = Number.parseInt(
            (env.TERM_PROGRAM_VERSION || "").split(".")[0],
            10,
          );
          switch (env.TERM_PROGRAM) {
            case "iTerm.app":
              return version >= 3 ? 3 : 2;
            case "Apple_Terminal":
              return 2;
          }
        }
        if (/-256(color)?$/i.test(env.TERM)) return 2;
        if (
          /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(
            env.TERM,
          )
        )
          return 1;
        if ("COLORTERM" in env) return 1;
        return min;
      }
      function createSupportsColor(stream, options = {}) {
        const level = _supportsColor(stream, {
          streamIsTTY: stream && stream.isTTY,
          ...options,
        });
        return translateLevel(level);
      }
      const supportsColor = {
        stdout: createSupportsColor({
          isTTY: external_node_tty_namespaceObject.isatty(1),
        }),
        stderr: createSupportsColor({
          isTTY: external_node_tty_namespaceObject.isatty(2),
        }),
      };
      const supports_color = supportsColor;
      const colorLevel = supports_color.stdout
        ? supports_color.stdout.level
        : 0;
      let errorStackRegExp = /at\s.*:\d+:\d+[\s\)]*$/;
      let anonymousErrorStackRegExp = /at\s.*\(<anonymous>\)$/;
      let isErrorStackMessage = (message) =>
        errorStackRegExp.test(message) ||
        anonymousErrorStackRegExp.test(message);
      let formatter = (open, close, replace = open) =>
        colorLevel >= 2
          ? (input) => {
              let string = "" + input;
              let index = string.indexOf(close, open.length);
              return ~index
                ? open + replaceClose(string, close, replace, index) + close
                : open + string + close;
            }
          : String;
      let replaceClose = (string, close, replace, index) => {
        let start = string.substring(0, index) + replace;
        let end = string.substring(index + close.length);
        let nextIndex = end.indexOf(close);
        return ~nextIndex
          ? start + replaceClose(end, close, replace, nextIndex)
          : start + end;
      };
      const bold = formatter("[1m", "[22m", "[22m[1m");
      const red = formatter("[31m", "[39m");
      const green = formatter("[32m", "[39m");
      const yellow = formatter("[33m", "[39m");
      const magenta = formatter("[35m", "[39m");
      const cyan = formatter("[36m", "[39m");
      const gray = formatter("[90m", "[39m");
      let startColor = [189, 255, 243];
      let endColor = [74, 194, 154];
      let isWord = (char) => !/[\s\n]/.test(char);
      let gradient = (message) => {
        if (colorLevel < 3)
          return 2 === colorLevel ? bold(cyan(message)) : message;
        let chars = [...message];
        let steps = chars.filter(isWord).length;
        let r = startColor[0];
        let g = startColor[1];
        let b = startColor[2];
        let rStep = (endColor[0] - r) / steps;
        let gStep = (endColor[1] - g) / steps;
        let bStep = (endColor[2] - b) / steps;
        let output = "";
        for (let char of chars) {
          if (isWord(char)) {
            r += rStep;
            g += gStep;
            b += bStep;
          }
          output += `[38;2;${Math.round(r)};${Math.round(g)};${Math.round(b)}m${char}[39m`;
        }
        return bold(output);
      };
      let LOG_LEVEL = {
        silent: -1,
        error: 0,
        warn: 1,
        info: 2,
        log: 2,
        verbose: 3,
      };
      let LOG_TYPES = {
        error: { label: "error", level: "error", color: red },
        warn: { label: "warn", level: "warn", color: yellow },
        info: { label: "info", level: "info", color: cyan },
        start: { label: "start", level: "info", color: cyan },
        ready: { label: "ready", level: "info", color: green },
        success: { label: "success", level: "info", color: green },
        log: { level: "info" },
        debug: { label: "debug", level: "verbose", color: magenta },
      };
      let createLogger = (options = {}) => {
        let maxLevel = options.level || "info";
        let log = (type, message, ...args) => {
          if (LOG_LEVEL[LOG_TYPES[type].level] > LOG_LEVEL[maxLevel]) return;
          if (null == message) return console.log();
          let logType = LOG_TYPES[type];
          let label = "";
          let text = "";
          if ("label" in logType) {
            label = (logType.label || "").padEnd(7);
            label = bold(logType.color ? logType.color(label) : label);
          }
          if (message instanceof Error)
            if (message.stack) {
              let [name, ...rest] = message.stack.split("\n");
              if (name.startsWith("Error: ")) name = name.slice(7);
              text = `${name}\n${gray(rest.join("\n"))}`;
            } else text = message.message;
          else if ("error" === logType.level && "string" == typeof message) {
            let lines = message.split("\n");
            text = lines
              .map((line) => (isErrorStackMessage(line) ? gray(line) : line))
              .join("\n");
          } else text = `${message}`;
          console.log(label.length ? `${label} ${text}` : text, ...args);
        };
        let logger = { greet: (message) => log("log", gradient(message)) };
        Object.keys(LOG_TYPES).forEach((key) => {
          logger[key] = (...args) => log(key, ...args);
        });
        Object.defineProperty(logger, "level", {
          get: () => maxLevel,
          set(val) {
            maxLevel = val;
          },
        });
        logger.override = (customLogger) => {
          Object.assign(logger, customLogger);
        };
        return logger;
      };
      let src_logger = createLogger();
      exports.createLogger = __nested_webpack_exports__.createLogger;
      exports.logger = __nested_webpack_exports__.logger;
      for (var __webpack_i__ in __nested_webpack_exports__)
        if (-1 === ["createLogger", "logger"].indexOf(__webpack_i__))
          exports[__webpack_i__] = __nested_webpack_exports__[__webpack_i__];
      Object.defineProperty(exports, "__esModule", { value: true });
    },
  };
  var __webpack_module_cache__ = {};
  function __nccwpck_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (cachedModule !== undefined) {
      return cachedModule.exports;
    }
    var module = (__webpack_module_cache__[moduleId] = { exports: {} });
    var threw = true;
    try {
      __webpack_modules__[moduleId](
        module,
        module.exports,
        __nccwpck_require__,
      );
      threw = false;
    } finally {
      if (threw) delete __webpack_module_cache__[moduleId];
    }
    return module.exports;
  }
  if (typeof __nccwpck_require__ !== "undefined")
    __nccwpck_require__.ab = __dirname + "/";
  var __webpack_exports__ = __nccwpck_require__(838);
  module.exports = __webpack_exports__;
})();
