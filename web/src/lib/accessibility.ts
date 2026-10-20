function channelLuminance(value: number) {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(foreground: string, background: string) {
  const parse = (hex: string) => {
    const normalized = hex.replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(normalized))
      throw new Error(`Invalid six-digit hex color: ${hex}`);
    return [0, 2, 4].map((offset) =>
      Number.parseInt(normalized.slice(offset, offset + 2), 16),
    );
  };
  const luminance = (hex: string) => {
    const [red, green, blue] = parse(hex).map(channelLuminance);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const first = luminance(foreground);
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
