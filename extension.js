/**
 * Roam Research 2024–2025 Compatible Version
 * CJK Bracket Auto-Pair + Double-Bracket Conversion + Symbol Conversion
 */

const cjkBracketPairs = {
    "【": "】",
    "（": "）",
    "「": "」",
    "『": "』",
};

const cjkDoubleBracketPairs = {
    "【【": "】】",
    "（（": "））",

    "『「": "』」",
    "「『": "」』",
    "『『": "』』",
    "「「": "」」",
};

const cjkBracketToRefPatterns = {
    "【【": "[[",
    "】】": "]]",

    "（（": "((",
    "））": "))",

    "『「": "{{",
    "』」": "}}",

    "「『": "{{",
    "」』": "}}",

    "『『": "{{",
    "』』": "}}",

    "「「": "{{",
    "」」": "}}",
};

const CJKToRoamSymbols = {
    "：：": "::",
    "；；": ";;",
};

const CJKToRoamSymbolsCursorPositionAfterConverting = {
    "：：": "left",
    "；；": "right",
};


function assert(x) {
    if (!x) throw new Error("Assertion failed");
}

/**
 * New: Robust detection for Roam textarea (2024–2025 UI)
 */
function isEditingBlockWithDOMElement(el) {
    if (!(el instanceof HTMLTextAreaElement)) return false;
    if (el !== document.activeElement) return false;

    return (
        el.className.includes("rm-block") ||
        el.classList.contains("rm-block-input") ||
        el.classList.contains("rm-block__input-area") ||
        el.closest(".rm-block-main")
    );
}

/**
 * Prevent default behavior, update textarea, and trigger Roam DB update.
 */
function preventDefaultWithSubstitution(event, el, substitution, start, end) {
    assert(event.target === el);
    assert(!event.defaultPrevented);

    el.setRangeText(substitution, start, end, "preserve");
    event.preventDefault();

    // NEW: ensure it bubbles so Roam captures the update
    setTimeout(() => {
        const manualEvent = new Event("input", { bubbles: true });
        el.dispatchEvent(manualEvent);
    }, 0);
}

function handleKeyDown(event) {
    const el = event.target;
    if (!isEditingBlockWithDOMElement(el)) return;
    if (event.isComposing === true) return;

    const key = event.key;
    const text = el.value;
    const ss = el.selectionStart;
    const se = el.selectionEnd;

    const charBefore = ss > 0 ? text.charAt(ss - 1) : null;
    const charAfter = se < text.length ? text.charAt(se) : null;

    // -------------------------------------------------------------
    // 1. CJK Left Bracket Auto-pairing
    // -------------------------------------------------------------
    if (key in cjkBracketPairs) {
        let substitution = text.substring(ss, se);
        const leftSide = charBefore + key;
        const rightSide = cjkBracketPairs[key] + charAfter;

        // Double bracket → Convert into [[ ]] or {{ }}
        if (
            leftSide in cjkDoubleBracketPairs &&
            cjkDoubleBracketPairs[leftSide] === rightSide
        ) {
            const leftPattern = cjkBracketToRefPatterns[leftSide];
            const rightPattern = cjkBracketToRefPatterns[rightSide];

            substitution = leftPattern + substitution + rightPattern;
            preventDefaultWithSubstitution(event, el, substitution, ss - 1, se + 1);

            el.setSelectionRange(ss + 1, se + 1);
            return;
        }

        // Normal single bracket auto-pairing
        substitution = key + substitution + cjkBracketPairs[key];
        preventDefaultWithSubstitution(event, el, substitution, ss, se);

        el.setSelectionRange(ss + 1, se + 1);
        return;
    }

    // -------------------------------------------------------------
    // 2. Convert ：： → ::  or  ；； → ;;
    // -------------------------------------------------------------
    const twoChars = charBefore + key;
    if (twoChars in CJKToRoamSymbols) {
        const substitution = CJKToRoamSymbols[twoChars];
        const cursorPosition = CJKToRoamSymbolsCursorPositionAfterConverting[twoChars];

        preventDefaultWithSubstitution(event, el, substitution, ss - 1, se);

        if (cursorPosition === "left") {
            el.setSelectionRange(0, 0);
        } else if (cursorPosition === "right") {
            el.setSelectionRange(ss + 1, ss + 1);
        }
        return;
    }

    // -------------------------------------------------------------
    // 3. Backspace auto-delete matching CJK bracket pair
    // -------------------------------------------------------------
    if (key === "Backspace") {
        if (ss === se) {
            if (
                charBefore &&
                charAfter &&
                cjkBracketPairs[charBefore] === charAfter
            ) {
                preventDefaultWithSubstitution(event, el, "", ss - 1, se + 1);
                return;
            }
        }
    }
}

/**
 * Main Life-cycle
 */
function onload() {
    document.addEventListener("keydown", handleKeyDown);
}

function onunload() {
    document.removeEventListener("keydown", handleKeyDown);
}

export default { onload, onunload };
