const { getStore, normalizeLink } = require('./store');

const LINK_DETECTORS = [
  /https?:\/\/[^\s<>[\]()]+/i,
  /(?:^|[\s(])www\.[^\s<>[\]()]+/i,
  /discord(?:\.gg|\.com\/invite|app\.com\/invite)\/[^\s<>[\]()]+/i,
  /(?:^|[\s(])[\w-]+\.(?:com|org|net|gg|io|me|co|uk|de|fr|ru|tv|app|dev|link|xyz|info|biz|online|site|tech|store|shop|blog|live|pro|cc|ly|be|nl|pl|es|it|br|jp|kr|cn|in|eu|us|ca|au)(?:\/[^\s<>[\]()]*)?/i,
];

const EXTRACT_PATTERN = /https?:\/\/[^\s<>[\]()]+|(?:^|[\s(])www\.[^\s<>[\]()]+|discord(?:\.gg|\.com\/invite|app\.com\/invite)\/[^\s<>[\]()]+|(?:^|[\s(])[\w-]+\.(?:com|org|net|gg|io|me|co|uk|de|fr|ru|tv|app|dev|link|xyz|info|biz|online|site|tech|store|shop|blog|live|pro|cc|ly|be|nl|pl|es|it|br|jp|kr|cn|in|eu|us|ca|au)(?:\/[^\s<>[\]()]*)?/gi;

function collectMessageText(message) {
  const parts = [message.content ?? ''];

  for (const embed of message.embeds) {
    if (embed.url) parts.push(embed.url);
    if (embed.description) parts.push(embed.description);
    if (embed.title) parts.push(embed.title);
  }

  return parts.join('\n');
}

function extractLinks(content) {
  const matches = content.match(EXTRACT_PATTERN);
  return matches ?? [];
}

function hasLinks(content) {
  if (!content) return false;
  return LINK_DETECTORS.some((pattern) => pattern.test(content));
}

function messageHasLinks(message) {
  return hasLinks(collectMessageText(message));
}

function isLinkAuthorized(userId, content) {
  const { authorizedLinks } = getStore();
  const authorization = authorizedLinks[userId];
  if (!authorization) return false;

  if (authorization.allLinks) return true;

  const links = extractLinks(content);
  const authorizedLink = authorization.link;
  if (!authorizedLink || links.length === 0) return false;

  return links.every((link) => {
    const normalized = normalizeLink(link);
    return normalized.includes(authorizedLink) || authorizedLink.includes(normalized);
  });
}

module.exports = {
  collectMessageText,
  extractLinks,
  hasLinks,
  messageHasLinks,
  isLinkAuthorized,
};
