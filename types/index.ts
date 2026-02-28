export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  preferred_lgs: string | null
  messenger_link: string | null
  created_at: string
}

export interface WantedCard {
  id: string
  user_id: string
  card_id: string
  card_name: string
  card_set: string | null
  card_set_name: string | null
  card_image_uri: string | null
  card_collector_number: string | null
  is_foil: boolean
  created_at: string
}

export interface Listing {
  id: string
  user_id: string
  card_id: string
  card_name: string
  card_set: string | null
  card_set_name: string | null
  card_image_uri: string | null
  card_rarity: string | null
  card_mana_cost: string | null
  card_type: string | null
  condition: CardCondition
  is_foil: boolean
  price: number
  quantity: number
  notes: string | null
  views: number
  created_at: string
  profiles?: Profile
}

export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG'

export interface ScryfallCard {
  id: string
  name: string
  set: string
  set_name: string
  rarity: string
  mana_cost: string | null
  type_line: string
  oracle_text: string | null
  image_uris?: {
    small: string
    normal: string
    large: string
    art_crop: string
  }
  card_faces?: Array<{
    image_uris?: {
      small: string
      normal: string
      large: string
      art_crop: string
    }
  }>
  prices: {
    usd: string | null
    usd_foil: string | null
    eur: string | null
    eur_foil: string | null
  }
  collector_number: string
  released_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  date: string
  location: string | null
  image_url: string | null
  organizer_id: string | null
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  listing_id: string | null
  content: string
  read: boolean
  created_at: string
  sender?: Profile
  receiver?: Profile
}
