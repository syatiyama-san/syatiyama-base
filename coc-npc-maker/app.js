(() => {
  const formatSelect = document.getElementById('formatSelect');
  const nameInput = document.getElementById('nameInput');
  const initiativeInput = document.getElementById('initiativeInput');
  const memoInput = document.getElementById('memoInput');
  const statusList = document.getElementById('statusList');
  const paramList = document.getElementById('paramList');
  const skillList = document.getElementById('skillList');
  const addStatusBtn = document.getElementById('addStatusBtn');
  const addParamBtn = document.getElementById('addParamBtn');
  const addSkillBtn = document.getElementById('addSkillBtn');
  const includeParamRolls = document.getElementById('includeParamRolls');
  const output = document.getElementById('output');
  const copyBtn = document.getElementById('copyBtn');
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const resetBtn = document.getElementById('resetBtn');

  let dragState = null;

  const state = {
    format: '6ccb',
    name: '',
    memo: '',
    initiative: '',
    statuses: [
      { label: '', value: '', max: '' }
    ],
    params: [
      { label: 'STR', value: '' },
      { label: 'CON', value: '' },
      { label: 'POW', value: '' },
      { label: 'DEX', value: '' },
      { label: 'APP', value: '' },
      { label: 'SIZ', value: '' },
      { label: 'INT', value: '' },
      { label: 'EDU', value: '' }
    ],
    skills: [
      { label: '', value: '' }
    ]
  };

  function clampNumber(value, fallback) {
    if (Number.isFinite(value)) return value;
    return fallback;
  }

  function getFormatPrefix(format) {
    if (format === '6ccb') return 'CCB';
    if (format === '6cc') return 'CC';
    return 'CC';
  }

  function getStatusValue(label) {
    const found = state.statuses.find(item => item.label === label);
    return found ? found.value : '';
  }

  function hasInputValue(value) {
    return String(value ?? '').trim() !== '';
  }

  function rollDice(expr) {
    // Parse and evaluate dice expressions like "3d6", "18-1d2", "3d6*5", "2d6+5", "(2d6+6)*5"
    const expr_trimmed = expr.trim();
    
    // Replace dice rolls with actual values
    let result_expr = expr_trimmed.replace(/\b(\d+)d(\d+)\b/g, (match, numDice, numSides) => {
      const n = parseInt(numDice, 10);
      const s = parseInt(numSides, 10);
      if (n <= 0 || s <= 0) return match;
      let total = 0;
      for (let i = 0; i < n; i++) {
        total += Math.floor(Math.random() * s) + 1;
      }
      return total;
    });
    
    // Check if result_expr is a valid math expression
    // Only allow digits, +, -, *, /, () and spaces
    if (!/^[0-9+\-*/()\s]*$/.test(result_expr)) return null;
    
    try {
      // Use Function instead of eval for slightly safer evaluation
      const result = Function('"use strict"; return (' + result_expr + ')')();
      if (!Number.isFinite(result) || result < 0) return null;
      return Math.round(result);
    } catch (e) {
      return null;
    }
  }

  function buildCommands() {
    const prefix = getFormatPrefix(state.format);
    const commands = [];
    const san = getStatusValue('SAN');
    if (san !== '') {
      commands.push(`1d100<=${san} 【正気度ロール】`);
    }

    state.skills.forEach(skill => {
      if (!skill.label || !hasInputValue(skill.value)) return;
      const value = skill.value;
      commands.push(`${prefix}<=${value} 【${skill.label}】`);
    });

    if (includeParamRolls.checked) {
      state.params.forEach(param => {
        if (!param.label || !hasInputValue(param.value)) return;
        const value = param.value;
        if (state.format === '7cc') {
          commands.push(`${prefix}<=${value} 【${param.label}】`);
        } else {
          commands.push(`${prefix}<=${value}*5 【${param.label} × 5】`);
        }
      });
    }

    return commands.join('\n');
  }

  function buildOutput() {
    const initiative = clampNumber(Number(initiativeInput.value), 0);
    const status = state.statuses
      .filter(item => hasInputValue(item.value))
      .map(item => ({
        label: item.label || '',
        value: clampNumber(Number(item.value), 0),
        max: clampNumber(Number(item.max), clampNumber(Number(item.value), 0))
      }));

    const params = state.params
      .filter(item => hasInputValue(item.value) && item.label)
      .map(item => ({
        label: item.label || '',
        value: String(item.value ?? '')
      }));

    const data = {
      name: nameInput.value || '',
      memo: memoInput.value || '',
      initiative,
      externalUrl: '',
      iconUrl: '',
      commands: buildCommands(),
      status,
      params
    };

    const payload = {
      kind: 'character',
      data
    };

    output.textContent = JSON.stringify(payload);
  }

  function renderStatusList() {
    statusList.innerHTML = '';
    state.statuses.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'list-row';
      row.dataset.index = String(index);
      row.dataset.type = 'status';
      row.addEventListener('dragover', onListDragOver);
      row.addEventListener('drop', onListDrop);

      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.textContent = '≡';
      handle.draggable = true;
      handle.addEventListener('dragstart', onListDragStart);
      handle.addEventListener('dragend', onListDragEnd);

      const label = document.createElement('input');
      label.type = 'text';
      label.placeholder = 'ステータス';
      label.value = item.label;
      label.addEventListener('input', () => {
        state.statuses[index].label = label.value;
        buildOutput();
      });

      const value = document.createElement('input');
      value.type = 'number';
      value.className = 'short';
      value.placeholder = '現在値';
      value.value = item.value;
      value.addEventListener('input', () => {
        state.statuses[index].value = value.value;
        buildOutput();
      });

      const max = document.createElement('input');
      max.type = 'number';
      max.className = 'short';
      max.placeholder = '最大値';
      max.value = item.max;
      max.addEventListener('input', () => {
        state.statuses[index].max = max.value;
        buildOutput();
      });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.textContent = '削除';
      remove.addEventListener('click', () => {
        state.statuses.splice(index, 1);
        renderStatusList();
        buildOutput();
      });

      row.appendChild(handle);
      row.appendChild(label);
      row.appendChild(value);
      row.appendChild(max);
      row.appendChild(remove);
      statusList.appendChild(row);
    });
  }

  function renderParamList() {
    paramList.innerHTML = '';
    state.params.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'list-row';
      row.dataset.index = String(index);
      row.dataset.type = 'param';
      row.addEventListener('dragover', onListDragOver);
      row.addEventListener('drop', onListDrop);

      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.textContent = '≡';
      handle.draggable = true;
      handle.addEventListener('dragstart', onListDragStart);
      handle.addEventListener('dragend', onListDragEnd);

      const label = document.createElement('input');
      label.type = 'text';
      label.placeholder = '能力値';
      label.value = item.label;
      label.addEventListener('input', () => {
        state.params[index].label = label.value;
        buildOutput();
      });

      const value = document.createElement('input');
      value.type = 'number';
      value.placeholder = '値';
      value.value = item.value;
      value.addEventListener('input', () => {
        state.params[index].value = value.value;
        buildOutput();
      });

      const dice = document.createElement('select');
      dice.className = 'dice-select';
      const options = [
        { text: 'ダイスを選択', value: '' },
        { text: '3d6', value: '3d6' },
        { text: '2d6+6', value: '2d6+6' },
        { text: '3d6+3', value: '3d6+3' },
        { text: '3d6*5', value: '3d6*5' },
        { text: '(2d6+6)*5', value: '(2d6+6)*5' },
        { text: '自由入力', value: 'custom' }
      ];
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        dice.appendChild(option);
      });

      const diceCustom = document.createElement('input');
      diceCustom.type = 'text';
      diceCustom.className = 'dice-input';
      diceCustom.placeholder = 'ダイス式を入力';
      diceCustom.style.display = 'none';
      diceCustom.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') rollBtn.click();
      });

      dice.addEventListener('change', () => {
        if (dice.value === 'custom') {
          diceCustom.style.display = '';
          diceCustom.focus();
        } else {
          diceCustom.style.display = 'none';
        }
      });

      const rollBtn = document.createElement('button');
      rollBtn.type = 'button';
      rollBtn.className = 'roll-btn';
      rollBtn.textContent = '🎲';
      rollBtn.title = 'ダイスをロール';
      rollBtn.addEventListener('click', () => {
        let diceStr;
        if (dice.value === 'custom') {
          diceStr = diceCustom.value.trim();
        } else {
          diceStr = dice.value;
        }
        if (!diceStr) return;
        const result = rollDice(diceStr);
        if (result !== null) {
          value.value = result;
          state.params[index].value = result;
          buildOutput();
        }
      });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.textContent = '削除';
      remove.addEventListener('click', () => {
        state.params.splice(index, 1);
        renderParamList();
        buildOutput();
      });

      row.appendChild(handle);
      row.appendChild(label);
      row.appendChild(value);
      row.appendChild(dice);
      row.appendChild(diceCustom);
      row.appendChild(rollBtn);
      row.appendChild(remove);
      paramList.appendChild(row);
    });
  }

  function renderSkillList() {
    skillList.innerHTML = '';
    state.skills.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'list-row';
      row.dataset.index = String(index);
      row.dataset.type = 'skill';
      row.addEventListener('dragover', onListDragOver);
      row.addEventListener('drop', onListDrop);

      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.textContent = '≡';
      handle.draggable = true;
      handle.addEventListener('dragstart', onListDragStart);
      handle.addEventListener('dragend', onListDragEnd);

      const label = document.createElement('input');
      label.type = 'text';
      label.placeholder = '技能';
      label.value = item.label;
      label.addEventListener('input', () => {
        state.skills[index].label = label.value;
        buildOutput();
      });

      const value = document.createElement('input');
      value.type = 'number';
      value.placeholder = '技能値';
      value.value = item.value;
      value.addEventListener('input', () => {
        state.skills[index].value = value.value;
        buildOutput();
      });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.textContent = '削除';
      remove.addEventListener('click', () => {
        state.skills.splice(index, 1);
        renderSkillList();
        buildOutput();
      });

      row.appendChild(handle);
      row.appendChild(label);
      row.appendChild(value);
      row.appendChild(remove);
      skillList.appendChild(row);
    });
  }

  function onListDragStart(e) {
    const row = e.currentTarget.parentElement;
    dragState = {
      type: row.dataset.type,
      index: Number(row.dataset.index)
    };
    row.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function onListDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function onListDrop(e) {
    e.preventDefault();
    if (!dragState) return;
    const row = e.currentTarget;
    const toIndex = Number(row.dataset.index);
    if (dragState.type !== row.dataset.type || dragState.index === toIndex) return;
    const list = getListByType(dragState.type);
    if (!list) return;
    const [moved] = list.splice(dragState.index, 1);
    list.splice(toIndex, 0, moved);
    dragState = null;
    renderAllLists();
    buildOutput();
  }

  function onListDragEnd(e) {
    const row = e.currentTarget.parentElement;
    row.classList.remove('dragging');
    dragState = null;
  }

  function getListByType(type) {
    if (type === 'status') return state.statuses;
    if (type === 'param') return state.params;
    if (type === 'skill') return state.skills;
    return null;
  }

  function renderAllLists() {
    renderStatusList();
    renderParamList();
    renderSkillList();
  }

  function bindBaseInputs() {
    formatSelect.addEventListener('change', () => {
      state.format = formatSelect.value;
      buildOutput();
    });

    nameInput.addEventListener('input', buildOutput);
    initiativeInput.addEventListener('input', buildOutput);
    memoInput.addEventListener('input', buildOutput);
    includeParamRolls.addEventListener('change', buildOutput);

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const outputPanel = document.querySelector('.output-panel');
      if (outputPanel) outputPanel.scrollTo({ top: 0, behavior: 'smooth' });
    });

    resetBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }

  async function copyOutput() {
    const text = output.textContent || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'コピー完了';
      setTimeout(() => {
        copyBtn.textContent = 'クリップボードにコピー';
      }, 1200);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
  }

  addStatusBtn.addEventListener('click', () => {
    state.statuses.push({ label: '', value: '', max: '' });
    renderStatusList();
    buildOutput();
  });

  addParamBtn.addEventListener('click', () => {
    state.params.push({ label: '', value: '' });
    renderParamList();
    buildOutput();
  });

  addSkillBtn.addEventListener('click', () => {
    state.skills.push({ label: '', value: '' });
    renderSkillList();
    buildOutput();
  });

  copyBtn.addEventListener('click', copyOutput);

  renderAllLists();
  bindBaseInputs();
  buildOutput();
})();
