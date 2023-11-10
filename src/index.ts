import prompts from "prompts";
// import minimist from "minimist";
import { reset, cyan, green, lightBlue, red } from "kolorist";
import path from "path";
import fs from "fs-extra";
import * as process from "process";

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
        name: "basic",
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

async function init() {
  let res = null;
  let templatePath = "";
  let exportingPath = "";
  let isExistence = false;
  let override = false;
  try {
    res = await prompts([
      {
        type: "text",
        name: "path",
        message: "项目路径",
        initial: ".",
        onState: ({ value }) => {
          exportingPath = path.join(process.cwd(), value);
          isExistence = fs.existsSync(exportingPath);
        },
      },
      {
        type: () => {
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
          if (isExistence && !override)
            throw new Error(`${red("✖")} 操作取消`);
          return null;
        },
        name: "overrideChecker",
      },
      {
        type: "select",
        name: "framework",
        message: "选择一个框架",
        choices: FRAMEWORKS.map((framework) => ({
          title: framework.color(framework.display),
          description: framework.description,
          value: framework,
        })),
      },
      {
        type: "select",
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
          templatePath = path.join(__dirname, "../templates", value);
          console.log(`templatePath`, templatePath);
        },
      },
    ]);

    copyFiles(templatePath, exportingPath);

    console.log("部署完成");
    console.log(`${exportingPath}`)
    console.log("运行以下命令:")
    console.log("pnpm install");
    console.log("pnpm run dev");
  } catch (e) {
    console.warn(e);
  }
}
