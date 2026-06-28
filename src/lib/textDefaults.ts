// Make Hanken Grotesk the default font for every <Text> in the app
// (Garden redesign). Without this, every Text without an explicit
// fontFamily falls back to the platform sans (Roboto on Android, SF on
// iOS), which clashes with the rest of the new type system.
//
// We patch Text.render once at module load. Per-instance styles still
// win because we put the default first in the style array — anything
// passed via `style={...}` overrides our entry. This is a long-standing
// RN pattern; if it ever stops working in a future SDK we'd switch to a
// wrapper Text component.

import { Text } from 'react-native';

const HANKEN_BODY = 'HankenGrotesk_400Regular';

/* eslint-disable @typescript-eslint/no-explicit-any */
const TextInternal = Text as any;
const origRender = TextInternal.render;

TextInternal.render = function (props: { style?: unknown }, ref: unknown) {
  const merged = {
    ...props,
    style: [{ fontFamily: HANKEN_BODY }, props.style],
  };
  return origRender.call(this, merged, ref);
};

export {};
