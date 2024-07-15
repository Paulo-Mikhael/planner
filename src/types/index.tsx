export type TripProps = {
  id: string,
  destination: string,
  starts_at: string,
  ends_at: string,
  emails_to_invite: string[],
  owner_name: string,
  owner_email: string
}

export type TripDetails = Omit<TripProps, "owner_name" | "owner_email">

export type ActivityProps = {
  id: string,
  occurs_at: string,
  title: string,
}