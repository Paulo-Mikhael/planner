import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import {
  MapPin,
  Calendar as CalendarIcon,
  Settings2,
  UserRoundPlus,
  ArrowRight,
  AtSign
} from 'lucide-react-native';
import { DateData } from 'react-native-calendars';
import { View, Text, Image, Keyboard, Alert } from 'react-native';
import { calendarUtils, DatesSelected } from '@/utils/calendarUtils';
import { validateInput } from '@/utils/validateInput';
import { Input } from '@/components/input';
import { colors } from '@/styles/colors';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { Calendar } from '@/components/calendar';
import { GuestEmail } from '@/components/email';
import { router } from 'expo-router';
import { tripServer } from '@/server/trip-server';
import Loading from '@/components/loading';
import { tripStorage } from '@/storage/trip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trips } from '@/data';

enum StepForm {
  TRIP_DETAILS = 1,
  ADD_EMAIL = 2
}
enum modal {
  NONE = 0,
  CALENDAR = 1,
  GUESTS = 2
}

export default function Index() {
  const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS); //data
  const [showModal, setShowModal] = useState(modal.NONE); //MODAL
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected); //dates trip
  const [destination, setDestination] = useState(""); //destination trip
  const [emailToInvite, setEmailToInvite] = useState(""); //email calling
  const [emailsToInvite, setEmailsToInvite] = useState<string[]>([]); //emails called
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isGettingTrip, setIsGettingTrip] = useState(true);

  function handleNextStepForm() {
    if (destination.trim().length === 0 || !selectedDates.startsAt || !selectedDates.endsAt){
      return Alert.alert("Detalhes da viagem", "Preencha todas as informações da viagem para seguir.");
    }
    
    if (destination.trim().length < 4){
      return Alert.alert("Detalhes da viagem", "O destino deve ter pelo menos 4 caracteres.");
    }

    if (stepForm === StepForm.TRIP_DETAILS) {
      return setStepForm(StepForm.ADD_EMAIL);
    }

    Alert.alert("Confirmar viagem", "Estamos quase lá! Deseja confirmar sua viagem?",
      [
        {
          text: "Não",
          style: "cancel"
        },
        {
          text: "Sim",
          onPress: createTrip
        }
      ]
    );
  }
  function handleSelectedDate(selectedDay: DateData){
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay
    });

    setSelectedDates(dates);
  }
  function handleRemoveEmail(emailToRemove: string){
    setEmailsToInvite((previousList) => previousList.filter((item) => item !== emailToRemove));
  }
  function handleInviteEmail(){
    if (!validateInput.email(emailToInvite)){
      return Alert.alert("Não foi possível convidar", "E-mail inválido!");
    }

    const emailAlredyExist = emailsToInvite.find((email) => email === emailToInvite);

    if (emailAlredyExist){
      return Alert.alert("Não foi possível convidar", "E-mail já cadastrado!");
    }

    setEmailsToInvite((previous) => [...previous, emailToInvite]);
    setEmailToInvite("");
  }
  function saveTrip(tripId: string){
    try {
      tripStorage.save(tripId);
      router.navigate("/trip/" + tripId);
    } catch (error) {
      Alert.alert("Salvar viagem", "Não foi possível salvar a viagem no dispositivo!");
      console.log(error);
    }
  }
  function createTrip(){
    try {
      setIsCreatingTrip(true);

      const newTrip = tripServer.create({
        destination,
        starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
        ends_at: dayjs(selectedDates.endsAt?.dateString).toString(),
        emails_to_invite: emailsToInvite
      });

      Alert.alert("Nova viagem", "Viagem criada com sucesso", [
        {
          text: "Ok. Continuar",
          onPress: () => saveTrip(newTrip)
        }
      ]);
    } catch (error) {
      console.log(error);
      setIsCreatingTrip(false);
    }
  }
  async function getTrip(){
    try {
      const tripID = await tripStorage.get();
  
      if (!tripID){
        return setIsGettingTrip(false);
      }

      const trip = tripServer.getById(tripID);

      if (trip){
        return router.navigate("/trip/" + trip.id);
      } else {
        AsyncStorage.clear();
        return setIsGettingTrip(false);
      }
    } catch (error) {
      setIsGettingTrip(false);
      throw error;
    }
  }

  useEffect(() => {
    getTrip();
  }, []);
  
  if (isGettingTrip){
    return <Loading />
  }

  return (
    <View className="flex-1 items-center justify-center p-8">
      <Image
        source={require("@/assets/logo.png")}
        className="h-8"
        resizeMode="contain"
      />
      <Image
        source={require("@/assets/bg.png")}
        className="absolute"
        resizeMode="contain"
      />
      <Text className='text-zinc-400 text-center font-regular text-lg mt-3'>
        Convide seus amigos e planeje sua{"\n"}
        viagem agora mesmo
      </Text>
      <View className="w-full bg-zinc-900 p-4 rounded-xl my-8 border border-zinc-800">
        <Input>
          <MapPin color={colors.zinc[400]} size={20} />
          <Input.Field 
            placeholder="Para onde?"
            editable={stepForm === StepForm.TRIP_DETAILS}
            onChangeText={setDestination}
            value={destination}
          />
        </Input>
        <Input>
          <CalendarIcon color={colors.zinc[400]} size={20} />
          <Input.Field 
            placeholder="Quando?"
            editable={stepForm === StepForm.TRIP_DETAILS}
            onFocus={() => { Keyboard.dismiss() }}
            onPressIn={() => { 
              stepForm === StepForm.TRIP_DETAILS && setShowModal(modal.CALENDAR)
             }}
             value={selectedDates.formatDatesInText}
          />
        </Input>
        {stepForm === StepForm.ADD_EMAIL &&
          <>
            <View className="border-b py-3 border-zinc-800">
              <Button variant="secondary" onPress={() => { setStepForm(StepForm.TRIP_DETAILS) }}>
                <Button.Title>
                  Alterar local/data
                </Button.Title>
                <Settings2 color={colors.zinc[200]} size={20} />
              </Button>
            </View>
            <Input>
              <UserRoundPlus color={colors.zinc[400]} size={20} />
              <Input.Field 
                placeholder="Quem estará na viagem?"
                onFocus={() => { Keyboard.dismiss() }}
                onPressIn={() => { 
                  stepForm === StepForm.ADD_EMAIL && setShowModal(modal.GUESTS)
                }}
                value={
                  emailsToInvite.length > 0 ? `${emailsToInvite.length} pessoa(s) convidada(s)` : ""
                }
              />
            </Input>
          </>
        }
        <Button onPress={handleNextStepForm} isLoading={isCreatingTrip}>
          <Button.Title>
            {stepForm === StepForm.TRIP_DETAILS ? "Continuar" : "Confirmar viagem"}
          </Button.Title>
          <ArrowRight color={colors.lime[950]} size={20} />
        </Button>
      </View>
      <Text className="text-center text-zinc-500 font-regular text-base">
        Ao planejar sua viagem pela plann.er você automaticamente concorda com nossos{" "}
        <Text className="text-zinc-300 underline">termos de uso e políticas de privacidade.</Text>
      </Text>
      <Modal 
        title="Selecionar datas" 
        subtitle="Selecione a data de ida e volta das viagens" 
        visible={showModal === modal.CALENDAR}
        onClose={() => { setShowModal(modal.NONE) }}
      >
        <View
          className="gap-4 mt-4"
        >
          <Calendar 
            minDate={dayjs().toISOString()}
            onDayPress={(handleSelectedDate)}
            markedDates={selectedDates.dates}
          />
          <Button onPress={() => setShowModal(modal.NONE)}>
            <Text>
              Confirmar
            </Text>
          </Button>
        </View>
      </Modal>
      <Modal 
        title="Selecionar convidados" 
        subtitle="Os convidados irão receber e-mails para confirmar a participação na viagem"
        visible={showModal === modal.GUESTS}
        onClose={() => setShowModal(modal.NONE)}
      >
        <View
          className="my-2 flex-wrap gap-2 border-b border-zinc-800 py-5"
        >
          {
            emailsToInvite.length > 0 ? (
              emailsToInvite.map(email => (
                <GuestEmail 
                  key={email}
                  email={email}
                  onRemove={() => {
                    handleRemoveEmail(email);
                  }}
                />
              ))
            ) : <Text className="text-zinc-600 text-base font-regular">Nenhum e-mail adicionado</Text>
          }
        </View>
        <View
          className="gap-4 mt-4"
        >
          <Input variant="secondary">
            <AtSign color={colors.zinc[400]} size={20}/>
            <Input.Field 
              placeholder="Digite o nome do convidado"
              keyboardType="email-address"
              onChangeText={(text) => setEmailToInvite(text)}
              value={emailToInvite.toLowerCase()}
              returnKeyType="send"
              onSubmitEditing={handleInviteEmail}
            />
          </Input>
          <Button onPress={handleInviteEmail}>
            <Button.Title>
              Convidar
            </Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  );
}