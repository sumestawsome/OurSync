import type { Song, ChatMessage, ActivityLog, RoomParticipant } from '../types'

export const initialPlaylist: Song[] = [
  {
    id: 's1',
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
    duration: '02:57',
    durationSeconds: 177,
    thumbnail: 'https://img.youtube.com/vi/GxldQ9eX2wo/hqdefault.jpg',
    videoId: 'GxldQ9eX2wo',
    addedBy: 'Aura',
  },
  {
    id: 's2',
    title: 'Golden Hour',
    artist: 'JVKE',
    duration: '03:29',
    durationSeconds: 209,
    thumbnail: 'https://img.youtube.com/vi/PEM0Vs8jf1w/hqdefault.jpg',
    videoId: 'PEM0Vs8jf1w',
    addedBy: 'Reza',
  },
  {
    id: 's3',
    title: 'Double Take',
    artist: 'dhruv',
    duration: '02:51',
    durationSeconds: 171,
    thumbnail: 'https://img.youtube.com/vi/uQ763VvqiPE/hqdefault.jpg',
    videoId: 'uQ763VvqiPE',
    addedBy: 'Aura',
  },
  {
    id: 's4',
    title: 'Here With Me',
    artist: 'd4vd',
    duration: '04:02',
    durationSeconds: 242,
    thumbnail: 'https://img.youtube.com/vi/b1kbLwvqugk/hqdefault.jpg',
    videoId: 'b1kbLwvqugk',
    addedBy: 'Reza',
  },
  {
    id: 's5',
    title: 'Line Without a Hook',
    artist: 'Ricky Montgomery',
    duration: '04:09',
    durationSeconds: 249,
    thumbnail: 'https://img.youtube.com/vi/AG-EREM85Xw/hqdefault.jpg',
    videoId: 'AG-EREM85Xw',
    addedBy: 'Aura',
  },
]

export const initialMessages: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'Aura',
    text: 'Halo sayang! Selamat mendengarkan musik bareng hari ini.',
    timestamp: '21:10',
    isSelf: false,
  },
  {
    id: 'm2',
    sender: 'Kamu',
    text: 'Halo juga! Lagu ini pas banget buat nemenin malam kita.',
    timestamp: '21:11',
    isSelf: true,
  },
  {
    id: 'm3',
    sender: 'Aura',
    text: 'Bagian chorus-nya selalu bikin kangen suasana waktu kita jalan-jalan.',
    timestamp: '21:12',
    isSelf: false,
  },
]

export const initialActivities: ActivityLog[] = [
  {
    id: 'a1',
    type: 'join',
    text: 'Aura baru saja terhubung ke ruangan',
    time: '21:08',
    user: 'Aura',
  },
  {
    id: 'a2',
    type: 'add_song',
    text: 'Aura menambahkan Until I Found You ke antrean',
    time: '21:09',
    user: 'Aura',
  },
  {
    id: 'a3',
    type: 'play',
    text: 'Pemutaran musik dimulai bersama',
    time: '21:10',
    user: 'Sistem',
  },
  {
    id: 'a4',
    type: 'reaction',
    text: 'Aura mengirimkan detak cinta ke layar Anda',
    time: '21:13',
    user: 'Aura',
  },
]

export const sampleParticipants: RoomParticipant[] = [
  {
    id: 'p1',
    name: 'Reza',
    isHost: true,
    isOnline: true,
    role: 'partner_1',
    avatarInitial: 'R',
  },
  {
    id: 'p2',
    name: 'Aura',
    isHost: false,
    isOnline: true,
    role: 'partner_2',
    avatarInitial: 'A',
  },
]
