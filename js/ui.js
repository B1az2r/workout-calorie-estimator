// =============================================
// ui.js - UI 조작 함수
// =============================================

// 유산소 구간 카드 생성
function addCardioInterval() {
  const list = document.getElementById('cardioList');
  const emptyMsg = list.querySelector('.empty-msg');
  if (emptyMsg) emptyMsg.remove();

  const idx = list.children.length;
  const item = document.createElement('div');
  item.className = 'exercise-item';
  item.id = `cardio-${idx}`;

  item.innerHTML = `
    <div class="exercise-item-header">
      <span class="exercise-item-title">유산소 구간 ${idx + 1}</span>
      <button class="btn-remove" onclick="removeItem('cardio-${idx}', 'cardioList')">삭제</button>
    </div>
    <div class="item-form">
      <div class="form-group">
        <label>운동 종류</label>
        <select style="padding:9px 10px;border:1.5px solid #D1D5DB;border-radius:8px;font-size:0.9em;">
          <option value="walking">걷기</option>
          <option value="running">달리기</option>
          <option value="cycling">실내자전거</option>
          <option value="stairs">계단오르기</option>
          <option value="elliptical">일립티컬</option>
        </select>
      </div>
      <div class="form-group">
        <label>속도 (km/h)</label>
        <div class="input-wrap">
          <input type="number" class="cardio-speed" placeholder="7.0" step="0.1" min="0">
          <span class="unit">km/h</span>
        </div>
      </div>
      <div class="form-group">
        <label>시간 (분)</label>
        <div class="input-wrap">
          <input type="number" class="cardio-duration" placeholder="10" min="1">
          <span class="unit">분</span>
        </div>
      </div>
      <div class="form-group">
        <label>경사도 <span class="optional">선택</span></label>
        <div class="input-wrap">
          <input type="number" class="cardio-incline" placeholder="0" min="0" max="30">
          <span class="unit">%</span>
        </div>
      </div>
    </div>
  `;
  list.appendChild(item);
}

// 웨이트 운동 카드 생성
function addWeightExercise() {
  const list = document.getElementById('weightList');
  const emptyMsg = list.querySelector('.empty-msg');
  if (emptyMsg) emptyMsg.remove();

  const idx = list.children.length;
  const item = document.createElement('div');
  item.className = 'exercise-item';
  item.id = `weight-${idx}`;

  // 운동 선택 옵션 — displayGroup 기준으로 그룹화
  const groupOrder = ["하체 — 복합", "하체 — 고립", "상체 — 당기기", "상체 — 밀기", "상체 — 고립"];
  const grouped = {};
  groupOrder.forEach(g => grouped[g] = []);
  WEIGHT_DB.forEach(ex => {
    if (grouped[ex.displayGroup]) grouped[ex.displayGroup].push(ex.name);
  });
  const options = groupOrder.map(g =>
    `<optgroup label="${g}">${grouped[g].map(n => `<option value="${n}">${n}</option>`).join('')}</optgroup>`
  ).join('');

  item.innerHTML = `
    <div class="exercise-item-header">
      <span class="exercise-item-title">웨이트 운동 ${idx + 1}</span>
      <button class="btn-remove" onclick="removeItem('weight-${idx}', 'weightList')">삭제</button>
    </div>
    <div class="item-form" style="margin-bottom:14px;">
      <div class="form-group">
        <label>운동 선택</label>
        <select class="weight-name" style="padding:9px 10px;border:1.5px solid #D1D5DB;border-radius:8px;font-size:0.9em;">
          ${options}
        </select>
      </div>
      <div class="form-group">
        <label>세트 간 휴식</label>
        <div class="input-wrap">
          <input type="number" class="weight-rest" placeholder="90" min="0" max="600">
          <span class="unit">초</span>
        </div>
      </div>
    </div>
    <div>
      <p style="font-size:0.85em;font-weight:600;color:#374151;margin-bottom:8px;">세트 기록</p>
      <div class="sets-container">
        <div class="set-row">
          <span class="set-num">1세트</span>
          <input type="number" class="set-weight" placeholder="중량 (kg)" step="0.5" min="0">
          <input type="number" class="set-reps" placeholder="반복수 (회)" min="1">
          <button class="btn-remove" onclick="removeSet(this)">-</button>
        </div>
      </div>
      <button class="btn-add-set" onclick="addSet(this)">+ 세트 추가</button>
    </div>
  `;
  list.appendChild(item);
}

// 세트 추가
function addSet(btn) {
  const container = btn.previousElementSibling;
  const setNum = container.children.length + 1;
  const row = document.createElement('div');
  row.className = 'set-row';
  row.innerHTML = `
    <span class="set-num">${setNum}세트</span>
    <input type="number" class="set-weight" placeholder="중량 (kg)" step="0.5" min="0">
    <input type="number" class="set-reps" placeholder="반복수 (회)" min="1">
    <button class="btn-remove" onclick="removeSet(this)">-</button>
  `;
  container.appendChild(row);
}

// 세트 삭제
function removeSet(btn) {
  const container = btn.parentElement.parentElement;
  if (container.children.length <= 1) return; // 최소 1세트 유지
  btn.parentElement.remove();
  // 세트 번호 재정렬
  Array.from(container.children).forEach((row, i) => {
    row.querySelector('.set-num').textContent = `${i + 1}세트`;
  });
}

// 운동 항목 삭제
function removeItem(id, listId) {
  const item = document.getElementById(id);
  if (item) item.remove();
  const list = document.getElementById(listId);
  if (list.children.length === 0) {
    list.innerHTML = '<p class="empty-msg">운동을 추가해주세요</p>';
  }
}

// 결과 화면 렌더링
function renderResult(userInfo, cardioResult, weightResult) {
  const bmi = calcBMI(userInfo.weight, userInfo.heightCm);
  const bmr = calcBMR(userInfo.gender, userInfo.age, userInfo.heightCm, userInfo.weight);
  const idealWeight = calcIdealWeight(userInfo.gender, userInfo.heightCm);
  const recommended = calcRecommendedCalories(bmr);

  const totalKcalPoint = (cardioResult ? cardioResult.totalKcal : 0) +
                         (weightResult ? weightResult.sessionKcal : 0);
  const totalMin = (cardioResult ? cardioResult.totalKcal : 0) +
                   (weightResult ? weightResult.sessionMin : 0);
  const totalMax = (cardioResult ? cardioResult.totalKcal : 0) +
                   (weightResult ? weightResult.sessionMax : 0);

  let html = '';

  // 총 소모 칼로리
  html += `
    <div class="result-card">
      <div class="result-title">오늘 총 예상 소모 칼로리</div>
      <div class="total-kcal">${totalMin === totalMax ? totalMin + ' kcal' : totalMin + ' ~ ' + totalMax + ' kcal'}</div>
      <div class="total-range">추정 중앙값: 약 ${Math.round(totalKcalPoint)} kcal</div>
      <div class="notice">본 값은 의료적 측정치가 아닌 참고용 추정치입니다. 운동별 수치는 세션 총 추정치를 상대 기여도로 분배한 값입니다.</div>
    </div>
  `;

  // 유산소 결과
  if (cardioResult && cardioResult.intervals.length > 0) {
    html += `
      <div class="result-card">
        <div class="result-title">유산소 운동</div>
        <table class="result-table">
          <tr><th>구간</th><th>속도</th><th>시간</th><th>소모 kcal</th></tr>
          ${cardioResult.intervals.map(i => `
            <tr>
              <td>${i.name}${i.autoConverted ? ' <span style="font-size:0.78em;color:#F59E0B;">(달리기로 자동 적용)</span>' : ''}</td>
              <td>${i.speed} km/h</td>
              <td>${i.durationMin}분</td>
              <td class="kcal-val">${i.kcal} kcal</td>
            </tr>
          `).join('')}
        </table>
        <p style="margin-top:14px;font-weight:700;color:#0F6E56;">
          유산소 합계: ${cardioResult.totalKcal} kcal
        </p>
      </div>
    `;
  }

  // 웨이트 결과
  if (weightResult && weightResult.exercises.length > 0) {
    html += `
      <div class="result-card">
        <div class="result-title">웨이트 운동</div>
        <p style="font-size:0.85em;color:#6B7280;margin-bottom:12px;">
          총 볼륨: ${weightResult.totalVolume.toLocaleString()} kg |
          계산 모드: ${weightResult.isPreciseMode ? '정밀' : '추정 (체지방 미입력)'}
        </p>
        <table class="result-table">
          <tr><th>운동</th><th>볼륨</th><th>세트</th><th>추정 kcal</th></tr>
          ${weightResult.exercises.map(ex => `
            <tr>
              <td>${ex.name}</td>
              <td>${ex.volume.toLocaleString()} kg</td>
              <td>${ex.sets}세트 / ${ex.totalReps}회</td>
              <td class="kcal-val">${ex.kcalMin === ex.kcalMax ? ex.kcalMin + " kcal" : ex.kcalMin + "~" + ex.kcalMax + " kcal"}</td>
            </tr>
          `).join('')}
        </table>
        <p style="margin-top:14px;font-weight:700;color:#0F6E56;">
          웨이트 합계: ${weightResult.sessionMin === weightResult.sessionMax ? weightResult.sessionMin + " kcal" : weightResult.sessionMin + " ~ " + weightResult.sessionMax + " kcal"}
        </p>
        ${weightResult.assistNotes && weightResult.assistNotes.length > 0 ? `
        <div style="margin-top:10px;padding:10px 14px;background:#EFF6FF;border-left:4px solid #3B82F6;border-radius:0 6px 6px 0;font-size:0.83em;color:#1E3A8A;">
          <strong>어시스트 운동 계산 정보</strong><br>
          ${weightResult.assistNotes.map(n =>
            `${n.name}: 보조중량 ${n.assistWeight}kg → 실제 부하 ${n.effectiveLoad}kg (체중 ${n.bodyWeight}kg 기준)`
          ).join('<br>')}
        </div>` : ''}
      </div>
    `;
  }

  // 신체 지표 + BMI 시각화
  const bmiVal = bmi;
  const bmiSegments = [
    { label: '저체중', max: 18.5, color: '#60A5FA' },
    { label: '정상', max: 23.0, color: '#34D399' },
    { label: '과체중', max: 25.0, color: '#FBBF24' },
    { label: '경도비만', max: 30.0, color: '#F97316' },
    { label: '고도비만', max: 40.0, color: '#EF4444' },
  ];
  const bmiMin = 10, bmiMax = 40;
  const bmiClamp = Math.min(Math.max(bmiVal, bmiMin), bmiMax);
  const bmiPct = ((bmiClamp - bmiMin) / (bmiMax - bmiMin)) * 100;

  // 각 구간 너비 계산
  const totalRange = bmiMax - bmiMin;
  let segWidths = [];
  let prev = bmiMin;
  bmiSegments.forEach(seg => {
    const w = ((Math.min(seg.max, bmiMax) - prev) / totalRange) * 100;
    segWidths.push(w);
    prev = seg.max;
  });

  // 현재 BMI 구간 라벨
  let bmiLabel = '고도비만';
  if (bmiVal < 18.5) bmiLabel = '저체중';
  else if (bmiVal < 23.0) bmiLabel = '정상';
  else if (bmiVal < 25.0) bmiLabel = '과체중';
  else if (bmiVal < 30.0) bmiLabel = '경도비만';

  html += `
    <div class="result-card">
      <div class="result-title">신체 지표 요약</div>

      <!-- BMI 시각화 -->
      <div style="margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
          <span style="font-size:0.88em;font-weight:600;color:#374151;">BMI</span>
          <span style="font-size:1.3em;font-weight:700;color:#1E3A8A;">${bmiVal.toFixed(1)}
            <span style="font-size:0.7em;font-weight:500;color:#6B7280;margin-left:4px;">${bmiLabel}</span>
          </span>
        </div>
        <!-- 게이지 바 -->
        <div style="position:relative;height:28px;border-radius:14px;overflow:hidden;display:flex;">
          ${bmiSegments.map((seg, i) => `
            <div style="flex:${segWidths[i]};background:${seg.color};opacity:0.85;"></div>
          `).join('')}
          <!-- 마커 -->
          <div style="position:absolute;left:${bmiPct}%;top:0;bottom:0;width:3px;background:#1E293B;transform:translateX(-50%);border-radius:2px;"></div>
          <div style="position:absolute;left:${bmiPct}%;top:-22px;transform:translateX(-50%);font-size:0.78em;font-weight:700;color:#1E293B;white-space:nowrap;">${bmiVal.toFixed(1)}</div>
        </div>
        <!-- 구간별 라벨: 각 섹터 바로 아래 -->
        <div style="display:flex;margin-top:6px;">
          ${bmiSegments.map((seg, i) => `
            <div style="flex:${segWidths[i]};display:flex;flex-direction:column;align-items:center;gap:2px;">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${seg.color};opacity:0.9;"></span>
              <span style="font-size:0.62em;color:#6B7280;white-space:nowrap;">${seg.label}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 나머지 지표 -->
      <div class="body-grid">
        <div class="body-item">
          <div class="body-item-label">기초대사량 (BMR)</div>
          <div class="body-item-value">${Math.round(bmr)} kcal</div>
        </div>
        <div class="body-item">
          <div class="body-item-label">권장 섭취 칼로리</div>
          <div class="body-item-value">${recommended} kcal</div>
        </div>
        <div class="body-item">
          <div class="body-item-label">적정 체중</div>
          <div class="body-item-value">${idealWeight.toFixed(1)} kg</div>
        </div>
        <div class="body-item">
          <div class="body-item-label">적정 체중 대비 차이</div>
          <div class="body-item-value" style="color:${userInfo.weight > idealWeight ? '#EF4444' : '#10B981'}">
            ${userInfo.weight > idealWeight ? '+' : ''}${(userInfo.weight - idealWeight).toFixed(1)} kg
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('resultContent').innerHTML = html;
}