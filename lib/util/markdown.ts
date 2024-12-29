export const escapeMarkdown = (text: string): string => {
  // First escape backslashes themselves
  let escaped = text.replace(/\\/g, '\\\\')

  // Then escape special Markdown V2 characters
  // Note: putting the dash at the end of the character class to avoid it being interpreted as a range
  escaped = escaped.replace(/[_[\]()~`>#+=|{}.!]|-|–|—/g, '\\$&')

  return escaped
}
