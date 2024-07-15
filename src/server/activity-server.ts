import { activities } from "@/data";
import { ActivityProps } from "@/types";
import 'react-native-get-random-values';
import { v4 as uuidV4 } from "uuid";

type ActivityDetails = Omit<ActivityProps, "id">

function getById(id: string){
  try {
    const activitiesList: ActivityProps[] = [
      ...activities
    ];

    const activity = activitiesList.find(trip => trip.id === id);

    if (!activity){
      return null;
    }

    const activityDetails: ActivityDetails = {
      occurs_at: activity?.occurs_at,
      title: activity?.title
    }

    return activityDetails;
  } catch (error) {
    throw error;
  }
}

function create(
  { occurs_at, title }: ActivityDetails
){
  try {
    const data: ActivityProps = {
      id: uuidV4(),
      occurs_at,
      title
    };


    return data.id;
  } catch (error) {
    throw error;
  }
}

export const activityServer = { getById, create }