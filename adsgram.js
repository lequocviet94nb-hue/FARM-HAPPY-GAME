/**
 * Adsgram backward-compatibility bridge -> delegates to MonetagManager
 */
if (typeof MonetagManager !== 'undefined' && !window.monetagManager) {
    window.monetagManager = new MonetagManager();
}
if (window.monetagManager) {
    window.adsgramManager = window.monetagManager;
}
