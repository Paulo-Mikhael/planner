import { trips } from "@/data";
import { TripDetails, TripProps } from "@/types";
import 'react-native-get-random-values';
import { v4 as uuidV4 } from "uuid";

type CreateTrip = Omit<TripProps, "id" | "owner_name" | "owner_email">

function getById(id: string){
  try {
    const tripsList: TripProps[] = [
      ...trips
    ];

    const trip = tripsList.find(trip => trip.id === id);

    if (!trip){
      return undefined;
    }

    const tripDetails: TripDetails = {
      id: trip.id,
      destination: trip.destination,
      starts_at: trip.starts_at,
      ends_at: trip.ends_at,
      emails_to_invite: trip.emails_to_invite
    }

    return tripDetails;
  } catch (error) {
    throw error;
  }
}

function create(
  { destination, starts_at, ends_at, emails_to_invite }: CreateTrip
){
  try {
    const data: TripProps = {
      id: uuidV4(),
      destination,
      starts_at,
      ends_at,
      emails_to_invite,
      owner_name: "Mikhael",
      owner_email: "paulomiguel@gmail.com"
    };

    trips.push(data);

    return data.id;
  } catch (error) {
    throw error;
  }
}

export const tripServer = { getById, create }