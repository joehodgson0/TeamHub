import { TextInput, View, Text } from "react-native";
import { forwardRef } from "react";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  className?: string;
  multiline?: boolean;
  numberOfLines?: number;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, placeholder, value, onChangeText, secureTextEntry, error, className = "", multiline, numberOfLines }, ref) => {
    return (
      <View className="w-full">
        {label && <Text className="text-sm font-medium text-foreground mb-2">{label}</Text>}
        <TextInput
          ref={ref}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderTextColor="#999"
          className={`border border-input bg-background rounded-md px-3 py-2 text-foreground ${multiline ? "h-24" : "h-10"} ${className}`}
        />
        {error && <Text className="text-destructive text-sm mt-1">{error}</Text>}
      </View>
    );
  }
);
