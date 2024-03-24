// main.js 中的 import 语句
// import Vue from "vue";
// 通过 recast 生成 ast 转换成 import Vue from "/__modules/vue"
// 而最终返回给浏览器的是 vue-dev-server/node_modules/vue/dist/vue.esm.browser.

import recast from "recast";
import isPkg from "validate-npm-package-name";

export default function (code) {
  const ast = recast.parse(code);
  console.log("这是ast：", ast);
  recast.types.visit(ast, {
    visitImportDeclaration(path) {
      const source = path.node.source.value;
      console.log("这是visitImportDeclaration", source);
      if (!/^\.\/?/.test(source) && isPkg(source)) {
        path.node.source = recast.types.builders.literal(
          `/__modules/${source}`
        );
      }
      this.traverse(path);
    },
  });
  return recast.print(ast).code;
}
