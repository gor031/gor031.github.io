const bookButtons = document.querySelectorAll('[data-notebook]');
const editorLayer = document.querySelector('#editorLayer');
const editorCard = document.querySelector('.editor-card');
const editorKicker = document.querySelector('#editorKicker');
const editorTitle = document.querySelector('#editorTitle');
const noteInput = document.querySelector('#noteInput');
const noteCount = document.querySelector('#noteCount');
const primaryAction = document.querySelector('#primaryAction');
const closeEditorButton = document.querySelector('#closeEditor');
const trashButton = document.querySelector('#trashBtn');
const successHistory = document.querySelector('#successHistory');
const successList = document.querySelector('#successList');
const toast = document.querySelector('#toast');

const DISCARD_KEY = 'maumswim-discard-draft';
const SUCCESS_KEY = 'maumswim-success-notes';
let currentMode = 'discard';

const notebookCopy = {
  discard: {
    kicker: '남겨두지 않아도 되는 마음',
    title: '버림노트',
    placeholder: '답답했던 일, 화나는 일, 내려놓고 싶은 생각을 적어보세요.',
    action: '휴지통에 버리기'
  },
  success: {
    kicker: '작은 일도 분명한 나의 기록',
    title: '성공노트',
    placeholder: '오늘 해낸 일, 잘한 일, 버텨낸 일을 적어보세요.',
    action: '성공으로 저장하기'
  }
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function updateCount() {
  noteCount.textContent = `${noteInput.value.length} / 500`;
}

function readSuccessNotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(SUCCESS_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function renderSuccessHistory() {
  const notes = readSuccessNotes();
  successList.replaceChildren();

  if (!notes.length) {
    const empty = document.createElement('p');
    empty.className = 'success-list-empty';
    empty.textContent = '아직 적힌 성공이 없어요.';
    successList.appendChild(empty);
    return;
  }

  notes.slice(0, 8).forEach((note) => {
    const article = document.createElement('article');
    article.className = 'success-entry';

    const time = document.createElement('time');
    const date = new Date(note.createdAt);
    time.dateTime = note.createdAt;
    time.textContent = Number.isNaN(date.getTime())
      ? '기록된 성공'
      : new Intl.DateTimeFormat('ko-KR', {
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);

    const text = document.createElement('p');
    text.textContent = note.text;

    article.append(time, text);
    successList.appendChild(article);
  });
}

function openNotebook(mode) {
  currentMode = mode;
  const copy = notebookCopy[mode];

  editorCard.classList.toggle('discard-mode', mode === 'discard');
  editorCard.classList.toggle('success-mode', mode === 'success');
  editorKicker.textContent = copy.kicker;
  editorTitle.textContent = copy.title;
  noteInput.placeholder = copy.placeholder;
  primaryAction.textContent = copy.action;
  successHistory.hidden = mode !== 'success';
  noteInput.value = mode === 'discard' ? localStorage.getItem(DISCARD_KEY) || '' : '';

  if (mode === 'success') renderSuccessHistory();
  updateCount();
  editorLayer.hidden = false;
  document.body.classList.add('modal-open');
  setTimeout(() => noteInput.focus(), 80);
}

function closeNotebook() {
  editorLayer.hidden = true;
  document.body.classList.remove('modal-open');
}

function animatePaperToTrash(startRect) {
  const endRect = trashButton.getBoundingClientRect();
  const paper = document.createElement('div');
  paper.className = 'paper-ball';
  paper.style.left = `${startRect.left + startRect.width / 2 - 17}px`;
  paper.style.top = `${startRect.top + startRect.height / 2 - 17}px`;
  document.body.appendChild(paper);

  requestAnimationFrame(() => {
    paper.style.left = `${endRect.left + endRect.width / 2 - 8}px`;
    paper.style.top = `${endRect.top + endRect.height / 2 - 8}px`;
    paper.style.transform = 'scale(.2) rotate(560deg)';
    paper.style.opacity = '0';
  });

  setTimeout(() => paper.remove(), 780);
}

function discardNote() {
  if (!noteInput.value.trim()) {
    showToast('버리고 싶은 마음을 먼저 적어보세요.');
    return;
  }

  const startRect = editorCard.getBoundingClientRect();
  localStorage.removeItem(DISCARD_KEY);
  noteInput.value = '';
  updateCount();
  closeNotebook();
  animatePaperToTrash(startRect);
  setTimeout(() => showToast('그 마음은 휴지통에 내려놓았어요.'), 420);
}

function saveSuccess() {
  const text = noteInput.value.trim();
  if (!text) {
    showToast('오늘 해낸 일을 한 가지 적어보세요.');
    return;
  }

  const notes = readSuccessNotes();
  notes.unshift({ text, createdAt: new Date().toISOString() });
  localStorage.setItem(SUCCESS_KEY, JSON.stringify(notes.slice(0, 50)));
  noteInput.value = '';
  updateCount();
  renderSuccessHistory();
  showToast('오늘의 성공을 기록했어요.');
}

bookButtons.forEach((button) => {
  button.addEventListener('click', () => openNotebook(button.dataset.notebook));
});

noteInput.addEventListener('input', () => {
  updateCount();
  if (currentMode === 'discard') {
    localStorage.setItem(DISCARD_KEY, noteInput.value);
  }
});

primaryAction.addEventListener('click', () => {
  if (currentMode === 'discard') discardNote();
  else saveSuccess();
});

trashButton.addEventListener('click', () => {
  const draft = localStorage.getItem(DISCARD_KEY);
  if (!draft) {
    showToast('휴지통은 비어 있어요.');
    return;
  }

  const discardBook = document.querySelector('.discard-book').getBoundingClientRect();
  localStorage.removeItem(DISCARD_KEY);
  animatePaperToTrash(discardBook);
  showToast('작성 중이던 버림노트를 비웠어요.');
});

closeEditorButton.addEventListener('click', closeNotebook);
editorLayer.addEventListener('click', (event) => {
  if (event.target === editorLayer) closeNotebook();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !editorLayer.hidden) closeNotebook();
});
