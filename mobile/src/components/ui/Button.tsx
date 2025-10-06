import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { forwardRef } from "react";

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "outline" | "destructive";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const Button = forwardRef<View, ButtonProps>(
  ({ children, onPress, variant = "default", size = "default", disabled, loading, className = "" }, ref) => {
    const baseClasses = "rounded-md items-center justify-center flex-row";
    
    const variantClasses = {
      default: "bg-primary",
      outline: "border border-input bg-background",
      destructive: "bg-destructive",
    };
    
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-9 px-3",
      lg: "h-11 px-8",
    };
    
    const textVariantClasses = {
      default: "text-primary-foreground font-medium",
      outline: "text-foreground font-medium",
      destructive: "text-destructive-foreground font-medium",
    };

    return (
      <TouchableOpacity
        ref={ref as any}
        onPress={onPress}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? "opacity-50" : ""} ${className}`}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={variant === "outline" ? "#222" : "#fff"} />
        ) : (
          <Text className={textVariantClasses[variant]}>{children}</Text>
        )}
      </TouchableOpacity>
    );
  }
);
