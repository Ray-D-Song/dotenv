-- Insert mode
vim.keymap.set('i', 'jj', '<Esc>') -- Use jj to exit insert mode

vim.keymap.set('n', 'ca', 'ggVG', { noremap = true, silent = true }) -- Select all content

local js_like_filetypes = {
  javascript = true,
  javascriptreact = true,
  typescript = true,
  typescriptreact = true,
  vue = true,
}

local function format_with_preference()
  local bufnr = vim.api.nvim_get_current_buf()
  local filetype = vim.bo[bufnr].filetype

  local function format_with_client(name)
    vim.lsp.buf.format({
      async = false,
      bufnr = bufnr,
      filter = function(client)
        return client.name == name
      end,
    })
  end

  if filetype == 'sql' then
    local lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)
    local content = table.concat(lines, '\n')
    local cmd = 'sql-formatter'
    local result = vim.fn.system(cmd, content)
    if vim.v.shell_error == 0 then
      local new_lines = vim.split(result, '\n', { plain = true })
      vim.api.nvim_buf_set_lines(bufnr, 0, -1, false, new_lines)
    else
      vim.notify('sql-formatter failed: ' .. result, vim.log.levels.ERROR)
    end
    return
  end

  if js_like_filetypes[filetype] then
    if #vim.lsp.get_clients({ bufnr = bufnr, name = 'eslint' }) > 0 then
      return format_with_client('eslint')
    end

    if #vim.lsp.get_clients({ bufnr = bufnr, name = 'ts_ls' }) > 0 then
      return format_with_client('ts_ls')
    end
  end

  vim.lsp.buf.format({ async = false, bufnr = bufnr })
end

-- Format code
vim.keymap.set('n', 'fmt', function()
  if vim.bo.filetype == 'go' then
    -- Organize imports first
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
  end
  format_with_preference()
end, opts)

vim.keymap.set('n', 'sa', function()
  if vim.bo.filetype == 'go' then
    -- Organize imports first
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
    -- Then format
    format_with_preference()
  end
  vim.cmd('w')
end)                                                            -- Save file
vim.keymap.set('n', 'wq', ':wq<CR>')                            -- Save and close file
vim.keymap.set('n', 'qf', ':lua vim.lsp.buf.code_action()<CR>') -- Show LSP quick fix suggestions
vim.keymap.set('n', 'gd', ':lua vim.lsp.buf.definition()<CR>')  -- Go to definition
vim.keymap.set('n', 'sd', function()
  -- Get current position
  local params = vim.lsp.util.make_position_params()

  -- Request definition and show in floating window
  vim.lsp.buf_request(0, 'textDocument/definition', params, function(err, result, ctx, config)
    if err or not result or #result == 0 then
      print('No definition found')
      return
    end

    -- Get the first result
    local definition = result[1]

    -- Get file content
    local uri = definition.uri or definition.targetUri
    local range = definition.range or definition.targetRange
    local filename = vim.uri_to_fname(uri)

    -- Read the file
    local lines = {}
    local file = io.open(filename, 'r')
    if file then
      for line in file:lines() do
        table.insert(lines, line)
      end
      file:close()
    end

    -- Extract function definition (get some context around the definition)
    local start_line = math.max(1, range.start.line - 5)
    local end_line = math.min(#lines, range['end'].line + 10)

    local content = {}
    for i = start_line, end_line do
      local line_content = lines[i] or ''
      if i == range.start.line + 1 then
        line_content = line_content .. ' ← Definition'
      end
      table.insert(content, string.format('%3d %s', i, line_content))
    end

    -- Create floating window
    local buf = vim.api.nvim_create_buf(false, true)
    vim.api.nvim_buf_set_lines(buf, 0, -1, false, content)

    -- Set buffer options
    vim.api.nvim_buf_set_option(buf, 'buftype', 'nofile')
    vim.api.nvim_buf_set_option(buf, 'bufhidden', 'wipe')
    vim.api.nvim_buf_set_option(buf, 'filetype', vim.bo.filetype)

    -- Calculate window size
    local width = math.min(80, vim.o.columns - 10)
    local height = math.min(20, #content)

    -- Get cursor position for window placement
    local cursor_row = vim.api.nvim_win_get_cursor(0)[1]
    local win_height = vim.api.nvim_win_get_height(0)
    local row = math.min(cursor_row + 1, win_height - height - 2)

    -- Create floating window
    local win = vim.api.nvim_open_win(buf, false, {
      relative = 'win',
      win = 0,
      row = row,
      col = 2,
      width = width,
      height = height,
      border = 'rounded',
      style = 'minimal',
      focusable = true,
      zindex = 50,
    })

    -- Set window options
    vim.api.nvim_win_set_option(win, 'winhl', 'Normal:Normal,FloatBorder:DiagnosticInfo')
    vim.api.nvim_win_set_option(win, 'signcolumn', 'no')

    -- Add keymaps to close the window
    local close_win = function()
      if vim.api.nvim_win_is_valid(win) then
        vim.api.nvim_win_close(win, true)
      end
    end

    vim.keymap.set('n', 'q', close_win, { buffer = buf, nowait = true })
    vim.keymap.set('n', '<Esc>', close_win, { buffer = buf, nowait = true })

    -- Close window when cursor moves
    vim.api.nvim_create_autocmd({ 'CursorMoved', 'CursorMovedI', 'BufLeave' }, {
      buffer = 0,
      once = true,
      callback = close_win,
    })

    -- Close window when inserting text
    vim.api.nvim_create_autocmd({ 'InsertEnter' }, {
      once = true,
      callback = close_win,
    })
  end)
end, { desc = 'Show definition in floating window' })
vim.keymap.set('n', 'gr', ':lua vim.lsp.buf.references()<CR>') -- View references
vim.keymap.set('n', 'K', ':lua vim.lsp.buf.hover()<CR>')       -- Show hover information
vim.keymap.set('n', '<space>K', function()
  -- Get hover information and copy to clipboard
  local params = vim.lsp.util.make_position_params()
  vim.lsp.buf_request(0, 'textDocument/hover', params, function(err, result, ctx, config)
    if result and result.contents then
      local content = ''
      if type(result.contents) == 'string' then
        content = result.contents
      elseif result.contents.value then
        content = result.contents.value
      elseif type(result.contents) == 'table' then
        for _, item in ipairs(result.contents) do
          if type(item) == 'string' then
            content = content .. item .. '\n'
          elseif item.value then
            content = content .. item.value .. '\n'
          end
        end
      end
      if content ~= '' then
        vim.fn.setreg('+', content)
        print('Hover content copied to clipboard')
      else
        print('No hover content available')
      end
    else
      print('No hover information available')
    end
  end)
end, { desc = 'Copy hover content to clipboard' })
vim.keymap.set('n', 'gs', ':lua require("fzf-lua").live_grep()<CR>')      -- Use fzf-lua for global search
vim.keymap.set('n', '<D-S-f>', ':lua require("fzf-lua").live_grep()<CR>') -- Use Command+Shift+F for global search
vim.keymap.set('n', 'cs', ':lua require("fzf-lua").lgrep_curbuf()<CR>')   -- Use fzf-lua to search in current file
vim.keymap.set('n', '<space>f', ':lua require("fzf-lua").files()<CR>')    -- Use fzf-lua to find files by name
vim.keymap.set('n', 'x', ':q<CR>')                                        -- Close current file

-- Split screen operation keymap
vim.keymap.set('n', 'wx', ':split<CR>')  -- Split screen horizontally
vim.keymap.set('n', 'wy', ':vsplit<CR>') -- Split screen vertically
vim.keymap.set('n', 'wc', ':close<CR>')  -- Close current split screen

-- Window switching keymap
vim.keymap.set('n', 'wh', '<C-w>h') -- Switch to left window
vim.keymap.set('n', 'wl', '<C-w>l') -- Switch to right window
vim.keymap.set('n', 'wk', '<C-w>k') -- Switch to top window
vim.keymap.set('n', 'wj', '<C-w>j') -- Switch to bottom window

-- Tab switching keymap (barbar plugin)
vim.keymap.set('n', 'th', ':BufferPrevious<CR>') -- Switch to previous buffer
vim.keymap.set('n', 'tl', ':BufferNext<CR>')     -- Switch to next buffer
vim.keymap.set('n', 'tx', ':BufferClose<CR>')    -- Close current buffer
vim.keymap.set('n', 'gb', '<C-^>', { noremap = true, silent = true })

-- Movement related keymap configuration
vim.keymap.set('n', '<space>k', '10k') -- Move up 10 lines
vim.keymap.set('n', '<space>j', '10j') -- Move down 10 lines
vim.keymap.set('n', '<space>h', '10h') -- Move left 10 characters
vim.keymap.set('n', '<space>l', '10l') -- Move right 10 characters

-- Quick movement keymap (using Hop)
vim.keymap.set('n', '<space><space>k', ':HopLineStartBC<CR>') -- Move up
vim.keymap.set('n', '<space><space>j', ':HopLineStartAC<CR>') -- Move down
vim.keymap.set('n', '<space><space>h', ':HopWordBC<CR>')      -- Move left 20 characters
vim.keymap.set('n', '<space><space>l', ':HopWordAC<CR>')      -- Move right 20 characters

vim.opt.termguicolors = true

vim.opt.tabstop = 2
vim.opt.expandtab = true
vim.opt.shiftwidth = 2

vim.opt.nu = true

vim.o.clipboard = "unnamedplus"
vim.o.background = "dark"
vim.o.scrolloff = 10

-- terminal config
function OpenTerminal()
  vim.cmd('botright vsplit')
  vim.cmd('vertical resize 50')
  vim.cmd('terminal')
end

vim.api.nvim_create_user_command('Term', OpenTerminal, {})
vim.keymap.set('n', '<leader>t', ':Term<CR>')
vim.keymap.set('t', '<Esc><Esc>', '<C-\\><C-n>', { desc = 'Exit terminal mode' })

-- Diagnostic keymaps
vim.keymap.set('n', '<space>e', ':lua vim.diagnostic.open_float()<CR>') -- Show diagnostic in float window
vim.keymap.set('n', '[d', ':lua vim.diagnostic.goto_prev()<CR>')        -- Go to previous diagnostic
vim.keymap.set('n', ']d', ':lua vim.diagnostic.goto_next()<CR>')        -- Go to next diagnostic
vim.keymap.set('n', '<space>q', ':lua vim.diagnostic.setloclist()<CR>') -- Show diagnostic list

-- Copy diagnostic content to clipboard
vim.keymap.set('n', '<space>c', function()
  local diagnostics = vim.diagnostic.get(0, { lnum = vim.fn.line('.') - 1 })
  if #diagnostics > 0 then
    local messages = {}
    for _, diagnostic in ipairs(diagnostics) do
      table.insert(messages, diagnostic.message)
    end
    local content = table.concat(messages, '\n')
    vim.fn.setreg('+', content)
    print('Diagnostic copied to clipboard')
  else
    print('No diagnostic at cursor')
  end
end, { desc = 'Copy diagnostic to clipboard' })

-- Diagnostic configuration
vim.diagnostic.config({
  virtual_text = true,
  signs = true,
  underline = true,
  update_in_insert = false,
  severity_sort = true,
  float = {
    border = 'rounded',
    source = 'always',
    header = '',
    prefix = '',
  },
})

-- Auto show diagnostic on cursor hold
vim.api.nvim_create_autocmd("CursorHold", {
  callback = function()
    local opts = {
      focusable = false,
      close_events = { "BufLeave", "CursorMoved", "InsertEnter", "FocusLost" },
      border = 'rounded',
      source = 'always',
      prefix = ' ',
      scope = 'cursor',
    }
    vim.diagnostic.open_float(nil, opts)
  end
})

-- Inlay hint toggle command
vim.api.nvim_create_user_command('InlayHintToggle', function()
  local bufnr = vim.api.nvim_get_current_buf()
  local current_state = vim.lsp.inlay_hint.is_enabled({ bufnr = bufnr })
  vim.lsp.inlay_hint.enable(not current_state, { bufnr = bufnr })
  if not current_state then
    print('Inlay hints enabled')
  else
    print('Inlay hints disabled')
  end
end, { desc = 'Toggle inlay type hints' })

-- Keymap for inlay hint toggle
vim.keymap.set('n', '<leader>ih', ':InlayHintToggle<CR>', { desc = 'Toggle inlay hints' })
