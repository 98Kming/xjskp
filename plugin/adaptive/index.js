// 适配 autojs6 api 与 ts校验异常问题
const fs = require('fs');
const path = require('path');

const { validate } = require("schema-utils")
const schema = require("./options.json")

class AdaptiveProjectPlugin {
    constructor(options = {}) {
        // 配置校验
        validate(schema, options, "AdaptiveProjectPlugin")

        this.tsDir = options.tsDir || 'src'; // TS 文件目录
        this.layoutDir = options.layoutDir || 'layout'; // layout 文件目录
    }

    // ...existing code...
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('AdaptiveProjectPlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'AdaptiveProjectPlugin',
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
                },
                (assets) => {
                    Object.keys(assets).forEach((filename) => {
                        if (filename.endsWith('.js')) {
                            const tsFile = path.resolve(compiler.context, this.tsDir, filename.replace(/\.js$/, '.ts'));
                            let needUiHeader = false;
                            let originalSource = assets[filename].source();
                            // 替换 layoutFile:
                            originalSource = originalSource.replace(
                                /(?<!\/[\/*].*)(['"])layoutFile\:(.+?\.xml)\1(?!.*?\*\/)/g,
                                (match, quote, xmlPath) => {
                                    // 解析 xml 文件绝对路径
                                    const absXmlPath = path.resolve(compiler.context, `./${this.layoutDir}`, xmlPath);
                                    console.log(`2Processing XML file: ${absXmlPath}`);
                                    if (fs.existsSync(absXmlPath)) {
                                        let xmlContent = fs.readFileSync(absXmlPath, 'utf-8');
                                        // 转义内容中的反斜杠和引号
                                        xmlContent = xmlContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
                                        return `${xmlContent}`;
                                    } else {
                                        throw new Error(`XML file not found: ${absXmlPath}`);
                                    }
                                }
                            );                    
                            originalSource = originalSource.replace(      
                                /(?<!\/[\/*].*)layoutFile\((['"])(.+?\.xml)\1(?!.*?\*\/)/g,
                                (match, quote, xmlPath) => {
                                    needUiHeader = true
                                    // 解析 xml 文件绝对路径
                                    const absXmlPath = path.resolve(compiler.context, `./${this.layoutDir}`, xmlPath);
                                    console.log(`2Processing XML file: ${absXmlPath}`);
                                    if (fs.existsSync(absXmlPath)) {
                                        let xmlContent = fs.readFileSync(absXmlPath, 'utf-8');
                                        // 转义内容中的反斜杠和引号
                                        xmlContent = xmlContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
                                        return `layout(${xmlContent}`;
                                    } else {
                                        throw new Error(`XML file not found: ${absXmlPath}`);
                                    }
                                }
                            );
                            if (needUiHeader) {
                                originalSource = '"ui";\n' + originalSource;
                            }

                            compilation.updateAsset(
                                filename,
                                new compiler.webpack.sources.RawSource(originalSource)
                            );
                        }
                    });
                }
            );
        });
    }
}

module.exports = AdaptiveProjectPlugin;