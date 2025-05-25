import ImageShape from './Image';

// Reloj de arena SVG (outlined) como imagen
const hourglassIcon = new Image();
hourglassIcon.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2h12"/>
    <path d="M6 22h12"/>
    <path d="M6 2c0 4 6 6 6 10s-6 6-6 10"/>
    <path d="M18 2c0 4-6 6-6 10s6 6 6 10"/>
  </svg>
`);

class CustomImageShape extends ImageShape {
  constructor(options, body, labelModule, imageObj) {
    super(options, body, labelModule, imageObj);
    this.loading = false;
  }

  setLoading(value) {
    this.loading = value;
  }

  draw(ctx, x, y, selected, hover, style) {
  const imgEntry = this.imageObj[this.imageObjIndex];
  const image = imgEntry?.image;

  if (image?.complete) {
    // Escalado proporcional
    const scale = this.size / Math.max(image.naturalWidth, image.naturalHeight);
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;

    this.width = w;
    this.height = h;

    // Dibuja la imagen base
    ctx.drawImage(image, x - w / 2, y - h / 2, w, h);

    // Si está en modo loading, pinta un overlay translúcido encima
    console.log('Drawing image at', x, y, 'with size', w, h);
    if (this.loading) {
      ctx.save();
      console.log('Drawing loading overlay');
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // blanco semitransparente
      ctx.fillRect(x - w / 2, y - h / 2, w, h);
      ctx.restore();
    }
  } else {
    // Imagen aún no cargada, usar draw fallback
    super.draw(ctx, x, y, selected, hover, style);
    return;
  }

  // 🔴 Badge (ejemplo fijo, tú puedes hacerlo dinámico si quieres)
  const badgeRadius = this.options.size * 0.15;
  const badgeX = x + this.width / 2 - badgeRadius;
  const badgeY = y - this.height / 2 + badgeRadius;

  ctx.save();
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  // ⏳ Icono de carga (reloj) en esquina inferior derecha si loading
  if (this.loading && hourglassIcon.complete) {
    const iconSize = this.options.size * 0.3;
    const iconX = x + this.width / 2 - iconSize;
    const iconY = y + this.height / 2 - iconSize;

    ctx.drawImage(hourglassIcon, iconX, iconY, iconSize, iconSize);
  }
}
}

export default CustomImageShape;
