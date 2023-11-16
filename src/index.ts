import prompts from "prompts";
import minimist from "minimist";
import { reset, cyan, green, lightBlue, red } from "kolorist";
import path from "path";
import fs from "fs-extra";
import * as process from "process";
import { fileURLToPath } from "node:url";
import spwan from "cross-spawn";

type ColorFn = (text: string | number) => string;

type Framework = {
  name: string;
  display: string;
  color: ColorFn;
  description?: string;
  variants: Array<{
    name: string;
    display: string;
    description?: string;
    color: ColorFn;
  }>;
};

const FRAMEWORKS: Framework[] = [
  {
    name: "react",
    display: "React",
    color: lightBlue,
    variants: [
      {
        name: "react",
        display: "React",
        description: "contains: Vite Tailwind Prettier",
        color: green,
      },
      {
        name: "react-pro",
        display: "React Pro",
        description:
          "contains: Vite Tailwind Prettier React-Router Redux React-Query",
        color: lightBlue,
      },
    ],
  },
  {
    name: "vue",
    display: "Vue",
    color: green,
    variants: [
      {
        name: "vue",
        display: "Vue",
        description: "contains: Vite Tailwind Prettier",
        color: green,
      },
      {
        name: "vue-pro",
        display: "Vue Pro",
        description: "contains: Vite Tailwind Prettier Vue-Router Pinia",
        color: lightBlue,
      },
    ],
  },
];

init();

function copyFiles(src: string, dest: string) {
  fs.emptyDirSync(dest);
  fs.copySync(src, dest);
}

function getExportPath(dir: string) {
  return path.join(process.cwd(), dir);
}

function getTemplatePath(dir: string) {
  const dirUrl = new URL("../", import.meta.url);
  const dirname = fileURLToPath(dirUrl);
  return path.join(dirname, "/templates", dir);
}

async function init() {
  let argv = minimist<{ template?: string }>(process.argv.slice(2), {
    string: ["_"],
  });

  let res = null;
  let template = argv.template;
  let destDir = argv._[0];
  let override = false;

  try {
    res = await prompts([
      {
        type: () => {
          if (destDir) return;
          return "text";
        },
        name: "destDir",
        message: "项目路径",
        initial: ".",
        onState: ({ value }) => {
          destDir = value;
        },
      },
      {
        type: () => {
          const exportPath = getExportPath(destDir);
          const isExistence = fs.existsSync(exportPath);
          if (isExistence) return "confirm";
          return null;
        },
        name: "override",
        message: "目录不为空,是否覆盖",
        onState: ({ value }) => {
          override = value;
        },
      },
      {
        type: () => {
          const exportPath = getExportPath(destDir);
          const isExistence = fs.existsSync(exportPath);
          if (isExistence && !override)
            throw new Error(`${red("✖")} 操作取消`);
          return null;
        },
        name: "overrideChecker",
      },
      {
        type: () => {
          if (template) return;
          return "select";
        },
        name: "framework",
        message: "选择一个框架",
        choices: FRAMEWORKS.map((framework) => ({
          title: framework.color(framework.display),
          description: framework.description,
          value: framework,
        })),
      },
      {
        type: () => {
          if (template) return;
          return "select";
        },
        name: "variant",
        message: "选择一个 variant",
        choices: (framework: Framework) => {
          return framework.variants.map((variant) => ({
            title: variant.color(variant.display),
            description: variant.description,
            value: variant.name,
          }));
        },
        onState: ({ value }) => {
          template = value;
        },
      },
    ]);
    const exportPath = getExportPath(destDir);
    const templatePath = getTemplatePath(template as string);
    copyFiles(templatePath, exportPath);

    const initializingGit = spwan.sync("git init", {
      cwd: exportPath,
      stdio: "inherit",
    });

    console.log("部署完成:");
    console.log(`${exportPath}`);
    console.log("运行以下命令:");
    console.log("pnpm install");
    console.log("pnpm run dev");
  } catch (e) {
    console.warn(e);
  }
}
