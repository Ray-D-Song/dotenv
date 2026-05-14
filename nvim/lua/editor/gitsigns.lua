return {
  'lewis6991/gitsigns.nvim',
  event = { 'BufReadPre', 'BufNewFile' },
  config = function()
    local gitsigns = require('gitsigns')

    gitsigns.setup({
      signs = {
        add          = { text = '▎' },
        change       = { text = '▎' },
        delete       = { text = '▎' },
        topdelete    = { text = '▎' },
        changedelete = { text = '▎' },
        untracked    = { text = '▎' },
      },
      signs_staged = {
        add          = { text = '▎' },
        change       = { text = '▎' },
        delete       = { text = '▎' },
        topdelete    = { text = '▎' },
        changedelete = { text = '▎' },
        untracked    = { text = '▎' },
      },
      signs_staged_enable = true,
      signcolumn = true,
      numhl      = false,
      linehl     = false,
      word_diff  = false,
      current_line_blame = false,
      current_line_blame_opts = {
        virt_text = true,
        virt_text_pos = 'eol',
        delay = 1000,
        ignore_whitespace = false,
      },
      current_line_blame_formatter = '<author>, <author_time:%Y-%m-%d> - <summary>',
      sign_priority = 6,
      update_debounce = 100,
      max_file_length = 40000,
      on_attach = function(bufnr)
        local gs = require('gitsigns')

        local function map(mode, l, r, opts)
          opts = opts or {}
          opts.buffer = bufnr
          vim.keymap.set(mode, l, r, opts)
        end

        -- Navigation
        map('n', ']g', function()
          if vim.wo.diff then
            vim.cmd.normal({ ']c', bang = true })
          else
            gs.nav_hunk('next')
          end
        end, { desc = 'Next hunk' })

        map('n', '[g', function()
          if vim.wo.diff then
            vim.cmd.normal({ '[c', bang = true })
          else
            gs.nav_hunk('prev')
          end
        end, { desc = 'Prev hunk' })

        -- Actions
        map('n', '<leader>hs', gs.stage_hunk, { desc = 'Stage hunk' })
        map('n', '<leader>hr', gs.reset_hunk, { desc = 'Reset hunk' })
        map('v', '<leader>hs', function()
          gs.stage_hunk({ vim.fn.line('.'), vim.fn.line('v') })
        end, { desc = 'Stage selected hunk' })
        map('v', '<leader>hr', function()
          gs.reset_hunk({ vim.fn.line('.'), vim.fn.line('v') })
        end, { desc = 'Reset selected hunk' })

        map('n', '<leader>hS', gs.stage_buffer, { desc = 'Stage buffer' })
        map('n', '<leader>hR', gs.reset_buffer, { desc = 'Reset buffer' })
        map('n', '<leader>hp', gs.preview_hunk, { desc = 'Preview hunk' })
        map('n', '<leader>hb', function()
          gs.blame_line({ full = true })
        end, { desc = 'Blame line' })
        map('n', '<leader>hB', gs.blame, { desc = 'Blame buffer' })

        -- Text object
        map({ 'o', 'x' }, 'ih', gs.select_hunk, { desc = 'Select hunk' })
      end,
    })
  end,
}
