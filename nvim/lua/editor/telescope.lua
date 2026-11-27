return {
  'nvim-telescope/telescope.nvim',
  dependencies = { 'nvim-lua/plenary.nvim', 'nvim-tree/nvim-web-devicons' },
  config = function()
    require('telescope').setup({
      defaults = {
        layout_config = { height = 0.85, width = 0.80 },
        file_ignore_patterns = {
          '%.git/', 'node_modules/', '%.cache/', 'dist/', 'build/', 'target/',
          '%.next/', '%.nuxt/', 'coverage/', '%.vscode/', '%.idea/', '__pycache__/',
        },
      },
      pickers = {
        find_files = { hidden = true, follow = true },
      },
    })

    local builtin = require('telescope.builtin')
    vim.keymap.set('n', '<leader><leader>f', builtin.live_grep, { desc = 'Live grep' })
    vim.keymap.set('n', '<leader>f', builtin.find_files, { desc = 'Find files' })
  end,
}
