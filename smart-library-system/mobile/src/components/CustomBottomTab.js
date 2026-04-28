import React, { useRef, useEffect } from 'react';
import { Platform, View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TABS, SCREEN_NAMES } from '../constants';

/**
 * CustomBottomTab Component
 * Stylish bottom navigation with pill-shaped glass morphism and animations
 */
const CustomBottomTab = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const animationValues = useRef(
    state.routes.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.parallel(
      animationValues.map((anim, index) =>
        Animated.timing(anim, {
          toValue: index === state.index ? 1 : 0,
          duration: 300,
          useNativeDriver: false,
        })
      )
    ).start();
  }, [state.index]);

  const getTabIcon = (routeName) => {
    switch (routeName) {
      case TABS.HOME:
        return 'local-library';
      case TABS.QR:
        return 'qr-code-scanner';
      case TABS.BOOKS:
        return 'search';
      case TABS.FILES:
        return 'print';
      case SCREEN_NAMES.Profile:
        return 'person';
      default:
        return 'home';
    }
  };

  const getTabLabel = (routeName) => {
    switch (routeName) {
      case TABS.HOME:
        return 'Home';
      case TABS.QR:
        return 'QR';
      case TABS.BOOKS:
        return 'Books';
      case TABS.FILES:
        return 'Print';
      case SCREEN_NAMES.Profile:
        return 'Profile';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 16 : insets.bottom + 12 }]}>
      <View style={styles.tabBarWrapper}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              preventDefault: false,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const animationValue = animationValues[index];

          const backgroundColor = animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', COLORS.primary + '15'],
          });

          const scale = animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.05],
          });

          const iconColor = animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [COLORS.onSurfaceVariant, COLORS.primary],
          });

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              <Animated.View
                style={[
                  styles.tabContent,
                  {
                    backgroundColor: backgroundColor,
                    transform: [{ scale }],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.iconContainer,
                    {
                    },
                  ]}
                >
                  <MaterialIcons
                    name={getTabIcon(route.name)}
                    size={isFocused ? 26 : 24}
                    color={isFocused ? COLORS.primary : COLORS.onSurfaceVariant}
                  />
                </Animated.View>

                {isFocused && (
                  <Animated.Text
                    style={[
                      styles.label,
                      {
                        opacity: animationValue,
                        transform: [
                          {
                            translateX: animationValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-10, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {getTabLabel(route.name)}
                  </Animated.Text>
                )}
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: -60,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  tabBarWrapper: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 28,
    
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "silver",
    
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 22,
    minWidth: 52,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  label: {
    fontSize: 7,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
});

export default CustomBottomTab;
