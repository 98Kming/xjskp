const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const AdaptiveProjectPlugin = require("./plugin/adaptive");

module.exports = {
  entry: {
    main: path.resolve(__dirname, "./src/main.ts"),
    "test-navigation": path.resolve(__dirname, "./src/test-navigation.ts"),
    "test-scroll": path.resolve(__dirname, "./src/test-scroll.ts"),
  },

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    environment: {
      arrowFunction: false,
      const: false,
      destructuring: false,
    },
  },

  // 插件
  plugins: [
    new CleanWebpackPlugin(),
    new AdaptiveProjectPlugin({ tsDir: "src", layoutDir: "layout" }),
  ],

  module: {
    rules: [
      {
        // 使用 babel-loader 处理 .js 文件
        loader: "babel-loader",
        test: /\.js$/,
        include: path.resolve(__dirname, "./src"),
        exclude: /node_modules/,
      },
      {
        // .ts 文件：ts-loader 编译 TS → babel-loader 转译为 ES5（兼容 Rhino）
        test: /\.ts$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                ["@babel/preset-env", {
                  targets: { ie: "10" },
                  modules: false,
                }],
              ],
              generatorOpts: {
                jsescOption: { minimal: true },
              },
            },
          },
          { loader: "ts-loader" },
        ],
        exclude: /node_modules/,
      },
      {
        loader: 'raw-loader', // 作为字符串导入（触发监听）
        test: /\.xml$/, // 匹配 XML 文件
        include: path.resolve(__dirname, "./layout"),
        exclude: /node_modules/,
      }
    ],
  },

  resolve: {
    extensions: [".ts", ".js"],
    modules: [path.resolve(__dirname, "node_modules")],
  },

  optimization: {
    minimize: false,
  },

  watch: false,
  watchOptions: {
    ignored: /node_modules/,
  },

  mode: "production",
};
