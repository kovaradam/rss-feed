export function getMissingTitle(title: string, description: string) {
  if (title) {
    return title;
  }
  title = description.slice(0, 30);
  return title.slice(0, title.lastIndexOf(' ')).concat(' ...');
}
