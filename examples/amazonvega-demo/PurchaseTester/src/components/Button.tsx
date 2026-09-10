import React, {useState} from 'react';
import {Pressable, Text, type GestureResponderEvent} from 'react-native';
import {styles} from './Button.styles';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  hasTVPreferredFocus?: boolean;
  variant?: ButtonVariant;
}

export const Button = ({
  label,
  onPress,
  disabled = false,
  hasTVPreferredFocus = false,
  variant = 'primary',
}: ButtonProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      disabled={disabled}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        isFocused && styles.focusedButton,
        disabled && styles.disabledButton,
      ]}>
      <Text
        style={[
          styles.label,
          variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
};
