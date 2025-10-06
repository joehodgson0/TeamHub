import { View, Text } from "react-native";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <View className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      {children}
    </View>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return <View className={`mb-2 ${className}`}>{children}</View>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return <Text className={`text-xl font-bold text-card-foreground ${className}`}>{children}</Text>;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className = "" }: CardDescriptionProps) {
  return <Text className={`text-sm text-muted-foreground ${className}`}>{children}</Text>;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return <View className={className}>{children}</View>;
}
