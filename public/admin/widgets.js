/**
 * UMI's custom content manager widgets. Loaded by admin/index.html right after Decap CMS,
 * which provides React as the `h` and `createClass` globals.
 *
 * - `photos`: a normal photo list with an "Upload photos" button (or drop zone) that adds
 *   many photos in one go. Big photos are resized to 2400px in the browser first, which also
 *   drops hidden camera data such as GPS location.
 * - `focus` (shown as "Crop position"): the whole photo from the image field next to it, with a
 *   bright box for each shape the site crops it to. Drag the box over the part to keep; the rest
 *   is dimmed. Saves a CSS object-position such as "50% 30%".
 *
 * Both lean on Decap internals (the list widget's control, and React's component tree to find
 * the photo beside a crop field), so re-test them when upgrading the pinned Decap version.
 */
(function () {
  'use strict';

  const { CMS, h, createClass } = window;
  if (!CMS || !h || !createClass) return;

  /* ─── Crop position ─────────────────────────────────────────────────────── */

  const FOCUS_PATTERN = /^(\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)%$/;
  const PREVIEW = { width: 420, height: 300 }; // the largest a photo is drawn in the editor
  const clamp = (n) => Math.min(100, Math.max(0, n));

  function parseFocus(value) {
    const match = typeof value === 'string' && FOCUS_PATTERN.exec(value.trim());
    return match ? { x: clamp(Number(match[1])), y: clamp(Number(match[2])) } : { x: 50, y: 50 };
  }

  const formatFocus = (point) => `${Math.round(point.x)}% ${Math.round(point.y)}%`;

  /** `crops: ['4 / 5', { aspect: '3 / 2', label: 'Film strip' }]` from the field's config. */
  function readCrops(field) {
    const crops = field.get('crops');
    const list = crops && crops.toJS ? crops.toJS() : ['4 / 3'];
    return list.map((crop) => {
      const aspect = typeof crop === 'string' ? crop : crop.aspect;
      const [across, down] = String(aspect).split('/').map(Number);
      const ratio = across / (down || 1);
      const shape = ratio > 1.05 ? 'Wide' : ratio < 0.95 ? 'Tall' : 'Square';
      return { ratio, label: (typeof crop === 'object' && crop.label) || shape };
    });
  }

  /**
   * Where a crop sits on a photo drawn at width × height: the largest box of the crop's shape
   * (what object-fit: cover shows), placed by the position. `spare` is how far the box can travel.
   */
  function cropBox(width, height, ratio, point) {
    const box = width / height > ratio ? { width: height * ratio, height } : { width, height: width / ratio };
    const spareX = width - box.width;
    const spareY = height - box.height;
    return { ...box, spareX, spareY, left: (spareX * point.x) / 100, top: (spareY * point.y) / 100 };
  }

  const isImmutableMap = (value) => Boolean(value) && value['@@__IMMUTABLE_MAP__@@'] === true;

  /**
   * The image path this crop belongs to: the `image` field (default `src`) in the same list item
   * or object, found by walking up React's component tree to the object control that renders this
   * field. Fields at the top of an entry read it straight from the entry.
   */
  function photoPath(instance) {
    const { field, entry } = instance.props;
    const name = field.get('name');
    const key = field.get('image', 'src');
    let fiber = instance._reactInternals || instance._reactInternalFiber;
    for (let depth = 0; fiber && depth < 120; depth += 1, fiber = fiber.return) {
      const node = fiber.stateNode;
      const props = node && typeof node.setState === 'function' ? node.props : null;
      if (!props || !isImmutableMap(props.value) || !props.field || typeof props.field.get !== 'function') continue;
      const fields = props.field.get('fields');
      if (fields && fields.some((f) => f.get('name') === name)) return props.value.get(key);
    }
    return entry.getIn(['data', key]);
  }

  const FocusControl = createClass({
    getInitialState() {
      // `loaded` and `failed` remember which photo they describe, so swapping the photo resets them.
      return { draft: null, loaded: null, failed: '' };
    },

    // The photo lives in another field, so re-render whenever the entry changes, not only this value.
    shouldComponentUpdate() {
      return true;
    },

    handleLoad(event) {
      const img = event.currentTarget;
      const src = img.getAttribute('src');
      const { loaded } = this.state;
      if (!loaded || loaded.src !== src) this.setState({ loaded: { src, w: img.naturalWidth, h: img.naturalHeight } });
    },

    handleError(event) {
      const src = event.currentTarget.getAttribute('src');
      if (this.state.failed !== src) this.setState({ failed: src });
    },

    commit(point) {
      const next = formatFocus(point);
      if (next !== this.props.value) this.props.onChange(next);
    },

    handlePointerDown(event) {
      if (event.button !== 0) return;
      const preview = event.currentTarget;
      const crop = this.crops[Number(preview.dataset.crop)];
      const rect = preview.getBoundingClientRect();
      const start = parseFocus(this.props.value);
      const box = cropBox(rect.width, rect.height, crop.ratio, start);
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      // Pressing outside the bright box moves it there first; dragging then carries it along.
      const inside = x >= box.left && x <= box.left + box.width && y >= box.top && y <= box.top + box.height;
      const from = inside
        ? start
        : {
            x: box.spareX > 1 ? clamp(((x - box.width / 2) / box.spareX) * 100) : start.x,
            y: box.spareY > 1 ? clamp(((y - box.height / 2) / box.spareY) * 100) : start.y,
          };
      preview.setPointerCapture(event.pointerId);
      preview.focus({ preventScroll: true });
      this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, from, spareX: box.spareX, spareY: box.spareY };
      this.setState({ draft: from });
      event.preventDefault();
    },

    handlePointerMove(event) {
      const drag = this.drag;
      if (!drag || drag.id !== event.pointerId) return;
      const x = drag.spareX > 1 ? clamp(drag.from.x + ((event.clientX - drag.x) / drag.spareX) * 100) : drag.from.x;
      const y = drag.spareY > 1 ? clamp(drag.from.y + ((event.clientY - drag.y) / drag.spareY) * 100) : drag.from.y;
      this.setState({ draft: { x, y } });
    },

    handlePointerUp(event) {
      const drag = this.drag;
      if (!drag || drag.id !== event.pointerId) return;
      this.drag = null;
      if (this.state.draft) this.commit(this.state.draft);
      this.setState({ draft: null });
    },

    handleKeyDown(event) {
      const step = event.shiftKey ? 10 : 2;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      const point = parseFocus(this.props.value);
      this.commit({ x: clamp(point.x + move[0]), y: clamp(point.y + move[1]) });
    },

    handleCentre() {
      this.props.onChange('50% 50%');
    },

    renderCrop(crop, index, src, photo, point) {
      const { setActiveStyle, setInactiveStyle } = this.props;
      const scale = Math.min(PREVIEW.width / photo.w, PREVIEW.height / photo.h);
      const width = photo.w * scale;
      const height = photo.h * scale;
      const box = cropBox(width, height, crop.ratio, point);
      const fits = box.spareX <= 1 && box.spareY <= 1;
      const classes = ['umi-crop', this.state.draft && 'is-dragging', fits && 'is-whole'].filter(Boolean).join(' ');
      return h(
        'div',
        { key: `${crop.ratio}-${index}`, className: 'umi-crop-wrap', style: { width: `${Math.round(width)}px` } },
        h(
          'div',
          {
            className: classes,
            style: { aspectRatio: `${photo.w} / ${photo.h}` },
            'data-crop': index,
            tabIndex: 0,
            role: 'group',
            'aria-label': `${crop.label}: drag the box, or use the arrow keys, to choose the part of the photo to keep.`,
            onPointerDown: this.handlePointerDown,
            onPointerMove: this.handlePointerMove,
            onPointerUp: this.handlePointerUp,
            onPointerCancel: this.handlePointerUp,
            onKeyDown: this.handleKeyDown,
            onFocus: setActiveStyle,
            onBlur: setInactiveStyle,
          },
          h('img', { src, alt: '', draggable: false }),
          h('span', {
            className: 'umi-crop__box',
            style: {
              left: `${(box.left / width) * 100}%`,
              top: `${(box.top / height) * 100}%`,
              width: `${(box.width / width) * 100}%`,
              height: `${(box.height / height) * 100}%`,
            },
          }),
        ),
        h('span', { className: 'umi-crop__label', 'aria-hidden': 'true' }, fits ? `${crop.label}: the whole photo fits` : crop.label),
      );
    },

    render() {
      const { field, forID, classNameWrapper, getAsset } = this.props;
      const path = photoPath(this);
      const wrapper = `${classNameWrapper} umi-focus`;

      if (!path) {
        return h('div', { id: forID, className: `${wrapper} umi-focus--empty` }, 'Choose a photo above first, then pick the part of it to keep here.');
      }

      const asset = getAsset(path, field);
      const src = asset ? String(asset) : '';
      const failed = Boolean(src) && this.state.failed === src;
      const photo = this.state.loaded && this.state.loaded.src === src ? this.state.loaded : null;
      const point = this.state.draft || parseFocus(this.props.value);
      this.crops = readCrops(field);

      let body;
      if (failed) {
        body = h('p', { className: 'umi-focus__status' }, "This photo's preview couldn't load. You can still publish; it will be centred.");
      } else if (!photo) {
        // Measure the photo first; the crop previews are drawn at its real proportions.
        body = h(
          'div',
          { className: 'umi-focus__status umi-focus__status--loading' },
          'Loading photo…',
          src && h('img', { key: src, className: 'umi-focus__probe', src, alt: '', onLoad: this.handleLoad, onError: this.handleError }),
        );
      } else {
        body = h('div', { className: 'umi-focus__crops' }, this.crops.map((crop, index) => this.renderCrop(crop, index, src, photo, point)));
      }

      return h(
        'div',
        { id: forID, className: wrapper },
        body,
        h(
          'div',
          { className: 'umi-focus__footer' },
          h('span', null, 'Drag the bright box over the part of the photo you want to show. Dimmed parts are cropped off.'),
          h('button', { type: 'button', className: 'umi-focus__reset', onClick: this.handleCentre }, 'Centre'),
        ),
      );
    },
  });

  CMS.registerWidget('focus', FocusControl, null, {
    properties: {
      image: { type: 'string' },
      crops: { type: 'array' },
    },
  });

  /* ─── Photo list with bulk upload ───────────────────────────────────────── */

  const list = CMS.getWidget('list');
  const ListControl = list && list.control;
  const MAX_EDGE = 2400;
  const WEB_IMAGE = /^image\/(jpeg|png|webp|avif)$/;
  const WEB_IMAGE_NAME = /\.(jpe?g|png|webp|avif)$/i;

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve({ img, url });
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Couldn't read ${file.name}`));
      };
      img.src = url;
    });
  }

  /** A web-sized copy: at most 2400px on the long edge. Small photos upload untouched. */
  async function shrink(file) {
    const { img, url } = await loadImage(file);
    try {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
      if (scale === 1 && file.size <= 2.5 * 1024 * 1024) return file;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const context = canvas.getContext('2d');
      context.imageSmoothingQuality = 'high';
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      // JPEG for photos; WebP keeps transparency for anything else.
      const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, type === 'image/jpeg' ? 0.86 : 0.9));
      return blob && (scale < 1 || blob.size < file.size) ? blob : file;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const randomTag = () => [...crypto.getRandomValues(new Uint8Array(6))].map((byte) => (byte % 36).toString(36)).join('');

  /** "IMG 2041 (1).JPG" → "img-2041-1-k3f9a2.jpg": web-safe, lowercase and unique, so uploads never replace each other. */
  function uploadName(original, blob) {
    const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : (original.name.match(WEB_IMAGE_NAME) || ['', 'jpg'])[1].toLowerCase().replace('jpeg', 'jpg');
    const base =
      original.name
        .replace(/\.[^.]+$/, '')
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'photo';
    return `${base}-${randomTag()}.${extension}`;
  }

  function publicFolder(config, imageField) {
    const folder = (imageField && imageField.get('public_folder')) || config.public_folder || '';
    return folder.replace(/\/+$/, '');
  }

  const PhotosControl = createClass({
    getInitialState() {
      return { listKey: 0, busy: false, done: 0, total: 0, message: '', over: false };
    },

    shouldComponentUpdate() {
      return true;
    },

    componentDidUpdate(prevProps) {
      // The list widget tracks its items internally, so rebuild it once the new photos arrive.
      if (this.rebuildList && prevProps.value !== this.props.value) {
        this.rebuildList = false;
        this.setState(({ listKey }) => ({ listKey: listKey + 1 }));
      }
    },

    // Decap validates and focuses fields through this control, so hand those calls to the list.
    validate() {
      return this.list && this.list.validate();
    },

    focus(path) {
      return this.list && this.list.focus && this.list.focus(path);
    },

    setList(instance) {
      this.list = instance;
    },

    imageField() {
      const key = this.props.field.get('upload_field', 'src');
      const fields = this.props.field.get('fields');
      return fields && fields.find((f) => f.get('name') === key);
    },

    handleInput(event) {
      const input = event.currentTarget;
      this.upload(input.files).finally(() => {
        input.value = '';
      });
    },

    handleDragOver(event) {
      if (![...(event.dataTransfer?.types || [])].includes('Files')) return;
      event.preventDefault();
      if (!this.state.over) this.setState({ over: true });
    },

    handleDragLeave() {
      if (this.state.over) this.setState({ over: false });
    },

    handleDrop(event) {
      if (!event.dataTransfer?.files?.length) return;
      event.preventDefault();
      this.setState({ over: false });
      this.upload(event.dataTransfer.files);
    },

    async upload(fileList) {
      const files = [...(fileList || [])];
      if (!files.length || this.state.busy) return;
      const photos = files.filter((file) => WEB_IMAGE.test(file.type) || (!file.type && WEB_IMAGE_NAME.test(file.name)));
      const skipped = files.length - photos.length;
      const imageField = this.imageField();
      const key = imageField ? imageField.get('name') : 'src';
      const folder = publicFolder(this.props.config, imageField);
      const paths = [];
      const failed = [];

      this.setState({ busy: true, done: 0, total: photos.length, message: '' });
      for (const [index, photo] of photos.entries()) {
        try {
          const blob = await shrink(photo);
          const name = uploadName(photo, blob);
          const file = new File([blob], name, { type: blob.type || photo.type, lastModified: Date.now() });
          // Like choosing a photo in the media library: it's saved with the entry when you publish.
          await this.props.onPersistMedia(file, { field: imageField });
          paths.push(folder ? `${folder}/${name}` : name);
        } catch (error) {
          console.error(error);
          failed.push(photo.name);
        }
        this.setState({ done: index + 1 });
      }

      if (paths.length) {
        const { value, field, onChange } = this.props;
        const current = value && typeof value.push === 'function' ? value : field.get('fields').clear();
        const blankItem = field.get('fields').first().clear();
        const items = paths.map((path) => blankItem.set(key, path));
        this.rebuildList = true;
        onChange(field.get('add_to_top', false) ? current.unshift(...items) : current.push(...items));
      }

      const notes = [];
      if (paths.length) notes.push(`Added ${paths.length} photo${paths.length === 1 ? '' : 's'}. Add descriptions if you like, then Publish.`);
      if (skipped) notes.push(`Skipped ${skipped === 1 ? '1 file that isn’t' : `${skipped} files that aren’t`} JPG, PNG or WebP (export iPhone HEIC photos as JPEG).`);
      if (failed.length) notes.push(`Couldn't add: ${failed.join(', ')}.`);
      this.setState({ busy: false, message: notes.join(' ') });
    },

    render() {
      const { busy, done, total, message, over, listKey } = this.state;
      return h(
        'div',
        { className: 'umi-photos' },
        h(
          'div',
          {
            className: `umi-photos__drop${over ? ' is-over' : ''}`,
            onDragOver: this.handleDragOver,
            onDragLeave: this.handleDragLeave,
            onDrop: this.handleDrop,
          },
          h(
            'label',
            { className: `umi-photos__button${busy ? ' is-busy' : ''}` },
            h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/avif', multiple: true, disabled: busy, onChange: this.handleInput }),
            busy ? `Adding ${Math.min(done + 1, total)} of ${total}…` : 'Upload photos',
          ),
          h('p', { className: 'umi-photos__hint', role: 'status', 'aria-live': 'polite' }, message || 'Choose or drop lots of photos at once. Large photos are resized for the web before they upload.'),
        ),
        h(ListControl, { ...this.props, key: `list-${listKey}`, ref: this.setList }),
      );
    },
  });

  if (ListControl) {
    CMS.registerWidget('photos', PhotosControl, list.preview, list.schema);
  }
})();
