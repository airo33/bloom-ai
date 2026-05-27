import React, { forwardRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../theme';

interface Props extends TextInputProps {
  invalid?: boolean;
}

const Input = forwardRef<TextInput, Props>(function Input(
  { invalid, multiline, style, ...rest },
  ref,
) {
  const theme = useTheme();
  return (
    <TextInput
      ref={ref}
      multiline={multiline}
      placeholderTextColor={theme.colors.tm}
      style={[
        {
          width: '100%',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: theme.colors.card,
          borderColor: invalid ? theme.colors.rd : theme.colors.bo2,
          borderWidth: 2,
          borderRadius: 13,
          fontSize: 15,
          color: theme.colors.th,
          minHeight: multiline ? 105 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
          lineHeight: multiline ? 22 : undefined,
        },
        style,
      ]}
      {...rest}
    />
  );
});

export default Input;
