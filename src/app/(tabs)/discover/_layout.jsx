import { withLayoutContext, useGlobalSearchParams } from "expo-router";
import Transition from "react-native-screen-transitions";
import { createBlankStackNavigator } from "react-native-screen-transitions/blank-stack";
import { interpolate } from "react-native-reanimated";

const { Navigator } = createBlankStackNavigator();
const TransitionStack = withLayoutContext(Navigator);

function useSharedTag() {
  const { tag } = useGlobalSearchParams();
  return typeof tag === "string" ? tag : "event-card";
}

export default function DiscoverLayout() {
  const sharedBoundTag = useSharedTag();

  return (
    <TransitionStack screenOptions={{ headerShown: false }}>
      <TransitionStack.Screen
        name="feed"
        options={{ ...Transition.Presets.SharedXImage({ sharedBoundTag }) }}
      />
      <TransitionStack.Screen
        name="details"
        options={{
          gestureEnabled: true,
          gestureDirection: "vertical",
          ...Transition.Presets.SharedXImage({ sharedBoundTag }),
          screenStyleInterpolator: ({
            focused,
            bounds,
            current,
            layouts: { screen },
            progress,
          }) => {
            "worklet";
            if (!focused) return {};
            const boundValues = bounds({
              id: sharedBoundTag,
              method: "transform",
              raw: true,
            });
            const dragY = interpolate(
              current.gesture.normalizedY,
              [-1, 0, 1],
              [-screen.height, 0, screen.height],
            );
            const contentY = interpolate(
              progress,
              [0, 1],
              [dragY >= 0 ? screen.height : -screen.height, 0],
            );
            return {
              [sharedBoundTag]: {
                transform: [
                  { translateX: boundValues.translateX },
                  { translateY: boundValues.translateY },
                  { scaleX: boundValues.scaleX },
                  { scaleY: boundValues.scaleY },
                ],
              },
              contentStyle: {
                transform: [{ translateY: contentY }, { translateY: dragY }],
                pointerEvents: current.animating ? "none" : "auto",
              },
            };
          },
        }}
      />
    </TransitionStack>
  );
}
