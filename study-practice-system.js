/* Study Practice System
 * Question bank + practice quizzes + scoring + incorrect-answer review.
 */
(function () {
  'use strict';

  const KEY = 'plannerData';
  const TYPES = ['multiple-choice', 'true-false', 'short-answer'];

  function data() {
    const d = JSON.parse(localStorage.getItem(KEY) || '{}');
    d.questionBank = Array.isArray(d.questionBank) ? d.questionBank : [];
    d.studyQuizzes = Array.isArray(d.studyQuizzes) ? d.studyQuizzes : [];
    d.studyPracticeHistory = Array.isArray(d.studyPracticeHistory) ? d.studyPracticeHistory : [];
    return d;
  }

  function save(d) {
    localStorage.setItem(KEY, JSON.stringify(d));
    window.dispatchEvent(new CustomEvent('planner-data-changed'));
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function subjects() {
    const d = data();
    return (d.settings && Array.isArray(d.settings.subjects) ? d.settings.subjects : []).filter(s => s && (s.active !== false));
  }

  function normalizeQuestion(q) {
    if (!q || !q.question) return null;
    return {
      id: q.id || 'Q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      question: String(q.question),
      answer: String(q.answer ?? ''),
      explanation: String(q.explanation ?? ''),
      type: TYPES.includes(q.type) ? q.type : 'short-answer',
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      subject: String(q.subject || ''),
      unit: String(q.unit || ''),
      topic: String(q.topic || ''),
      tags: Array.isArray(q.tags) ? q.tags : [],
      createdAt: q.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function buildQuestionFromCard(card, set) {
    return normalizeQuestion({
      question: card.front,
      answer: card.back,
      explanation: 'Answer based on the study card.',
      type: 'short-answer',
      subject: set.subject,
      unit: set.unit,
      topic: card.tag || '',
      tags: ['#Flashcard']
    });
  }

  function getQuestions(filters = {}) {
    const d = data();
    let qs = d.questionBank.map(normalizeQuestion).filter(Boolean);
    if (filters.subject) qs = qs.filter(q => q.subject === filters.subject);
    if (filters.unit) qs = qs.filter(q => q.unit === filters.unit);
    if (filters.topic) qs = qs.filter(q => q.topic === filters.topic);

    // Supplement the bank with valid flashcards without modifying the native study set system.
    if (filters.includeCards !== false && Array.isArray(d.studySets)) {
      d.studySets.forEach(set => {
        if (!set || !Array.isArray(set.items) || (filters.subject && set.subject !== filters.subject)) return;
        set.items.forEach(card => {
          if (!card || !card.front || !card.back) return;
          qs.push(buildQuestionFromCard(card, set));
        });
      });
    }

    const seen = new Set();
    return qs.filter(q => {
      const key = q.question.trim().toLowerCase() + '|' + q.subject;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function answerCorrect(q, value) {
    const given = String(value || '').trim().toLowerCase();
    const correct = String(q.answer || '').trim().toLowerCase();
    if (!given) return false;
    if (q.type === 'true-false') return given === correct || (given === 'true' && correct === 't') || (given === 'false' && correct === 'f');
    return given === correct;
  }

  function ensurePage() {
    let page = document.getElementById('studyPracticePage');
    if (page) return page;
    page = document.createElement('div');
    page.id = 'studyPracticePage';
    page.className = 'page-hidden';
    page.innerHTML = '<header class="header study-practice-header"><div><h1>Practice</h1><p>Test yourself with your question bank and study material.</p></div><button class="save-button" id="newPracticeQuizBtn">+ Practice Quiz</button></header><section class="card study-practice-card"><div class="study-practice-toolbar"><select id="practiceSubject"><option value="">All subjects</option></select><select id="practiceCount"><option value="5">5 questions</option><option value="10" selected>10 questions</option><option value="15">15 questions</option><option value="20">20 questions</option></select></div><div id="practiceLibrary"></div></section>';
    const main = document.querySelector('main.main');
    if (main) main.appendChild(page);

    const nav = document.querySelector('.sidebar');
    if (nav && !nav.querySelector('[data-page="study-practice"]')) {
      const section = document.createElement('div');
      section.className = 'nav-section';
      section.innerHTML = '<div class="nav-title">Study</div><a href="#study-practice" class="nav-item" data-page="study-practice" onclick="showPage(\'study-practice\'); return false;">📝 Practice</a>';
      nav.appendChild(section);
    }
    return page;
  }

  function openQuizBuilder() {
    const page = ensurePage();
    const subject = page.querySelector('#practiceSubject')?.value || '';
    const count = Number(page.querySelector('#practiceCount')?.value || 10);
    const qs = getQuestions({subject});
    if (!qs.length) return alert('There are no practice questions or flashcards available yet.');
    const chosen = shuffle(qs).slice(0, Math.min(count, qs.length));
    const quiz = {id:'PQ-'+Date.now(), name:(subject ? subject+' · ' : '')+'Practice Quiz', subject, questions:chosen.map(q=>q.id || q.question), createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()};
    // Store full snapshots so generated quizzes remain usable if source material changes.
    quiz.items = chosen;
    const d = data();
    d.studyQuizzes.unshift(quiz);
    save(d);
    runQuiz(quiz);
  }

  function runQuiz(quiz) {
    const items = Array.isArray(quiz.items) ? quiz.items : [];
    if (!items.length) return;
    let index = 0, score = 0;
    const answers = [];
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay study-practice-overlay';
    overlay.style.display = 'flex';
    document.body.appendChild(overlay);

    function render() {
      const q = items[index];
      const options = q.type === 'true-false' ? ['True','False'] : (q.type === 'multiple-choice' ? q.options : []);
      overlay.innerHTML = '<div class="modal study-practice-modal"><div class="modal-header"><h2>'+esc(quiz.name)+'</h2><button class="close-button" id="practiceClose">×</button></div><div class="practice-progress">Question '+(index+1)+' of '+items.length+'</div><div class="practice-question"><h3>'+esc(q.question)+'</h3>'+(options.length ? '<div class="practice-options">'+options.map(o=>'<button class="practice-option" data-answer="'+esc(o)+'">'+esc(o)+'</button>').join('')+'</div>' : '<textarea id="practiceAnswer" rows="5" placeholder="Type your answer from memory..."></textarea>')+'<div id="practiceFeedback"></div><button class="save-button" id="practiceSubmit">'+(index === items.length-1 ? 'Finish' : 'Check answer')+'</button></div></div>';
      overlay.querySelector('#practiceClose').onclick = () => overlay.remove();
      overlay.querySelectorAll('.practice-option').forEach(btn => btn.onclick = () => submit(btn.dataset.answer));
      overlay.querySelector('#practiceSubmit').onclick = () => submit(overlay.querySelector('#practiceAnswer')?.value || '');
    }

    function submit(value) {
      const q = items[index];
      const correct = answerCorrect(q, value);
      if (correct) score++;
      answers.push({question:q.question, given:value, correct, expected:q.answer});
      const fb = overlay.querySelector('#practiceFeedback');
      if (fb) fb.innerHTML = '<div class="practice-feedback '+(correct?'correct':'incorrect')+'"><strong>'+(correct?'✓ Correct':'Not quite')+'</strong><div>Answer: '+esc(q.answer)+'</div>'+(q.explanation?'<div>'+esc(q.explanation)+'</div>':'')+'</div>';
      const submit = overlay.querySelector('#practiceSubmit');
      if (!submit) return;
      if (index === items.length - 1) submit.textContent = 'See results';
      submit.onclick = () => {
        if (index === items.length - 1) finish(); else { index++; render(); }
      };
    }

    function finish() {
      const pct = Math.round(score / items.length * 100);
      const d = data();
      d.studyPracticeHistory.unshift({id:'PH-'+Date.now(), quizId:quiz.id, subject:quiz.subject, score, total:items.length, percentage:pct, incorrect:answers.filter(a=>!a.correct), completedAt:new Date().toISOString()});
      save(d);
      overlay.innerHTML = '<div class="modal study-practice-modal"><div class="modal-header"><h2>Practice complete</h2><button class="close-button" id="practiceDone">×</button></div><div class="practice-results"><div class="practice-score">'+pct+'%</div><p>'+score+' of '+items.length+' correct</p><p>'+(pct >= 80 ? 'Nice work. Keep going with spaced review.' : 'Review the missed questions and try again later.')+'</p><div class="practice-result-actions">'+(answers.some(a=>!a.correct)?'<button class="save-button" id="reviewIncorrect">Review incorrect</button>':'')+'<button class="cancel-button" id="closeResults">Done</button></div></div></div>';
      overlay.querySelector('#practiceDone').onclick = () => overlay.remove();
      overlay.querySelector('#closeResults').onclick = () => overlay.remove();
      const review = overlay.querySelector('#reviewIncorrect');
      if (review) review.onclick = () => { overlay.remove(); openIncorrectReview(answers.filter(a=>!a.correct)); };
    }

    render();
  }

  function openIncorrectReview(items) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay study-practice-overlay';
    overlay.style.display = 'flex';
    overlay.innerHTML = '<div class="modal study-practice-modal"><div class="modal-header"><h2>Review incorrect</h2><button class="close-button" id="reviewClose">×</button></div><div class="practice-review-list">'+items.map((a,i)=>'<article><span>'+(i+1)+'</span><h3>'+esc(a.question)+'</h3><p><strong>Your answer:</strong> '+esc(a.given || 'No answer')+'</p><p><strong>Correct answer:</strong> '+esc(a.expected)+'</p></article>').join('')+'</div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#reviewClose').onclick = () => overlay.remove();
  }

  function renderLibrary() {
    const page = ensurePage();
    const subjectSelect = page.querySelector('#practiceSubject');
    if (subjectSelect && subjectSelect.options.length <= 1) subjects().forEach(s => { const o=document.createElement('option'); o.value=s.name; o.textContent=(s.emoji||'📚')+' '+s.name; subjectSelect.appendChild(o); });
    const lib = page.querySelector('#practiceLibrary');
    if (!lib) return;
    const d = data();
    const history = d.studyPracticeHistory || [];
    const qs = getQuestions({subject:subjectSelect?.value || ''});
    lib.innerHTML = '<div class="practice-summary"><strong>'+qs.length+'</strong><span>available questions</span></div>' + (history.length ? '<h3>Recent practice</h3>'+history.slice(0,8).map(h=>'<article class="practice-history-card"><strong>'+h.percentage+'%</strong><span>'+h.score+'/'+h.total+' correct</span><small>'+new Date(h.completedAt).toLocaleString()+'</small></article>').join('') : '<div class="practice-empty">No practice sessions yet.</div>');
  }

  function init() {
    const page = ensurePage();
    page.querySelector('#newPracticeQuizBtn')?.addEventListener('click', openQuizBuilder);
    page.querySelector('#practiceSubject')?.addEventListener('change', renderLibrary);
    renderLibrary();
    window.renderStudyPractice = renderLibrary;
    window.openPracticeQuiz = openQuizBuilder;
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('planner-data-changed', () => { if (document.getElementById('studyPracticePage')) renderLibrary(); });
})();
