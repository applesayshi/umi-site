/**
 * Makes CMS image thumbnails work.
 *
 * Content stores images as paths relative to each content file
 * (../../assets/uploads/photo.jpg) so Astro can optimise them. Inside the admin
 * at /admin/, that same relative path resolves to /assets/uploads/photo.jpg,
 * so this integration serves the original uploads at that URL: live from
 * src/ during development, and copied into the build for production.
 * Visitors never see these originals; pages use the optimised AVIF/WebP versions.
 */
import { createReadStream } from 'node:fs';
import { cp, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export default function cmsMedia({ source = 'src/assets/uploads', mount = '/assets/uploads' } = {}) {
  let root = process.cwd();

  return {
    name: 'umi-cms-media',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = fileURLToPath(config.root);
      },

      'astro:server:setup': ({ server }) => {
        const dir = path.resolve(root, source);
        server.middlewares.use(mount, async (req, res, next) => {
          try {
            const requested = decodeURIComponent((req.url ?? '/').split('?')[0]);
            const file = path.resolve(dir, `.${requested}`);
            if (!file.startsWith(dir + path.sep)) return next();
            const info = await stat(file);
            const type = MIME[path.extname(file).toLowerCase()];
            if (!info.isFile() || !type) return next();
            res.setHeader('Content-Type', type);
            res.setHeader('Content-Length', info.size);
            createReadStream(file).pipe(res);
          } catch {
            next();
          }
        });
      },

      'astro:build:done': async ({ dir, logger }) => {
        const target = path.join(fileURLToPath(dir), mount);
        await cp(path.resolve(root, source), target, { recursive: true });
        logger.info(`Copied CMS image originals to ${mount} for admin thumbnails`);
      },
    },
  };
}
