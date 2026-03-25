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

  // 운동 날짜 기본값 = 오늘
  const wdEl = document.getElementById('workoutDate');
  if (wdEl && !wdEl.value) wdEl.value = new Date().toISOString().split('T')[0];

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
let selectedDate = null;

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
        <span class="record-value" style="color:#B45309;">${d.kcal} kcal</span>
      </div>`;
    });
    // 칼로리 밸런스
    const workoutMin = record.totalKcalMin || 0;
    const balance = totalDiet - workoutMin;

    // 하루 순 밸런스: 섭취 - (BMR + 운동 소모)
    const bmrVal = record.user ? calcBMR(record.user.gender, record.user.age, record.user.heightCm, record.user.weight) : 0;
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
      const bmr = calcBMR(record.user.gender, record.user.age, record.user.heightCm, record.user.weight);
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

  const dietRecords = loadDietRecords();
  dietRecords.push({ date, name, kcal, memo, id: Date.now() });
  saveDietRecords(dietRecords);

  // 입력 초기화
  document.getElementById('dietName').value = '';
  document.getElementById('dietKcal').value = '';
  document.getElementById('dietMemo').value = '';

  renderDietList(date);
  if (selectedDate === date) renderDayDetail(date);
  renderChart();
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
  let html = `<div style="font-size:0.82em;color:#6B7280;margin-bottom:8px;">총 섭취: <strong style="color:#1E3A8A;">${total} kcal</strong></div>`;

  records.forEach(r => {
    html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#F9FAFB;border-radius:6px;margin-bottom:6px;font-size:0.88em;">
      <div>
        <span style="font-weight:600;">${r.name}</span>
        ${r.memo ? `<span style="color:#9CA3AF;margin-left:6px;">${r.memo}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-weight:700;color:#0F6E56;">${r.kcal} kcal</span>
        <button onclick="deleteDietRecord(${r.id})" style="background:none;border:none;color:#EF4444;cursor:pointer;font-size:0.85em;">삭제</button>
      </div>
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

async function searchFood() {
  const query = document.getElementById('foodSearchInput').value.trim();
  if (!query) { alert('음식명을 입력해주세요.'); return; }

  const resultEl = document.getElementById('foodSearchResult');
  resultEl.innerHTML = '<p style="font-size:0.85em;color:#6B7280;">검색 중...</p>';

  try {
    const url = `${FOOD_API_URL}?serviceKey=${FOOD_API_KEY}&FOOD_NM_KR=${encodeURIComponent(query)}&numOfRows=5&pageNo=1&type=json`;
    const res = await fetch(url);
    const data = await res.json();

    const items = data?.body?.items;
    if (!items || items.length === 0) {
      resultEl.innerHTML = '<p style="font-size:0.85em;color:#9CA3AF;">검색 결과가 없습니다.</p>';
      return;
    }

    let html = '<div style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-top:4px;">';
    items.forEach(item => {
      const name = item.FOOD_NM_KR || '';
      const kcal = Math.round(parseFloat(item.NUTR_CONT1) || 0);
      const per = item.SERVING_SIZE ? `${item.SERVING_SIZE}g 기준` : '100g 기준';
      html += `
        <div onclick="selectFood('${name.replace(/'/g,"\\'")}', ${kcal})"
          style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #F3F4F6;display:flex;justify-content:space-between;align-items:center;transition:background 0.15s;"
          onmouseover="this.style.background='#EFF6FF'" onmouseout="this.style.background='white'">
          <div>
            <span style="font-size:0.9em;font-weight:600;">${name}</span>
            <span style="font-size:0.78em;color:#9CA3AF;margin-left:6px;">${per}</span>
          </div>
          <span style="font-size:0.88em;font-weight:700;color:#0F6E56;">${kcal} kcal</span>
        </div>`;
    });
    html += '</div>';
    resultEl.innerHTML = html;

  } catch (err) {
    resultEl.innerHTML = '<p style="font-size:0.85em;color:#EF4444;">검색 중 오류가 발생했습니다. 직접 입력해주세요.</p>';
    console.error(err);
  }
}

function selectFood(name, kcal) {
  document.getElementById('dietName').value = name;
  document.getElementById('dietKcal').value = kcal;
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