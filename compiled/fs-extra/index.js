(() => {
  var __webpack_modules__ = {
    524: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const fs = __nccwpck_require__(804);
      const path = __nccwpck_require__(17);
      const mkdirsSync = __nccwpck_require__(516).mkdirsSync;
      const utimesMillisSync = __nccwpck_require__(227).utimesMillisSync;
      const stat = __nccwpck_require__(826);
      function copySync(src, dest, opts) {
        if (typeof opts === "function") {
          opts = { filter: opts };
        }
        opts = opts || {};
        opts.clobber = "clobber" in opts ? !!opts.clobber : true;
        opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
        if (opts.preserveTimestamps && process.arch === "ia32") {
          process.emitWarning(
            "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n" +
              "	see https://github.com/jprichardson/node-fs-extra/issues/269",
            "Warning",
            "fs-extra-WARN0002",
          );
        }
        const { srcStat, destStat } = stat.checkPathsSync(
          src,
          dest,
          "copy",
          opts,
        );
        stat.checkParentPathsSync(src, srcStat, dest, "copy");
        if (opts.filter && !opts.filter(src, dest)) return;
        const destParent = path.dirname(dest);
        if (!fs.existsSync(destParent)) mkdirsSync(destParent);
        return getStats(destStat, src, dest, opts);
      }
      function getStats(destStat, src, dest, opts) {
        const statSync = opts.dereference ? fs.statSync : fs.lstatSync;
        const srcStat = statSync(src);
        if (srcStat.isDirectory())
          return onDir(srcStat, destStat, src, dest, opts);
        else if (
          srcStat.isFile() ||
          srcStat.isCharacterDevice() ||
          srcStat.isBlockDevice()
        )
          return onFile(srcStat, destStat, src, dest, opts);
        else if (srcStat.isSymbolicLink())
          return onLink(destStat, src, dest, opts);
        else if (srcStat.isSocket())
          throw new Error(`Cannot copy a socket file: ${src}`);
        else if (srcStat.isFIFO())
          throw new Error(`Cannot copy a FIFO pipe: ${src}`);
        throw new Error(`Unknown file: ${src}`);
      }
      function onFile(srcStat, destStat, src, dest, opts) {
        if (!destStat) return copyFile(srcStat, src, dest, opts);
        return mayCopyFile(srcStat, src, dest, opts);
      }
      function mayCopyFile(srcStat, src, dest, opts) {
        if (opts.overwrite) {
          fs.unlinkSync(dest);
          return copyFile(srcStat, src, dest, opts);
        } else if (opts.errorOnExist) {
          throw new Error(`'${dest}' already exists`);
        }
      }
      function copyFile(srcStat, src, dest, opts) {
        fs.copyFileSync(src, dest);
        if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
        return setDestMode(dest, srcStat.mode);
      }
      function handleTimestamps(srcMode, src, dest) {
        if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
        return setDestTimestamps(src, dest);
      }
      function fileIsNotWritable(srcMode) {
        return (srcMode & 128) === 0;
      }
      function makeFileWritable(dest, srcMode) {
        return setDestMode(dest, srcMode | 128);
      }
      function setDestMode(dest, srcMode) {
        return fs.chmodSync(dest, srcMode);
      }
      function setDestTimestamps(src, dest) {
        const updatedSrcStat = fs.statSync(src);
        return utimesMillisSync(
          dest,
          updatedSrcStat.atime,
          updatedSrcStat.mtime,
        );
      }
      function onDir(srcStat, destStat, src, dest, opts) {
        if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts);
        return copyDir(src, dest, opts);
      }
      function mkDirAndCopy(srcMode, src, dest, opts) {
        fs.mkdirSync(dest);
        copyDir(src, dest, opts);
        return setDestMode(dest, srcMode);
      }
      function copyDir(src, dest, opts) {
        fs.readdirSync(src).forEach((item) =>
          copyDirItem(item, src, dest, opts),
        );
      }
      function copyDirItem(item, src, dest, opts) {
        const srcItem = path.join(src, item);
        const destItem = path.join(dest, item);
        if (opts.filter && !opts.filter(srcItem, destItem)) return;
        const { destStat } = stat.checkPathsSync(
          srcItem,
          destItem,
          "copy",
          opts,
        );
        return getStats(destStat, srcItem, destItem, opts);
      }
      function onLink(destStat, src, dest, opts) {
        let resolvedSrc = fs.readlinkSync(src);
        if (opts.dereference) {
          resolvedSrc = path.resolve(process.cwd(), resolvedSrc);
        }
        if (!destStat) {
          return fs.symlinkSync(resolvedSrc, dest);
        } else {
          let resolvedDest;
          try {
            resolvedDest = fs.readlinkSync(dest);
          } catch (err) {
            if (err.code === "EINVAL" || err.code === "UNKNOWN")
              return fs.symlinkSync(resolvedSrc, dest);
            throw err;
          }
          if (opts.dereference) {
            resolvedDest = path.resolve(process.cwd(), resolvedDest);
          }
          if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
            throw new Error(
              `Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`,
            );
          }
          if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
            throw new Error(
              `Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`,
            );
          }
          return copyLink(resolvedSrc, dest);
        }
      }
      function copyLink(resolvedSrc, dest) {
        fs.unlinkSync(dest);
        return fs.symlinkSync(resolvedSrc, dest);
      }
      module1.exports = copySync;
    },
    770: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const fs = __nccwpck_require__(845);
      const path = __nccwpck_require__(17);
      const { mkdirs } = __nccwpck_require__(516);
      const { pathExists } = __nccwpck_require__(667);
      const { utimesMillis } = __nccwpck_require__(227);
      const stat = __nccwpck_require__(826);
      async function copy(src, dest, opts = {}) {
        if (typeof opts === "function") {
          opts = { filter: opts };
        }
        opts.clobber = "clobber" in opts ? !!opts.clobber : true;
        opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
        if (opts.preserveTimestamps && process.arch === "ia32") {
          process.emitWarning(
            "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n" +
              "	see https://github.com/jprichardson/node-fs-extra/issues/269",
            "Warning",
            "fs-extra-WARN0001",
          );
        }
        const { srcStat, destStat } = await stat.checkPaths(
          src,
          dest,
          "copy",
          opts,
        );
        await stat.checkParentPaths(src, srcStat, dest, "copy");
        const include = await runFilter(src, dest, opts);
        if (!include) return;
        const destParent = path.dirname(dest);
        const dirExists = await pathExists(destParent);
        if (!dirExists) {
          await mkdirs(destParent);
        }
        await getStatsAndPerformCopy(destStat, src, dest, opts);
      }
      async function runFilter(src, dest, opts) {
        if (!opts.filter) return true;
        return opts.filter(src, dest);
      }
      async function getStatsAndPerformCopy(destStat, src, dest, opts) {
        const statFn = opts.dereference ? fs.stat : fs.lstat;
        const srcStat = await statFn(src);
        if (srcStat.isDirectory())
          return onDir(srcStat, destStat, src, dest, opts);
        if (
          srcStat.isFile() ||
          srcStat.isCharacterDevice() ||
          srcStat.isBlockDevice()
        )
          return onFile(srcStat, destStat, src, dest, opts);
        if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
        if (srcStat.isSocket())
          throw new Error(`Cannot copy a socket file: ${src}`);
        if (srcStat.isFIFO())
          throw new Error(`Cannot copy a FIFO pipe: ${src}`);
        throw new Error(`Unknown file: ${src}`);
      }
      async function onFile(srcStat, destStat, src, dest, opts) {
        if (!destStat) return copyFile(srcStat, src, dest, opts);
        if (opts.overwrite) {
          await fs.unlink(dest);
          return copyFile(srcStat, src, dest, opts);
        }
        if (opts.errorOnExist) {
          throw new Error(`'${dest}' already exists`);
        }
      }
      async function copyFile(srcStat, src, dest, opts) {
        await fs.copyFile(src, dest);
        if (opts.preserveTimestamps) {
          if (fileIsNotWritable(srcStat.mode)) {
            await makeFileWritable(dest, srcStat.mode);
          }
          const updatedSrcStat = await fs.stat(src);
          await utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
        }
        return fs.chmod(dest, srcStat.mode);
      }
      function fileIsNotWritable(srcMode) {
        return (srcMode & 128) === 0;
      }
      function makeFileWritable(dest, srcMode) {
        return fs.chmod(dest, srcMode | 128);
      }
      async function onDir(srcStat, destStat, src, dest, opts) {
        if (!destStat) {
          await fs.mkdir(dest);
        }
        const items = await fs.readdir(src);
        await Promise.all(
          items.map(async (item) => {
            const srcItem = path.join(src, item);
            const destItem = path.join(dest, item);
            const include = await runFilter(srcItem, destItem, opts);
            if (!include) return;
            const { destStat } = await stat.checkPaths(
              srcItem,
              destItem,
              "copy",
              opts,
            );
            return getStatsAndPerformCopy(destStat, srcItem, destItem, opts);
          }),
        );
        if (!destStat) {
          await fs.chmod(dest, srcStat.mode);
        }
      }
      async function onLink(destStat, src, dest, opts) {
        let resolvedSrc = await fs.readlink(src);
        if (opts.dereference) {
          resolvedSrc = path.resolve(process.cwd(), resolvedSrc);
        }
        if (!destStat) {
          return fs.symlink(resolvedSrc, dest);
        }
        let resolvedDest = null;
        try {
          resolvedDest = await fs.readlink(dest);
        } catch (e) {
          if (e.code === "EINVAL" || e.code === "UNKNOWN")
            return fs.symlink(resolvedSrc, dest);
          throw e;
        }
        if (opts.dereference) {
          resolvedDest = path.resolve(process.cwd(), resolvedDest);
        }
        if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
          throw new Error(
            `Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`,
          );
        }
        if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
          throw new Error(
            `Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`,
          );
        }
        await fs.unlink(dest);
        return fs.symlink(resolvedSrc, dest);
      }
      module1.exports = copy;
    },
    852: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const u = __nccwpck_require__(59).fromPromise;
      module1.exports = {
        copy: u(__nccwpck_require__(770)),
        copySync: __nccwpck_require__(524),
      };
    },
    783: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const u = __nccwpck_require__(59).fromPromise;
      const fs = __nccwpck_require__(845);
      const path = __nccwpck_require__(17);
      const mkdir = __nccwpck_require__(516);
      const remove = __nccwpck_require__(58);
      const emptyDir = u(async function emptyDir(dir) {
        let items;
        try {
          items = await fs.readdir(dir);
        } catch {
          return mkdir.mkdirs(dir);
        }
        return Promise.all(
          items.map((item) => remove.remove(path.join(dir, item))),
        );
      });
      function emptyDirSync(dir) {
        let items;
        try {
          items = fs.readdirSync(dir);
        } catch {
          return mkdir.mkdirsSync(dir);
        }
        items.forEach((item) => {
          item = path.join(dir, item);
          remove.removeSync(item);
        });
      }
      module1.exports = {
        emptyDirSync,
        emptydirSync: emptyDirSync,
        emptyDir,
        emptydir: emptyDir,
      };
    },
    530: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const u = __nccwpck_require__(59).fromPromise;
      const path = __nccwpck_require__(17);
      const fs = __nccwpck_require__(845);
      const mkdir = __nccwpck_require__(516);
      async function createFile(file) {
        let stats;
        try {
          stats = await fs.stat(file);
        } catch {}
        if (stats && stats.isFile()) return;
        const dir = path.dirname(file);
        let dirStats = null;
        try {
          dirStats = await fs.stat(dir);
        } catch (err) {
          if (err.code === "ENOENT") {
            await mkdir.mkdirs(dir);
            await fs.writeFile(file, "");
            return;
          } else {
            throw err;
          }
        }
        if (dirStats.isDirectory()) {
          await fs.writeFile(file, "");
        } else {
          await fs.readdir(dir);
        }
      }
      function createFileSync(file) {
        let stats;
        try {
          stats = fs.statSync(file);
        } catch {}
        if (stats && stats.isFile()) return;
        const dir = path.dirname(file);
        try {
          if (!fs.statSync(dir).isDirectory()) {
            fs.readdirSync(dir);
          }
        } catch (err) {
          if (err && err.code === "ENOENT") mkdir.mkdirsSync(dir);
          else throw err;
        }
        fs.writeFileSync(file, "");
      }
      module1.exports = { createFile: u(createFile), createFileSync };
    },
    960: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const { createFile, createFileSync } = __nccwpck_require__(530);
      const { createLink, createLinkSync } = __nccwpck_require__(404);
      const { createSymlink, createSymlinkSync } = __nccwpck_require__(425);
      module1.exports = {
        createFile,
        createFileSync,
        ensureFile: createFile,
        ensureFileSync: createFileSync,
        createLink,
        createLinkSync,
        ensureLink: createLink,
        ensureLinkSync: createLinkSync,
        createSymlink,
        createSymlinkSync,
        ensureSymlink: createSymlink,
        ensureSymlinkSync: createSymlinkSync,
      };
    },
    404: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const u = __nccwpck_require__(59).fromPromise;
      const path = __nccwpck_require__(17);
      const fs = __nccwpck_require__(845);
      const mkdir = __nccwpck_require__(516);
      const { pathExists } = __nccwpck_require__(667);
      const { areIdentical } = __nccwpck_require__(826);
      async function createLink(srcpath, dstpath) {
        let dstStat;
        try {
          dstStat = await fs.lstat(dstpath);
        } catch {}
        let srcStat;
        try {
          srcStat = await fs.lstat(srcpath);
        } catch (err) {
          err.message = err.message.replace("lstat", "ensureLink");
          throw err;
        }
        if (dstStat && areIdentical(srcStat, dstStat)) return;
        const dir = path.dirname(dstpath);
        const dirExists = await pathExists(dir);
        if (!dirExists) {
          await mkdir.mkdirs(dir);
        }
        await fs.link(srcpath, dstpath);
      }
      function createLinkSync(srcpath, dstpath) {
        let dstStat;
        try {
          dstStat = fs.lstatSync(dstpath);
        } catch {}
        try {
          const srcStat = fs.lstatSync(srcpath);
          if (dstStat && areIdentical(srcStat, dstStat)) return;
        } catch (err) {
          err.message = err.message.replace("lstat", "ensureLink");
          throw err;
        }
        const dir = path.dirname(dstpath);
        const dirExists = fs.existsSync(dir);
        if (dirExists) return fs.linkSync(srcpath, dstpath);
        mkdir.mkdirsSync(dir);
        return fs.linkSync(srcpath, dstpath);
      }
      module1.exports = { createLink: u(createLink), createLinkSync };
    },
    687: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const path = __nccwpck_require__(17);
      const fs = __nccwpck_require__(845);
      const { pathExists } = __nccwpck_require__(667);
      const u = __nccwpck_require__(59).fromPromise;
      async function symlinkPaths(srcpath, dstpath) {
        if (path.isAbsolute(srcpath)) {
          try {
            await fs.lstat(srcpath);
          } catch (err) {
            err.message = err.message.replace("lstat", "ensureSymlink");
            throw err;
          }
          return { toCwd: srcpath, toDst: srcpath };
        }
        const dstdir = path.dirname(dstpath);
        const relativeToDst = path.join(dstdir, srcpath);
        const exists = await pathExists(relativeToDst);
        if (exists) {
          return { toCwd: relativeToDst, toDst: srcpath };
        }
        try {
          await fs.lstat(srcpath);
        } catch (err) {
          err.message = err.message.replace("lstat", "ensureSymlink");
          throw err;
        }
        return { toCwd: srcpath, toDst: path.relative(dstdir, srcpath) };
      }
      function symlinkPathsSync(srcpath, dstpath) {
        if (path.isAbsolute(srcpath)) {
          const exists = fs.existsSync(srcpath);
          if (!exists) throw new Error("absolute srcpath does not exist");
          return { toCwd: srcpath, toDst: srcpath };
        }
        const dstdir = path.dirname(dstpath);
        const relativeToDst = path.join(dstdir, srcpath);
        const exists = fs.existsSync(relativeToDst);
        if (exists) {
          return { toCwd: relativeToDst, toDst: srcpath };
        }
        const srcExists = fs.existsSync(srcpath);
        if (!srcExists) throw new Error("relative srcpath does not exist");
        return { toCwd: srcpath, toDst: path.relative(dstdir, srcpath) };
      }
      module1.exports = { symlinkPaths: u(symlinkPaths), symlinkPathsSync };
    },
    725: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const fs = __nccwpck_require__(845);
      const u = __nccwpck_require__(59).fromPromise;
      async function symlinkType(srcpath, type) {
        if (type) return type;
        let stats;
        try {
          stats = await fs.lstat(srcpath);
        } catch {
          return "file";
        }
        return stats && stats.isDirectory() ? "dir" : "file";
      }
      function symlinkTypeSync(srcpath, type) {
        if (type) return type;
        let stats;
        try {
          stats = fs.lstatSync(srcpath);
        } catch {
          return "file";
        }
        return stats && stats.isDirectory() ? "dir" : "file";
      }
      module1.exports = { symlinkType: u(symlinkType), symlinkTypeSync };
    },
    425: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const u = __nccwpck_require__(59).fromPromise;
      const path = __nccwpck_require__(17);
      const fs = __nccwpck_require__(845);
      const { mkdirs, mkdirsSync } = __nccwpck_require__(516);
      const { symlinkPaths, symlinkPathsSync } = __nccwpck_require__(687);
      const { symlinkType, symlinkTypeSync } = __nccwpck_require__(725);
      const { pathExists } = __nccwpck_require__(667);
      const { areIdentical } = __nccwpck_require__(826);
      async function createSymlink(srcpath, dstpath, type) {
        let stats;
        try {
          stats = await fs.lstat(dstpath);
        } catch {}
        if (stats && stats.isSymbolicLink()) {
          const [srcStat, dstStat] = await Promise.all([
            fs.stat(srcpath),
            fs.stat(dstpath),
          ]);
          if (areIdentical(srcStat, dstStat)) return;
        }
        const relative = await symlinkPaths(srcpath, dstpath);
        srcpath = relative.toDst;
        const toType = await symlinkType(relative.toCwd, type);
        const dir = path.dirname(dstpath);
        if (!(await pathExists(dir))) {
          await mkdirs(dir);
        }
        return fs.symlink(srcpath, dstpath, toType);
      }
      function createSymlinkSync(srcpath, dstpath, type) {
        let stats;
        try {
          stats = fs.lstatSync(dstpath);
        } catch {}
        if (stats && stats.isSymbolicLink()) {
          const srcStat = fs.statSync(srcpath);
          const dstStat = fs.statSync(dstpath);
          if (areIdentical(srcStat, dstStat)) return;
        }
        const relative = symlinkPathsSync(srcpath, dstpath);
        srcpath = relative.toDst;
        type = symlinkTypeSync(relative.toCwd, type);
        const dir = path.dirname(dstpath);
        const exists = fs.existsSync(dir);
        if (exists) return fs.symlinkSync(srcpath, dstpath, type);
        mkdirsSync(dir);
        return fs.symlinkSync(srcpath, dstpath, type);
      }
      module1.exports = { createSymlink: u(createSymlink), createSymlinkSync };
    },
    845: (__unused_webpack_module, exports, __nccwpck_require__) => {
      "use strict";
      const u = __nccwpck_require__(59).fromCallback;
      const fs = __nccwpck_require__(804);
      const api = [
        "access",
        "appendFile",
        "chmod",
        "chown",
        "close",
        "copyFile",
        "fchmod",
        "fchown",
        "fdatasync",
        "fstat",
        "fsync",
        "ftruncate",
        "futimes",
        "lchmod",
        "lchown",
        "link",
        "lstat",
        "mkdir",
        "mkdtemp",
        "open",
        "opendir",
        "readdir",
        "readFile",
        "readlink",
        "realpath",
        "rename",
        "rm",
        "rmdir",
        "stat",
        "symlink",
        "truncate",
        "unlink",
        "utimes",
        "writeFile",
      ].filter((key) => {
        return typeof fs[key] === "function";
      });
      Object.assign(exports, fs);
      api.forEach((method) => {
        exports[method] = u(fs[method]);
      });
      exports.exists = function (filename, callback) {
        if (typeof callback === "function") {
          return fs.exists(filename, callback);
        }
        return new Promise((resolve) => {
          return fs.exists(filename, resolve);
        });
      };
      exports.read = function (fd, buffer, offset, length, position, callback) {
        if (typeof callback === "function") {
          return fs.read(fd, buffer, offset, length, position, callback);
        }
        return new Promise((resolve, reject) => {
          fs.read(
            fd,
            buffer,
            offset,
            length,
            position,
            (err, bytesRead, buffer) => {
              if (err) return reject(err);
              resolve({ bytesRead, buffer });
            },
          );
        });
      };
      exports.write = function (fd, buffer, ...args) {
        if (typeof args[args.length - 1] === "function") {
          return fs.write(fd, buffer, ...args);
        }
        return new Promise((resolve, reject) => {
          fs.write(fd, buffer, ...args, (err, bytesWritten, buffer) => {
            if (err) return reject(err);
            resolve({ bytesWritten, buffer });
          });
        });
      };
      exports.readv = function (fd, buffers, ...args) {
        if (typeof args[args.length - 1] === "function") {
          return fs.readv(fd, buffers, ...args);
        }
        return new Promise((resolve, reject) => {
          fs.readv(fd, buffers, ...args, (err, bytesRead, buffers) => {
            if (err) return reject(err);
            resolve({ bytesRead, buffers });
          });
        });
      };
      exports.writev = function (fd, buffers, ...args) {
        if (typeof args[args.length - 1] === "function") {
          return fs.writev(fd, buffers, ...args);
        }
        return new Promise((resolve, reject) => {
          fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers) => {
            if (err) return reject(err);
            resolve({ bytesWritten, buffers });
          });
        });
      };
      if (typeof fs.realpath.native === "function") {
        exports.realpath.native = u(fs.realpath.native);
      } else {
        process.emitWarning(
          "fs.realpath.native is not a function. Is fs being monkey-patched?",
          "Warning",
          "fs-extra-WARN0003",
        );
      }
    },
    175: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      module1.exports = {
        ...__nccwpck_require__(845),
        ...__nccwpck_require__(852),
        ...__nccwpck_require__(783),
        ...__nccwpck_require__(960),
        ...__nccwpck_require__(540),
        ...__nccwpck_require__(516),
        ...__nccwpck_require__(135),
        ...__nccwpck_require__(987),
        ...__nccwpck_require__(667),
        ...__nccwpck_require__(58),
      };
    },
    540: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const u = __nccwpck_require__(59).fromPromise;
      const jsonFile = __nccwpck_require__(869);
      jsonFile.outputJson = u(__nccwpck_require__(201));
      jsonFile.outputJsonSync = __nccwpck_require__(709);
      jsonFile.outputJSON = jsonFile.outputJson;
      jsonFile.outputJSONSync = jsonFile.outputJsonSync;
      jsonFile.writeJSON = jsonFile.writeJson;
      jsonFile.writeJSONSync = jsonFile.writeJsonSync;
      jsonFile.readJSON = jsonFile.readJson;
      jsonFile.readJSONSync = jsonFile.readJsonSync;
      module1.exports = jsonFile;
    },
    869: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const jsonFile = __nccwpck_require__(449);
      module1.exports = {
        readJson: jsonFile.readFile,
        readJsonSync: jsonFile.readFileSync,
        writeJson: jsonFile.writeFile,
        writeJsonSync: jsonFile.writeFileSync,
      };
    },
    709: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const { stringify } = __nccwpck_require__(213);
      const { outputFileSync } = __nccwpck_require__(987);
      function outputJsonSync(file, data, options) {
        const str = stringify(data, options);
        outputFileSync(file, str, options);
      }
      module1.exports = outputJsonSync;
    },
    201: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const { stringify } = __nccwpck_require__(213);
      const { outputFile } = __nccwpck_require__(987);
      async function outputJson(file, data, options = {}) {
        const str = stringify(data, options);
        await outputFile(file, str, options);
      }
      module1.exports = outputJson;
    },
    516: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const u = __nccwpck_require__(59).fromPromise;
      const { makeDir: _makeDir, makeDirSync } = __nccwpck_require__(368);
      const makeDir = u(_makeDir);
      module1.exports = {
        mkdirs: makeDir,
        mkdirsSync: makeDirSync,
        mkdirp: makeDir,
        mkdirpSync: makeDirSync,
        ensureDir: makeDir,
        ensureDirSync: makeDirSync,
      };
    },
    368: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const fs = __nccwpck_require__(845);
      const { checkPath } = __nccwpck_require__(676);
      const getMode = (options) => {
        const defaults = { mode: 511 };
        if (typeof options === "number") return options;
        return { ...defaults, ...options }.mode;
      };
      module1.exports.makeDir = async (dir, options) => {
        checkPath(dir);
        return fs.mkdir(dir, { mode: getMode(options), recursive: true });
      };
      module1.exports.makeDirSync = (dir, options) => {
        checkPath(dir);
        return fs.mkdirSync(dir, { mode: getMode(options), recursive: true });
      };
    },
    676: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const path = __nccwpck_require__(17);
      module1.exports.checkPath = function checkPath(pth) {
        if (process.platform === "win32") {
          const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(
            pth.replace(path.parse(pth).root, ""),
          );
          if (pathHasInvalidWinCharacters) {
            const error = new Error(`Path contains invalid characters: ${pth}`);
            error.code = "EINVAL";
            throw error;
          }
        }
      };
    },
    135: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const u = __nccwpck_require__(59).fromPromise;
      module1.exports = {
        move: u(__nccwpck_require__(497)),
        moveSync: __nccwpck_require__(801),
      };
    },
    801: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const fs = __nccwpck_require__(804);
      const path = __nccwpck_require__(17);
      const copySync = __nccwpck_require__(852).copySync;
      const removeSync = __nccwpck_require__(58).removeSync;
      const mkdirpSync = __nccwpck_require__(516).mkdirpSync;
      const stat = __nccwpck_require__(826);
      function moveSync(src, dest, opts) {
        opts = opts || {};
        const overwrite = opts.overwrite || opts.clobber || false;
        const { srcStat, isChangingCase = false } = stat.checkPathsSync(
          src,
          dest,
          "move",
          opts,
        );
        stat.checkParentPathsSync(src, srcStat, dest, "move");
        if (!isParentRoot(dest)) mkdirpSync(path.dirname(dest));
        return doRename(src, dest, overwrite, isChangingCase);
      }
      function isParentRoot(dest) {
        const parent = path.dirname(dest);
        const parsedPath = path.parse(parent);
        return parsedPath.root === parent;
      }
      function doRename(src, dest, overwrite, isChangingCase) {
        if (isChangingCase) return rename(src, dest, overwrite);
        if (overwrite) {
          removeSync(dest);
          return rename(src, dest, overwrite);
        }
        if (fs.existsSync(dest)) throw new Error("dest already exists.");
        return rename(src, dest, overwrite);
      }
      function rename(src, dest, overwrite) {
        try {
          fs.renameSync(src, dest);
        } catch (err) {
          if (err.code !== "EXDEV") throw err;
          return moveAcrossDevice(src, dest, overwrite);
        }
      }
      function moveAcrossDevice(src, dest, overwrite) {
        const opts = {
          overwrite,
          errorOnExist: true,
          preserveTimestamps: true,
        };
        copySync(src, dest, opts);
        return removeSync(src);
      }
      module1.exports = moveSync;
    },
    497: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const fs = __nccwpck_require__(845);
      const path = __nccwpck_require__(17);
      const { copy } = __nccwpck_require__(852);
      const { remove } = __nccwpck_require__(58);
      const { mkdirp } = __nccwpck_require__(516);
      const { pathExists } = __nccwpck_require__(667);
      const stat = __nccwpck_require__(826);
      async function move(src, dest, opts = {}) {
        const overwrite = opts.overwrite || opts.clobber || false;
        const { srcStat, isChangingCase = false } = await stat.checkPaths(
          src,
          dest,
          "move",
          opts,
        );
        await stat.checkParentPaths(src, srcStat, dest, "move");
        const destParent = path.dirname(dest);
        const parsedParentPath = path.parse(destParent);
        if (parsedParentPath.root !== destParent) {
          await mkdirp(destParent);
        }
        return doRename(src, dest, overwrite, isChangingCase);
      }
      async function doRename(src, dest, overwrite, isChangingCase) {
        if (!isChangingCase) {
          if (overwrite) {
            await remove(dest);
          } else if (await pathExists(dest)) {
            throw new Error("dest already exists.");
          }
        }
        try {
          await fs.rename(src, dest);
        } catch (err) {
          if (err.code !== "EXDEV") {
            throw err;
          }
          await moveAcrossDevice(src, dest, overwrite);
        }
      }
      async function moveAcrossDevice(src, dest, overwrite) {
        const opts = {
          overwrite,
          errorOnExist: true,
          preserveTimestamps: true,
        };
        await copy(src, dest, opts);
        return remove(src);
      }
      module1.exports = move;
    },
    987: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const u = __nccwpck_require__(59).fromPromise;
      const fs = __nccwpck_require__(845);
      const path = __nccwpck_require__(17);
      const mkdir = __nccwpck_require__(516);
      const pathExists = __nccwpck_require__(667).pathExists;
      async function outputFile(file, data, encoding = "utf-8") {
        const dir = path.dirname(file);
        if (!(await pathExists(dir))) {
          await mkdir.mkdirs(dir);
        }
        return fs.writeFile(file, data, encoding);
      }
      function outputFileSync(file, ...args) {
        const dir = path.dirname(file);
        if (!fs.existsSync(dir)) {
          mkdir.mkdirsSync(dir);
        }
        fs.writeFileSync(file, ...args);
      }
      module1.exports = { outputFile: u(outputFile), outputFileSync };
    },
    667: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const u = __nccwpck_require__(59).fromPromise;
      const fs = __nccwpck_require__(845);
      function pathExists(path) {
        return fs
          .access(path)
          .then(() => true)
          .catch(() => false);
      }
      module1.exports = {
        pathExists: u(pathExists),
        pathExistsSync: fs.existsSync,
      };
    },
    58: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const fs = __nccwpck_require__(804);
      const u = __nccwpck_require__(59).fromCallback;
      function remove(path, callback) {
        fs.rm(path, { recursive: true, force: true }, callback);
      }
      function removeSync(path) {
        fs.rmSync(path, { recursive: true, force: true });
      }
      module1.exports = { remove: u(remove), removeSync };
    },
    826: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const fs = __nccwpck_require__(845);
      const path = __nccwpck_require__(17);
      const u = __nccwpck_require__(59).fromPromise;
      function getStats(src, dest, opts) {
        const statFunc = opts.dereference
          ? (file) => fs.stat(file, { bigint: true })
          : (file) => fs.lstat(file, { bigint: true });
        return Promise.all([
          statFunc(src),
          statFunc(dest).catch((err) => {
            if (err.code === "ENOENT") return null;
            throw err;
          }),
        ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
      }
      function getStatsSync(src, dest, opts) {
        let destStat;
        const statFunc = opts.dereference
          ? (file) => fs.statSync(file, { bigint: true })
          : (file) => fs.lstatSync(file, { bigint: true });
        const srcStat = statFunc(src);
        try {
          destStat = statFunc(dest);
        } catch (err) {
          if (err.code === "ENOENT") return { srcStat, destStat: null };
          throw err;
        }
        return { srcStat, destStat };
      }
      async function checkPaths(src, dest, funcName, opts) {
        const { srcStat, destStat } = await getStats(src, dest, opts);
        if (destStat) {
          if (areIdentical(srcStat, destStat)) {
            const srcBaseName = path.basename(src);
            const destBaseName = path.basename(dest);
            if (
              funcName === "move" &&
              srcBaseName !== destBaseName &&
              srcBaseName.toLowerCase() === destBaseName.toLowerCase()
            ) {
              return { srcStat, destStat, isChangingCase: true };
            }
            throw new Error("Source and destination must not be the same.");
          }
          if (srcStat.isDirectory() && !destStat.isDirectory()) {
            throw new Error(
              `Cannot overwrite non-directory '${dest}' with directory '${src}'.`,
            );
          }
          if (!srcStat.isDirectory() && destStat.isDirectory()) {
            throw new Error(
              `Cannot overwrite directory '${dest}' with non-directory '${src}'.`,
            );
          }
        }
        if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
          throw new Error(errMsg(src, dest, funcName));
        }
        return { srcStat, destStat };
      }
      function checkPathsSync(src, dest, funcName, opts) {
        const { srcStat, destStat } = getStatsSync(src, dest, opts);
        if (destStat) {
          if (areIdentical(srcStat, destStat)) {
            const srcBaseName = path.basename(src);
            const destBaseName = path.basename(dest);
            if (
              funcName === "move" &&
              srcBaseName !== destBaseName &&
              srcBaseName.toLowerCase() === destBaseName.toLowerCase()
            ) {
              return { srcStat, destStat, isChangingCase: true };
            }
            throw new Error("Source and destination must not be the same.");
          }
          if (srcStat.isDirectory() && !destStat.isDirectory()) {
            throw new Error(
              `Cannot overwrite non-directory '${dest}' with directory '${src}'.`,
            );
          }
          if (!srcStat.isDirectory() && destStat.isDirectory()) {
            throw new Error(
              `Cannot overwrite directory '${dest}' with non-directory '${src}'.`,
            );
          }
        }
        if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
          throw new Error(errMsg(src, dest, funcName));
        }
        return { srcStat, destStat };
      }
      async function checkParentPaths(src, srcStat, dest, funcName) {
        const srcParent = path.resolve(path.dirname(src));
        const destParent = path.resolve(path.dirname(dest));
        if (
          destParent === srcParent ||
          destParent === path.parse(destParent).root
        )
          return;
        let destStat;
        try {
          destStat = await fs.stat(destParent, { bigint: true });
        } catch (err) {
          if (err.code === "ENOENT") return;
          throw err;
        }
        if (areIdentical(srcStat, destStat)) {
          throw new Error(errMsg(src, dest, funcName));
        }
        return checkParentPaths(src, srcStat, destParent, funcName);
      }
      function checkParentPathsSync(src, srcStat, dest, funcName) {
        const srcParent = path.resolve(path.dirname(src));
        const destParent = path.resolve(path.dirname(dest));
        if (
          destParent === srcParent ||
          destParent === path.parse(destParent).root
        )
          return;
        let destStat;
        try {
          destStat = fs.statSync(destParent, { bigint: true });
        } catch (err) {
          if (err.code === "ENOENT") return;
          throw err;
        }
        if (areIdentical(srcStat, destStat)) {
          throw new Error(errMsg(src, dest, funcName));
        }
        return checkParentPathsSync(src, srcStat, destParent, funcName);
      }
      function areIdentical(srcStat, destStat) {
        return (
          destStat.ino &&
          destStat.dev &&
          destStat.ino === srcStat.ino &&
          destStat.dev === srcStat.dev
        );
      }
      function isSrcSubdir(src, dest) {
        const srcArr = path
          .resolve(src)
          .split(path.sep)
          .filter((i) => i);
        const destArr = path
          .resolve(dest)
          .split(path.sep)
          .filter((i) => i);
        return srcArr.every((cur, i) => destArr[i] === cur);
      }
      function errMsg(src, dest, funcName) {
        return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
      }
      module1.exports = {
        checkPaths: u(checkPaths),
        checkPathsSync,
        checkParentPaths: u(checkParentPaths),
        checkParentPathsSync,
        isSrcSubdir,
        areIdentical,
      };
    },
    227: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      "use strict";
      const fs = __nccwpck_require__(845);
      const u = __nccwpck_require__(59).fromPromise;
      async function utimesMillis(path, atime, mtime) {
        const fd = await fs.open(path, "r+");
        let closeErr = null;
        try {
          await fs.futimes(fd, atime, mtime);
        } finally {
          try {
            await fs.close(fd);
          } catch (e) {
            closeErr = e;
          }
        }
        if (closeErr) {
          throw closeErr;
        }
      }
      function utimesMillisSync(path, atime, mtime) {
        const fd = fs.openSync(path, "r+");
        fs.futimesSync(fd, atime, mtime);
        return fs.closeSync(fd);
      }
      module1.exports = { utimesMillis: u(utimesMillis), utimesMillisSync };
    },
    691: (module1) => {
      "use strict";
      module1.exports = clone;
      var getPrototypeOf =
        Object.getPrototypeOf ||
        function (obj) {
          return obj.__proto__;
        };
      function clone(obj) {
        if (obj === null || typeof obj !== "object") return obj;
        if (obj instanceof Object)
          var copy = { __proto__: getPrototypeOf(obj) };
        else var copy = Object.create(null);
        Object.getOwnPropertyNames(obj).forEach(function (key) {
          Object.defineProperty(
            copy,
            key,
            Object.getOwnPropertyDescriptor(obj, key),
          );
        });
        return copy;
      }
    },
    804: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      var fs = __nccwpck_require__(147);
      var polyfills = __nccwpck_require__(567);
      var legacy = __nccwpck_require__(915);
      var clone = __nccwpck_require__(691);
      var util = __nccwpck_require__(837);
      var gracefulQueue;
      var previousSymbol;
      if (typeof Symbol === "function" && typeof Symbol.for === "function") {
        gracefulQueue = Symbol.for("graceful-fs.queue");
        previousSymbol = Symbol.for("graceful-fs.previous");
      } else {
        gracefulQueue = "___graceful-fs.queue";
        previousSymbol = "___graceful-fs.previous";
      }
      function noop() {}
      function publishQueue(context, queue) {
        Object.defineProperty(context, gracefulQueue, {
          get: function () {
            return queue;
          },
        });
      }
      var debug = noop;
      if (util.debuglog) debug = util.debuglog("gfs4");
      else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
        debug = function () {
          var m = util.format.apply(util, arguments);
          m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
          console.error(m);
        };
      if (!fs[gracefulQueue]) {
        var queue = global[gracefulQueue] || [];
        publishQueue(fs, queue);
        fs.close = (function (fs$close) {
          function close(fd, cb) {
            return fs$close.call(fs, fd, function (err) {
              if (!err) {
                resetQueue();
              }
              if (typeof cb === "function") cb.apply(this, arguments);
            });
          }
          Object.defineProperty(close, previousSymbol, { value: fs$close });
          return close;
        })(fs.close);
        fs.closeSync = (function (fs$closeSync) {
          function closeSync(fd) {
            fs$closeSync.apply(fs, arguments);
            resetQueue();
          }
          Object.defineProperty(closeSync, previousSymbol, {
            value: fs$closeSync,
          });
          return closeSync;
        })(fs.closeSync);
        if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
          process.on("exit", function () {
            debug(fs[gracefulQueue]);
            __nccwpck_require__(491).equal(fs[gracefulQueue].length, 0);
          });
        }
      }
      if (!global[gracefulQueue]) {
        publishQueue(global, fs[gracefulQueue]);
      }
      module1.exports = patch(clone(fs));
      if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
        module1.exports = patch(fs);
        fs.__patched = true;
      }
      function patch(fs) {
        polyfills(fs);
        fs.gracefulify = patch;
        fs.createReadStream = createReadStream;
        fs.createWriteStream = createWriteStream;
        var fs$readFile = fs.readFile;
        fs.readFile = readFile;
        function readFile(path, options, cb) {
          if (typeof options === "function") (cb = options), (options = null);
          return go$readFile(path, options, cb);
          function go$readFile(path, options, cb, startTime) {
            return fs$readFile(path, options, function (err) {
              if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
                enqueue([
                  go$readFile,
                  [path, options, cb],
                  err,
                  startTime || Date.now(),
                  Date.now(),
                ]);
              else {
                if (typeof cb === "function") cb.apply(this, arguments);
              }
            });
          }
        }
        var fs$writeFile = fs.writeFile;
        fs.writeFile = writeFile;
        function writeFile(path, data, options, cb) {
          if (typeof options === "function") (cb = options), (options = null);
          return go$writeFile(path, data, options, cb);
          function go$writeFile(path, data, options, cb, startTime) {
            return fs$writeFile(path, data, options, function (err) {
              if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
                enqueue([
                  go$writeFile,
                  [path, data, options, cb],
                  err,
                  startTime || Date.now(),
                  Date.now(),
                ]);
              else {
                if (typeof cb === "function") cb.apply(this, arguments);
              }
            });
          }
        }
        var fs$appendFile = fs.appendFile;
        if (fs$appendFile) fs.appendFile = appendFile;
        function appendFile(path, data, options, cb) {
          if (typeof options === "function") (cb = options), (options = null);
          return go$appendFile(path, data, options, cb);
          function go$appendFile(path, data, options, cb, startTime) {
            return fs$appendFile(path, data, options, function (err) {
              if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
                enqueue([
                  go$appendFile,
                  [path, data, options, cb],
                  err,
                  startTime || Date.now(),
                  Date.now(),
                ]);
              else {
                if (typeof cb === "function") cb.apply(this, arguments);
              }
            });
          }
        }
        var fs$copyFile = fs.copyFile;
        if (fs$copyFile) fs.copyFile = copyFile;
        function copyFile(src, dest, flags, cb) {
          if (typeof flags === "function") {
            cb = flags;
            flags = 0;
          }
          return go$copyFile(src, dest, flags, cb);
          function go$copyFile(src, dest, flags, cb, startTime) {
            return fs$copyFile(src, dest, flags, function (err) {
              if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
                enqueue([
                  go$copyFile,
                  [src, dest, flags, cb],
                  err,
                  startTime || Date.now(),
                  Date.now(),
                ]);
              else {
                if (typeof cb === "function") cb.apply(this, arguments);
              }
            });
          }
        }
        var fs$readdir = fs.readdir;
        fs.readdir = readdir;
        var noReaddirOptionVersions = /^v[0-5]\./;
        function readdir(path, options, cb) {
          if (typeof options === "function") (cb = options), (options = null);
          var go$readdir = noReaddirOptionVersions.test(process.version)
            ? function go$readdir(path, options, cb, startTime) {
                return fs$readdir(
                  path,
                  fs$readdirCallback(path, options, cb, startTime),
                );
              }
            : function go$readdir(path, options, cb, startTime) {
                return fs$readdir(
                  path,
                  options,
                  fs$readdirCallback(path, options, cb, startTime),
                );
              };
          return go$readdir(path, options, cb);
          function fs$readdirCallback(path, options, cb, startTime) {
            return function (err, files) {
              if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
                enqueue([
                  go$readdir,
                  [path, options, cb],
                  err,
                  startTime || Date.now(),
                  Date.now(),
                ]);
              else {
                if (files && files.sort) files.sort();
                if (typeof cb === "function") cb.call(this, err, files);
              }
            };
          }
        }
        if (process.version.substr(0, 4) === "v0.8") {
          var legStreams = legacy(fs);
          ReadStream = legStreams.ReadStream;
          WriteStream = legStreams.WriteStream;
        }
        var fs$ReadStream = fs.ReadStream;
        if (fs$ReadStream) {
          ReadStream.prototype = Object.create(fs$ReadStream.prototype);
          ReadStream.prototype.open = ReadStream$open;
        }
        var fs$WriteStream = fs.WriteStream;
        if (fs$WriteStream) {
          WriteStream.prototype = Object.create(fs$WriteStream.prototype);
          WriteStream.prototype.open = WriteStream$open;
        }
        Object.defineProperty(fs, "ReadStream", {
          get: function () {
            return ReadStream;
          },
          set: function (val) {
            ReadStream = val;
          },
          enumerable: true,
          configurable: true,
        });
        Object.defineProperty(fs, "WriteStream", {
          get: function () {
            return WriteStream;
          },
          set: function (val) {
            WriteStream = val;
          },
          enumerable: true,
          configurable: true,
        });
        var FileReadStream = ReadStream;
        Object.defineProperty(fs, "FileReadStream", {
          get: function () {
            return FileReadStream;
          },
          set: function (val) {
            FileReadStream = val;
          },
          enumerable: true,
          configurable: true,
        });
        var FileWriteStream = WriteStream;
        Object.defineProperty(fs, "FileWriteStream", {
          get: function () {
            return FileWriteStream;
          },
          set: function (val) {
            FileWriteStream = val;
          },
          enumerable: true,
          configurable: true,
        });
        function ReadStream(path, options) {
          if (this instanceof ReadStream)
            return fs$ReadStream.apply(this, arguments), this;
          else
            return ReadStream.apply(
              Object.create(ReadStream.prototype),
              arguments,
            );
        }
        function ReadStream$open() {
          var that = this;
          open(that.path, that.flags, that.mode, function (err, fd) {
            if (err) {
              if (that.autoClose) that.destroy();
              that.emit("error", err);
            } else {
              that.fd = fd;
              that.emit("open", fd);
              that.read();
            }
          });
        }
        function WriteStream(path, options) {
          if (this instanceof WriteStream)
            return fs$WriteStream.apply(this, arguments), this;
          else
            return WriteStream.apply(
              Object.create(WriteStream.prototype),
              arguments,
            );
        }
        function WriteStream$open() {
          var that = this;
          open(that.path, that.flags, that.mode, function (err, fd) {
            if (err) {
              that.destroy();
              that.emit("error", err);
            } else {
              that.fd = fd;
              that.emit("open", fd);
            }
          });
        }
        function createReadStream(path, options) {
          return new fs.ReadStream(path, options);
        }
        function createWriteStream(path, options) {
          return new fs.WriteStream(path, options);
        }
        var fs$open = fs.open;
        fs.open = open;
        function open(path, flags, mode, cb) {
          if (typeof mode === "function") (cb = mode), (mode = null);
          return go$open(path, flags, mode, cb);
          function go$open(path, flags, mode, cb, startTime) {
            return fs$open(path, flags, mode, function (err, fd) {
              if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
                enqueue([
                  go$open,
                  [path, flags, mode, cb],
                  err,
                  startTime || Date.now(),
                  Date.now(),
                ]);
              else {
                if (typeof cb === "function") cb.apply(this, arguments);
              }
            });
          }
        }
        return fs;
      }
      function enqueue(elem) {
        debug("ENQUEUE", elem[0].name, elem[1]);
        fs[gracefulQueue].push(elem);
        retry();
      }
      var retryTimer;
      function resetQueue() {
        var now = Date.now();
        for (var i = 0; i < fs[gracefulQueue].length; ++i) {
          if (fs[gracefulQueue][i].length > 2) {
            fs[gracefulQueue][i][3] = now;
            fs[gracefulQueue][i][4] = now;
          }
        }
        retry();
      }
      function retry() {
        clearTimeout(retryTimer);
        retryTimer = undefined;
        if (fs[gracefulQueue].length === 0) return;
        var elem = fs[gracefulQueue].shift();
        var fn = elem[0];
        var args = elem[1];
        var err = elem[2];
        var startTime = elem[3];
        var lastTime = elem[4];
        if (startTime === undefined) {
          debug("RETRY", fn.name, args);
          fn.apply(null, args);
        } else if (Date.now() - startTime >= 6e4) {
          debug("TIMEOUT", fn.name, args);
          var cb = args.pop();
          if (typeof cb === "function") cb.call(null, err);
        } else {
          var sinceAttempt = Date.now() - lastTime;
          var sinceStart = Math.max(lastTime - startTime, 1);
          var desiredDelay = Math.min(sinceStart * 1.2, 100);
          if (sinceAttempt >= desiredDelay) {
            debug("RETRY", fn.name, args);
            fn.apply(null, args.concat([startTime]));
          } else {
            fs[gracefulQueue].push(elem);
          }
        }
        if (retryTimer === undefined) {
          retryTimer = setTimeout(retry, 0);
        }
      }
    },
    915: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      var Stream = __nccwpck_require__(781).Stream;
      module1.exports = legacy;
      function legacy(fs) {
        return { ReadStream: ReadStream, WriteStream: WriteStream };
        function ReadStream(path, options) {
          if (!(this instanceof ReadStream))
            return new ReadStream(path, options);
          Stream.call(this);
          var self = this;
          this.path = path;
          this.fd = null;
          this.readable = true;
          this.paused = false;
          this.flags = "r";
          this.mode = 438;
          this.bufferSize = 64 * 1024;
          options = options || {};
          var keys = Object.keys(options);
          for (var index = 0, length = keys.length; index < length; index++) {
            var key = keys[index];
            this[key] = options[key];
          }
          if (this.encoding) this.setEncoding(this.encoding);
          if (this.start !== undefined) {
            if ("number" !== typeof this.start) {
              throw TypeError("start must be a Number");
            }
            if (this.end === undefined) {
              this.end = Infinity;
            } else if ("number" !== typeof this.end) {
              throw TypeError("end must be a Number");
            }
            if (this.start > this.end) {
              throw new Error("start must be <= end");
            }
            this.pos = this.start;
          }
          if (this.fd !== null) {
            process.nextTick(function () {
              self._read();
            });
            return;
          }
          fs.open(this.path, this.flags, this.mode, function (err, fd) {
            if (err) {
              self.emit("error", err);
              self.readable = false;
              return;
            }
            self.fd = fd;
            self.emit("open", fd);
            self._read();
          });
        }
        function WriteStream(path, options) {
          if (!(this instanceof WriteStream))
            return new WriteStream(path, options);
          Stream.call(this);
          this.path = path;
          this.fd = null;
          this.writable = true;
          this.flags = "w";
          this.encoding = "binary";
          this.mode = 438;
          this.bytesWritten = 0;
          options = options || {};
          var keys = Object.keys(options);
          for (var index = 0, length = keys.length; index < length; index++) {
            var key = keys[index];
            this[key] = options[key];
          }
          if (this.start !== undefined) {
            if ("number" !== typeof this.start) {
              throw TypeError("start must be a Number");
            }
            if (this.start < 0) {
              throw new Error("start must be >= zero");
            }
            this.pos = this.start;
          }
          this.busy = false;
          this._queue = [];
          if (this.fd === null) {
            this._open = fs.open;
            this._queue.push([
              this._open,
              this.path,
              this.flags,
              this.mode,
              undefined,
            ]);
            this.flush();
          }
        }
      }
    },
    567: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      var constants = __nccwpck_require__(57);
      var origCwd = process.cwd;
      var cwd = null;
      var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
      process.cwd = function () {
        if (!cwd) cwd = origCwd.call(process);
        return cwd;
      };
      try {
        process.cwd();
      } catch (er) {}
      if (typeof process.chdir === "function") {
        var chdir = process.chdir;
        process.chdir = function (d) {
          cwd = null;
          chdir.call(process, d);
        };
        if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
      }
      module1.exports = patch;
      function patch(fs) {
        if (
          constants.hasOwnProperty("O_SYMLINK") &&
          process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)
        ) {
          patchLchmod(fs);
        }
        if (!fs.lutimes) {
          patchLutimes(fs);
        }
        fs.chown = chownFix(fs.chown);
        fs.fchown = chownFix(fs.fchown);
        fs.lchown = chownFix(fs.lchown);
        fs.chmod = chmodFix(fs.chmod);
        fs.fchmod = chmodFix(fs.fchmod);
        fs.lchmod = chmodFix(fs.lchmod);
        fs.chownSync = chownFixSync(fs.chownSync);
        fs.fchownSync = chownFixSync(fs.fchownSync);
        fs.lchownSync = chownFixSync(fs.lchownSync);
        fs.chmodSync = chmodFixSync(fs.chmodSync);
        fs.fchmodSync = chmodFixSync(fs.fchmodSync);
        fs.lchmodSync = chmodFixSync(fs.lchmodSync);
        fs.stat = statFix(fs.stat);
        fs.fstat = statFix(fs.fstat);
        fs.lstat = statFix(fs.lstat);
        fs.statSync = statFixSync(fs.statSync);
        fs.fstatSync = statFixSync(fs.fstatSync);
        fs.lstatSync = statFixSync(fs.lstatSync);
        if (fs.chmod && !fs.lchmod) {
          fs.lchmod = function (path, mode, cb) {
            if (cb) process.nextTick(cb);
          };
          fs.lchmodSync = function () {};
        }
        if (fs.chown && !fs.lchown) {
          fs.lchown = function (path, uid, gid, cb) {
            if (cb) process.nextTick(cb);
          };
          fs.lchownSync = function () {};
        }
        if (platform === "win32") {
          fs.rename =
            typeof fs.rename !== "function"
              ? fs.rename
              : (function (fs$rename) {
                  function rename(from, to, cb) {
                    var start = Date.now();
                    var backoff = 0;
                    fs$rename(from, to, function CB(er) {
                      if (
                        er &&
                        (er.code === "EACCES" ||
                          er.code === "EPERM" ||
                          er.code === "EBUSY") &&
                        Date.now() - start < 6e4
                      ) {
                        setTimeout(function () {
                          fs.stat(to, function (stater, st) {
                            if (stater && stater.code === "ENOENT")
                              fs$rename(from, to, CB);
                            else cb(er);
                          });
                        }, backoff);
                        if (backoff < 100) backoff += 10;
                        return;
                      }
                      if (cb) cb(er);
                    });
                  }
                  if (Object.setPrototypeOf)
                    Object.setPrototypeOf(rename, fs$rename);
                  return rename;
                })(fs.rename);
        }
        fs.read =
          typeof fs.read !== "function"
            ? fs.read
            : (function (fs$read) {
                function read(fd, buffer, offset, length, position, callback_) {
                  var callback;
                  if (callback_ && typeof callback_ === "function") {
                    var eagCounter = 0;
                    callback = function (er, _, __) {
                      if (er && er.code === "EAGAIN" && eagCounter < 10) {
                        eagCounter++;
                        return fs$read.call(
                          fs,
                          fd,
                          buffer,
                          offset,
                          length,
                          position,
                          callback,
                        );
                      }
                      callback_.apply(this, arguments);
                    };
                  }
                  return fs$read.call(
                    fs,
                    fd,
                    buffer,
                    offset,
                    length,
                    position,
                    callback,
                  );
                }
                if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
                return read;
              })(fs.read);
        fs.readSync =
          typeof fs.readSync !== "function"
            ? fs.readSync
            : (function (fs$readSync) {
                return function (fd, buffer, offset, length, position) {
                  var eagCounter = 0;
                  while (true) {
                    try {
                      return fs$readSync.call(
                        fs,
                        fd,
                        buffer,
                        offset,
                        length,
                        position,
                      );
                    } catch (er) {
                      if (er.code === "EAGAIN" && eagCounter < 10) {
                        eagCounter++;
                        continue;
                      }
                      throw er;
                    }
                  }
                };
              })(fs.readSync);
        function patchLchmod(fs) {
          fs.lchmod = function (path, mode, callback) {
            fs.open(
              path,
              constants.O_WRONLY | constants.O_SYMLINK,
              mode,
              function (err, fd) {
                if (err) {
                  if (callback) callback(err);
                  return;
                }
                fs.fchmod(fd, mode, function (err) {
                  fs.close(fd, function (err2) {
                    if (callback) callback(err || err2);
                  });
                });
              },
            );
          };
          fs.lchmodSync = function (path, mode) {
            var fd = fs.openSync(
              path,
              constants.O_WRONLY | constants.O_SYMLINK,
              mode,
            );
            var threw = true;
            var ret;
            try {
              ret = fs.fchmodSync(fd, mode);
              threw = false;
            } finally {
              if (threw) {
                try {
                  fs.closeSync(fd);
                } catch (er) {}
              } else {
                fs.closeSync(fd);
              }
            }
            return ret;
          };
        }
        function patchLutimes(fs) {
          if (constants.hasOwnProperty("O_SYMLINK") && fs.futimes) {
            fs.lutimes = function (path, at, mt, cb) {
              fs.open(path, constants.O_SYMLINK, function (er, fd) {
                if (er) {
                  if (cb) cb(er);
                  return;
                }
                fs.futimes(fd, at, mt, function (er) {
                  fs.close(fd, function (er2) {
                    if (cb) cb(er || er2);
                  });
                });
              });
            };
            fs.lutimesSync = function (path, at, mt) {
              var fd = fs.openSync(path, constants.O_SYMLINK);
              var ret;
              var threw = true;
              try {
                ret = fs.futimesSync(fd, at, mt);
                threw = false;
              } finally {
                if (threw) {
                  try {
                    fs.closeSync(fd);
                  } catch (er) {}
                } else {
                  fs.closeSync(fd);
                }
              }
              return ret;
            };
          } else if (fs.futimes) {
            fs.lutimes = function (_a, _b, _c, cb) {
              if (cb) process.nextTick(cb);
            };
            fs.lutimesSync = function () {};
          }
        }
        function chmodFix(orig) {
          if (!orig) return orig;
          return function (target, mode, cb) {
            return orig.call(fs, target, mode, function (er) {
              if (chownErOk(er)) er = null;
              if (cb) cb.apply(this, arguments);
            });
          };
        }
        function chmodFixSync(orig) {
          if (!orig) return orig;
          return function (target, mode) {
            try {
              return orig.call(fs, target, mode);
            } catch (er) {
              if (!chownErOk(er)) throw er;
            }
          };
        }
        function chownFix(orig) {
          if (!orig) return orig;
          return function (target, uid, gid, cb) {
            return orig.call(fs, target, uid, gid, function (er) {
              if (chownErOk(er)) er = null;
              if (cb) cb.apply(this, arguments);
            });
          };
        }
        function chownFixSync(orig) {
          if (!orig) return orig;
          return function (target, uid, gid) {
            try {
              return orig.call(fs, target, uid, gid);
            } catch (er) {
              if (!chownErOk(er)) throw er;
            }
          };
        }
        function statFix(orig) {
          if (!orig) return orig;
          return function (target, options, cb) {
            if (typeof options === "function") {
              cb = options;
              options = null;
            }
            function callback(er, stats) {
              if (stats) {
                if (stats.uid < 0) stats.uid += 4294967296;
                if (stats.gid < 0) stats.gid += 4294967296;
              }
              if (cb) cb.apply(this, arguments);
            }
            return options
              ? orig.call(fs, target, options, callback)
              : orig.call(fs, target, callback);
          };
        }
        function statFixSync(orig) {
          if (!orig) return orig;
          return function (target, options) {
            var stats = options
              ? orig.call(fs, target, options)
              : orig.call(fs, target);
            if (stats) {
              if (stats.uid < 0) stats.uid += 4294967296;
              if (stats.gid < 0) stats.gid += 4294967296;
            }
            return stats;
          };
        }
        function chownErOk(er) {
          if (!er) return true;
          if (er.code === "ENOSYS") return true;
          var nonroot = !process.getuid || process.getuid() !== 0;
          if (nonroot) {
            if (er.code === "EINVAL" || er.code === "EPERM") return true;
          }
          return false;
        }
      }
    },
    449: (module1, __unused_webpack_exports, __nccwpck_require__) => {
      let _fs;
      try {
        _fs = __nccwpck_require__(804);
      } catch (_) {
        _fs = __nccwpck_require__(147);
      }
      const universalify = __nccwpck_require__(59);
      const { stringify, stripBom } = __nccwpck_require__(213);
      async function _readFile(file, options = {}) {
        if (typeof options === "string") {
          options = { encoding: options };
        }
        const fs = options.fs || _fs;
        const shouldThrow = "throws" in options ? options.throws : true;
        let data = await universalify.fromCallback(fs.readFile)(file, options);
        data = stripBom(data);
        let obj;
        try {
          obj = JSON.parse(data, options ? options.reviver : null);
        } catch (err) {
          if (shouldThrow) {
            err.message = `${file}: ${err.message}`;
            throw err;
          } else {
            return null;
          }
        }
        return obj;
      }
      const readFile = universalify.fromPromise(_readFile);
      function readFileSync(file, options = {}) {
        if (typeof options === "string") {
          options = { encoding: options };
        }
        const fs = options.fs || _fs;
        const shouldThrow = "throws" in options ? options.throws : true;
        try {
          let content = fs.readFileSync(file, options);
          content = stripBom(content);
          return JSON.parse(content, options.reviver);
        } catch (err) {
          if (shouldThrow) {
            err.message = `${file}: ${err.message}`;
            throw err;
          } else {
            return null;
          }
        }
      }
      async function _writeFile(file, obj, options = {}) {
        const fs = options.fs || _fs;
        const str = stringify(obj, options);
        await universalify.fromCallback(fs.writeFile)(file, str, options);
      }
      const writeFile = universalify.fromPromise(_writeFile);
      function writeFileSync(file, obj, options = {}) {
        const fs = options.fs || _fs;
        const str = stringify(obj, options);
        return fs.writeFileSync(file, str, options);
      }
      const jsonfile = { readFile, readFileSync, writeFile, writeFileSync };
      module1.exports = jsonfile;
    },
    213: (module1) => {
      function stringify(
        obj,
        { EOL = "\n", finalEOL = true, replacer = null, spaces } = {},
      ) {
        const EOF = finalEOL ? EOL : "";
        const str = JSON.stringify(obj, replacer, spaces);
        return str.replace(/\n/g, EOL) + EOF;
      }
      function stripBom(content) {
        if (Buffer.isBuffer(content)) content = content.toString("utf8");
        return content.replace(/^\uFEFF/, "");
      }
      module1.exports = { stringify, stripBom };
    },
    59: (__unused_webpack_module, exports) => {
      "use strict";
      exports.fromCallback = function (fn) {
        return Object.defineProperty(
          function (...args) {
            if (typeof args[args.length - 1] === "function")
              fn.apply(this, args);
            else {
              return new Promise((resolve, reject) => {
                args.push((err, res) =>
                  err != null ? reject(err) : resolve(res),
                );
                fn.apply(this, args);
              });
            }
          },
          "name",
          { value: fn.name },
        );
      };
      exports.fromPromise = function (fn) {
        return Object.defineProperty(
          function (...args) {
            const cb = args[args.length - 1];
            if (typeof cb !== "function") return fn.apply(this, args);
            else {
              args.pop();
              fn.apply(this, args).then((r) => cb(null, r), cb);
            }
          },
          "name",
          { value: fn.name },
        );
      };
    },
    491: (module1) => {
      "use strict";
      module1.exports = require("assert");
    },
    57: (module1) => {
      "use strict";
      module1.exports = require("constants");
    },
    147: (module1) => {
      "use strict";
      module1.exports = require("fs");
    },
    17: (module1) => {
      "use strict";
      module1.exports = require("path");
    },
    781: (module1) => {
      "use strict";
      module1.exports = require("stream");
    },
    837: (module1) => {
      "use strict";
      module1.exports = require("util");
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
  var __webpack_exports__ = __nccwpck_require__(175);
  module.exports = __webpack_exports__;
})();
