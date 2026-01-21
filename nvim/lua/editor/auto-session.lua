return {
  "rmagatti/auto-session",
  lazy = false,

  init = function()
    vim.o.sessionoptions = "blank,buffers,curdir,folds,help,tabpages,winsize,winpos,terminal,localoptions"
  end,

  opts = {
    auto_save_enabled = true,
    auto_restore_enabled = true,
    auto_restore_lazy_delay_enabled = true,
    suppressed_dirs = { "~/", "~/Projects", "~/Downloads", "/" },
    cwd_change_handling = {
      restore_upcoming_session = true,
    },
    -- log_level = 'debug',
    session_lens = {
      load_on_setup = true,
    },
    post_restore_cmds = {
      function()
        -- nvim-tree will auto-open via the BufEnter autocmd in lazy_index.lua
        -- Ensure it's visible after session restore
        vim.defer_fn(function()
          local nvim_tree_api = require('nvim-tree.api')
          if not nvim_tree_api.tree.is_visible() then
            nvim_tree_api.tree.open()
          end
        end, 100)
      end
    },
  },
}
