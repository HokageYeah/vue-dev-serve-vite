import path from "node:path";
import fs from "node:fs";
import util from "node:util";
import parseurl from "parseurl";

// 将读取文件转换成promise风格
const readFilePromise = util.promisify(fs.readFile);
// fs.stat 方法接受一个文件路径作为参数，然后返回一个包含文件状态信息的对象。这个对象包含了文件的各种属性，比如文件大小、创建时间、修改时间等等。通过这些信息，你可以对文件进行进一步的处理，比如判断文件类型、检查文件大小、以及其他与文件状态相关的操作。
const statPromise = util.promisify(fs.stat);
const root = process.cwd();
export default async function readSource(req) {
  const { pathname } = parseurl(req);
  console.log(root);
  const filepath = path.resolve(root, pathname.replace(/^\//, ""));
  return {
    filepath,
    source: await readFilePromise(filepath, { encoding: "utf8" }),
    updateTime: (await statPromise(filepath)).mtime.getTime(),
  };
}
