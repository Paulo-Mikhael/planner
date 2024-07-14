import { TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from "react";
import { TripDetails as details } from "@/types";
import { tripServer } from "@/server/trip-server";
import Loading from "@/components/loading";
import { Input } from "@/components/input";
import { CalendarRange, Info, MapPin, Settings2 } from "lucide-react-native";
import { colors } from "@/styles/colors";
import dayjs from "dayjs";
import { Button } from "@/components/button";
import { TripActivities } from "./tripActivities";
import { TripDetails } from "./tripDetails";
import { Modal } from "@/components/modal";

type TripData = details & {
  when: string
};

enum MODAL {
  NONE = 0,
  UPDATE_TRIP = 1,
  CALENDAR = 2

}

export default function Trip() {
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [tripDetails, setTripDetails] = useState({} as TripData);
  const [option, setOption] = useState<"activity" | "details">("activity");
  const [showModal, setShowModal] = useState(MODAL.UPDATE_TRIP);
  const tripId = useLocalSearchParams<{ tripId: string }>().tripId;

  async function getTripDetails() {
    try {
      setIsLoadingTrip(true);

      if (!tripId) {
        return router.back();
      }

      const trip = tripServer.getById(tripId);
      if (!trip) {
        return router.back();
      }

      const maxLengthDestination = 14;
      const destination = trip.destination.length > maxLengthDestination
        ? trip.destination.slice(0, maxLengthDestination) + "..." : trip.destination

      const start_at = dayjs(trip.starts_at).format("DD");
      const ends_at = dayjs(trip.ends_at).format("DD");
      const month = dayjs(trip.starts_at).format("MMMM");

      setTripDetails(
        {
          ...trip,
          when: `${destination}, de ${start_at} a ${ends_at} de ${month}`
        }
      );
    } catch (error) {
      throw error;
    } finally {
      setIsLoadingTrip(false);
    }
  }

  useEffect(() => {
    getTripDetails();
  }, []);

  if (isLoadingTrip) {
    return <Loading />
  }

  return (
    <View className="flex-1 px-5 pt-16">
      <Input variant="tertiary">
        <MapPin color={colors.zinc[400]} size={20} />
        <Input.Field value={tripDetails.when} />
        <TouchableOpacity
          activeOpacity={0.6}
        >
          <View className="bg-zinc-800 w-9 h-9 items-center justify-center rounded">
            <Settings2 color={colors.zinc[400]} size={20} />
          </View>
        </TouchableOpacity>
      </Input>
      {
        option === "activity" 
        ? (<TripActivities tripData={tripDetails} />)
        : (<TripDetails tripId={tripDetails.id} />)
      }
      <View
        className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950"
      >
        <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border border-zinc-800 gap-2">
          <Button
            onPress={() => setOption("activity")}
            variant={option === "activity" ? "primary" : "secondary"}
          >
            <View className="flex-1 flex-row justify-center items-center gap-2">
              <CalendarRange
                color={option === "activity" ? colors.lime[950] : colors.zinc[200]}
              />
              <Button.Title>
                Atividades
              </Button.Title>
            </View>
          </Button>
          <Button
            onPress={() => setOption("details")}
            variant={option === "details" ? "primary" : "secondary"}
          >
            <View className="flex-1 flex-row justify-center items-center gap-2">
              <Info
                color={option === "details" ? colors.lime[950] : colors.zinc[200]}
              />
              <Button.Title>
                Detalhes
              </Button.Title>
            </View>
          </Button>
        </View>
      </View>
      <Modal 
        title="Atualizar viagem" 
        subtitle="Somente quem criou a viagem pode editar" 
        visible={showModal === MODAL.UPDATE_TRIP} 
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="gap-2 my-4">

        </View>
      </Modal>
    </View>
  );
}