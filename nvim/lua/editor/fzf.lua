return {
  'ibhagwan/fzf-lua',
  dependencies = { 'nvim-tree/nvim-web-devicons' },
  config = function()
    require('fzf-lua').setup({
      winopts = {
        height = 0.85,
        width = 0.80,
      },
      files = {
        fd_opts = [[--color=never --type f --hidden --follow ]] ..
                  [[--exclude .git --exclude node_modules --exclude .cache ]] ..
                  [[--exclude dist --exclude build --exclude target ]] ..
                  [[--exclude .next --exclude .nuxt --exclude coverage ]] ..
                  [[--exclude .vscode --exclude .idea --exclude __pycache__]],
      },
      grep = {
        rg_opts = [[--column --line-number --no-heading --color=always ]] ..
                  [[--smart-case --max-columns=4096 ]] ..
                  [[--glob '!.git/' --glob '!node_modules/' --glob '!.cache/' ]] ..
                  [[--glob '!dist/' --glob '!build/' --glob '!target/' ]] ..
                  [[--glob '!.next/' --glob '!.nuxt/' --glob '!coverage/' ]] ..
                  [[--glob '!.vscode/' --glob '!.idea/' --glob '!__pycache__/']],
      },
    })

    local fzf = require('fzf-lua')

    vim.keymap.set('n', '<leader><leader>f', function()
      fzf.live_grep_resume()
    end, { desc = 'Live grep (resume)' })
    vim.keymap.set('n', '<leader>f', function()
      fzf.files({ resume = true })
    end, { desc = 'Find files (resume)' })
  end
}
