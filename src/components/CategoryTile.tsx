// Small emoji square with a category-tinted background.
// Ports prototype's `catTile()` helper.

import React from 'react';
import { View, Text } from 'react-native';
import { getCategory } from '../theme/categories';

interface Props {
  category?: string;
  size?: number;
}

export default function CategoryTile({ category, size = 46 }: Props) {
  const c = getCategory(category);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        backgroundColor: c.bg,
        borderWidth: 1.5,
        borderColor: c.bar + '30',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: Math.round(size * 0.5) }}>{c.em}</Text>
    </View>
  );
}
