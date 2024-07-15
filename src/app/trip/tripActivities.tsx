import { Clock, Calendar as IconCalendar, PlusIcon, Tag } from "lucide-react-native";
import { View, Text, Keyboard, Alert, SectionList } from "react-native";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

import { activityServer } from "@/server/activity-server";
import { colors } from "@/styles/colors";
import { ActivityProps, TripDetails } from "@/types";
import { activities as activitiesList } from "@/data";

import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { Input } from "@/components/input";
import { Calendar } from "@/components/calendar";
import { Activity } from "@/components/activity";
import Loading from "@/components/loading";

enum MODAL {
  NONE = 0,
  CALENDAR = 1,
  NEW_ACTIVITY = 2
}
type ActivityData = ActivityProps & { isBefore: boolean }
type ActivityList = {
  title: {
    dayNumber: number,
    dayName: string
  },
  data: [ActivityData]
}

export function TripActivities({ tripData }: { tripData: TripDetails }) {
  const [showModal, setShowModal] = useState(MODAL.NONE);
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [activityHour, setActivityHour] = useState("");
  const [tripActivities, setTripActivities] = useState<ActivityList[]>([]);

  function resetNewActivityFields() {
    setActivityDate("");
    setActivityHour("");
    setActivityTitle("");
    setShowModal(MODAL.NONE);
  }
  function handleCreateActivity() {
    try {
      if (!activityTitle || !activityDate || !activityHour) {
        return Alert.alert("Cadastrar atividade", "Preencha todos os campos");
      }

      setIsCreatingActivity(true);

      activityServer.create({
        occurs_at: dayjs(activityDate).add(Number(activityHour), "h").toString(),
        title: activityTitle
      });

      resetNewActivityFields();

      Alert.alert("Nova atividade", "Nova atividade cadastrada com sucesso")
    } catch (error) {
      throw error;
    } finally {
      setIsCreatingActivity(false);
    }
  }
  function getTripActivities() {
    try {
      const activities: ActivityProps[] = activitiesList;

      const activitiesToSectionList: ActivityList[] = activities.map((dayActivity) => ({
        title: {
          dayNumber: dayjs(dayActivity.occurs_at).date(),
          dayName: dayjs(dayActivity.occurs_at).format("dddd").replace("-feira", ""),
        },
        data: [
          {
            id: dayActivity.id,
            title: dayActivity.title,
            occurs_at: dayjs(dayActivity.occurs_at).format("hh[:]mm[h]"),
            isBefore: dayjs(dayActivity.occurs_at).isBefore(dayjs())
          }
        ]
      }));

      setTripActivities(activitiesToSectionList);
    } catch (error) {
      throw error;
    } finally {
      setIsLoadingActivities(false);
    }
  }

  useEffect(() => {
    getTripActivities();
  }, []);

  return (
    <View className="flex-1">
      <View className="w-full flex-row mt-5 mb-6 items-center">
        <Text className="text-zinc-50 text-2xl font-semibold flex-1">
          Atividades
        </Text>
        <Button className="p-2" onPress={() => setShowModal(MODAL.NEW_ACTIVITY)}>
          <PlusIcon color={colors.lime[950]} size={20} />
          <Button.Title>
            Nova Atividade
          </Button.Title>
        </Button>
      </View>
      {isCreatingActivity
      ? <Loading /> : 
      <SectionList
        sections={tripActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Activity data={item} />}
        renderSectionHeader={({ section }) => (
          <View className="w-full">
          <Text className="text-zinc-50 text-2xl font-semibold py-2">
            Dia {section.title.dayNumber + " "}
            <Text className="text-zinc-500 text-base font-regular capitalize">
              {section.title.dayName}
            </Text>
          </Text>

          {section.data.length <= 0 && (
            <Text className="text-zinc-500 font-regular text-sm mb-8">
              Nenhuma atividade cadastrada nessa data.
            </Text>
          )}
        </View>
        )}
      />}
      <Modal
        title="Cadastrar atividade"
        subtitle="Todos os convidados podem visualizar as atividades"
        visible={showModal === MODAL.NEW_ACTIVITY}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View
          className="mt-4 mb-3"
        >
          <Input variant="secondary">
            <Tag color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Qual a atividade?"
              onChangeText={setActivityTitle}
              value={activityTitle}
            />
          </Input>
          <View
            className="w-full mt-2 flex-row gap-2"
          >
            <Input variant="secondary" className="flex-1">
              <IconCalendar color={colors.zinc[400]} size={20} />
              <Input.Field
                placeholder="Data"
                onChangeText={(text) => setActivityHour(text.replace(".", "").replace(",", ""))}
                value={activityDate && dayjs(activityDate).format("DD [de] MMMM")}
                onFocus={() => { Keyboard.dismiss() }}
                onPressIn={() => {
                  setShowModal(MODAL.CALENDAR)
                }}
              />
            </Input>
            <Input variant="secondary" className="flex-1">
              <Clock color={colors.zinc[400]} size={20} />
              <Input.Field
                placeholder="Horário"
                onChangeText={(text) => setActivityHour(text.replace(".", "").replace(",", ""))}
                value={activityHour}
                keyboardType="numeric"
                maxLength={2}
              />
            </Input>
          </View>
          <View className="mt-4">
            <Button isLoading={isCreatingActivity} onPress={handleCreateActivity}>
              <Button.Title>
                Salvar atividade
              </Button.Title>
            </Button>
          </View>
        </View>
      </Modal >
      <Modal
        title="Selecionar data"
        subtitle="Selecione a data da atividade"
        visible={showModal === MODAL.CALENDAR}
        onClose={() => {
          setShowModal(MODAL.NONE);
          setActivityDate("");
        }}
      >
        <View className="gap-4 mt-4">
          <Calendar
            onDayPress={(day) => {
              setActivityDate(day.dateString);
            }}
            markedDates={{ [activityDate]: { selected: true } }}
            initialDate={tripData.starts_at}
            minDate={tripData.starts_at}
            maxDate={tripData.ends_at}
          />
          <Button onPress={() => setShowModal(MODAL.NEW_ACTIVITY)}>
            <Button.Title>
              Confirmar
            </Button.Title>
          </Button>
        </View>
      </Modal>
    </View >
  );
}