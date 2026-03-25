// =============================================
// app.js - 화면 전환 및 전체 흐름 제어
// =============================================

let currentUser = {};

// ── 화면 전환 ──────────────────────────────

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  window.scrollTo(0, 0);
}

function updateStepIndicator(step) {
  document.querySelectorAll('.step').forEach((el, idx) => {
    el.classList.remove('active', 'done');
    if (idx + 1 === step) el.classList.add('active');
    if (idx + 1 < step) el.classList.add('done');
  });
}

// ── 화면 1 → 화면 2 ──────────────────────

function goToStep2() {
  const gender = document.querySelector('input[name="gender"]:checked')?.value;
  const age = parseFloat(document.getElementById('age').value);
  const height = parseFloat(document.getElementById('height').value);
  const weight = parseFloat(document.getElementById('weight').value);

  if (!gender || !age || !height || !weight) {
    alert('성별, 나이, 키, 몸무게는 필수 입력 항목입니다.');
    return;
  }
  if (age < 10 || age > 100) {
    alert('나이는 10~100 사이로 입력해주세요.');
    return;
  }
  if (height < 100 || height > 250) {
    alert('키는 100~250cm 사이로 입력해주세요.');
    return;
  }
  if (weight < 20 || weight > 300) {
    alert('몸무게는 20~300kg 사이로 입력해주세요.');
    return;
  }
  const fatMassVal = parseFloat(document.getElementById('fatMass').value);
  if (!isNaN(fatMassVal) && (fatMassVal < 0 || fatMassVal >= weight)) {
    alert('체지방량은 0보다 크고 몸무게보다 작아야 합니다.');
    return;
  }
  const muscleMassVal = parseFloat(document.getElementById('muscleMass').value);
  if (!isNaN(muscleMassVal) && (muscleMassVal < 0 || muscleMassVal >= weight)) {
    alert('골격근량은 0보다 크고 몸무게보다 작아야 합니다.');
    return;
  }

  const fatMass = parseFloat(document.getElementById('fatMass').value) || null;
  const muscleMass = parseFloat(document.getElementById('muscleMass').value) || null;

  currentUser = {
    gender, age,
    heightCm: height,
    weight,
    fatMass,
    muscleMass,
    leanMass: fatMass ? weight - fatMass : null
  };

  // 운동 날짜 기본값 = 오늘 (날짜가 바뀌었을 수 있으므로 항상 갱신)
  const wdEl = document.getElementById('workoutDate');
  if (wdEl) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (!wdEl.value || wdEl.value < todayStr) wdEl.value = todayStr;
  }

  showScreen('screen2');
  updateStepIndicator(2);
}

function goToStep1() {
  showScreen('screen1');
  updateStepIndicator(1);
}

// ── 화면 2 → 결과 ────────────────────────

function goToResult() {
  const cardioItems = document.querySelectorAll('#cardioList .exercise-item');
  const cardioIntervals = [];

  for (const item of cardioItems) {
    const isStepsMode = item.querySelector('.mode-steps').style.display !== 'none';

    if (isStepsMode) {
      // 걸음 수 모드
      const steps = parseFloat(item.querySelector('.cardio-steps').value) || 0;
      const duration = parseFloat(item.querySelector('.cardio-steps-duration').value) || 0;
      const incline = parseFloat(item.querySelector('.cardio-steps-incline').value) || 0;

      if (steps > 0 && duration > 0) {
        if (duration > 300) { alert('유산소 시간은 300분 이하로 입력해주세요.'); return; }
        const speed = stepsToSpeed(steps, duration, currentUser.heightCm);
        const type = speed >= 8.0 ? 'running' : 'walking';
        const cardioInfo = CARDIO_DB.find(c => c.type === type);
        const handrailSteps = parseFloat(item.querySelector('.cardio-steps-handrail').value) || 0;
        const handrailCorrectionSteps = 1 - (Math.min(handrailSteps, duration) / duration) * 0.10;
        cardioIntervals.push({
          type, name: cardioInfo ? cardioInfo.name : type,
          speed, durationMin: duration, incline,
          fromSteps: true, steps,
          handrailCorrection: handrailCorrectionSteps
        });
      }
    } else {
      // 속도 모드
      const typeEl = item.querySelector('.cardio-type') || item.querySelector('select');
      const type = typeEl ? typeEl.value : 'walking';
      const speed = parseFloat(item.querySelector('.cardio-speed').value) || 0;
      const duration = parseFloat(item.querySelector('.cardio-duration').value) || 0;
      const incline = parseFloat(item.querySelector('.cardio-incline').value) || 0;
      const cardioInfo = CARDIO_DB.find(c => c.type === type);
      if (speed > 0 && duration > 0) {
        if (speed > 30) { alert('유산소 속도는 30km/h 이하로 입력해주세요.'); return; }
        if (duration > 300) { alert('유산소 시간은 300분 이하로 입력해주세요.'); return; }
        const handrail = parseFloat(item.querySelector('.cardio-handrail').value) || 0;
        const handrailCorrection = 1 - (Math.min(handrail, duration) / duration) * 0.10;
        cardioIntervals.push({ type, name: cardioInfo ? cardioInfo.name : type, speed, durationMin: duration, incline, handrailCorrection });
      }
    }
  }

  const weightItems = document.querySelectorAll('#weightList .exercise-item');
  const weightExercises = [];

  weightItems.forEach(item => {
    const name = item.querySelector('.weight-name').value;
    const rest = parseFloat(item.querySelector('.weight-rest').value) || 90;
    const dbEntry = WEIGHT_DB.find(ex => ex.name === name);
    const setRows = item.querySelectorAll('.set-row');
    const sets = [];
    setRows.forEach(row => {
      const w = parseFloat(row.querySelector('.set-weight').value) || 0;
      const r = parseFloat(row.querySelector('.set-reps').value) || 0;
      if (w > 0 && r > 0) {
        if (w > 1000) { alert('중량은 1000kg 이하로 입력해주세요.'); return; }
        if (r > 200)  { alert('반복수는 200회 이하로 입력해주세요.'); return; }
        sets.push({ weight: w, reps: r });
      }
    });
    if (sets.length > 0 && dbEntry) {
      weightExercises.push({
        name: dbEntry.name,
        group: dbEntry.group,
        correction: dbEntry.correction,
        isAssist: dbEntry.isAssist || false,
        restSeconds: rest,
        sets
      });
    }
  });

  if (cardioIntervals.length === 0 && weightExercises.length === 0) {
    alert('유산소 또는 웨이트 운동을 최소 하나 이상 입력해주세요.');
    return;
  }

  const cardioResult = cardioIntervals.length > 0
    ? calcCardioTotal(cardioIntervals, currentUser.weight)
    : null;

  const weightResult = weightExercises.length > 0
    ? calcWeightSession(currentUser, weightExercises)
    : null;

  // localStorage에 저장
  saveRecord(currentUser, cardioResult, weightResult);

  renderResult(currentUser, cardioResult, weightResult);
  showScreen('screen3');
  updateStepIndicator(3);
}

// ── localStorage 저장/불러오기 ────────────

function saveRecord(user, cardioResult, weightResult) {
  const wdEl = document.getElementById('workoutDate');
  const today = (wdEl && wdEl.value) ? wdEl.value : new Date().toISOString().split('T')[0];
  const record = {
    date: today,
    user: {
      gender: user.gender,
      age: user.age,
      heightCm: user.heightCm,
      weight: user.weight,
      fatMass: user.fatMass || null
    },
    cardio: cardioResult ? {
      totalKcal: cardioResult.totalKcal,
      intervals: cardioResult.intervals.map(i => ({
        name: i.name, speed: i.speed, durationMin: i.durationMin, kcal: i.kcal
      }))
    } : null,
    weight: weightResult ? {
      sessionKcal: weightResult.sessionKcal,
      sessionMin: weightResult.sessionMin,
      sessionMax: weightResult.sessionMax,
      totalVolume: weightResult.totalVolume,
      exercises: weightResult.exercises.map(ex => ({
        name: ex.name, volume: ex.volume, sets: ex.sets,
        totalReps: ex.totalReps, kcal: ex.kcal, kcalMin: ex.kcalMin, kcalMax: ex.kcalMax
      }))
    } : null,
    totalKcalMin: (cardioResult ? cardioResult.totalKcal : 0) + (weightResult ? weightResult.sessionMin : 0),
    totalKcalMax: (cardioResult ? cardioResult.totalKcal : 0) + (weightResult ? weightResult.sessionMax : 0)
  };

  // 기존 기록 불러오기
  const records = loadAllRecords();

  // 오늘 기록이 있으면 덮어쓰기, 없으면 추가
  const existingIdx = records.findIndex(r => r.date === today);
  if (existingIdx >= 0) {
    records[existingIdx] = record;
  } else {
    records.push(record);
  }

  // 최근 365일치만 유지
  records.sort((a, b) => a.date.localeCompare(b.date));
  const trimmed = records.slice(-365);

  localStorage.setItem('workout_records', JSON.stringify(trimmed));
}

function loadAllRecords() {
  try {
    return JSON.parse(localStorage.getItem('workout_records')) || [];
  } catch {
    return [];
  }
}

function getRecordByDate(dateStr) {
  return loadAllRecords().find(r => r.date === dateStr) || null;
}

// ── 전체 초기화 ──────────────────────────

function resetAll() {
  currentUser = {};
  document.getElementById('age').value = '';
  document.getElementById('height').value = '';
  document.getElementById('weight').value = '';
  document.getElementById('fatMass').value = '';
  document.getElementById('muscleMass').value = '';
  document.querySelector('input[name="gender"][value="male"]').checked = true;
  document.getElementById('cardioList').innerHTML = '<p class="empty-msg">유산소 구간을 추가해주세요</p>';
  document.getElementById('weightList').innerHTML = '<p class="empty-msg">웨이트 운동을 추가해주세요</p>';
  const wdEl2 = document.getElementById('workoutDate');
  if (wdEl2) wdEl2.value = '';
  showScreen('screen1');
  updateStepIndicator(1);
}

// ── 유산소 입력 모드 전환 ────────────────

function setCardioMode(btn, mode) {
  const item = btn.closest('.exercise-item');
  const btns = item.querySelectorAll('.input-mode-btn');
  btns.forEach(b => {
    b.style.background = 'white';
    b.style.color = '#374151';
    b.style.borderColor = '#D1D5DB';
  });
  btn.style.background = '#1E3A8A';
  btn.style.color = 'white';
  btn.style.borderColor = '#1E3A8A';

  item.querySelector('.mode-speed').style.display = mode === 'speed' ? '' : 'none';
  item.querySelector('.mode-steps').style.display = mode === 'steps' ? '' : 'none';
}

// 걸음 수 → 속도 변환
function stepsToSpeed(steps, durationMin, heightCm) {
  const strideM = heightCm * 0.45 / 100; // 보폭(m)
  const distanceKm = (steps * strideM) / 1000;
  const speedKmh = distanceKm / (durationMin / 60);
  return Math.round(speedKmh * 10) / 10;
}

// ── 탭 전환 ──────────────────────────────

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (tab === 'calc') {
    document.querySelector('.tab-btn:first-child').classList.add('active');
    document.querySelector('main').style.display = '';
    document.getElementById('historyTab').style.display = 'none';
    document.getElementById('stepIndicator').style.display = '';
  } else {
    document.querySelector('.tab-btn:last-child').classList.add('active');
    document.querySelector('main').style.display = 'none';
    document.getElementById('historyTab').style.display = '';
    document.getElementById('stepIndicator').style.display = 'none';
    // 탭 열 때마다 오늘 날짜 기준으로 달력 갱신
    currentCalYear = new Date().getFullYear();
    currentCalMonth = new Date().getMonth();
    selectedDate = new Date().toISOString().split('T')[0]; // 오늘 날짜로 초기화
    renderCalendar(currentCalYear, currentCalMonth);
    renderChart();
    initDietDate();
    const today2 = new Date().toISOString().split('T')[0];
    renderDietList(today2);
  }
}

// ── 달력 ─────────────────────────────────

let currentCalYear = new Date().getFullYear();
let currentCalMonth = new Date().getMonth();
let selectedDate = new Date().toISOString().split('T')[0]; // 기본값 오늘

function changeMonth(delta) {
  currentCalMonth += delta;
  if (currentCalMonth > 11) { currentCalMonth = 0; currentCalYear++; }
  if (currentCalMonth < 0)  { currentCalMonth = 11; currentCalYear--; }
  renderCalendar(currentCalYear, currentCalMonth);
}

function renderCalendar(year, month) {
  const records = loadAllRecords();
  const recordDates = new Set(records.map(r => r.date));

  const title = `${year}년 ${month + 1}월`;
  document.getElementById('calendarTitle').textContent = title;

  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const days = ['일','월','화','수','목','금','토'];
  let html = '<div class="calendar-grid">';

  // 요일 헤더
  days.forEach(d => {
    html += `<div class="cal-header">${d}</div>`;
  });

  // 빈 칸
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-day empty"></div>';
  }

  // 날짜
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const hasRecord = recordDates.has(dateStr);
    const isToday = dateStr === today;
    const isSelected = dateStr === selectedDate;

    let cls = 'cal-day';
    if (hasRecord) cls += ' has-record';
    if (isToday) cls += ' today';
    if (isSelected) cls += ' selected';

    html += `<div class="${cls}" onclick="selectDay('${dateStr}')">
      <span class="day-num">${d}</span>
      ${hasRecord ? '<span class="day-dot"></span>' : ''}
    </div>`;
  }

  html += '</div>';
  document.getElementById('calendarGrid').innerHTML = html;

  if (selectedDate) renderDayDetail(selectedDate);
}

function selectDay(dateStr) {
  selectedDate = dateStr;
  renderCalendar(currentCalYear, currentCalMonth);
  renderDayDetail(dateStr);
}

function renderDayDetail(dateStr) {
  const record = getRecordByDate(dateStr);
  const el = document.getElementById('dayDetail');

  if (!record) {
    el.innerHTML = `<div class="day-record"><p style="color:#9CA3AF;text-align:center;font-size:0.88em;">${dateStr} — 기록 없음</p></div>`;
    return;
  }

  const cardio = record.cardio ? record.cardio.totalKcal : 0;
  const weight = record.weight ? `${record.weight.sessionMin}~${record.weight.sessionMax}` : 0;
  const total = `${record.totalKcalMin}~${record.totalKcalMax}`;

  let html = `<div class="day-record">
    <div class="day-record-title">${dateStr} 운동 기록</div>`;

  if (record.cardio) {
    html += `<div class="record-row"><span class="record-label">유산소</span><span class="record-value">${cardio} kcal</span></div>`;
    record.cardio.intervals.forEach(i => {
      html += `<div class="record-row" style="padding-left:12px;">
        <span class="record-label">${i.name} ${i.speed}km/h ${i.durationMin}분</span>
        <span class="record-value">${i.kcal} kcal</span>
      </div>`;
    });
  }

  if (record.weight) {
    html += `<div class="record-row"><span class="record-label">웨이트</span><span class="record-value">${weight} kcal</span></div>`;
    record.weight.exercises.forEach(ex => {
      html += `<div class="record-row" style="padding-left:12px;">
        <span class="record-label">${ex.name} ${ex.sets}세트</span>
        <span class="record-value">${ex.kcalMin}~${ex.kcalMax} kcal</span>
      </div>`;
    });
  }

  // 식단 기록 추가
  const dietItems = getDietByDate(dateStr);
  if (dietItems.length > 0) {
    const totalDiet = dietItems.reduce((s, r) => s + r.kcal, 0);
    html += `<div class="record-row" style="margin-top:6px;border-top:2px solid #E5E7EB;padding-top:8px;">
      <span class="record-label" style="font-weight:700;color:#B45309;">식단 (섭취)</span>
      <span class="record-value" style="color:#B45309;">${totalDiet} kcal</span>
    </div>`;
    dietItems.forEach(d => {
      html += `<div class="record-row" style="padding-left:12px;">
        <span class="record-label">${d.name}${d.memo ? ' · ' + d.memo : ''}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="record-value" style="color:#B45309;">${d.kcal} kcal</span>
          <button onclick="deleteDietRecordFromCalendar(${d.id}, '${dateStr}')"
            style="background:none;border:none;color:#EF4444;cursor:pointer;font-size:0.8em;padding:0;">삭제</button>
        </div>
      </div>`;
    });
    // 칼로리 밸런스
    const workoutMin = record.totalKcalMin || 0;
    const balance = totalDiet - workoutMin;

    // 하루 순 밸런스: 섭취 - (BMR + 운동 소모)
    const bmrVal = record.user ? calcBMR(record.user.gender, record.user.age, record.user.heightCm, record.user.weight, record.user.fatMass) : 0;
    const dayBalance = totalDiet - Math.round(bmrVal) - workoutMin;

    // 체중 방향 판단
    let directionLabel, directionColor, directionDesc;
    if (dayBalance <= -200) {
      directionLabel = '체중 감소 방향';
      directionColor = '#059669';
      directionDesc = '소비가 섭취보다 많아 감량 쪽에 가깝습니다.';
    } else if (dayBalance >= 200) {
      directionLabel = '체중 증가 방향';
      directionColor = '#DC2626';
      directionDesc = '섭취가 소비보다 많아 체중이 늘기 쉬운 상태입니다.';
    } else {
      directionLabel = '유지 방향';
      directionColor = '#D97706';
      directionDesc = '섭취와 소비가 비슷해 체중 변화가 크지 않은 수준입니다.';
    }

    html += `<div style="margin-top:8px;padding:12px 14px;background:#F9FAFB;border-radius:8px;border:1.5px solid #E5E7EB;">
      <div style="font-size:0.78em;color:#6B7280;margin-bottom:6px;">오늘의 체중 방향</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-weight:700;font-size:1em;color:${directionColor};">${directionLabel}</span>
        <span style="font-size:0.88em;color:#374151;">${dayBalance > 0 ? '+' : ''}${Math.round(dayBalance)} kcal</span>
      </div>
      <div style="font-size:0.8em;color:#6B7280;">${directionDesc}</div>
      <div style="font-size:0.75em;color:#9CA3AF;margin-top:6px;">기준: 섭취 ${totalDiet} kcal − BMR ${Math.round(bmrVal)} kcal − 운동 ${workoutMin} kcal</div>
    </div>`;
  }

  const totalDisplay = record.totalKcalMin === record.totalKcalMax
    ? `${record.totalKcalMin} kcal`
    : `${record.totalKcalMin}~${record.totalKcalMax} kcal`;
  html += `<div class="record-row" style="margin-top:6px;border-top:2px solid #E5E7EB;padding-top:8px;">
    <span class="record-label" style="font-weight:700;">총 소모 칼로리</span>
    <span class="record-value" style="color:#0F6E56;">${totalDisplay}</span>
  </div></div>`;

  el.innerHTML = html;
}

// ── 차트 ─────────────────────────────────

let chartInstance = null;

function renderChart() {
  const records = loadAllRecords();
  if (records.length === 0) return;

  // 최근 14일
  const today = new Date();
  const labels = [];
  const burnData = [];
  const intakeData = [];
  const balanceData = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const record = records.find(r => r.date === dateStr);
    const dietItems = getDietByDate(dateStr);

    labels.push(`${d.getMonth()+1}/${d.getDate()}`);

    const burn = record ? record.totalKcalMin : null;
    const intake = dietItems.length > 0 ? dietItems.reduce((s, r) => s + r.kcal, 0) : null;

    burnData.push(burn);
    intakeData.push(intake);

    // 하루 순 밸런스: 섭취 - BMR - 운동소모
    if (intake !== null && burn !== null && record && record.user) {
      const bmr = calcBMR(record.user.gender, record.user.age, record.user.heightCm, record.user.weight, record.user.fatMass);
      balanceData.push(Math.round(intake - Math.round(bmr) - burn));
    } else {
      balanceData.push(null);
    }
  }

  const ctx = document.getElementById('kcalChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '운동 소모',
          data: burnData,
          backgroundColor: 'rgba(16,110,86,0.6)',
          borderColor: 'rgba(16,110,86,1)',
          borderWidth: 1,
          borderRadius: 4,
          order: 2,
        },
        {
          label: '섭취 칼로리',
          data: intakeData,
          backgroundColor: 'rgba(180,83,9,0.45)',
          borderColor: 'rgba(180,83,9,0.9)',
          borderWidth: 1,
          borderRadius: 4,
          order: 2,
        },
        {
          label: '체중 방향 (순밸런스)',
          data: balanceData,
          type: 'line',
          borderColor: 'rgba(37,99,235,0.9)',
          backgroundColor: 'rgba(37,99,235,0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: balanceData.map(v => v === null ? 'transparent' : v > 0 ? '#EF4444' : '#10B981'),
          fill: {
            target: { value: 0 },
            above: 'rgba(239,68,68,0.08)',
            below: 'rgba(16,110,86,0.08)'
          },
          tension: 0.3,
          order: 1,
          yAxisID: 'y',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.parsed.y === null) return null;
              const suffix = ctx.dataset.label === '체중 방향 (순밸런스)'
                ? (ctx.parsed.y > 0 ? ' → 체중 증가 방향' : ' → 체중 감소 방향')
                : '';
              return `${ctx.dataset.label}: ${ctx.parsed.y} kcal${suffix}`;
            }
          }
        }
      },
      scales: {
        y: {
          ticks: { callback: v => v + ' kcal' },
          grid: {
            color: ctx => ctx.tick.value === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
            lineWidth: ctx => ctx.tick.value === 0 ? 2 : 1,
          }
        }
      }
    }
  });
}

// ── 식단 기록 ─────────────────────────────

function initDietDate() {
  const today = new Date().toISOString().split('T')[0];
  const el = document.getElementById('dietDate');
  if (el) el.value = today;
  _updateDietDisplay(today);
  renderDietList(today);
}

function updateDietDayLabel() {
  const el = document.getElementById('dietDate');
  if (!el || !el.value) return;
  _updateDietDisplay(el.value);
  renderDietList(el.value);
}

function _updateDietDisplay(dateStr) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(dateStr + 'T00:00:00');
  const dayStr = days[d.getDay()];
  const label = document.getElementById('dietDayLabel');
  const display = document.getElementById('dietDateDisplay');
  if (label) label.textContent = '(' + dayStr + ')';
  if (display) {
    const [y, m, dd] = dateStr.split('-');
    display.textContent = `${y}년 ${parseInt(m)}월 ${parseInt(dd)}일`;
  }
}

function addDietRecord() {
  const date = document.getElementById('dietDate').value;
  const name = document.getElementById('dietName').value.trim();
  const kcal = parseFloat(document.getElementById('dietKcal').value);
  const memo = document.getElementById('dietMemo').value.trim();

  if (!date || !name || !kcal) {
    alert('날짜, 음식명, 섭취 칼로리는 필수 입력 항목입니다.');
    return;
  }

  const carbs = parseFloat(document.getElementById('dietCarbs')?.value) || null;
  const protein = parseFloat(document.getElementById('dietProtein')?.value) || null;
  const fat = parseFloat(document.getElementById('dietFat')?.value) || null;

  const dietRecords = loadDietRecords();
  dietRecords.push({ date, name, kcal, carbs, protein, fat, memo, id: Date.now() });
  saveDietRecords(dietRecords);

  // 입력 초기화
  document.getElementById('dietName').value = '';
  document.getElementById('dietKcal').value = '';
  document.getElementById('dietMemo').value = '';

  renderDietList(date);
  if (selectedDate === date) renderDayDetail(date);
  renderChart();
}

function deleteDietRecordFromCalendar(id, dateStr) {
  const records = loadDietRecords().filter(r => r.id !== id);
  saveDietRecords(records);
  renderDayDetail(dateStr);
  renderChart();
  // 식단 목록도 같이 갱신
  const dietDateEl = document.getElementById('dietDate');
  if (dietDateEl && dietDateEl.value === dateStr) renderDietList(dateStr);
}

function deleteDietRecord(id) {
  const records = loadDietRecords().filter(r => r.id !== id);
  saveDietRecords(records);
  const date = document.getElementById('dietDate').value;
  renderDietList(date);
  if (selectedDate) renderDayDetail(selectedDate);
  renderChart();
}

function renderDietList(date) {
  const records = loadDietRecords().filter(r => r.date === date);
  const el = document.getElementById('dietList');
  if (!el) return;

  if (records.length === 0) {
    el.innerHTML = '<p style="color:#9CA3AF;font-size:0.85em;text-align:center;padding:12px;">이 날짜의 식단 기록이 없습니다</p>';
    return;
  }

  const total = records.reduce((s, r) => s + r.kcal, 0);
  const totalCarbs   = records.reduce((s, r) => s + (r.carbs || 0), 0);
  const totalProtein = records.reduce((s, r) => s + (r.protein || 0), 0);
  const totalFat     = records.reduce((s, r) => s + (r.fat || 0), 0);

  // 하루 권장량 (currentUser 또는 저장된 사용자 기준)
  const user = currentUser?.weight ? currentUser : null;
  const bmr = user ? calcBMR(user.gender, user.age, user.heightCm, user.weight, user.fatMass) : null;
  const tdee = bmr ? Math.round(bmr * 1.55) : null;
  const recCarbs   = tdee ? Math.round(tdee * 0.55 / 4) : 300;
  const recProtein = tdee ? Math.round(tdee * 0.20 / 4) : 55;
  const recFat     = tdee ? Math.round(tdee * 0.25 / 9) : 50;

  function macroBar(val, rec, color) {
    const pct = Math.min(Math.round((val / rec) * 100), 100);
    return `<div style="display:flex;align-items:center;gap:6px;font-size:0.78em;">
      <div style="flex:1;background:#E5E7EB;border-radius:4px;height:6px;overflow:hidden;">
        <div style="width:${pct}%;background:${color};height:100%;border-radius:4px;transition:width 0.3s;"></div>
      </div>
      <span style="min-width:70px;color:#6B7280;">${val}g / ${rec}g (${pct}%)</span>
    </div>`;
  }

  let html = `<div style="background:#F9FAFB;border-radius:8px;padding:12px 14px;margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
      <span style="font-size:0.82em;font-weight:600;color:#374151;">오늘 영양소 합계</span>
      <span style="font-size:0.88em;font-weight:700;color:#1E3A8A;">${total} kcal</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      <div><span style="font-size:0.78em;color:#374151;display:inline-block;width:50px;">탄수화물</span>${macroBar(Math.round(totalCarbs), recCarbs, '#3B82F6')}</div>
      <div><span style="font-size:0.78em;color:#374151;display:inline-block;width:50px;">단백질</span>${macroBar(Math.round(totalProtein), recProtein, '#10B981')}</div>
      <div><span style="font-size:0.78em;color:#374151;display:inline-block;width:50px;">지방</span>${macroBar(Math.round(totalFat), recFat, '#F59E0B')}</div>
    </div>
  </div>`;

  records.forEach(r => {
    html += `<div style="background:#F9FAFB;border-radius:6px;margin-bottom:6px;font-size:0.88em;overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;">
        <div>
          <span style="font-weight:600;">${r.name}</span>
          ${r.memo ? `<span style="color:#9CA3AF;margin-left:6px;">${r.memo}</span>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-weight:700;color:#0F6E56;">${r.kcal} kcal</span>
          <button onclick="deleteDietRecord(${r.id})" style="background:none;border:none;color:#EF4444;cursor:pointer;font-size:0.85em;">삭제</button>
        </div>
      </div>
      ${(r.carbs || r.protein || r.fat) ? `
      <div style="padding:4px 12px 8px;display:flex;gap:12px;font-size:0.78em;color:#6B7280;">
        ${r.carbs   != null ? `<span>탄수화물 ${r.carbs}g</span>` : ''}
        ${r.protein != null ? `<span>단백질 ${r.protein}g</span>` : ''}
        ${r.fat     != null ? `<span>지방 ${r.fat}g</span>` : ''}
      </div>` : ''}
    </div>`;
  });

  el.innerHTML = html;
}

function saveDietRecords(records) {
  const trimmed = records
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-1000);
  localStorage.setItem('diet_records', JSON.stringify(trimmed));
}

function loadDietRecords() {
  try {
    return JSON.parse(localStorage.getItem('diet_records')) || [];
  } catch { return []; }
}

function getDietByDate(dateStr) {
  return loadDietRecords().filter(r => r.date === dateStr);
}

// ── 식품영양성분 API 검색 ──────────────────

const FOOD_API_KEY = 'f7659e5d9dd0ae5706e6cf5bbee542eb0abd6b8de042cc85a7213e85859f638f';
const FOOD_API_URL = 'https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02';

function _parseNumberLike(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function _extractFoodName(item) {
  // 식약처 정의서 기준: FOOD_NM_KR = 식품명
  const raw = item.FOOD_NM_KR || item.DESC_KOR || item.FOOD_NM || item.name || '';
  return String(raw)
    .replace(/�/g, ' ')
    .replace(/[^\w\s가-힣()\-\.,·\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _extractFoodKcal(item) {
  // 식약처 정의서 기준: AMT_NUM1 = 에너지(kcal)
  // NUTR_CONT1 등은 하위 호환 fallback으로만 사용.
  const keys = ['AMT_NUM1', 'NUTR_CONT1', 'ENERGY_KCAL', 'KCAL', 'AMT_NUM13'];

  for (const k of keys) {
    const raw = item[k];
    let n = _parseNumberLike(raw);
    if (n <= 0) continue;

    const rawText = String(raw ?? '').toLowerCase();
    const keyText = String(k).toLowerCase();
    const hasKjHint = rawText.includes('kj') || rawText.includes('킬로줄') || keyText.includes('kj');

    if (hasKjHint) {
      n = n / 4.184;
    }
    return Math.round(n);
  }

  return 0;
}

function _extractServingText(item) {
  // 기준량은 항목별 SERVING_SIZE를 우선 사용
  const serving =
    item.SERVING_SIZE ||
    item.SERVING ||
    item.SERV ||
    item.SERV_SIZE ||
    item.SERVING_WT;
  const amount = item.AMT_NUM13 || item.AMT_NUM1;
  if (serving) return `${serving} 기준`;
  if (amount) return `에너지 표기 기준`;
  return '기준량 확인 필요';
}

function _extractServingGram(item) {
  const serving =
    String(
      item.SERVING_SIZE ||
      item.SERVING ||
      item.SERV ||
      item.SERV_SIZE ||
      item.SERVING_WT ||
      ''
    );

  const m = serving.match(/([0-9]+(?:\.[0-9]+)?)\s*g/i);
  if (!m) return null;
  const g = parseFloat(m[1]);
  return Number.isFinite(g) && g > 0 ? g : null;
}

function _extractTotalGram(item) {
  const source = String(item.Z10500 || item.DISH_ONE_SERVING || '');
  const m = source.match(/([0-9]+(?:\.[0-9]+)?)\s*g/i);
  if (!m) return null;
  const g = parseFloat(m[1]);
  return Number.isFinite(g) && g > 0 ? g : null;
}

function _buildKcalInfo(item) {
  const baseKcal = _extractFoodKcal(item);      // AMT_NUM1
  const servingGram = _extractServingGram(item); // SERVING_SIZE
  const totalGram = _extractTotalGram(item);     // Z10500

  // 기준량 kcal를 100g 기준으로 환산
  let kcalPer100 = null;
  if (servingGram && baseKcal > 0) {
    kcalPer100 = (baseKcal * 100) / servingGram;
  } else if (baseKcal > 0) {
    kcalPer100 = baseKcal;
  }

  // 총중량이 있으면 제품 총량 kcal 계산
  let totalKcal = null;
  if (kcalPer100 && totalGram) {
    totalKcal = (kcalPer100 * totalGram) / 100;
  }

  const name = _extractFoodName(item);
  const isBulkPackName = /(멀티팩|묶음|세트|번들|박스|대용량|업소용|개입|입\b)/i.test(name);
  const hasLargeRatio = Boolean(servingGram && totalGram && (totalGram / servingGram) >= 3);
  const isBulkPack = isBulkPackName || hasLargeRatio || (totalGram && totalGram >= 350);
  const effectiveTotalKcal = isBulkPack ? null : totalKcal;

  return {
    baseKcal: Math.round(baseKcal),
    servingGram,
    totalGram,
    kcalPer100: kcalPer100 ? Math.round(kcalPer100) : null,
    totalKcal: totalKcal ? Math.round(totalKcal) : null,
    effectiveTotalKcal: effectiveTotalKcal ? Math.round(effectiveTotalKcal) : null,
    isBulkPack,
  };
}

function _toDateKey(s) {
  const t = String(s || '').trim();
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return 0;
  return parseInt(`${m[1]}${m[2]}${m[3]}`, 10);
}

function _recordScore(item, kcalInfo) {
  let score = 0;
  if (kcalInfo.effectiveTotalKcal) score += 40; // 총량 계산 가능(멀티팩 제외)
  if (kcalInfo.kcalPer100) score += 20;        // 100g 환산 가능
  if (kcalInfo.servingGram) score += 10;       // 기준량 g 존재
  if (item.MAKER_NM) score += 5;               // 제조사 정보
  score += Math.min(20, _toDateKey(item.UPDATE_DATE) / 100000000); // 최신 데이터 가점(완만)
  return score;
}

function _dedupeAndNormalizeItems(items) {
  const bucket = new Map();

  for (const item of items) {
    const name = _extractFoodName(item);
    if (!name) continue;

    const kcalInfo = _buildKcalInfo(item);
    if (!(kcalInfo.baseKcal > 0 || kcalInfo.totalKcal > 0)) continue;

    const maker = item.MAKER_NM || '';
    const key = `${name}__${maker}`;
    const candidate = { item, kcalInfo, score: _recordScore(item, kcalInfo) };

    const prev = bucket.get(key);
    if (!prev || candidate.score > prev.score) {
      bucket.set(key, candidate);
    }
  }

  const merged = Array.from(bucket.values()).map(v => v.item);
  // 총량 표시 가능한 항목 우선, 이후 최신 순
  merged.sort((a, b) => {
    const ka = _buildKcalInfo(a);
    const kb = _buildKcalInfo(b);
    const ta = ka.effectiveTotalKcal ? 1 : 0;
    const tb = kb.effectiveTotalKcal ? 1 : 0;
    if (ta !== tb) return tb - ta;
    return _toDateKey(b.UPDATE_DATE) - _toDateKey(a.UPDATE_DATE);
  });
  return merged;
}

async function searchFood() {
  const query = document.getElementById('foodSearchInput').value.trim();
  if (!query) { alert('음식명을 입력해주세요.'); return; }

  const resultEl = document.getElementById('foodSearchResult');
  resultEl.innerHTML = '<p style="font-size:0.85em;color:#6B7280;">검색 중...</p>';

  try {
    const url = `${FOOD_API_URL}?serviceKey=${FOOD_API_KEY}&FOOD_NM_KR=${encodeURIComponent(query)}&numOfRows=30&pageNo=1&type=json`;
    const res = await fetch(url);
    const data = await res.json();

    const rawItems = data?.body?.items;
    const items = Array.isArray(rawItems)
      ? rawItems
      : (Array.isArray(rawItems?.item) ? rawItems.item : []);

    if (!items || items.length === 0) {
      resultEl.innerHTML = '<p style="font-size:0.85em;color:#9CA3AF;">검색 결과가 없습니다.</p>';
      return;
    }

    const normalizedItems = _dedupeAndNormalizeItems(items);
    if (normalizedItems.length === 0) {
      resultEl.innerHTML = '<p style="font-size:0.85em;color:#9CA3AF;">칼로리 값을 가진 검색 결과가 없습니다.</p>';
      return;
    }

    window._foodSearchItems = normalizedItems;

    let html = `
      <div style="font-size:0.8em;color:#6B7280;margin:4px 2px 6px;">검색 결과 ${normalizedItems.length}건</div>
      <div style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-top:4px;max-height:420px;overflow-y:auto;">
    `;
    normalizedItems.forEach((item, idx) => {
      const name = _extractFoodName(item);
      const kcalInfo = _buildKcalInfo(item);
      const per = _extractServingText(item);
      const maker = item.MAKER_NM || item.BIZRNO_NM || '';
      const mainKcal = kcalInfo.effectiveTotalKcal || kcalInfo.baseKcal;
      const leftBasisLabel = (kcalInfo.effectiveTotalKcal && kcalInfo.totalGram)
        ? `총량 ${kcalInfo.totalGram}g`
        : per;
      html += `
        <div onclick="selectFoodByIdx(${idx})"
          style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #F3F4F6;display:flex;justify-content:space-between;align-items:center;transition:background 0.15s;"
          onmouseover="this.style.background='#EFF6FF'" onmouseout="this.style.background='white'">
          <div>
            <span style="font-size:0.9em;font-weight:600;">${name}</span>
            <span style="font-size:0.78em;color:#9CA3AF;margin-left:6px;">${leftBasisLabel}</span>
            ${maker ? `<span style="font-size:0.76em;color:#9CA3AF;margin-left:6px;">${maker}</span>` : ''}
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.88em;font-weight:700;color:#0F6E56;">${mainKcal} kcal</div>
            ${kcalInfo.isBulkPack ? `<div style="font-size:0.74em;color:#9CA3AF;">멀티팩/대용량은 총량 계산 제외</div>` : ''}
            ${kcalInfo.kcalPer100 ? `<div style="font-size:0.74em;color:#9CA3AF;">${kcalInfo.kcalPer100} kcal/100g</div>` : ''}
          </div>
        </div>`;
    });
    html += '</div>';
    resultEl.innerHTML = html;

  } catch (err) {
    resultEl.innerHTML = '<p style="font-size:0.85em;color:#EF4444;">검색 중 오류가 발생했습니다. 직접 입력해주세요.</p>';
    console.error(err);
  }
}

function selectFoodByIdx(idx) {
  const item = window._foodSearchItems && window._foodSearchItems[idx];
  if (!item) return;
  const name = _extractFoodName(item);
  const kcalInfo = _buildKcalInfo(item);
  const kcal = kcalInfo.effectiveTotalKcal || kcalInfo.baseKcal;

  // 탄단지 추출 (기준량 → 총량 환산)
  const ratio = (kcalInfo.servingGram && kcalInfo.totalGram && !kcalInfo.isBulkPack)
    ? kcalInfo.totalGram / kcalInfo.servingGram
    : 1;
  const carbs   = item.AMT_NUM6 ? Math.round(parseFloat(item.AMT_NUM6) * ratio * 10) / 10 : null;
  const protein = item.AMT_NUM3 ? Math.round(parseFloat(item.AMT_NUM3) * ratio * 10) / 10 : null;
  const fat     = item.AMT_NUM4 ? Math.round(parseFloat(item.AMT_NUM4) * ratio * 10) / 10 : null;

  document.getElementById('dietName').value = name;
  document.getElementById('dietKcal').value = kcal;
  if (document.getElementById('dietCarbs'))   document.getElementById('dietCarbs').value   = carbs ?? '';
  if (document.getElementById('dietProtein')) document.getElementById('dietProtein').value = protein ?? '';
  if (document.getElementById('dietFat'))     document.getElementById('dietFat').value     = fat ?? '';

  document.getElementById('foodSearchResult').innerHTML = '';
  document.getElementById('foodSearchInput').value = '';
}

// 엔터키로 검색
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('foodSearchInput');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') searchFood();
    });
  }
});