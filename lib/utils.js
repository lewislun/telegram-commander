/**
 * @param {string} s
 * @returns {string}
 */
export function escapeMarkdownV2(s) {
	if (typeof s !== 'string') return s
	return s.replace(/([_\*\[\]`\-<>\.\(\)\{\}\+])/g, '\\$1')
}