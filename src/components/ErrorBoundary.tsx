// Root-level error boundary so any render-time JS error surfaces with a
// readable message + stack trace instead of the device's generic
// "Error loading app" screen.
//
// Only swallows render errors — async errors must be handled at the call
// site. The boundary is intentionally style-light so it can render even
// if the theme/SVG/icon layers are the thing that crashed.

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const stackLines = (error.stack ?? '').split('\n').slice(0, 12).join('\n');

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0A0A0A',
          paddingTop: 60,
          paddingHorizontal: 22,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: '#FF6040',
            marginBottom: 6,
          }}
        >
          Something crashed
        </Text>
        <Text style={{ fontSize: 13, color: '#9098C0', marginBottom: 16 }}>
          Screenshot this and send it to support.
        </Text>

        <ScrollView
          style={{
            flex: 1,
            backgroundColor: '#171717',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: '#FAFAFA',
              fontWeight: '700',
              marginBottom: 6,
            }}
          >
            {error.name}: {error.message}
          </Text>
          <Text style={{ fontSize: 11, color: '#9098C0', lineHeight: 16 }}>
            {stackLines || '(no stack trace)'}
          </Text>
        </ScrollView>

        <Pressable
          onPress={this.retry}
          style={({ pressed }) => ({
            marginTop: 14,
            marginBottom: 14,
            backgroundColor: '#B5E550',
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: '#0A0A0A', fontSize: 15, fontWeight: '800' }}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }
}
