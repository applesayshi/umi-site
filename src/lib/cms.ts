/**
 * Links into the content manager at /admin, used by the pencils that logged-in editors see on the site
 * (ui/EditPin.astro and layout/EditorBar.astro). Collection and file names match public/admin/config.yml.
 */
type EntryCollection = 'events' | 'gallery' | 'songs' | 'team' | 'sponsors';
type PageFile = 'home' | 'produce' | 'about' | 'join' | 'booking' | 'lessons' | 'sponsors' | 'contact';

/** The content manager itself. index.html is spelled out so the link also works on the local dev server. */
export const CMS_HOME = '/admin/index.html';
const COLLECTIONS = `${CMS_HOME}#/collections`;

/** An event, album, song, exec or sponsor. The CMS knows entries by file name, which can differ from the page URL. */
export function cmsEntry(entry: { collection: EntryCollection; id: string; filePath?: string }) {
  const file = entry.filePath?.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '');
  return `${COLLECTIONS}/${entry.collection}/entries/${file || entry.id}`;
}

/** A page's words and photos (Pages in the CMS). */
export const cmsPage = (file: PageFile) => `${COLLECTIONS}/pages/entries/${file}`;

/** Contact details, socials, links and the announcement bar. */
export const cmsSettings = `${COLLECTIONS}/settings/entries/site`;

/** The form for adding a new event, album, song, exec or sponsor. */
export const cmsNew = (collection: EntryCollection) => `${COLLECTIONS}/${collection}/new`;

/** Every event, album, song, exec or sponsor, for pages that list them. */
export const cmsCollection = (collection: EntryCollection) => `${COLLECTIONS}/${collection}`;
