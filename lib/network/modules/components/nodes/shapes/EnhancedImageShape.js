import ImageShape from './Image';

// Reloj de arena SVG precargado
const hourglassIcon = new Image();
hourglassIcon.src =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2h12"/><path d="M6 22h12"/>
    <path d="M6 2c0 4 6 6 6 10s-6 6-6 10"/>
    <path d="M18 2c0 4-6 6-6 10s6 6 6 10"/>
  </svg>
`);

export default class EnhancedImageShape extends ImageShape {
  constructor(options, body, labelModule, imageObj) {
    super(options, body, labelModule, imageObj);
    this.loading = false;
    this.loadingRotation = 0;
    this._loadingInterval = null;

    this.icons = options.icons || [];
    this.iconCache = new Map();
    this.iconHitboxes = [];
    this._preloadIcons(this.icons);
  }

  setLoading(value) {
    console.log("➡️ setLoading:", value);
    this.loading = value;
    this.dirty = true;

    if (value && !this._loadingInterval) {
      this._loadingInterval = setInterval(() => {
        if (!this.loading) {
          clearInterval(this._loadingInterval);
          this._loadingInterval = null;
          return;
        }
        this.loadingRotation += Math.PI / 12;
        this.body.emitter.emit('_requestRedraw');
      }, 100);
    }

    if (!value && this._loadingInterval) {
      clearInterval(this._loadingInterval);
      this._loadingInterval = null;
    }

    this.body.emitter.emit('_requestRedraw');
  }

  setIcons(icons) {
    this.icons = icons;
    this._preloadIcons(icons);
    this.body.emitter.emit('redraw');
  }

  _preloadIcons(icons) {
    icons.forEach((icon) => {
      if (!this.iconCache.has(icon.src)) {
        const img = new Image();
        img.src = icon.src;
        img.onload = () => this.body.emitter.emit('redraw');
        this.iconCache.set(icon.src, img);
      }
    });

    if (!this.iconCache.has(hourglassIcon.src)) {
      this.iconCache.set(hourglassIcon.src, hourglassIcon);
    }
  }

  draw(ctx, x, y, selected, hover, style) {
    const imgEntry = this.imageObj[this.imageObjIndex];
    const image = imgEntry?.image;

    if (image?.complete) {
      const scale = this.size / Math.max(image.naturalWidth, image.naturalHeight);
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      this.width = w;
      this.height = h;

      ctx.drawImage(image, x - w / 2, y - h / 2, w, h);

      ctx.save();
      ctx.fillStyle = 'black';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`loading: ${this.loading}`, x, y - h / 2 - 6);
      ctx.restore();
    } else {
      super.draw(ctx, x, y, selected, hover, style);
    }

    if (this.loading) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(x - this.width / 2, y - this.height / 2, this.width, this.height);
      ctx.restore();
    }

    ctx.save();
    const badgeRadius = this.options.size * 0.15;
    const badgeX = x + this.width / 2 - badgeRadius;
    const badgeY = y - this.height / 2 + badgeRadius;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    const allIcons = [...this.icons];
    if (this.loading) {
      allIcons.push({ src: hourglassIcon.src, tooltip: "Cargando..." });
    }

    const baseSize = this.options.size || 50;
    let iconX = x + this.width / 2;
    const iconY = y + this.height / 2 + 2;

    this.iconHitboxes = [];

    allIcons.reverse().forEach((iconData) => {
      const iconImg = this.iconCache.get(iconData.src);
      const size = iconData.size || baseSize * 0.25;
      iconX -= size + 4;

      if (iconImg?.complete) {
        if (this.loading && iconData.src === hourglassIcon.src) {
          ctx.save();
          ctx.translate(iconX + size / 2, iconY - size / 2);
          ctx.rotate(this.loadingRotation);
          ctx.drawImage(iconImg, -size / 2, -size / 2, size, size);
          ctx.restore();
        } else {
          ctx.drawImage(iconImg, iconX, iconY - size, size, size);
        }

        this.iconHitboxes.push({
          x: iconX,
          y: iconY - size,
          width: size,
          height: size,
          icon: iconData
        });
      }

      if (iconData.badge?.color) {
        ctx.save();
        ctx.fillStyle = iconData.badge.color;
        ctx.beginPath();
        ctx.arc(iconX + size, iconY - size, size * 0.3, 0, 2 * Math.PI);
        ctx.fill();

        if (iconData.badge.value != null) {
          ctx.fillStyle = 'white';
          ctx.font = `${Math.round(size * 0.4)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(iconData.badge.value), iconX + size, iconY - size);
        }
        ctx.restore();
      }
    });
  }

  getIconAt(x, y) {
    return this.iconHitboxes.find(h =>
      x >= h.x &&
      x <= h.x + h.width &&
      y >= h.y &&
      y <= h.y + h.height
    )?.icon;
  }

  isPointInside(x, y) {
    for (const hitbox of this.iconHitboxes) {
      if (
        x >= hitbox.x &&
        x <= hitbox.x + hitbox.width &&
        y >= hitbox.y &&
        y <= hitbox.y + hitbox.height
      ) {
        this.body.emitter.emit('iconHovered', {
          nodeId: this.options.id,
          icon: hitbox.icon,
          x,
          y
        });
        return true;
      }
    }

    return super.isPointInside?.(x, y);
  }
}
