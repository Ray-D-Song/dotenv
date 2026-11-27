# dotenv

安装配置和依赖：`make install`。使用 GitHub 下载镜像：

```sh
make install PROXY=1
make update-nvim PROXY=1
```

直接运行安装脚本时也可以传入 `--proxy`，例如 `node scripts/install_deps.mjs --proxy`、`node scripts/download_nerd_font.mjs --proxy` 或 `node scripts/bootstrap.mjs --proxy`。

镜像使用 ghfast.top，仅代理脚本直接下载的 GitHub 和 GitHub Raw 文件；系统包管理器、Homebrew、mise 及其他来源仍使用各自配置的源。镜像是第三方服务，下载的文件由其转发。
