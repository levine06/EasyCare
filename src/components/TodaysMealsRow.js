import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  PanResponder,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from './SectionCard';
import { getTodaysMeals } from '../api/meals';
import { colors, spacing, radius, MAX_FONT_MULT } from '../theme';

const THUMB_SIZE = 96;

// Home-page "Today's Meals" card: horizontal scroll of today's logged meals (photo +
// meal type), plus a dashed-border + tile to log a new one. Tapping an existing meal
// opens the edit screen; tapping + opens the add screen.
export default function TodaysMealsRow() {
  const navigation = useNavigation();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const scrollRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getTodaysMeals()
        .then((data) => active && setMeals(data))
        .catch(() => active && setMeals([]))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SectionCard
      icon="restaurant"
      title="Today's Meals"
      onPressChevron={() => navigation.navigate('Tabs', { screen: 'Logs', params: { tab: 'Food' } })}
    >
      {loading ? (
        <ActivityIndicator style={{ padding: spacing.lg }} color={colors.primary} />
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            onContentSizeChange={(w) => setContentWidth(w)}
            onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
          >
            {meals.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                style={styles.mealTile}
                onPress={() => navigation.navigate('AddMeal', { mealId: meal.id })}
                activeOpacity={0.8}
              >
                {meal.photo_url ? (
                  <Image source={{ uri: meal.photo_url }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Ionicons name="restaurant-outline" size={28} color={colors.textSecondary} />
                  </View>
                )}
                <Text style={styles.mealLabel} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_MULT}>
                  {meal.meal_type}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.addTile}
              onPress={() => navigation.navigate('AddMeal')}
              accessibilityRole="button"
              accessibilityLabel="Log a meal"
            >
              <Ionicons name="add" size={34} color={colors.textSecondary} />
            </TouchableOpacity>
          </ScrollView>

          {contentWidth > containerWidth && containerWidth > 0 && (
            <ScrollHandle
              scrollRef={scrollRef}
              containerWidth={containerWidth}
              contentWidth={contentWidth}
              scrollX={scrollX}
              setScrollX={setScrollX}
            />
          )}
        </>
      )}
    </SectionCard>
  );
}

// Custom scroll indicator (native scrollbars are too subtle for elderly users to
// notice) — a gray track with a short teal handle that slides across it to reflect
// current scroll position. Rendered as its own row BELOW the ScrollView (not
// overlapping it) so there's no ambiguity for the native touch responder system
// about which view a drag starting on the handle belongs to. Dragging the handle
// drives the underlying ScrollView with scrollTo AND updates the handle position
// directly, so it tracks the finger immediately rather than waiting on the
// ScrollView's onScroll round trip.
function ScrollHandle({ scrollRef, containerWidth, contentWidth, scrollX, setScrollX }) {
  const trackWidth = containerWidth - spacing.lg * 2;
  const visibleRatio = containerWidth / contentWidth;
  const handleWidth = Math.min(Math.max(visibleRatio * trackWidth, 28), trackWidth * 0.35);
  const maxScrollX = contentWidth - containerWidth;
  const maxHandleLeft = trackWidth - handleWidth;
  const handleLeft = maxScrollX > 0
    ? Math.min(Math.max((scrollX / maxScrollX) * maxHandleLeft, 0), maxHandleLeft)
    : 0;

  const dragStartScrollX = useRef(0);
  // PanResponder is only built once, so its handlers can't close over scrollX /
  // maxScrollX / maxHandleLeft directly (those change every render) — read them
  // through this ref, which is kept current below, instead.
  const metrics = useRef({ scrollX, maxScrollX, maxHandleLeft });
  metrics.current = { scrollX, maxScrollX, maxHandleLeft };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        dragStartScrollX.current = metrics.current.scrollX;
      },
      onPanResponderMove: (_, gesture) => {
        const { maxScrollX, maxHandleLeft } = metrics.current;
        if (maxScrollX <= 0 || maxHandleLeft <= 0) return;
        const scale = maxScrollX / maxHandleLeft;
        const nextScrollX = Math.min(
          Math.max(dragStartScrollX.current + gesture.dx * scale, 0),
          maxScrollX
        );
        setScrollX(nextScrollX);
        scrollRef.current?.scrollTo({ x: nextScrollX, animated: false });
      },
    })
  ).current;

  return (
    <View
      style={[styles.scrollTrackHit, Platform.OS === 'web' && styles.scrollTrackHitWeb]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.scrollTrack, { width: trackWidth }]}>
        <View style={[styles.scrollHandle, { width: handleWidth, left: handleLeft }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  mealTile: { alignItems: 'center', gap: spacing.xs, width: THUMB_SIZE },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: radius.md, backgroundColor: colors.border },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  mealLabel: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  addTile: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  scrollTrackHit: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    justifyContent: 'center',
  },
  // Without this, mobile browsers can hijack a drag starting on the handle as a
  // native page/ancestor scroll before our PanResponder gets to claim it.
  scrollTrackHitWeb: { touchAction: 'none' },
  scrollTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  scrollHandle: {
    position: 'absolute',
    top: 0,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
