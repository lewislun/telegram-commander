/**
 * @param {string|number} s
 * @returns {string}
 */
export function escapeMarkdownV2(s) {
	return String(s).replace(/([_\*\[\]`\-<>\.\(\)\{\}\+=#~|!])/g, '\\$1')
}