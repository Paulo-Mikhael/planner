import {
  Calendar as IconCalendar,
  CalendarRange,
  Info,
  MapPin,
  Settings2
} from "lucide-react-native";
import { Keyboard, TouchableOpacity, View, Text, Alert } from "react-native";
import { router, useLocalSearchParams } from 'expo-router';
import { DateData } from "react-native-calendars";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";
import { tripServer } from "@/server/trip-server";
import { TripDetails as details } from "@/types";
import { colors } from "@/styles/colors";

import Loading from "@/components/loading";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { Calendar } from "@/components/calendar";

import { TripActivities } from "./tripActivities";
import { TripDetails } from "./tripDetails";

type TripData = details & {
  when: string
};

enum MODAL {
  NONE = 0,
  UPDATE_TRIP = 1,
  CALENDAR = 2

}

export default function Trip() {
  const tripId = useLocalSearchParams<{ tripId: string }>().tripId;
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false);
  const [tripDetails, setTripDetails] = useState({} as TripData);
  const [option, setOption] = useState<"activity" | "details">("activity");
  const [showModal, setShowModal] = useState(MODAL.NONE);
  const [destination, setDestination] = useState("");
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected);

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
      const month = dayjs(trip.starts_at).format("MMM");

      setDestination(trip.destination);

      setTripDetails(
        {
          ...trip,
          when: `${destination}, de ${start_at} a ${ends_at} de ${month}.`
        }
      );
    } catch (error) {
      throw error;
    } finally {
      setIsLoadingTrip(false);
      setIsUpdatingTrip(false);
    }
  }
  function handleSelectedDate(selectedDay: DateData){
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay
    });

    setSelectedDates(dates);
  }
  function handleUpdateTrip(){
    if (!tripId){
      return;
    }

    if (!destination || !selectedDates.startsAt || !selectedDates.endsAt){
      return Alert.alert("Atualizar viagem", "Lembre-se de, além de definir um destino, selecionar a data de ínicio e fim da viagem.");
    }

    setIsUpdatingTrip(true);

    Alert.alert("Atualizar viagem", "Viajem atualizada com sucesso!", [
      {
        text: "OK",
        onPress: () => {
          getTripDetails();
          setShowModal(MODAL.NONE);
        }
      }
    ]);
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
          onPress={() => setShowModal(MODAL.UPDATE_TRIP)}
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
          <Input variant="secondary">
            <MapPin color={colors.zinc[400]} size={20} />
            <Input.Field placeholder="Para onde?" onChangeText={setDestination} value={destination} />
          </Input>
          <Input variant="secondary">
            <IconCalendar color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Quando?"
              value={selectedDates.formatDatesInText}
              onPressIn={() => setShowModal(MODAL.CALENDAR)}
              onFocus={() => Keyboard.dismiss()}
            />
          </Input>
          <Button onPress={handleUpdateTrip} isLoading={isUpdatingTrip}>
            <Button.Title>
              Atualizar
            </Button.Title>
          </Button>
        </View>
      </Modal>
      <Modal 
        title="Selecionar datas" 
        subtitle="Selecione a data de ida e volta das viagens" 
        visible={showModal === MODAL.CALENDAR}
        onClose={() => { setShowModal(MODAL.UPDATE_TRIP) }}
      >
        <View
          className="gap-4 mt-4"
        >
          <Calendar 
            minDate={dayjs().toISOString()}
            onDayPress={(handleSelectedDate)}
            markedDates={selectedDates.dates}
          />
          <Button onPress={() => setShowModal(MODAL.UPDATE_TRIP)}>
            <Text>
              Confirmar
            </Text>
          </Button>
        </View>
      </Modal>
    </View>
  );
}