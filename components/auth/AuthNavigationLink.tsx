import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { TextLink, Typography } from '@/components/ui';
import { tokens } from '@/theme/tokens';

export type AuthNavigationLinkProps = {
  href: Href;
  prompt: string;
  actionLabel: string;
};

export function AuthNavigationLink({
  href,
  prompt,
  actionLabel,
}: AuthNavigationLinkProps) {
  return (
    <View style={styles.row}>
      <Typography variant="medium" muted>
        {prompt}{' '}
      </Typography>
      <Link href={href} asChild>
        <TextLink>{actionLabel}</TextLink>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.space.md,
  },
});
