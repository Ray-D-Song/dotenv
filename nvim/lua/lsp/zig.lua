return function(capabilities, on_attach)
  vim.lsp.enable('zls')
  vim.lsp.config('zls', {
    capabilities = capabilities,
    on_attach = function(client, bufnr)
      -- 1. ensure keymap
      on_attach(client, bufnr)

      -- 2. format on save (zls supports zig fmt)
      if client.supports_method('textDocument/formatting') then
        vim.api.nvim_create_autocmd('BufWritePre', {
          buffer = bufnr,
          callback = function()
            vim.lsp.buf.format({ async = false, bufnr = bufnr })
          end,
        })
      end
    end,
    settings = {
      zls = {
        -- Enable inlay hints
        enable_inlay_hints = true,
        -- Enable semantic highlighting
        enable_semantic_tokens = true,
        -- Enable build on save (runs zig build to check for errors)
        build_on_save = false,
        -- Build runner path (uses zig's build system)
        build_runner_path = nil,
        -- Zig path (uses zig in PATH by default)
        zig_path = nil,
        -- Zig lib path (auto-detected by zls)
        zig_lib_path = nil,
        -- Completion support
        enable_argument_placeholders = true,
        -- Hover support
        enable_build_runner_signature_help = true,
        -- Code action support
        enable_autofix = true,
      },
    },
  })
end
