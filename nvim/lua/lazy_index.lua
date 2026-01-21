local lazy_path = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazy_path) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable", lazyrepo, lazy_path })
  if vim.v.shell_error ~= 0 then
    vim.api.nvim_echo({
      { "Failed to clone lazy.nvim:\n", "ErrorMsg" },
      { out,                            "WarningMsg" },
      { "\nPress any key to exit..." },
    }, true, {})
    vim.fn.getchar()
    os.exit(1)
  end
end
vim.opt.rtp:prepend(lazy_path)

vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

vim.opt.autoread = false

require("lazy").setup({
  spec = {
    {
      import = 'style',
    },
    {
      import = 'lsp.config',
    },
    {
      import = 'editor.fzf'
    },
    {
      "mg979/vim-visual-multi",
      branch = "master",
      init = function()
      end
    },
    {
      "ray-d-song/inlay-hint-trim.nvim",
      config = function()
        require("inlay-hint-trim").setup({
          max_length = 24,
          ellipsis = "…",
          clients = {
            ["typescript-tools"] = true,
            ["tsserver"] = true,
            ["ts_ls"] = true,
          },
        })
      end,
    },
    {
      "norcalli/nvim-colorizer.lua",
      config = function()
        require('colorizer').setup()
      end
    },
    {
      "nvim-tree/nvim-tree.lua",
      version = "*",
      lazy = false,
      dependencies = {
        "nvim-tree/nvim-web-devicons",
      },
      config = function()
        require("nvim-tree").setup {
          sync_root_with_cwd = true,
          respect_buf_cwd = true,
          update_focused_file = {
            enable = true,
            update_root = false,
          },
          view = {
            width = 40,
            side = "left",
            preserve_window_proportions = true,
          },
          actions = {
            open_file = {
              quit_on_open = false,
            },
          },
          on_attach = function(bufnr)
            local api = require("nvim-tree.api")

            -- Use default mappings
            api.config.mappings.default_on_attach(bufnr)

            -- Disable quit/close keymaps (only if they exist)
            pcall(vim.keymap.del, 'n', 'q', { buffer = bufnr })

            -- Override q to do nothing instead of closing
            vim.keymap.set('n', 'q', '<nop>', { buffer = bufnr, noremap = true, silent = true })
          end,
        }

        -- Auto-open nvim-tree on startup
        vim.api.nvim_create_autocmd("VimEnter", {
          callback = function()
            vim.defer_fn(function()
              local api = require("nvim-tree.api")
              if not api.tree.is_visible() then
                api.tree.open()
              end
            end, 100)
          end,
        })

        -- Prevent closing nvim-tree (with debounce to avoid rapid triggers)
        local reopening = false
        vim.api.nvim_create_autocmd("BufEnter", {
          callback = function()
            if reopening then return end

            vim.defer_fn(function()
              local api = require("nvim-tree.api")
              -- Check if nvim-tree exists but is not visible
              if not api.tree.is_visible() then
                local buffers = vim.api.nvim_list_bufs()
                local has_nvim_tree_buf = false

                for _, buf in ipairs(buffers) do
                  if vim.api.nvim_buf_is_valid(buf) then
                    local ft = vim.api.nvim_buf_get_option(buf, 'filetype')
                    if ft == 'NvimTree' then
                      has_nvim_tree_buf = true
                      break
                    end
                  end
                end

                -- Only try to open if there's no existing nvim-tree buffer
                if not has_nvim_tree_buf then
                  reopening = true
                  api.tree.open()
                  vim.defer_fn(function()
                    reopening = false
                  end, 200)
                end
              end
            end, 50)
          end,
        })

        -- Override quit commands to prevent closing when only nvim-tree is left
        vim.api.nvim_create_autocmd("QuitPre", {
          callback = function()
            local tree_wins = {}
            local wins = vim.api.nvim_list_wins()

            -- Find all nvim-tree windows
            for _, win in ipairs(wins) do
              local buf = vim.api.nvim_win_get_buf(win)
              local ft = vim.api.nvim_buf_get_option(buf, "filetype")
              if ft == "NvimTree" then
                table.insert(tree_wins, win)
              end
            end

            -- If trying to close the last non-nvim-tree window, prevent quit
            if #wins - #tree_wins <= 1 then
              vim.cmd("qa!")
            end
          end,
        })
      end,
    },
    {
      "ray-d-song/calm.nvim",
      lazy = false,
      priority = 1000,
      config = function()
        require("calm").setup({
          preset = "pyments"
        })

        vim.cmd.colorscheme("calm")
      end,
    },
    {
      'smoka7/hop.nvim',
      version = "*",
      opts = {
        keys = 'etovxqpdygfblzhckisuran'
      }
    },
  },
  checker = { enabled = false },
})
