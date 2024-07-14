import { TripDetails } from "@/types";
import { View, Text } from "react-native";

export function TripActivities({ tripData }: {tripData: TripDetails}){
  return (
    <View className="flex-1">
      <Text className="text-white">
        {tripData.destination}
      </Text>
    </View>
  );
}