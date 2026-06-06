const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'security.json');

const DEFAULT_STORE = {
  whitelistUserIds: [],
  authorizedLinks: {},
};

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2));
    return { ...DEFAULT_STORE };
  }

  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  return {
    whitelistUserIds: parsed.whitelistUserIds ?? [],
    authorizedLinks: parsed.authorizedLinks ?? {},
  };
}

let cache = ensureStore();

function saveStore() {
  fs.writeFileSync(STORE_PATH, JSON.stringify(cache, null, 2));
}

function getStore() {
  return cache;
}

function reloadStore() {
  cache = ensureStore();
  return cache;
}

function addWhitelistUser(userId) {
  if (!cache.whitelistUserIds.includes(userId)) {
    cache.whitelistUserIds.push(userId);
    saveStore();
  }
}

function removeWhitelistUser(userId) {
  cache.whitelistUserIds = cache.whitelistUserIds.filter((id) => id !== userId);
  saveStore();
}

function authorizeUserLink(userId, options = {}) {
  const { link = null, authorizedBy } = options;

  cache.authorizedLinks[userId] = {
    allLinks: !link,
    link: link ? normalizeLink(link) : null,
    authorizedBy,
    authorizedAt: Date.now(),
  };
  saveStore();
}

function revokeUserLinkAuthorization(userId) {
  delete cache.authorizedLinks[userId];
  saveStore();
}

function normalizeLink(link) {
  return link.trim().toLowerCase().replace(/\/$/, '');
}

module.exports = {
  getStore,
  reloadStore,
  addWhitelistUser,
  removeWhitelistUser,
  authorizeUserLink,
  revokeUserLinkAuthorization,
  normalizeLink,
};
