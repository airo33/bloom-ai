// Tiny markdown renderer — just enough to display our two legal docs.
// Supports # / ## / ### headings, **bold**, bullet lists, and paragraphs.
// Pulls in only React Native primitives so we don't need a markdown lib.

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  source: string;
}

type Block =
  | { kind: 'h1' | 'h2' | 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'hr' };

/** Split the markdown source into typed blocks. */
function parseBlocks(src: string): Block[] {
  const lines = src.split(/\r?\n/);
  const blocks: Block[] = [];
  let pendingPara: string[] = [];
  let pendingList: string[] = [];

  const flushPara = () => {
    if (pendingPara.length) {
      blocks.push({ kind: 'p', text: pendingPara.join(' ').trim() });
      pendingPara = [];
    }
  };
  const flushList = () => {
    if (pendingList.length) {
      blocks.push({ kind: 'ul', items: pendingList });
      pendingList = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') {
      flushPara();
      flushList();
      continue;
    }
    if (line.startsWith('### ')) {
      flushPara();
      flushList();
      blocks.push({ kind: 'h3', text: line.slice(4) });
    } else if (line.startsWith('## ')) {
      flushPara();
      flushList();
      blocks.push({ kind: 'h2', text: line.slice(3) });
    } else if (line.startsWith('# ')) {
      flushPara();
      flushList();
      blocks.push({ kind: 'h1', text: line.slice(2) });
    } else if (line.startsWith('- ')) {
      flushPara();
      pendingList.push(line.slice(2));
    } else if (line.startsWith('|')) {
      // Skip markdown tables — we don't render them; they're rare in our docs
      flushPara();
      flushList();
    } else if (line.startsWith('---')) {
      flushPara();
      flushList();
      blocks.push({ kind: 'hr' });
    } else {
      flushList();
      pendingPara.push(line);
    }
  }
  flushPara();
  flushList();

  return blocks;
}

/** Render inline `**bold**` runs inside a Text. */
function renderInline(text: string, color: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={{ fontWeight: '700', color }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

export default function SimpleMarkdown({ source }: Props) {
  const theme = useTheme();
  const blocks = useMemo(() => parseBlocks(source), [source]);

  return (
    <View>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'h1':
            return (
              <Text
                key={i}
                style={{
                  fontSize: 26,
                  fontWeight: '800',
                  color: theme.colors.th,
                  letterSpacing: -0.5,
                  marginBottom: 12,
                }}
              >
                {b.text}
              </Text>
            );
          case 'h2':
            return (
              <Text
                key={i}
                style={{
                  fontSize: 18,
                  fontWeight: '800',
                  color: theme.colors.th,
                  letterSpacing: -0.3,
                  marginTop: 22,
                  marginBottom: 10,
                }}
              >
                {b.text}
              </Text>
            );
          case 'h3':
            return (
              <Text
                key={i}
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: theme.colors.tb,
                  letterSpacing: -0.2,
                  marginTop: 14,
                  marginBottom: 6,
                }}
              >
                {b.text}
              </Text>
            );
          case 'p':
            return (
              <Text
                key={i}
                style={{
                  fontSize: 14,
                  lineHeight: 22,
                  color: theme.colors.tb,
                  marginBottom: 10,
                }}
              >
                {renderInline(b.text, theme.colors.th)}
              </Text>
            );
          case 'ul':
            return (
              <View key={i} style={{ marginBottom: 12, gap: 6 }}>
                {b.items.map((item, j) => (
                  <View key={j} style={{ flexDirection: 'row', gap: 8 }}>
                    <Text style={{ color: theme.colors.tm, fontSize: 14 }}>•</Text>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        lineHeight: 22,
                        color: theme.colors.tb,
                      }}
                    >
                      {renderInline(item, theme.colors.th)}
                    </Text>
                  </View>
                ))}
              </View>
            );
          case 'hr':
            return (
              <View
                key={i}
                style={{
                  height: 1,
                  backgroundColor: theme.colors.bo,
                  marginVertical: 18,
                }}
              />
            );
        }
      })}
    </View>
  );
}
