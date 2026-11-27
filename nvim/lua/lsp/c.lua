return function(capabilities, on_attach)
  vim.lsp.config('clangd', {
    capabilities = capabilities,
    on_attach = function(client, bufnr)
      -- 1. ensure keymap
      on_attach(client, bufnr)

      -- 2. format on save
      if client.supports_method('textDocument/formatting') then
        vim.api.nvim_create_autocmd('BufWritePre', {
          buffer = bufnr,
          group = vim.api.nvim_create_augroup('lsp_format_' .. client.name .. '_' .. bufnr, { clear = true }),
          callback = function()
            if #vim.lsp.get_clients({ bufnr = bufnr, name = client.name }) > 0 then
              vim.lsp.buf.format({ async = false, bufnr = bufnr, filter = function(c) return c.name == client.name end })
            end
          end,
        })
      end
    end,
  })
end

