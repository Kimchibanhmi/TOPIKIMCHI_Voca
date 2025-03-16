// 게임 상태 관리를 위한 변수들
let currentWord = null;
let score = 0;
let hasUsedHint = false;
let timerInterval = null;
let timeLeft = 300; // 5분 = 300초
let isTimerPaused = false;
let correctWordCount = 0; // 맞힌 단어 수
let isGameStarted = false; // 게임 시작 여부

// DOM 요소들 선택
let gameContainer, initialSoundDisplay, topicDisplay, hintButton;
let hintDisplay, answerInput, submitButton, resultMessage;
let scoreDisplay, nextButton, resetButton, timerDisplay;
let startPopup, startGameButton, examplePopup, closePopupButton;
let continueButton,
  popupWordDisplay,
  koreanExampleDisplay,
  vietnameseExampleDisplay;
let timeoverPopup, finalScoreDisplay, correctCountDisplay, restartButton;

// DOM 요소 초기화 함수
function initializeDOM() {
  // 기본 게임 요소
  gameContainer = document.getElementById('game-container');
  initialSoundDisplay = document.getElementById('initial-sound-display');
  topicDisplay = document.getElementById('topic-display');
  hintButton = document.getElementById('hint-button');
  hintDisplay = document.getElementById('hint-display');
  answerInput = document.getElementById('answer-input');
  submitButton = document.getElementById('submit-button');
  resultMessage = document.getElementById('result-message');
  scoreDisplay = document.getElementById('score-display');
  nextButton = document.getElementById('next-button');
  resetButton = document.getElementById('reset-button');
  timerDisplay = document.getElementById('timer-display');

  // 팝업 관련 요소
  startPopup = document.getElementById('start-popup');
  startGameButton = document.getElementById('start-game-button');
  examplePopup = document.getElementById('example-popup');
  closePopupButton = document.getElementById('close-popup');
  continueButton = document.getElementById('continue-button');
  popupWordDisplay = document.getElementById('popup-word');
  koreanExampleDisplay = document.getElementById('korean-example');
  vietnameseExampleDisplay = document.getElementById('vietnamese-example');

  // 타임오버 팝업 요소
  timeoverPopup = document.getElementById('timeover-popup');
  finalScoreDisplay = document.getElementById('final-score');
  correctCountDisplay = document.getElementById('correct-count');
  restartButton = document.getElementById('restart-button');
}

// 초성 추출 함수
function getInitialSound(word) {
  const initialConsonants = [
    'ㄱ',
    'ㄲ',
    'ㄴ',
    'ㄷ',
    'ㄸ',
    'ㄹ',
    'ㅁ',
    'ㅂ',
    'ㅃ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅉ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
  ];
  let result = '';

  for (let i = 0; i < word.length; i++) {
    const charCode = word.charCodeAt(i);

    // 한글 음절 범위(AC00~D7A3) 내에 있는지 확인
    if (charCode >= 0xac00 && charCode <= 0xd7a3) {
      // 초성 인덱스 계산: (음절 코드 포인트 - 0xAC00) / 28 / 21
      const initialIndex = Math.floor((charCode - 0xac00) / 28 / 21);
      result += initialConsonants[initialIndex];
    } else {
      // 한글이 아닌 경우 그대로 추가
      result += word[i];
    }
  }

  return result;
}

// 랜덤 단어 선택 함수
function selectRandomWord() {
  if (window.allWords && window.allWords.length > 0) {
    const randomIndex = Math.floor(Math.random() * window.allWords.length);
    return window.allWords[randomIndex];
  } else {
    console.error('단어 목록이 비어 있거나 정의되지 않았습니다.');
    return null;
  }
}

// 타이머 표시 업데이트 함수
function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  // 시간이 얼마 남지 않았을 때 스타일 변경
  if (timeLeft <= 60) {
    timerDisplay.classList.add('timer-warning');
    document.querySelector('.timer-container').classList.add('danger');
  } else {
    timerDisplay.classList.remove('timer-warning');
    document.querySelector('.timer-container').classList.remove('danger');
  }

  // 시간이 10초 이하로 남았을 때 추가 강조
  if (timeLeft <= 10) {
    document.querySelector('.timer-container').style.animation =
      'blink 0.5s infinite';
  } else {
    document.querySelector('.timer-container').style.animation = 'none';
  }
}

// 타이머 시작 함수
function startTimer() {
  console.log('타이머 시작 함수 호출됨');

  // 이전 타이머가 있다면 중지
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // 타이머 초기화
  timeLeft = 300; // 5분으로 초기화
  isTimerPaused = false;
  updateTimerDisplay();

  // 새 타이머 시작
  timerInterval = setInterval(function () {
    if (!isTimerPaused && isGameStarted) {
      timeLeft--;
      updateTimerDisplay();

      if (timeLeft <= 0) {
        // 타이머가 0이 되면 게임 종료
        timeLeft = 0;
        updateTimerDisplay();
        endGame();
      }
    }
  }, 1000);
}

// 타이머 일시정지 함수
function pauseTimer() {
  isTimerPaused = true;
}

// 타이머 재개 함수
function resumeTimer() {
  if (isGameStarted) {
    isTimerPaused = false;
  }
}

// 게임 시작 함수
function startGame() {
  console.log('게임 시작 함수 호출됨');

  // 시작 팝업 숨기기
  startPopup.classList.add('hidden');

  // 타임오버 팝업 숨기기
  timeoverPopup.classList.add('hidden');

  // 게임 컨테이너 표시
  gameContainer.classList.remove('hidden');

  // 게임 초기화
  score = 0;
  correctWordCount = 0;
  scoreDisplay.textContent = '점수 / Điểm: 0';

  // 게임 시작 상태로 설정
  isGameStarted = true;

  // 타이머 시작
  startTimer();

  // 게임 초기화 (첫 단어 설정)
  initGame();
}

// 게임 종료 함수
function endGame() {
  // 게임이 시작되지 않았으면 함수 실행 종료
  if (!isGameStarted) {
    return;
  }

  // 타이머 중지
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // 게임 상태 변경
  isGameStarted = false;

  // 최종 점수 표시
  finalScoreDisplay.textContent = score;
  correctCountDisplay.textContent = `맞힌 단어: ${correctWordCount}개 / Số từ đúng: ${correctWordCount}`;

  // 게임 컨테이너 숨기기
  gameContainer.classList.add('hidden');

  // 타임오버 팝업 표시
  timeoverPopup.classList.remove('hidden');
}

// 화면 업데이트 함수
function updateDisplay() {
  if (currentWord) {
    const initialSound = getInitialSound(currentWord.word);
    initialSoundDisplay.textContent = initialSound;
    topicDisplay.textContent = 'Chủ đề: ' + currentWord.topic;

    // 점수 표시 업데이트
    scoreDisplay.textContent = `점수 / Điểm: ${score}`;
  }
}

// 게임 초기화 함수
function initGame() {
  console.log('게임 초기화 함수 호출됨');

  // words.js가 제대로 로드되었는지 확인
  if (!window.allWords) {
    initialSoundDisplay.textContent = '단어 데이터를 찾을 수 없습니다';
    console.error('단어 데이터(allWords)를 찾을 수 없습니다!');
    return;
  }

  // 새 단어 선택 및 화면 업데이트
  currentWord = selectRandomWord();
  updateDisplay();

  // 힌트 초기화
  hasUsedHint = false;
  hintDisplay.classList.add('hidden');
  hintDisplay.textContent = '';

  // 입력 필드 초기화
  answerInput.value = '';
  answerInput.disabled = false;
  submitButton.disabled = false;
  answerInput.focus();

  // 결과 메시지 초기화
  resultMessage.textContent = '';
  resultMessage.className = '';
}

// 게임 완전 재시작 함수
function restartGame() {
  console.log('재시작 함수 호출됨');

  // 타임오버 팝업 숨기기
  timeoverPopup.classList.add('hidden');

  // 게임 컨테이너 숨기기
  gameContainer.classList.add('hidden');

  // 시작 팝업 표시
  startPopup.classList.remove('hidden');

  // 타이머 중지
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // 게임 변수 초기화
  score = 0;
  correctWordCount = 0;
  isGameStarted = false;
  timeLeft = 300; // 타이머 리셋
  scoreDisplay.textContent = '점수 / Điểm: 0';
}

// 정답 확인 함수
function checkAnswer() {
  const userAnswer = answerInput.value.trim();

  if (!userAnswer) {
    resultMessage.textContent =
      '정답을 입력해주세요 / Vui lòng nhập câu trả lời';
    resultMessage.className = 'incorrect';
    return;
  }

  if (userAnswer === currentWord.word) {
    // 정답일 경우
    resultMessage.textContent = '정답입니다! / Chính xác!';
    resultMessage.className = 'correct';

    // 힌트 사용 여부에 따라 점수 부여
    if (hasUsedHint) {
      score += 1; // 힌트 사용 시 1점
    } else {
      score += 2; // 힌트 미사용 시 2점
    }

    // 맞힌 단어 수 증가
    correctWordCount++;

    // 점수 업데이트
    scoreDisplay.textContent = `점수 / Điểm: ${score}`;

    // 입력 필드와 제출 버튼 비활성화
    answerInput.disabled = true;
    submitButton.disabled = true;

    // 타이머 일시정지
    pauseTimer();

    // 예문 팝업 표시
    showExamplePopup();
  } else {
    // 오답일 경우
    resultMessage.textContent =
      '틀렸습니다. 다시 시도하세요. / Sai rồi. Hãy thử lại.';
    resultMessage.className = 'incorrect';
  }
}

// 예문 팝업 표시 함수
function showExamplePopup() {
  popupWordDisplay.textContent = currentWord.word;
  koreanExampleDisplay.textContent = currentWord.koreanExample;
  vietnameseExampleDisplay.textContent = currentWord.vietnameseExample;

  examplePopup.classList.remove('hidden');
}

// 힌트 표시 함수
function showHint() {
  if (!hasUsedHint) {
    hasUsedHint = true;
    hintDisplay.textContent = currentWord.hint;
    hintDisplay.classList.remove('hidden');
  }
}

// 이벤트 리스너 등록 함수
function setupEventListeners() {
  // 시작 버튼 클릭 시
  startGameButton.addEventListener('click', startGame);

  // 제출 버튼 클릭 시
  submitButton.addEventListener('click', checkAnswer);

  // 엔터 키로 제출 시
  answerInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  });

  // 힌트 버튼 클릭 시
  hintButton.addEventListener('click', showHint);

  // 다음 버튼 클릭 시
  nextButton.addEventListener('click', function () {
    resumeTimer(); // 타이머 재개
    initGame();
  });

  // 재시작 버튼 클릭 시
  resetButton.addEventListener('click', function () {
    if (
      confirm(
        '게임을 처음부터 다시 시작하시겠습니까? / Bạn có muốn bắt đầu lại trò chơi từ đầu không?'
      )
    ) {
      restartGame();
    }
  });

  // 팝업 닫기 버튼 클릭 시
  closePopupButton.addEventListener('click', function () {
    examplePopup.classList.add('hidden');
    resumeTimer(); // 타이머 재개
    initGame(); // 다음 단어로 넘어가기
  });

  // 계속 버튼 클릭 시
  continueButton.addEventListener('click', function () {
    examplePopup.classList.add('hidden');
    resumeTimer(); // 타이머 재개
    initGame(); // 다음 단어로 넘어가기
  });

  // 게임 재시작 버튼 클릭 시 (타임오버 팝업)
  restartButton.addEventListener('click', restartGame);
}

// 초기화 함수
function initialize() {
  console.log('게임 초기화 시작');

  // DOM 요소 초기화
  initializeDOM();

  // 시작 시 모든 팝업 및 컨테이너 상태 초기화
  gameContainer.classList.add('hidden');
  examplePopup.classList.add('hidden');
  timeoverPopup.classList.add('hidden');
  startPopup.classList.remove('hidden');

  // 타이머 초기 표시
  timeLeft = 300;
  timerDisplay.textContent = '05:00';

  // 게임 상태 초기화
  isGameStarted = false;
  score = 0;
  correctWordCount = 0;

  // 이벤트 리스너 설정
  setupEventListeners();

  // words.js 로드 확인
  if (typeof window.allWords === 'undefined') {
    console.error(
      'words.js가 로드되지 않았거나 allWords가 정의되지 않았습니다!'
    );
    if (initialSoundDisplay) {
      initialSoundDisplay.textContent = '단어 데이터 오류';
    }
  } else {
    console.log('단어 데이터 로드됨:', window.allWords.length + '개 단어');
  }

  console.log('게임 초기화 완료');
}

// 페이지 로드 완료 시 초기화
window.addEventListener('load', function () {
  console.log('페이지 로드됨');
  initialize();
});
