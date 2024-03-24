import fs from "node:fs";
import path from "node:path";
import util from "node:util";
import { createRequire } from "module";
// 解决在esmodel中无法使用require的问题
const require = createRequire(import.meta.url);
const fsd = require("fs");
console.log(fsd);
// 这段代码最终返回的是读取路径 vue-dev-server/node_modules/vue/dist/vue.esm.browser.js 下的文件。
const readFile = util.promisify(fs.readFile);
export default (pkg) => {
  if (pkg === "vue") {
    const dirname = require.resolve("vue");
    const dir = path.dirname(dirname);
    // 获取vue在model的地址
    console.log(dir);
    const filepath = path.join(dir, "vue.esm.browser.js");
    return readFile(filepath);
  } else {
    throw new Error("npm imports support are not ready yet.");
  }
};
