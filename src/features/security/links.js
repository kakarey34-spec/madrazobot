const { getStore, normalizeLink } = require('./store');

const LINK_PATTERN = /(?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]\}!?]/gi;
const DOMAIN_PATTERN = /(?:https?:\/\/)?(?:www\.)?([a-z0-9][-a-z0-9]*(?:\.[a-z0-9][-a-z0-9]*)+)/gi;

function extractLinks(content) {
  const matches = content.match(LINK_PATTERN);
  return matches ?? [];
}

function hasLinks(content) {
  return /(?:https?:\/\/|www\.)[^\s<]+/i.test(content);
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
  extractLinks,
  hasLinks,
  isLinkAuthorized,
  LINK_PATTERN,
  DOMAIN_PATTERN,
};
