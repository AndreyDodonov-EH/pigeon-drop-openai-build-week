/** Tiny dictionary i18n for the instructional UI text (wizard, control hints).
 * Language comes from the browser (`navigator.languages`), overridable with
 * `?lang=xx` for testing. Unsupported languages fall back to English.
 * Key tokens (SPACE, LMB/RMB, S) stay literal except where a language has an
 * established gamer term (e.g. Russian ЛКМ/ПКМ). */

const STRINGS = {
  en: {
    howToPlay: 'HOW TO PLAY',
    holdClimb: 'HOLD — CLIMB',
    dragDive: 'DRAG DOWN — DIVE',
    holdRip: 'HOLD — LET IT RIP',
    tapStart: 'TAP ANYWHERE TO START',
    kbClimb: 'HOLD ↑ / SPACE / LMB — CLIMB',
    kbDive: 'HOLD ↓ — DIVE',
    kbRip: 'HOLD S / RMB — LET IT RIP',
    clickStart: 'CLICK OR PRESS ANY KEY TO START',
  },
  es: {
    howToPlay: 'CÓMO JUGAR',
    holdClimb: 'MANTÉN — SUBIR',
    dragDive: 'DESLIZA ABAJO — PICADO',
    holdRip: 'MANTÉN — ¡SUÉLTALO!',
    tapStart: 'TOCA PARA EMPEZAR',
    kbClimb: 'MANTÉN ↑ / ESPACIO / LMB — SUBIR',
    kbDive: 'MANTÉN ↓ — PICADO',
    kbRip: 'MANTÉN S / RMB — ¡SUÉLTALO!',
    clickStart: 'CLIC O CUALQUIER TECLA PARA EMPEZAR',
  },
  fr: {
    howToPlay: 'COMMENT JOUER',
    holdClimb: 'MAINTIENS — MONTER',
    dragDive: 'GLISSE VERS LE BAS — PIQUÉ',
    holdRip: 'MAINTIENS — LÂCHE TOUT',
    tapStart: 'TOUCHE POUR COMMENCER',
    kbClimb: 'MAINTIENS ↑ / ESPACE / LMB — MONTER',
    kbDive: 'MAINTIENS ↓ — PIQUÉ',
    kbRip: 'MAINTIENS S / RMB — LÂCHE TOUT',
    clickStart: 'CLIQUE OU APPUIE SUR UNE TOUCHE',
  },
  de: {
    howToPlay: 'SO WIRD GESPIELT',
    holdClimb: 'HALTEN — STEIGEN',
    dragDive: 'RUNTERZIEHEN — STURZFLUG',
    holdRip: 'HALTEN — LASS ES RAUS',
    tapStart: 'ZUM STARTEN TIPPEN',
    kbClimb: 'HALTEN ↑ / SPACE / LMB — STEIGEN',
    kbDive: 'HALTEN ↓ — STURZFLUG',
    kbRip: 'HALTEN S / RMB — LASS ES RAUS',
    clickStart: 'KLICKEN ODER TASTE DRÜCKEN',
  },
  it: {
    howToPlay: 'COME SI GIOCA',
    holdClimb: 'TIENI PREMUTO — SALI',
    dragDive: 'TRASCINA GIÙ — PICCHIATA',
    holdRip: 'TIENI PREMUTO — MOLLA TUTTO',
    tapStart: 'TOCCA PER INIZIARE',
    kbClimb: 'TIENI ↑ / SPAZIO / LMB — SALI',
    kbDive: 'TIENI ↓ — PICCHIATA',
    kbRip: 'TIENI S / RMB — MOLLA TUTTO',
    clickStart: 'CLICCA O PREMI UN TASTO PER INIZIARE',
  },
  pt: {
    howToPlay: 'COMO JOGAR',
    holdClimb: 'SEGURE — SUBIR',
    dragDive: 'ARRASTE PARA BAIXO — MERGULHO',
    holdRip: 'SEGURE — MANDA VER',
    tapStart: 'TOQUE PARA COMEÇAR',
    kbClimb: 'SEGURE ↑ / ESPAÇO / LMB — SUBIR',
    kbDive: 'SEGURE ↓ — MERGULHO',
    kbRip: 'SEGURE S / RMB — MANDA VER',
    clickStart: 'CLIQUE OU APERTE UMA TECLA',
  },
  ru: {
    howToPlay: 'КАК ИГРАТЬ',
    holdClimb: 'ДЕРЖИ — ВЗЛЁТ',
    dragDive: 'ТЯНИ ВНИЗ — ПИКЕ',
    holdRip: 'ДЕРЖИ — БОМБИ!',
    tapStart: 'КОСНИСЬ, ЧТОБЫ НАЧАТЬ',
    kbClimb: 'ДЕРЖИ ↑ / ПРОБЕЛ / ЛКМ — ВЗЛЁТ',
    kbDive: 'ДЕРЖИ ↓ — ПИКЕ',
    kbRip: 'ДЕРЖИ S / ПКМ — БОМБИ!',
    clickStart: 'КЛИКНИ ИЛИ НАЖМИ ЛЮБУЮ КЛАВИШУ',
  },
  uk: {
    howToPlay: 'ЯК ГРАТИ',
    holdClimb: 'ТРИМАЙ — ЗЛІТ',
    dragDive: 'ТЯГНИ ВНИЗ — ПІКЕ',
    holdRip: 'ТРИМАЙ — БОМБИ!',
    tapStart: 'ТОРКНИСЬ, ЩОБ ПОЧАТИ',
    kbClimb: 'ТРИМАЙ ↑ / ПРОБІЛ / ЛКМ — ЗЛІТ',
    kbDive: 'ТРИМАЙ ↓ — ПІКЕ',
    kbRip: 'ТРИМАЙ S / ПКМ — БОМБИ!',
    clickStart: 'КЛІКНИ АБО НАТИСНИ БУДЬ-ЯКУ КЛАВІШУ',
  },
  ja: {
    howToPlay: 'あそびかた',
    holdClimb: '長押し — 上昇',
    dragDive: '下にドラッグ — 急降下',
    holdRip: '長押し — ぶちまけろ！',
    tapStart: 'タップでスタート',
    kbClimb: '↑ / スペース / 左クリック 長押し — 上昇',
    kbDive: '↓ 長押し — 急降下',
    kbRip: 'S / 右クリック 長押し — ぶちまけろ！',
    clickStart: 'クリックかキーでスタート',
  },
  zh: {
    howToPlay: '玩法说明',
    holdClimb: '按住 — 爬升',
    dragDive: '下拉 — 俯冲',
    holdRip: '按住 — 开拉！',
    tapStart: '点击任意处开始',
    kbClimb: '按住 ↑ / 空格 / 左键 — 爬升',
    kbDive: '按住 ↓ — 俯冲',
    kbRip: '按住 S / 右键 — 开拉！',
    clickStart: '点击或按任意键开始',
  },
  ko: {
    howToPlay: '게임 방법',
    holdClimb: '길게 누르기 — 상승',
    dragDive: '아래로 드래그 — 급강하',
    holdRip: '길게 누르기 — 발사!',
    tapStart: '화면을 탭하여 시작',
    kbClimb: '↑ / 스페이스 / 좌클릭 꾹 — 상승',
    kbDive: '↓ 꾹 — 급강하',
    kbRip: 'S / 우클릭 꾹 — 발사!',
    clickStart: '클릭 또는 아무 키나 눌러 시작',
  },
} as const;

export type Lang = keyof typeof STRINGS;

export function detectLang(): Lang {
  const forced = new URLSearchParams(location.search).get('lang');
  const candidates = forced ? [forced] : (navigator.languages ?? [navigator.language]);
  for (const c of candidates) {
    const primary = c.toLowerCase().split('-')[0] as Lang;
    if (primary in STRINGS) return primary;
  }
  return 'en';
}

/** Strings for the detected language — resolved once at module load. */
export const t = STRINGS[detectLang()];
