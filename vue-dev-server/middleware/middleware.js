import parseUrl from "parseurl";
import readSource from "./readSource.js";
import transformModuleImports from "./transformModuleImports.js";
import vueCompiler from "@vue/component-compiler";
import loadPkg from "./loadPkg.js";
import LRU from "lru-cache";
import fs from "node:fs";
import util from "node:util";
import path from "node:path";

const root = process.cwd();
// 回调转换成promise
const stat = util.promisify(fs.stat);
// 用来编译.VUE文件
const compiler = vueCompiler.createDefaultCompiler();
const defaultOptions = {
  cache: true,
};
// 返回send
const send = (res, source, mime) => {
  res.setHeader("Content-Type", mime);
  res.end(source);
};
const injectSourceMapToBlock = (block, lang) => {
  const map = Base64.toBase64(JSON.stringify(block.map));
  let mapInject;
  switch (lang) {
    case "js":
      mapInject = `//# sourceMappingURL=data:application/json;base64,${map}\n`;
      break;
    case "css":
      mapInject = `/*# sourceMappingURL=data:application/json;base64,${map}*/\n`;
      break;
    default:
      break;
  }
  return {
    ...block,
    code: mapInject + block.code,
  };
};
const injectSourceMapToScript = (script) => {
  return injectSourceMapToBlock(script, "js");
};
const injectSourceMapsToStyles = (styles) => {
  return styles.map((style) => injectSourceMapToBlock(style, "css"));
};
const bundleSFC = async (req) => {
  // 获取文件内的所有内容
  const { filepath, source, updateTime } = await readSource(req);
  const descriptorResult = compiler.compileToDescriptor(filepath, source);
  const assembledResult = vueCompiler.assemble(compiler, filepath, {
    ...descriptorResult,
    script: injectSourceMapToScript(descriptorResult.script),
    styles: injectSourceMapsToStyles(descriptorResult.styles),
  });
  return { ...assembledResult, updateTime };
};

const vueMiddleWare = (options = defaultOptions) => {
  let cache;
  let time = {};
  if (options.cache) {
    cache = new LRU({
      max: 500,
      length: function(n, key) {
        return n * 2 + key.length;
      },
    });
  }
  const tryCache = async (key, checkUpdateTime = true) => {
    const data = cache.get(key);
    if (checkUpdateTime) {
      const cacheUpdateTime = time[key];
      const fileUpdateTime = (await stat(
        path.resolve(root, key.replace(/^\//, ""))
      )).mtime.getTime();
      if (cacheUpdateTime < fileUpdateTime) return null;
    }
    return data;
  };
  function cacheData(key, data, updateTime) {
    const old = cache.peek(key);

    if (old != data) {
      cache.set(key, data);
      if (updateTime) time[key] = updateTime;
      return true;
    } else return false;
  }
  console.log("中间件进入了");
  // 柯里化处理、自定义vue中间件传递参数的问题
  return async (req, res, next) => {
    console.log("这是回调");
    console.log(req.path);
    // 对 .vue 结尾的文件进行处理
    if (req.path.endsWith(".vue")) {
      const key = parseUrl(req).pathname;
      console.log(key);
      let out = await tryCache(key);
      if (!out) {
        out = await bundleSFC(req);
        cacheData(key, out, out.updateTime);
      }
      send(res, out.code, "application/javascript");
      // 对 .js 结尾的文件进行处理
    } else if (req.path.endsWith(".js")) {
      const key = parseUrl(req).pathname;
      console.log(key);
      console.log(parseUrl(req));
      let out = await tryCache(key);
      if (!out) {
        const result = await readSource(req);
        out = await transformModuleImports(result.source);
        cacheData(key, out, result.updateTime);
      }
      console.log(out);
      send(res, out, "application/javascript");
      // 对 /__modules/ 开头的文件进行处理
    } else if (req.path.startsWith("/__modules/")) {
      const key = parseUrl(req).pathname;
      const pkg = req.path.replace(/^\/__modules\//, "");
      let out = await tryCache(key, false); // Do not outdate modules
      if (!out) {
        out = (await loadPkg(pkg)).toString();
        cacheData(key, out, false); // Do not outdate modules
      }
      send(res, out, "application/javascript");
    } else {
      next();
    }
  };
};
export default vueMiddleWare;
