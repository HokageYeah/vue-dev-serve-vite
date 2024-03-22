import parseUrl from "parseurl";
import readSource from "./readSource.js";
const defaultOptions = {
  cache: true,
};
const vueMiddleWare = (options = defaultOptions) => {
  console.log("中间件进入了");
  // 柯里化处理、自定义vue中间件传递参数的问题
  return async (req, res, next) => {
    console.log("这是回调");
    console.log(req.path);
    // 对 .vue 结尾的文件进行处理
    if (req.path.endsWith(".vue")) {
      const key = parseUrl(req).pathname;
      console.log(key);

      // 对 .js 结尾的文件进行处理
    } else if (req.path.endsWith(".js")) {
      const key = parseUrl(req).pathname;
      console.log(key);
      console.log(parseUrl(req));
      const result = await readSource(req);
      console.log(result);
      // 对 /__modules/ 开头的文件进行处理
    } else if (req.path.startsWith("/__modules/")) {
    } else {
      next();
    }
  };
};
export default vueMiddleWare;
