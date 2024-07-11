(() => {
  "use strict";
  var __webpack_modules__ = {
    37: (module1) => {
      module1.exports = require("os");
    },
    282: (module1) => {
      module1.exports = require("process");
    },
    224: (module1) => {
      module1.exports = require("tty");
    },
    103: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      var __create = Object.create;
      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __getProtoOf = Object.getPrototypeOf;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps = (to, from, except, desc) => {
        if ((from && typeof from === "object") || typeof from === "function") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, {
                get: () => from[key],
                enumerable:
                  !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
              });
        }
        return to;
      };
      var __toESM = (mod, isNodeMode, target) => (
        (target = mod != null ? __create(__getProtoOf(mod)) : {}),
        __copyProps(
          isNodeMode || !mod || !mod.__esModule
            ? __defProp(target, "default", { value: mod, enumerable: true })
            : target,
          mod,
        )
      );
      var __toCommonJS = (mod) =>
        __copyProps(__defProp({}, "__esModule", { value: true }), mod);
      var src_exports = {};
      __export(src_exports, {
        createLogger: () => createLogger,
        logger: () => logger,
      });
      module1.exports = __toCommonJS(src_exports);
      var import_node_process = __toESM(__nccwpck_require__(282));
      var import_node_os = __toESM(__nccwpck_require__(37));
      var import_node_tty = __toESM(__nccwpck_require__(224));
      function hasFlag(
        flag,
        argv = globalThis.Deno
          ? globalThis.Deno.args
          : import_node_process.default.argv,
      ) {
        const prefix = flag.startsWith("-")
          ? ""
          : flag.length === 1
            ? "-"
            : "--";
        const position = argv.indexOf(prefix + flag);
        const terminatorPosition = argv.indexOf("--");
        return (
          position !== -1 &&
          (terminatorPosition === -1 || position < terminatorPosition)
        );
      }
      var { env } = import_node_process.default;
      var flagForceColor;
      if (
        hasFlag("no-color") ||
        hasFlag("no-colors") ||
        hasFlag("color=false") ||
        hasFlag("color=never")
      ) {
        flagForceColor = 0;
      } else if (
        hasFlag("color") ||
        hasFlag("colors") ||
        hasFlag("color=true") ||
        hasFlag("color=always")
      ) {
        flagForceColor = 1;
      }
      function envForceColor() {
        if ("FORCE_COLOR" in env) {
          if (env.FORCE_COLOR === "true") {
            return 1;
          }
          if (env.FORCE_COLOR === "false") {
            return 0;
          }
          return env.FORCE_COLOR.length === 0
            ? 1
            : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
        }
      }
      function translateLevel(level) {
        if (level === 0) {
          return false;
        }
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
        if (noFlagForceColor !== void 0) {
          flagForceColor = noFlagForceColor;
        }
        const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
        if (forceColor === 0) {
          return 0;
        }
        if (sniffFlags) {
          if (
            hasFlag("color=16m") ||
            hasFlag("color=full") ||
            hasFlag("color=truecolor")
          ) {
            return 3;
          }
          if (hasFlag("color=256")) {
            return 2;
          }
        }
        if ("TF_BUILD" in env && "AGENT_NAME" in env) {
          return 1;
        }
        if (haveStream && !streamIsTTY && forceColor === void 0) {
          return 0;
        }
        const min = forceColor || 0;
        if (env.TERM === "dumb") {
          return min;
        }
        if (import_node_process.default.platform === "win32") {
          const osRelease = import_node_os.default.release().split(".");
          if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
            return Number(osRelease[2]) >= 14931 ? 3 : 2;
          }
          return 1;
        }
        if ("CI" in env) {
          if ("GITHUB_ACTIONS" in env || "GITEA_ACTIONS" in env) {
            return 3;
          }
          if (
            [
              "TRAVIS",
              "CIRCLECI",
              "APPVEYOR",
              "GITLAB_CI",
              "BUILDKITE",
              "DRONE",
            ].some((sign) => sign in env) ||
            env.CI_NAME === "codeship"
          ) {
            return 1;
          }
          return min;
        }
        if ("TEAMCITY_VERSION" in env) {
          return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION)
            ? 1
            : 0;
        }
        if (env.COLORTERM === "truecolor") {
          return 3;
        }
        if (env.TERM === "xterm-kitty") {
          return 3;
        }
        if ("TERM_PROGRAM" in env) {
          const version = Number.parseInt(
            (env.TERM_PROGRAM_VERSION || "").split(".")[0],
            10,
          );
          switch (env.TERM_PROGRAM) {
            case "iTerm.app": {
              return version >= 3 ? 3 : 2;
            }
            case "Apple_Terminal": {
              return 2;
            }
          }
        }
        if (/-256(color)?$/i.test(env.TERM)) {
          return 2;
        }
        if (
          /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(
            env.TERM,
          )
        ) {
          return 1;
        }
        if ("COLORTERM" in env) {
          return 1;
        }
        return min;
      }
      function createSupportsColor(stream, options = {}) {
        const level = _supportsColor(stream, {
          streamIsTTY: stream && stream.isTTY,
          ...options,
        });
        return translateLevel(level);
      }
      var supportsColor = {
        stdout: createSupportsColor({
          isTTY: import_node_tty.default.isatty(1),
        }),
        stderr: createSupportsColor({
          isTTY: import_node_tty.default.isatty(2),
        }),
      };
      var supports_color_default = supportsColor;
      var colorLevel = supports_color_default.stdout
        ? supports_color_default.stdout.level
        : 0;
      var errorStackRegExp = /at\s.*:\d+:\d+[\s\)]*$/;
      var anonymousErrorStackRegExp = /^\s*at\s.*\(<anonymous>\)$/;
      var isErrorStackMessage = (message) =>
        errorStackRegExp.test(message) ||
        anonymousErrorStackRegExp.test(message);
      var formatter = (open, close, replace = open) =>
        colorLevel >= 2
          ? (input) => {
              let string = "" + input;
              let index = string.indexOf(close, open.length);
              return ~index
                ? open + replaceClose(string, close, replace, index) + close
                : open + string + close;
            }
          : String;
      var replaceClose = (string, close, replace, index) => {
        let start = string.substring(0, index) + replace;
        let end = string.substring(index + close.length);
        let nextIndex = end.indexOf(close);
        return ~nextIndex
          ? start + replaceClose(end, close, replace, nextIndex)
          : start + end;
      };
      var bold = formatter("\x1b[1m", "\x1b[22m", "\x1b[22m\x1b[1m");
      var red = formatter("\x1b[31m", "\x1b[39m");
      var green = formatter("\x1b[32m", "\x1b[39m");
      var yellow = formatter("\x1b[33m", "\x1b[39m");
      var magenta = formatter("\x1b[35m", "\x1b[39m");
      var cyan = formatter("\x1b[36m", "\x1b[39m");
      var gray = formatter("\x1b[90m", "\x1b[39m");
      var startColor = [189, 255, 243];
      var endColor = [74, 194, 154];
      var isWord = (char) => !/[\s\n]/.test(char);
      var gradient = (message) => {
        if (colorLevel < 3) {
          return colorLevel === 2 ? bold(cyan(message)) : message;
        }
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
          output += `\x1b[38;2;${Math.round(r)};${Math.round(g)};${Math.round(b)}m${char}\x1b[39m`;
        }
        return bold(output);
      };
      var LOG_LEVEL = { error: 0, warn: 1, info: 2, log: 3, verbose: 4 };
      var LOG_TYPES = {
        error: { label: "error", level: "error", color: red },
        warn: { label: "warn", level: "warn", color: yellow },
        info: { label: "info", level: "info", color: cyan },
        start: { label: "start", level: "info", color: cyan },
        ready: { label: "ready", level: "info", color: green },
        success: { label: "success", level: "info", color: green },
        log: { level: "log" },
        debug: { label: "debug", level: "verbose", color: magenta },
      };
      var createLogger = (options = {}) => {
        let maxLevel = options.level || "log";
        let log = (type, message, ...args) => {
          if (LOG_LEVEL[LOG_TYPES[type].level] > LOG_LEVEL[maxLevel]) {
            return;
          }
          if (message === void 0 || message === null) {
            return console.log();
          }
          let logType = LOG_TYPES[type];
          let label = "";
          let text = "";
          if ("label" in logType) {
            label = (logType.label || "").padEnd(7);
            label = bold(logType.color ? logType.color(label) : label);
          }
          if (message instanceof Error) {
            if (message.stack) {
              let [name, ...rest] = message.stack.split("\n");
              if (name.startsWith("Error: ")) {
                name = name.slice(7);
              }
              text = `${name}
${gray(rest.join("\n"))}`;
            } else {
              text = message.message;
            }
          } else if (logType.level === "error" && typeof message === "string") {
            let lines = message.split("\n");
            text = lines
              .map((line) => (isErrorStackMessage(line) ? gray(line) : line))
              .join("\n");
          } else {
            text = `${message}`;
          }
          console.log(label.length ? `${label} ${text}` : text, ...args);
        };
        let logger2 = { greet: (message) => log("log", gradient(message)) };
        Object.keys(LOG_TYPES).forEach((key) => {
          logger2[key] = (...args) => log(key, ...args);
        });
        Object.defineProperty(logger2, "level", {
          get: () => maxLevel,
          set(val) {
            maxLevel = val;
          },
        });
        logger2.override = (customLogger) => {
          Object.assign(logger2, customLogger);
        };
        return logger2;
      };
      var logger = createLogger();
      0 && 0;
    },
  };
  var __webpack_module_cache__ = {};
  function __nccwpck_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (cachedModule !== undefined) {
      return cachedModule.exports;
    }
    var module1 = (__webpack_module_cache__[moduleId] = { exports: {} });
    var threw = true;
    try {
      __webpack_modules__[moduleId](
        module1,
        module1.exports,
        __nccwpck_require__,
      );
      threw = false;
    } finally {
      if (threw) delete __webpack_module_cache__[moduleId];
    }
    return module1.exports;
  }
  if (typeof __nccwpck_require__ !== "undefined")
    __nccwpck_require__.ab = __dirname + "/";
  var __webpack_exports__ = __nccwpck_require__(103);
  module.exports = __webpack_exports__;
})();
