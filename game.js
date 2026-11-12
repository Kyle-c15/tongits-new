(function () {
  "use strict";

  const CARD_ASSET = "asset/card/";
  const GAME_SECONDS = 30;
  const COMBO_WINDOW_MS = 4000;
  const OVERLAP_THRESHOLD = 0.16;
  const challengeParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const incomingSeedRaw = challengeParams.get("c");
  const incomingSeed = incomingSeedRaw ? Number.parseInt(incomingSeedRaw, 36) : Number.NaN;
  const incomingBeat = Math.max(0, Number(challengeParams.get("beat")) || 0);

  function localDateKey() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  const activeSeed = Number.isFinite(incomingSeed)
    ? incomingSeed >>> 0
    : hashString(`tongits-rush-${localDateKey()}`);

  const suits = {
    hearts: { label: "红桃", rankColor: "red", suitFile: "30_suit_heart_red.png" },
    diamonds: { label: "方块", rankColor: "red", suitFile: "29_suit_diamond_red.png" },
    clubs: { label: "梅花", rankColor: "black", suitFile: "31_suit_club_black.png" },
    spades: { label: "黑桃", rankColor: "black", suitFile: "32_suit_spade_black.png" }
  };

  const rankFiles = {
    red: {
      A: "03_rank_red_A.png", 2: "04_rank_red_2.png", 3: "05_rank_red_3.png",
      4: "06_rank_red_4.png", 5: "07_rank_red_5.png", 6: "08_rank_red_6.png",
      7: "09_rank_red_7.png", 8: "10_rank_red_8.png", 9: "11_rank_red_9.png",
      10: "12_rank_red_10.png", J: "13_rank_red_J.png", Q: "14_rank_red_Q.png", K: "15_rank_red_K.png"
    },
    black: {
      A: "16_rank_black_A.png", 2: "17_rank_black_2.png", 3: "18_rank_black_3.png",
      4: "19_rank_black_4.png", 5: "20_rank_black_5.png", 6: "21_rank_black_6.png",
      7: "22_rank_black_7.png", 8: "23_rank_black_8.png", 9: "24_rank_black_9.png",
      10: "25_rank_black_10.png", J: "26_rank_black_J.png", Q: "27_rank_black_Q.png", K: "28_rank_black_K.png"
    }
  };

  const rankValues = { A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13 };

  // Seventeen disjoint Melds use 51 unique cards from one standard deck (4 diamonds is omitted).
  const meldGroups = [
    [["A", "spades"], ["2", "spades"], ["3", "spades"]],
    [["A", "diamonds"], ["A", "clubs"], ["A", "hearts"]],
    [["2", "hearts"], ["2", "clubs"], ["2", "diamonds"]],
    [["3", "hearts"], ["3", "clubs"], ["3", "diamonds"]],
    [["4", "hearts"], ["4", "clubs"], ["4", "spades"]],
    [["5", "hearts"], ["5", "clubs"], ["5", "spades"]],
    [["5", "diamonds"], ["6", "diamonds"], ["7", "diamonds"]],
    [["6", "hearts"], ["6", "clubs"], ["6", "spades"]],
    [["7", "hearts"], ["7", "clubs"], ["7", "spades"]],
    [["8", "hearts"], ["8", "clubs"], ["8", "spades"]],
    [["8", "diamonds"], ["9", "diamonds"], ["10", "diamonds"]],
    [["9", "hearts"], ["9", "clubs"], ["9", "spades"]],
    [["10", "hearts"], ["10", "clubs"], ["10", "spades"]],
    [["J", "hearts"], ["J", "clubs"], ["J", "spades"]],
    [["J", "diamonds"], ["Q", "diamonds"], ["K", "diamonds"]],
    [["Q", "hearts"], ["Q", "clubs"], ["Q", "spades"]],
    [["K", "hearts"], ["K", "clubs"], ["K", "spades"]]
  ];

  // The reference silhouette uses seven real Z layers and thirteen irregular vertical bands.
  // Four five-card piles are real cards: two are embedded at the sides and two stand at the bottom.
  const layoutSlots = [
    slot("c01", 44, 3.5, 5, -1.2), slot("c02", 56, 3.5, 5, 1.1), slot("c03", 50, 10.5, 6, .2),
    slot("c04", 34.7, 15.5, 5, -1), slot("c05", 44.9, 15, 5, .6), slot("c06", 55.1, 15.5, 5, -.5), slot("c07", 65.3, 16.5, 5, .9),
    slot("c08", 29.6, 24, 4, -1), slot("c09", 39.8, 23, 4, .7), slot("c10", 50, 24.5, 4, -.6),
    slot("c11", 60.2, 23.5, 4, .8), slot("c12", 70.4, 24.5, 4, -.8), slot("c13", 50, 31.5, 4, .3),
    slot("c14", 19.4, 35, 3, -1.1), slot("c15", 29.6, 34, 3, .5), slot("c16", 39.8, 35.5, 3, -.7),
    slot("c17", 50, 34, 3, .4), slot("c18", 60.2, 35, 3, -.5), slot("c19", 70.4, 34, 3, .8),
    slot("c20", 80.6, 35.5, 3, -1), slot("c21", 50, 42, 3, .2),
    slot("c22", 29.6, 50, 2, -.8), slot("c23", 39.8, 49, 2, .5), slot("c24", 50, 51, 2, -.4),
    slot("c25", 60.2, 49.5, 2, .7), slot("c26", 70.4, 50.5, 2, -.6),
    slot("c27", 39.8, 60, 1, -.8), slot("c28", 60.2, 60, 1, .5),
    slot("c29", 44.9, 67.5, 1, -.4), slot("c30", 55.1, 67, 1, .7),
    slot("c31", 50, 75, 0, -.2),
    ...pileSlots("sl", 8.5, 42, -1), ...pileSlots("sr", 91.5, 42, 1),
    ...pileSlots("bl", 14, 82, -1), ...pileSlots("br", 86, 82, 1)
  ];

  // Consecutive triplets form a valid removal route at both desktop and mobile board ratios.
  const removalPlan = [
    ["c03", "c04", "c07"], ["c01", "c02", "c05"], ["c06", "c09", "c08"],
    ["c11", "c10", "c12"], ["c13", "sl0", "sr0"], ["bl0", "br0", "c15"],
    ["c17", "c19", "c14"], ["c18", "c16", "c20"], ["c21", "sl1", "sr1"],
    ["bl1", "br1", "sl2"], ["sr2", "c23", "c25"], ["c22", "c26", "c24"],
    ["bl2", "br2", "sl3"], ["sr3", "c28", "c30"], ["c27", "c29", "bl3"],
    ["br3", "sl4", "sr4"], ["c31", "bl4", "br4"]
  ];
  const slotById = new Map(layoutSlots.map((layout) => [layout.slotId, layout]));
  const levelPositions = removalPlan.flatMap((group) => group.map((id) => slotById.get(id)));

  const $ = (id) => document.getElementById(id);
  const board = $("board");
  let game = null;
  let timerId = null;
  let toastTimer = null;
  let resizeFrame = null;

  function slot(slotId, x, y, layer, rotation, pileId = null, pileDepth = 0) {
    return { slotId, x, y, layer, rotation, pileId, pileDepth };
  }

  function pileSlots(pileId, x, y, rotation) {
    return Array.from({ length: 5 }, (_, pileDepth) => slot(
      `${pileId}${pileDepth}`,
      x,
      y + pileDepth * .8,
      4 - pileDepth,
      rotation + (pileDepth % 2 ? .25 : -.15),
      pileId,
      pileDepth
    ));
  }

  function buildRound(round) {
    const groupOffset = ((round - 1) * 5) % meldGroups.length;
    return levelPositions.map((layout, index) => {
      const positionGroup = Math.floor(index / 3);
      const cardInGroup = index % 3;
      const group = meldGroups[(positionGroup + groupOffset) % meldGroups.length];
      const [rank, suit] = group[cardInGroup];
      return {
        ...layout,
        id: `r${round}-c${index + 1}`,
        order: index,
        rank,
        suit,
        active: true,
        blockers: []
      };
    });
  }

  function rankSrc(rank, suit) {
    return CARD_ASSET + rankFiles[suits[suit].rankColor][rank];
  }

  function suitSrc(suit) {
    return CARD_ASSET + suits[suit].suitFile;
  }

  function cardLabel(card) {
    return `${suits[card.suit].label}${card.rank}`;
  }

  function cardFaceMarkup(card, prefix = "card") {
    const tenClass = card.rank === "10" ? " ten" : "";
    return `
      <img class="${prefix}-blank" src="${CARD_ASSET}02_card_front_blank.png" alt="" draggable="false">
      <img class="${prefix}-rank${tenClass}" src="${rankSrc(card.rank, card.suit)}" alt="" draggable="false">
      <img class="${prefix}-suit" src="${suitSrc(card.suit)}" alt="" draggable="false">`;
  }

  function isPileFaceDown(card) {
    if (!card.pileId) return false;
    return game.cards.some((other) => other.active
      && other.pileId === card.pileId
      && other.pileDepth < card.pileDepth);
  }

  function renderPreview() {
    const cards = [
      { rank: "10", suit: "hearts" },
      { rank: "J", suit: "hearts" },
      { rank: "Q", suit: "hearts" }
    ];
    $("preview-cards").innerHTML = cards.map((card) => `
      <div class="preview-card">
        <img class="card-blank" src="${CARD_ASSET}02_card_front_blank.png" alt="">
        <img class="card-rank${card.rank === "10" ? " ten" : ""}" src="${rankSrc(card.rank, card.suit)}" alt="">
        <img class="card-rank bottom${card.rank === "10" ? " ten" : ""}" src="${rankSrc(card.rank, card.suit)}" alt="">
        <img class="card-suit" src="${suitSrc(card.suit)}" alt="">
      </div>`).join("");
  }

  function createCardElement(card, dealing) {
    const exposed = isExposed(card);
    const faceDown = isPileFaceDown(card);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `playing-card ${exposed ? "exposed" : "blocked"}${faceDown ? " pile-covered" : ""}${game.selected.includes(card.id) ? " selected" : ""}${game.hintIds.includes(card.id) ? " hinted" : ""}${dealing ? " dealing" : ""}`;
    button.dataset.cardId = card.id;
    button.style.left = `${card.x}%`;
    button.style.top = `${card.y}%`;
    button.style.zIndex = String(card.layer * 100 + card.order);
    button.style.setProperty("--card-rotation", `${card.rotation}deg`);
    button.style.setProperty("--deal-order", card.order);
    button.setAttribute("aria-label", faceDown ? "牌堆中的盖牌" : exposed ? cardLabel(card) : `${cardLabel(card)}，被遮挡`);
    button.disabled = !exposed || !game.running || game.resolving;
    button.innerHTML = faceDown
      ? `<img class="card-back" src="${CARD_ASSET}01_card_back.png" alt="" draggable="false">`
      : `
      <img class="card-blank" src="${CARD_ASSET}02_card_front_blank.png" alt="" draggable="false">
      <img class="card-rank${card.rank === "10" ? " ten" : ""}" src="${rankSrc(card.rank, card.suit)}" alt="" draggable="false">
      <img class="card-rank bottom${card.rank === "10" ? " ten" : ""}" src="${rankSrc(card.rank, card.suit)}" alt="" draggable="false">
      <img class="card-suit" src="${suitSrc(card.suit)}" alt="" draggable="false">`;
    return button;
  }

  function renderBoard(options = {}) {
    if (!game) return;
    board.replaceChildren();
    game.cards.filter((card) => card.active).forEach((card) => {
      board.appendChild(createCardElement(card, Boolean(options.dealing)));
    });
    requestAnimationFrame(() => {
      syncBlocking();
      paintCardStates();
    });
  }

  function syncBlocking() {
    if (!game) return;
    const nodes = new Map([...board.querySelectorAll(".playing-card")].map((node) => [node.dataset.cardId, node]));
    const active = game.cards.filter((card) => card.active);

    function getLayoutRect(node) {
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      const left = node.offsetLeft - width / 2;
      const top = node.offsetTop;
      return { left, top, right: left + width, bottom: top + height, width, height };
    }

    active.forEach((card) => {
      const node = nodes.get(card.id);
      if (!node) return;
      // Use layout geometry so deal, hover, selection and hint transforms cannot change blocking.
      const rect = getLayoutRect(node);
      const cardArea = rect.width * rect.height;
      card.blockers = active.filter((other) => {
        if (other.id === card.id || other.layer <= card.layer) return false;
        const otherNode = nodes.get(other.id);
        if (!otherNode) return false;
        const otherRect = getLayoutRect(otherNode);
        const overlapWidth = Math.max(0, Math.min(rect.right, otherRect.right) - Math.max(rect.left, otherRect.left));
        const overlapHeight = Math.max(0, Math.min(rect.bottom, otherRect.bottom) - Math.max(rect.top, otherRect.top));
        const overlapArea = overlapWidth * overlapHeight;
        return overlapArea / Math.min(cardArea, otherRect.width * otherRect.height) >= OVERLAP_THRESHOLD;
      }).map((other) => other.id);
    });
  }

  function paintCardStates() {
    board.querySelectorAll(".playing-card").forEach((node) => {
      const card = game.cards.find((item) => item.id === node.dataset.cardId);
      if (!card) return;
      const exposed = isExposed(card);
      const faceDown = isPileFaceDown(card);
      node.disabled = !exposed || !game.running || game.resolving;
      node.classList.toggle("exposed", exposed);
      node.classList.toggle("blocked", !exposed);
      node.classList.toggle("pile-covered", faceDown);
      node.classList.toggle("selected", game.selected.includes(card.id));
      node.classList.toggle("hinted", game.hintIds.includes(card.id));
      node.setAttribute("aria-label", faceDown ? "牌堆中的盖牌" : exposed ? cardLabel(card) : `${cardLabel(card)}，被遮挡`);
    });
  }

  function isExposed(card) {
    return card.active && (!card.blockers || card.blockers.length === 0);
  }

  function getSelectedCards() {
    return game.cards.filter((card) => game.selected.includes(card.id));
  }

  function getMeld(cards) {
    if (cards.length !== 3) return null;
    const sameRank = cards.every((card) => card.rank === cards[0].rank);
    const uniqueSuits = new Set(cards.map((card) => card.suit)).size === cards.length;
    if (sameRank && uniqueSuits) return { type: "同点数组" };

    const sameSuit = cards.every((card) => card.suit === cards[0].suit);
    const values = cards.map((card) => rankValues[card.rank]).sort((a, b) => a - b);
    const consecutive = values[1] === values[0] + 1 && values[2] === values[1] + 1;
    if (sameSuit && consecutive) return { type: "同花顺" };
    return null;
  }

  function combinationsOfThree(cards) {
    const combinations = [];
    for (let a = 0; a < cards.length - 2; a += 1) {
      for (let b = a + 1; b < cards.length - 1; b += 1) {
        for (let c = b + 1; c < cards.length; c += 1) combinations.push([cards[a], cards[b], cards[c]]);
      }
    }
    return combinations;
  }

  function findAvailableMeld() {
    const exposed = game.cards.filter(isExposed);
    return combinationsOfThree(exposed).find((cards) => getMeld(cards)) || null;
  }

  function chooseCard(cardId) {
    if (!game?.running || game.resolving) return;
    const card = game.cards.find((item) => item.id === cardId);
    if (!card || !isExposed(card)) return;

    const selectedIndex = game.selected.indexOf(cardId);
    if (selectedIndex >= 0) game.selected.splice(selectedIndex, 1);
    else if (game.selected.length < 3) game.selected.push(cardId);
    else showToast("一次只判断 3 张牌", "error");

    game.hintIds = [];
    updateSelection();
    paintCardStates();
  }

  function clearSelection() {
    if (!game) return;
    game.selected = [];
    updateSelection();
    paintCardStates();
  }

  function updateSelection() {
    if (!game) return;
    const cards = getSelectedCards();
    const meld = getMeld(cards);
    const status = $("selection-status");
    const button = $("meld-button");

    if (cards.length === 0) status.textContent = "选择 3 张牌";
    else if (cards.length < 3) status.textContent = `还需 ${3 - cards.length} 张`;
    else if (meld) status.textContent = `${meld.type} · 可以打出`;
    else {
      status.textContent = "这 3 张不是 Meld";
      if (game.combo > 0) {
        game.combo = 0;
        $("combo-value").textContent = "x0";
        showToast("无效组合，Combo 归零", "error");
      }
    }

    const inComboWindow = game.lastSuccessAt > 0 && performance.now() - game.lastSuccessAt < COMBO_WINDOW_MS;
    const projectedCombo = inComboWindow ? game.combo + 1 : 1;
    const projectedPoints = 100 + Math.max(0, projectedCombo - 1) * 25;
    button.disabled = !meld || !game.running || game.resolving;
    button.querySelector("small").textContent = meld ? `+${projectedPoints}` : "+100";
    renderSelectionSlots(cards);
  }

  function renderSelectionSlots(cards) {
    [...$("selection-slots").children].forEach((slot, index) => {
      const card = cards[index];
      slot.classList.toggle("filled", Boolean(card));
      slot.innerHTML = card ? cardFaceMarkup(card, "slot") : `<span>${index + 1}</span>`;
    });
  }

  function submitMeld() {
    if (!game?.running || game.resolving) return;
    const cards = getSelectedCards();
    const meld = getMeld(cards);
    if (!meld) return;

    const now = performance.now();
    game.combo = now - game.lastSuccessAt < COMBO_WINDOW_MS ? game.combo + 1 : 1;
    game.lastSuccessAt = now;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    game.melds += 1;
    const points = 100 + Math.max(0, game.combo - 1) * 25;
    game.score += points;
    game.resolving = true;

    $("score-value").textContent = String(game.score).padStart(4, "0");
    $("combo-value").textContent = `x${game.combo}`;
    showToast(`${meld.type}  +${points}  ·  Combo x${game.combo}`, "success");

    const removedIds = [...game.selected];
    removedIds.forEach((id) => board.querySelector(`[data-card-id="${id}"]`)?.classList.add("clearing"));
    game.selected = [];
    updateSelection();

    window.setTimeout(() => {
      if (!game) return;
      game.cards.forEach((card) => {
        if (removedIds.includes(card.id)) card.active = false;
      });
      game.resolving = false;
      if (!game.running) return;

      if (!game.cards.some((card) => card.active)) {
        game.score += 300;
        game.round += 1;
        game.cards = buildRound(game.round);
        $("score-value").textContent = String(game.score).padStart(4, "0");
        $("round-label").textContent = `牌阵 ${game.round}`;
        showToast("牌桌清空  +300", "success");
        renderBoard({ dealing: true });
      } else {
        renderBoard();
      }
      updateSelection();
    }, 360);
  }

  function useHint() {
    if (!game?.running || game.resolving || game.hints <= 0) return;
    syncBlocking();
    const meld = findAvailableMeld();
    if (!meld) {
      showToast("当前没有完整可见的 Meld", "error");
      return;
    }
    game.hints -= 1;
    game.hintIds = meld.map((card) => card.id);
    $("hint-count").textContent = game.hints;
    $("hint-button").disabled = game.hints <= 0;
    paintCardStates();
    showToast(`已标出一组${getMeld(meld).type}`, "success");
    window.setTimeout(() => {
      if (!game) return;
      game.hintIds = [];
      paintCardStates();
    }, 2300);
  }

  function showToast(message, kind = "") {
    const toast = $("toast");
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `toast show ${kind}`;
    toastTimer = window.setTimeout(() => { toast.className = "toast"; }, 1100);
  }

  function resetGameState() {
    window.clearInterval(timerId);
    game = {
      cards: buildRound(1),
      selected: [],
      hintIds: [],
      score: 0,
      combo: 0,
      maxCombo: 0,
      melds: 0,
      hints: 2,
      round: 1,
      lastSuccessAt: 0,
      startedAt: 0,
      remaining: GAME_SECONDS,
      running: false,
      resolving: false
    };
    $("score-value").textContent = "0000";
    $("combo-value").textContent = "x0";
    $("timer-value").textContent = String(GAME_SECONDS);
    $("timer").classList.remove("urgent");
    $("timer-progress").style.strokeDashoffset = "0";
    $("hint-count").textContent = "2";
    $("hint-button").disabled = false;
    $("round-label").textContent = "牌阵 1";
    updateSelection();
  }

  function startGame() {
    resetGameState();
    $("share-button").textContent = "发起同牌挑战";
    $("share-button").classList.remove("copied");
    switchScreen("game-screen");
    game.running = true;
    game.startedAt = performance.now();
    renderBoard({ dealing: true });
    updateSelection();
    tick();
    timerId = window.setInterval(tick, 80);
  }

  function tick() {
    if (!game?.running) return;
    game.remaining = Math.max(0, GAME_SECONDS - (performance.now() - game.startedAt) / 1000);
    const displaySeconds = Math.ceil(game.remaining);
    $("timer-value").textContent = String(displaySeconds);
    $("timer-progress").style.strokeDashoffset = String(113.1 * (1 - game.remaining / GAME_SECONDS));
    $("timer").classList.toggle("urgent", game.remaining <= 5);
    if (game.remaining <= 0) endGame();
  }

  function endGame() {
    if (!game?.running) return;
    game.running = false;
    game.resolving = false;
    window.clearInterval(timerId);
    const performanceScore = game.score + game.melds * 80 + game.maxCombo * 50;
    const rank = Math.max(1, Math.round(50000 / (1 + performanceScore / 700)));
    const percent = Math.min(99.9, Math.max(1, 32 + performanceScore / 48));

    $("final-score").textContent = String(game.score).padStart(4, "0");
    $("final-melds").textContent = `${game.melds} 组`;
    $("final-combo").textContent = `x${game.maxCombo}`;
    $("final-rank").textContent = `#${rank.toLocaleString("zh-CN")}`;
    $("final-percent").textContent = `${percent.toFixed(1)}%`;
    $("challenge-code").textContent = `今日牌序 ${activeSeed.toString(36).toUpperCase()}`;
    if (incomingBeat > 0) {
      const difference = game.score - incomingBeat;
      $("challenge-result").textContent = difference >= 0
        ? `挑战成功！你以 ${difference} 分优势超过好友。`
        : `距离好友的 ${incomingBeat} 分还差 ${Math.abs(difference)} 分。`;
    } else {
      $("challenge-result").textContent = "分享本局，好友将获得完全相同的牌序。";
    }

    const bestKey = `tongits-rush-best-${localDateKey()}-${activeSeed.toString(36)}`;
    const previousBest = Number(window.localStorage.getItem(bestKey)) || 0;
    if (game.score > previousBest) window.localStorage.setItem(bestKey, String(game.score));
    refreshBest();
    switchScreen("result-screen");
  }

  async function shareResult() {
    if (!game) return;
    const shareUrl = new URL(window.location.href);
    shareUrl.search = "";
    shareUrl.hash = new URLSearchParams({
      c: activeSeed.toString(36),
      beat: String(game.score)
    }).toString();
    const text = `我在 Tongits Rush Meld 得到 ${game.score} 分。用同一副牌来挑战我！`;
    const button = $("share-button");
    const shareText = `${text} ${shareUrl.href}`;

    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(shareText);
    } catch (_) {
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    button.textContent = "挑战链接已复制";
    button.classList.add("copied");

    if (navigator.share) {
      try {
        await navigator.share({ title: "Tongits Rush Meld", text, url: shareUrl.href });
      } catch (error) {
        if (error.name !== "AbortError") button.textContent = "挑战链接已复制";
      }
    }
  }

  function refreshBest() {
    const bestKey = `tongits-rush-best-${localDateKey()}-${activeSeed.toString(36)}`;
    const best = Number(window.localStorage.getItem(bestKey)) || 0;
    $("daily-best").textContent = `今日最佳：${best}`;
  }

  function setupChallengeUI() {
    if (incomingBeat > 0) {
      const banner = $("challenge-banner");
      banner.hidden = false;
      banner.textContent = `好友同牌挑战：目标 ${incomingBeat} 分`;
      $("start-button-label").textContent = `接受挑战 · 超越 ${incomingBeat} 分`;
    }
    refreshBest();
  }

  function goHome() {
    if (game) game.running = false;
    window.clearInterval(timerId);
    switchScreen("start-screen");
  }

  function switchScreen(screenId) {
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
    $(screenId).classList.add("active");
  }

  function openRules() {
    const dialog = $("rules-dialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeRules() {
    const dialog = $("rules-dialog");
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  board.addEventListener("click", (event) => {
    const card = event.target.closest(".playing-card");
    if (card) chooseCard(card.dataset.cardId);
  });
  $("start-button").addEventListener("click", startGame);
  $("restart-button").addEventListener("click", startGame);
  $("home-button").addEventListener("click", goHome);
  $("result-home").addEventListener("click", goHome);
  $("share-button").addEventListener("click", shareResult);
  $("meld-button").addEventListener("click", submitMeld);
  $("hint-button").addEventListener("click", useHint);
  $("clear-selection").addEventListener("click", clearSelection);
  $("rules-open").addEventListener("click", openRules);
  $("rules-close").addEventListener("click", closeRules);
  $("rules-confirm").addEventListener("click", closeRules);
  $("rules-dialog").addEventListener("click", (event) => {
    if (event.target === $("rules-dialog")) closeRules();
  });

  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      if (!game || !$("game-screen").classList.contains("active")) return;
      syncBlocking();
      paintCardStates();
    });
  });

  renderPreview();
  setupChallengeUI();
  window.TongitsRushMeld = { getMeld, meldGroups, levelPositions };
}());
