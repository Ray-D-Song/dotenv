return function(capabilities, on_attach)
  vim.lsp.config('sqls', {
    capabilities = capabilities,
    on_attach = on_attach,
    on_init = function(client)
      client.server_capabilities.documentFormattingProvider = false
      client.server_capabilities.documentRangeFormattingProvider = false
    end,
    settings = {
      sqls = {
        connections = {},
      },
    }
  })
  vim.lsp.enable('sqls')
end
