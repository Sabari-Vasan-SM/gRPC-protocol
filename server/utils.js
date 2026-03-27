function nowIso() {
    return new Date().toISOString();
}

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

module.exports = {
    nowIso,
    generateId,
};
