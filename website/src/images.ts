export const iconWebp = (src: string, width: 160 | 384) =>
  src.replace(/\.png$/, `-${width}.webp`);
