local gopls_config_fn = require('lsp.go')
local jsts_config_fn = require('lsp.js-ts')
local sql_config_fn = require('lsp.sql')
local c_config_fn = require('lsp.c')

-- Track if we were in a quickfix window
local was_in_qf = false

-- Auto-close quickfix/location list when jumping from it to a normal buffer
vim.api.nvim_create_autocmd('WinLeave', {
  callback = function()
    local current_buf = vim.api.nvim_get_current_buf()
    local buftype = vim.api.nvim_buf_get_option(current_buf, 'buftype')
    was_in_qf = (buftype == 'quickfix')
  end
})

vim.api.nvim_create_autocmd('WinEnter', {
  callback = function()
    if was_in_qf then
      local current_buf = vim.api.nvim_get_current_buf()
      local buftype = vim.api.nvim_buf_get_option(current_buf, 'buftype')
      -- If we just left a quickfix window and entered a normal buffer, close quickfix
      if buftype == '' then
        vim.defer_fn(function()
          vim.cmd('cclose')
          vim.cmd('lclose')
        end, 50)
      end
      was_in_qf = false
    end
  end
})

return {
  {
    'neovim/nvim-lspconfig'
  },
  {
    'numToStr/Comment.nvim',
  },
  {
    'williamboman/mason.nvim',
    config = function()
      require('mason').setup()
    end,
  },
  {
    'WhoIsSethDaniel/mason-tool-installer.nvim',
    dependencies = { 'williamboman/mason.nvim' },
    config = function()
      require('mason-tool-installer').setup({
        ensure_installed = {
          'java-debug-adapter',
          'java-test',
          'google-java-format',
          'vscode-java-dependency',
          'vscode-java-decompiler'
        }
      })
    end,
  },
  {
    'williamboman/mason-lspconfig.nvim',
    dependencies = {
      'williamboman/mason.nvim',
      'nvim-java/nvim-java'
    },
    config = function()
      local capabilities = vim.lsp.protocol.make_client_capabilities()

      -- Lsp key bindings
      local on_attach = function(client, bufnr)
        local opts = { noremap = true, silent = true, buffer = bufnr }
        -- Go definition
        vim.keymap.set('n', 'gd', vim.lsp.buf.definition, opts)
        -- Go declaration
        vim.keymap.set('n', 'gD', vim.lsp.buf.declaration, opts)
        -- Go implementation
        vim.keymap.set('n', 'gi', vim.lsp.buf.implementation, opts)
        -- Show help
        vim.keymap.set('n', '<C-k>', vim.lsp.buf.signature_help, opts)
        -- Show message
        vim.keymap.set('n', 'K', vim.lsp.buf.hover, opts)
        -- Rename
        vim.keymap.set('n', '<leader>rn', vim.lsp.buf.rename, opts)
        -- Code action
        vim.keymap.set('n', '<leader>ca', vim.lsp.buf.code_action, opts)
        -- Find ref
        vim.keymap.set('n', 'gr', vim.lsp.buf.references, opts)
      end

      -- Setup mason-lspconfig to ensure LSP servers are installed
      require('mason-lspconfig').setup({
        ensure_installed = {
          'lua_ls', 'clangd', 'pyright', 'rust_analyzer',
          'eslint', 'ts_ls', 'intelephense',
          'gopls'
        },
      })

      -- Configure LSP servers using vim.lsp.config (new API)
      local servers = {
        'lua_ls', 'clangd', 'pyright', 'rust_analyzer',
        'eslint', 'intelephense', 'tailwindcss-language-server', 'ts_ls'
      }

      for _, server in ipairs(servers) do
        vim.lsp.enable(server)
        vim.lsp.config(server, {
          capabilities = capabilities,
          on_attach = on_attach,
        })
      end

      -- Go with custom configuration
      gopls_config_fn(capabilities, on_attach)
      jsts_config_fn(capabilities, on_attach)
      sql_config_fn(capabilities, on_attach)
      c_config_fn(capabilities, on_attach)
    end,
  },
  {
    'mfussenegger/nvim-dap',
    dependencies = {
      'williamboman/mason.nvim',
      'jay-babu/mason-nvim-dap.nvim',
    },
    config = function()
      local mason_nvim_dap = require('mason-nvim-dap')
      mason_nvim_dap.setup({
        ensure_installed = {
          'js-debug-adapter',
          'python',
        },
        handlers = {},
      })
    end,
  },
  {
    'saghen/blink.cmp',
    dependencies = { 'rafamadriz/friendly-snippets' },

    version = '1.*',
    opts = {
      keymap = { preset = 'super-tab' },

      appearance = {
        nerd_font_variant = 'mono'
      },

      completion = {
        documentation = { auto_show = true },
        menu = { max_height = 5 }
      },

      sources = {
        default = { 'lsp', 'path', 'snippets', 'buffer' },
      },

      fuzzy = { implementation = "prefer_rust_with_warning" }
    },
    opts_extend = { "sources.default" }
  },
  {
    'windwp/nvim-autopairs',
    event = "InsertEnter",
    config = function()
      require('nvim-autopairs').setup({
        check_ts = true,
        ts_config = {
          lua = { 'string' },
          javascript = { 'string', 'template_string' },
        },
        disable_filetype = { "TelescopePrompt", "vim" },
      })
    end
  }
}
