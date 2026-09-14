import { Text, View } from 'react-native';

export function AuthHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View>
      <Text className="text-[34px] font-bold leading-[41px] text-ink">
        {title}
      </Text>
      <Text className="mt-3 text-[17px] leading-[24px] text-ink-secondary">
        {subtitle}
      </Text>
    </View>
  );
}
