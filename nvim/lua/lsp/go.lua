return function(capabilities, on_attach)
  vim.lsp.enable('gopls')
  vim.lsp.config('gopls', {
    capabilities = capabilities,
    on_attach = function(client, bufnr)
      -- 1. ensure keymap
      on_attach(client, bufnr)

      -- 2. format on save
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
      gopls = {
        analyses = {
          unusedparams = true,
          shadow       = true,
        },
        staticcheck = true,
        gofumpt = true,
        ['ui.completion.usePlaceholders'] = true,
        hints = {
          assignVariableTypes = true,
          compositeLiteralFields = true,
          compositeLiteralTypes = true,
          constantValues = true,
          functionTypeParameters = true,
          parameterNames = true,
          rangeVariableTypes = true,
        },
      },
    },
    commands = {
      GoImports = {
        function()
          local params = vim.lsp.util.make_range_params()
          params.context = { only = { "source.organizeImports" } }
          local result = vim.lsp.buf_request_sync(0, "textDocument/codeAction", params, 1000)
          for _, res in pairs(result or {}) do
            for _, r in pairs(res.result or {}) do
              if r.edit then
                vim.lsp.util.apply_workspace_edit(r.edit, "utf-8")
              else
                vim.lsp.buf.execute_command(r.command)
              end
            end
          end
        end,
        description = "Organize imports",
      },
    },
  })
end
